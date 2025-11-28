import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const systemPrompt = `You are an expert automation system builder. When given a business process or problem description, you will create READY-TO-USE deliverables that clients can immediately implement.

Your response must be a valid JSON object with the following structure:
{
  "systemOverview": "Brief 2-3 sentence summary of what this system does",
  "aiPrompts": [
    {
      "name": "Prompt name (e.g., Email Response Generator)",
      "purpose": "What this prompt does",
      "prompt": "The actual complete prompt text the user can copy and use with AI. Include specific instructions, formatting requirements, and context.",
      "variables": ["variable1", "variable2"],
      "exampleOutput": "A brief example of what output this prompt produces"
    }
  ],
  "automationWorkflow": {
    "name": "Workflow name",
    "description": "What this workflow automates",
    "trigger": {"type": "webhook|schedule|email|form", "config": "Configuration details"},
    "steps": [
      {"id": 1, "name": "Step name", "type": "action_type", "action": "What it does", "config": "Detailed configuration", "nextStep": 2}
    ],
    "connections": ["List of services/tools needed: Gmail, Slack, Notion, etc."]
  },
  "codeSnippets": [
    {
      "name": "Snippet name",
      "language": "javascript|python|bash",
      "description": "What this code does",
      "code": "Actual working code the user can copy and use"
    }
  ],
  "emailTemplates": [
    {
      "name": "Template name",
      "subject": "Email subject with {{variables}}",
      "body": "Full email body text with {{variables}} for personalization",
      "variables": ["variable1", "variable2"]
    }
  ],
  "apiConfig": [
    {
      "name": "API configuration name",
      "endpoint": "Full endpoint URL or path",
      "method": "GET|POST|PUT|DELETE",
      "headers": "JSON string of headers needed",
      "body": "JSON string of request body template",
      "description": "What this API call does"
    }
  ],
  "implementationChecklist": [
    {"id": 1, "task": "Task description", "details": "Specific steps to complete this task", "category": "Setup|Configuration|Testing|Deployment"}
  ],
  "portalActions": [
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
          "required": true,
          "options": [{"value": "opt1", "label": "Option 1"}]
        }
      ],
      "aiPrompt": "The AI prompt to process this action's input. Use {{field_name}} for variables.",
      "dataSource": "For dashboard type: what data to show",
      "triggerAction": "For trigger type: what action to perform"
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Generate ACTUAL, USABLE content - real prompts, real code, real templates that work
2. AI Prompts should be complete and ready to paste into ChatGPT/Claude
3. Code snippets should be working code (JavaScript/Python) that can be copied and run
4. Email templates should be professional and ready to use
5. Be specific and detailed - avoid generic placeholder text
6. Include at least 2-3 items in each array where relevant to the request
7. IMPORTANT: portalActions are the client-facing buttons/actions they'll see in their portal
   - Generate 3-5 relevant actions based on what the system does
   - "form" type needs fields array and aiPrompt
   - "dashboard" type shows data/analytics
   - "trigger" type is a one-click action
   - "ai_chat" type lets user chat with AI about this topic

Your response must be ONLY the JSON object, no additional text or markdown.`;

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

    // Update status to processing - check both workflows and system_builds tables
    if (buildId) {
      const supabase = getSupabase();
      // Try workflows table first (new system)
      const { data: workflow } = await supabase
        .from("workflows")
        .select("id")
        .eq("id", buildId)
        .single();

      if (workflow) {
        await supabase.from("workflows").update({ status: "processing" }).eq("id", buildId);
      } else {
        // Fallback to system_builds for backwards compatibility
        await supabase.from("system_builds").update({ status: "processing" }).eq("id", buildId);
      }
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
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
        systemOverview: "System generated from your request. See details below.",
        aiPrompts: [{
          name: "Generated Prompt",
          purpose: "Based on your request",
          prompt: responseText,
          variables: [],
          exampleOutput: "Output will vary based on input"
        }],
        automationWorkflow: {
          name: "Custom Workflow",
          description: "Generated workflow",
          trigger: { type: "manual", config: "Manual trigger" },
          steps: [{ id: 1, name: "Process", type: "action", action: "Execute task", config: responseText }],
          connections: []
        },
        codeSnippets: [],
        emailTemplates: [],
        apiConfig: [],
        implementationChecklist: [{ id: 1, task: "Review generated content", details: responseText, category: "Setup" }]
      };
    }

    // Extract portal actions from result
    const portalActions = result.portalActions || [];

    // Remove portalActions from result to keep it clean (actions stored separately)
    const { portalActions: _, ...cleanResult } = result;

    // Save result and actions - check both tables
    if (buildId) {
      const supabase = getSupabase();

      // Try workflows table first (new system)
      const { data: workflow } = await supabase
        .from("workflows")
        .select("id")
        .eq("id", buildId)
        .single();

      if (workflow) {
        // Save to workflows table with automation-specific fields
        await supabase.from("workflows").update({
          result: cleanResult,
          steps: cleanResult.automationWorkflow?.steps || [],
          total_steps: cleanResult.automationWorkflow?.steps?.length || 0,
          status: "ready",
          updated_at: new Date().toISOString(),
        }).eq("id", buildId);
      } else {
        // Fallback to system_builds for backwards compatibility
        await supabase.from("system_builds").update({
          result: cleanResult,
          actions: portalActions,
          status: "completed",
          updated_at: new Date().toISOString(),
        }).eq("id", buildId);
      }
    }

    return NextResponse.json({ result: cleanResult, actions: portalActions });

  } catch (error) {
    console.error("System Builder error:", error);

    if (buildId) {
      try {
        const supabase = getSupabase();

        // Try workflows table first
        const { data: workflow } = await supabase
          .from("workflows")
          .select("id")
          .eq("id", buildId)
          .single();

        if (workflow) {
          await supabase.from("workflows").update({
            status: "failed",
            updated_at: new Date().toISOString(),
          }).eq("id", buildId);
        } else {
          await supabase.from("system_builds").update({
            status: "failed",
            updated_at: new Date().toISOString(),
          }).eq("id", buildId);
        }
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
