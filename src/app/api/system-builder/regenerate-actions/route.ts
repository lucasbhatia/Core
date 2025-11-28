import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const actionsPrompt = `Based on the following system description, generate portal actions that a client can use.

Return ONLY a JSON array of actions with this structure:
[
  {
    "id": "unique-action-id (lowercase with hyphens)",
    "label": "Action button label (e.g., Add New Lead)",
    "icon": "plus-circle|bar-chart|send|message-square|zap",
    "type": "form|dashboard|trigger|ai_chat",
    "description": "Brief description of what this action does",
    "fields": [
      {
        "name": "field_name",
        "label": "Field Label",
        "type": "text|textarea|email|tel|number|select|date",
        "placeholder": "Placeholder text",
        "required": true
      }
    ],
    "aiPrompt": "The AI prompt to process this action's input. Use {{field_name}} for variables."
  }
]

Rules:
- Generate 3-5 relevant actions based on what the system does
- "form" type needs fields array and aiPrompt
- "dashboard" type shows data/analytics (no fields needed)
- "trigger" type is a one-click action (no fields needed)
- "ai_chat" type lets user chat with AI (no fields needed, but include aiPrompt)
- Make actions practical and immediately usable
- Return ONLY the JSON array, no other text`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(req: Request) {
  try {
    const { systemId } = await req.json();

    if (!systemId) {
      return NextResponse.json({ error: "System ID is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get the system
    const { data: system, error: systemError } = await supabase
      .from("system_builds")
      .select("*")
      .eq("id", systemId)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    // Build context from system
    const systemContext = `
System Title: ${system.title}
System Description: ${system.prompt}
${system.result?.systemOverview ? `Overview: ${system.result.systemOverview}` : ""}
    `.trim();

    // Call Claude API to generate actions
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: actionsPrompt,
      messages: [{ role: "user", content: systemContext }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the actions
    let actions = [];
    try {
      const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      actions = JSON.parse(cleanJson);
    } catch {
      console.error("Failed to parse actions:", responseText);
      return NextResponse.json({ error: "Failed to generate valid actions" }, { status: 500 });
    }

    // Save the actions
    const { error: updateError } = await supabase
      .from("system_builds")
      .update({
        actions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", systemId);

    if (updateError) {
      console.error("Failed to save actions:", updateError);
      return NextResponse.json({ error: "Failed to save actions" }, { status: 500 });
    }

    return NextResponse.json({ success: true, actions });

  } catch (error) {
    console.error("Regenerate actions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate actions" },
      { status: 500 }
    );
  }
}
