import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const systemPrompt = `You are an expert automation system architect. When given a business process or problem description, you will design a comprehensive automation system.

Your response must be a valid JSON object with the following structure:
{
  "systemDiagram": "A text-based ASCII or description of the system architecture diagram",
  "workflowSteps": [
    {"id": 1, "title": "Step title", "description": "Detailed description", "tools": ["Tool1"]}
  ],
  "agentArchitecture": {
    "name": "System name",
    "description": "Overall system description",
    "agents": [{"name": "Agent name", "role": "Role", "capabilities": ["Cap1"]}],
    "integrations": ["Integration 1"]
  },
  "sopText": "Standard Operating Procedure text",
  "timeline": [{"phase": "Phase name", "duration": "Duration", "tasks": ["Task 1"]}],
  "resources": [{"name": "Resource", "type": "Type", "description": "Description"}]
}

IMPORTANT: Your response must be ONLY the JSON object, no additional text or markdown.`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(req: Request) {
  let buildId: string | null = null;
  let prompt: string = "";

  try {
    // Parse body once
    const body = await req.json();
    prompt = body.prompt || "";
    buildId = body.buildId || null;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Update status to processing
    if (buildId) {
      const supabase = getSupabase();
      await supabase.from("system_builds").update({ status: "processing" }).eq("id", buildId);
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `Design an automation system for:\n\n${prompt}` }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse result
    let result;
    try {
      const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanJson);
    } catch {
      result = {
        systemDiagram: "See workflow steps",
        workflowSteps: [{ id: 1, title: "Design", description: responseText, tools: [] }],
        agentArchitecture: { name: "System", description: responseText, agents: [], integrations: [] },
        sopText: responseText,
        timeline: [],
        resources: [],
      };
    }

    // Save result
    if (buildId) {
      const supabase = getSupabase();
      await supabase.from("system_builds").update({
        result,
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", buildId);
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error("System Builder error:", error);

    if (buildId) {
      try {
        const supabase = getSupabase();
        await supabase.from("system_builds").update({
          status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", buildId);
      } catch (e) {
        console.error("DB update failed:", e);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate" },
      { status: 500 }
    );
  }
}
