import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

export async function POST(request: NextRequest) {
  try {
    const { prompt, buildId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    // Update status to processing
    if (buildId) {
      const supabase = await createClient();
      await supabase
        .from("system_builds")
        .update({ status: "processing" })
        .eq("id", buildId);
    }

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
      const supabase = await createClient();
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
    const body = await request.clone().json().catch(() => ({}));
    if (body.buildId) {
      const supabase = await createClient();
      await supabase
        .from("system_builds")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.buildId);
    }

    return NextResponse.json(
      { error: "Failed to generate system design" },
      { status: 500 }
    );
  }
}
