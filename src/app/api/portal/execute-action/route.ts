import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate a short reference number
function generateRefNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${timestamp.slice(-4)}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemId, clientId, actionId, actionType, aiPrompt, data } = body;

    if (!systemId || !clientId || !actionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // Get the system to verify ownership and get prompts
    const { data: system, error: systemError } = await supabase
      .from("system_builds")
      .select("*, client:clients(name, email)")
      .eq("id", systemId)
      .single();

    if (systemError || !system) {
      return NextResponse.json(
        { error: "System not found" },
        { status: 404 }
      );
    }

    // Verify client access
    if (system.client_id !== clientId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Generate a reference number for this submission
    const refNumber = generateRefNumber();
    const clientInfo = system.client as { name?: string; email?: string } | null;

    let result: Record<string, unknown> | null = null;
    let aiResponse: string | null = null;

    // Process based on action type
    if (actionType === "form" || actionType === "ai_chat" || actionType === "trigger") {
      // Build a better system prompt for AI processing
      const systemContext = `You are a helpful assistant for "${system.title}".
The client "${clientInfo?.name || 'Client'}" is using this system.
Reference Number: ${refNumber}

Your job is to process their submission and provide a helpful, actionable response.
Be concise but thorough. If this is a form submission like a ticket or request:
1. Acknowledge receipt with the reference number
2. Summarize what was submitted
3. Explain next steps or what will happen
4. Be professional and helpful

Do NOT just echo back the data - provide real value and actionable information.`;

      let userPrompt = aiPrompt || "";

      // If we have form data, format it for the AI
      if (data && Object.keys(data).length > 0) {
        const dataString = Object.entries(data)
          .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
          .join("\n");

        userPrompt = userPrompt
          ? `${userPrompt}\n\nSubmitted Data:\n${dataString}`
          : `Process this submission:\n${dataString}`;
      }

      // Call Claude API with better context
      if (userPrompt) {
        try {
          const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: systemContext,
            messages: [
              {
                role: "user",
                content: userPrompt,
              },
            ],
          });

          const textContent = message.content.find((c) => c.type === "text");
          aiResponse = textContent?.text || `Submission received. Reference: ${refNumber}`;
          result = {
            response: aiResponse,
            refNumber,
            submittedAt: new Date().toISOString(),
          };
        } catch (aiError) {
          console.error("AI processing error:", aiError);
          // Provide a meaningful fallback response
          aiResponse = `Your submission has been received and recorded.\n\nReference Number: ${refNumber}\n\nWe will review your submission and get back to you shortly.`;
          result = {
            response: aiResponse,
            refNumber,
            submittedAt: new Date().toISOString(),
          };
        }
      }
    }

    // Store the action data with reference number
    const { data: savedData, error: dataError } = await supabase
      .from("system_data")
      .insert({
        system_id: systemId,
        client_id: clientId,
        action_id: actionId,
        data: { ...data, ref_number: refNumber },
        ai_result: result,
        status: "active", // Start as active so admin can see new submissions
      })
      .select()
      .single();

    if (dataError) {
      console.error("Error storing action data:", dataError);
    }

    // Log the activity with meaningful description
    const activityDescription = data && Object.keys(data).length > 0
      ? `New submission via "${actionId}" (${refNumber})`
      : `Action "${actionId}" triggered (${refNumber})`;

    const { error: activityError } = await supabase
      .from("system_activity")
      .insert({
        system_id: systemId,
        client_id: clientId,
        action_type: actionType,
        description: activityDescription,
        metadata: {
          data,
          result,
          ref_number: refNumber,
          submission_id: savedData?.id,
        },
      });

    if (activityError) {
      console.error("Error logging activity:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: aiResponse || `Submission received. Reference: ${refNumber}`,
      result: result,
      refNumber,
    });

  } catch (error) {
    console.error("Error executing action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
