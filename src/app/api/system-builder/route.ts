import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const systemPrompt = `You are an expert automation system architect. When given a business process or problem description, you will design a comprehensive automation system.

Your response must be a valid JSON object with the following structure:
{
  "systemDiagram": "A text-based ASCII or description of the system architecture diagram",
  "workflowSteps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "Detailed description of this step",
      "tools": ["Tool1", "Tool2"]
    }
  ],
  "agentArchitecture": {
    "name": "System name",
    "description": "Overall system description",
    "agents": [
      {
        "name": "Agent name",
        "role": "Agent role description",
        "capabilities": ["Capability 1", "Capability 2"]
      }
    ],
    "integrations": ["Integration 1", "Integration 2"]
  },
  "sopText": "Standard Operating Procedure text explaining how to use and maintain this system",
  "timeline": [
    {
      "phase": "Phase name",
      "duration": "Duration estimate",
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "resources": [
    {
      "name": "Resource name",
      "type": "Tool/API/Service",
      "description": "Description of the resource"
    }
  ]
}

Make your designs practical, detailed, and implementable. Focus on:
1. Efficiency and automation opportunities
2. Integration between different tools and systems
3. Clear workflow steps
4. Realistic timelines
5. Necessary resources and tools

IMPORTANT: Your response must be ONLY the JSON object, no additional text or markdown formatting.`;

// Create a simple Supabase client for API routes
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(request: NextRequest) {
  let buildId: string | null = null;

  try {
    const body = await request.json();
    const { prompt } = body;
    buildId = body.buildId || null;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to your .env.local file." },
        { status: 500 }
      );
    }

    const supabase = getSupabaseClient();

    // Update status to processing
    if (buildId) {
      await supabase
        .from("system_builds")
        .update({ status: "processing" })
        .eq("id", buildId);
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Design an automation system for the following requirement:\n\n${prompt}`,
        },
      ],
      system: systemPrompt,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to parse the JSON response
    let result;
    try {
      // Remove any potential markdown code blocks
      const cleanJson = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      result = JSON.parse(cleanJson);
    } catch {
      // If parsing fails, create a structured response from the text
      result = {
        systemDiagram: "See workflow steps for system design",
        workflowSteps: [
          {
            id: 1,
            title: "System Design",
            description: responseText,
            tools: [],
          },
        ],
        agentArchitecture: {
          name: "Custom Automation System",
          description: "AI-generated automation system",
          agents: [],
          integrations: [],
        },
        sopText: responseText,
        timeline: [],
        resources: [],
      };
    }

    // Update the system build with results
    if (buildId) {
      await supabase
        .from("system_builds")
        .update({
          result,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", buildId);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("System Builder API error:", error);

    // Update status to failed if we have a buildId
    if (buildId) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from("system_builds")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", buildId);
      } catch (dbError) {
        console.error("Failed to update build status:", dbError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate system design: ${errorMessage}` },
      { status: 500 }
    );
  }
}
