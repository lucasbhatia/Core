import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(req: Request) {
  try {
    const { toolId, inputs, clientId } = await req.json();

    if (!toolId || !inputs) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get the tool
    const { data: tool, error: toolError } = await supabase
      .from("client_tools")
      .select("*")
      .eq("id", toolId)
      .eq("is_active", true)
      .single();

    if (toolError || !tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    const startTime = Date.now();

    // Build the user prompt from inputs
    let userPrompt = "User inputs:\n";
    for (const [key, value] of Object.entries(inputs)) {
      userPrompt += `${key}: ${value}\n`;
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      system: tool.system_prompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const executionTime = Date.now() - startTime;

    // Extract response
    const responseContent = message.content[0];
    const outputText = responseContent.type === "text" ? responseContent.text : "";

    // Calculate tokens
    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

    return NextResponse.json({
      success: true,
      output: outputText,
      format: tool.output_format,
      tokensUsed,
      executionTime,
    });
  } catch (error) {
    console.error("Tool execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute tool" },
      { status: 500 }
    );
  }
}
