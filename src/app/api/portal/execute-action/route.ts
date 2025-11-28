import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
      .select("*")
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

    let result: Record<string, unknown> | null = null;
    let aiResponse: string | null = null;

    // Process based on action type
    if (actionType === "form" || actionType === "ai_chat" || actionType === "trigger") {
      // Build the prompt for AI processing
      let prompt = aiPrompt || "";

      // If we have form data, format it for the AI
      if (data && Object.keys(data).length > 0) {
        const dataString = Object.entries(data)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");

        if (prompt) {
          prompt = `${prompt}\n\nUser Input:\n${dataString}`;
        } else {
          // Use system prompts if available
          const systemResult = system.result as Record<string, unknown> | null;
          const aiPrompts = systemResult?.aiPrompts as Array<{ name: string; prompt: string }> | undefined;

          if (aiPrompts && aiPrompts.length > 0) {
            prompt = `${aiPrompts[0].prompt}\n\nUser Input:\n${dataString}`;
          } else {
            prompt = `Process this request:\n${dataString}`;
          }
        }
      }

      // Call Claude API
      if (prompt) {
        try {
          const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const textContent = message.content.find((c) => c.type === "text");
          aiResponse = textContent?.text || "Action completed successfully.";
          result = { response: aiResponse };
        } catch (aiError) {
          console.error("AI processing error:", aiError);
          // Continue without AI response if it fails
          result = { response: "Action recorded successfully." };
        }
      }
    }

    // Store the action data
    const { error: dataError } = await supabase
      .from("system_data")
      .insert({
        system_id: systemId,
        client_id: clientId,
        action_id: actionId,
        data: data || {},
        ai_result: result,
        status: "processed",
      });

    if (dataError) {
      console.error("Error storing action data:", dataError);
    }

    // Log the activity
    const { error: activityError } = await supabase
      .from("system_activity")
      .insert({
        system_id: systemId,
        client_id: clientId,
        action_type: actionType,
        description: `Action "${actionId}" executed successfully`,
        metadata: { data, result },
      });

    if (activityError) {
      console.error("Error logging activity:", activityError);
    }

    return NextResponse.json({
      success: true,
      message: aiResponse || "Action completed successfully",
      result: result,
    });

  } catch (error) {
    console.error("Error executing action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
