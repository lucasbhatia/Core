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
    const { toolId, inputs, userId, clientId } = await req.json();

    if (!toolId || !inputs || !userId || !clientId) {
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

    // Verify user has access to this tool's client
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check access
    if (profile.role !== "admin" && profile.client_id !== tool.client_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
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

    // Log usage
    const { error: logError } = await supabase
      .from("tool_usage_logs")
      .insert({
        tool_id: toolId,
        user_id: userId,
        client_id: clientId,
        input_data: inputs,
        output_data: { text: outputText, format: tool.output_format },
        tokens_used: tokensUsed,
        execution_time_ms: executionTime,
        status: "success",
      });

    if (logError) {
      console.error("Error logging usage:", logError);
    }

    return NextResponse.json({
      success: true,
      output: outputText,
      format: tool.output_format,
      tokensUsed,
      executionTime,
    });
  } catch (error) {
    console.error("Tool execution error:", error);

    // Try to log the error
    try {
      const { toolId, userId, clientId, inputs } = await req.clone().json();
      const supabase = getSupabase();

      await supabase
        .from("tool_usage_logs")
        .insert({
          tool_id: toolId,
          user_id: userId,
          client_id: clientId,
          input_data: inputs || {},
          output_data: {},
          tokens_used: 0,
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { error: "Failed to execute tool" },
      { status: 500 }
    );
  }
}
