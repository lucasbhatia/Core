import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getAgentById,
  type CreateTaskRequest,
  type AgentTask,
  type AgentDeliverable,
} from "@/lib/ai-workforce";

const anthropic = new Anthropic();

// GET /api/portal/workforce/tasks - Get all tasks for the client
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("agent_tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq("hired_agent_id", agentId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tasks, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    return NextResponse.json({
      tasks: tasks || [],
      total: tasks?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/portal/workforce/tasks - Create and execute a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body: CreateTaskRequest = await request.json();
    const {
      hired_agent_id,
      title,
      description,
      instructions,
      priority = "normal",
      options = {},
      execute_immediately = true,
    } = body;

    if (!hired_agent_id || !title) {
      return NextResponse.json(
        { error: "Agent ID and title are required" },
        { status: 400 }
      );
    }

    // Get the hired agent
    const { data: hiredAgent } = await supabase
      .from("hired_agents")
      .select("*")
      .eq("id", hired_agent_id)
      .eq("client_id", clientId)
      .single();

    // Get roster agent for system prompt
    const rosterAgent = hiredAgent
      ? getAgentById(hiredAgent.roster_id)
      : getAgentById("content-writer-sarah"); // Fallback for demo

    if (!rosterAgent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Create task record
    const taskId = `task-${Date.now()}`;
    const task: Partial<AgentTask> = {
      id: taskId,
      hired_agent_id,
      client_id: clientId,
      title,
      description: description || "",
      instructions: instructions || "",
      priority,
      input_data: {},
      attachments: [],
      options,
      status: execute_immediately ? "in_progress" : "pending",
      progress: 0,
      deliverable_id: null,
      created_at: new Date().toISOString(),
      started_at: execute_immediately ? new Date().toISOString() : null,
      completed_at: null,
      estimated_duration_seconds: 30,
      actual_duration_seconds: null,
      tokens_used: 0,
      error_message: null,
      triggered_by_automation_id: null,
      trigger_next_automation: false,
    };

    // If execute immediately, generate the content
    if (execute_immediately) {
      try {
        // Build the prompt
        const userPrompt = buildTaskPrompt(title, description, instructions, options);

        // Call Anthropic API
        const response = await anthropic.messages.create({
          model: rosterAgent.default_model || "claude-sonnet-4-20250514",
          max_tokens: 4096,
          temperature: rosterAgent.default_temperature || 0.7,
          system: rosterAgent.system_prompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const outputText =
          response.content[0].type === "text" ? response.content[0].text : "";
        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

        // Create deliverable
        const deliverableId = `del-${Date.now()}`;
        const deliverable: Partial<AgentDeliverable> = {
          id: deliverableId,
          task_id: taskId,
          hired_agent_id,
          client_id: clientId,
          title,
          type: inferDeliverableType(title, options),
          content: outputText,
          word_count: outputText.split(/\s+/).length,
          character_count: outputText.length,
          reading_time_minutes: Math.ceil(outputText.split(/\s+/).length / 200),
          status: "ready",
          rating: null,
          feedback: null,
          version: 1,
          previous_version_id: null,
          tokens_used: tokensUsed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          published_at: null,
        };

        // Update task with completion
        task.status = "completed";
        task.progress = 100;
        task.completed_at = new Date().toISOString();
        task.actual_duration_seconds = 5; // Simulated
        task.tokens_used = tokensUsed;
        task.deliverable_id = deliverableId;

        // Try to save to database
        try {
          await supabase.from("agent_tasks").insert(task);
          await supabase.from("agent_deliverables").insert(deliverable);

          // Update agent stats
          await supabase
            .from("hired_agents")
            .update({
              tasks_completed: (hiredAgent?.tasks_completed || 0) + 1,
              deliverables_created: (hiredAgent?.deliverables_created || 0) + 1,
              total_tokens_used: (hiredAgent?.total_tokens_used || 0) + tokensUsed,
              last_active_at: new Date().toISOString(),
            })
            .eq("id", hired_agent_id);
        } catch (dbError) {
          // Database tables may not exist, continue with response
          console.log("Database save skipped:", dbError);
        }

        return NextResponse.json({
          task,
          deliverable,
        }, { status: 201 });
      } catch (aiError) {
        console.error("AI generation error:", aiError);

        // Return error state
        task.status = "failed";
        task.error_message = "Failed to generate content";

        return NextResponse.json({
          task,
          error: "Failed to generate content",
        }, { status: 500 });
      }
    }

    // If not executing immediately, just save the task
    try {
      await supabase.from("agent_tasks").insert(task);
    } catch {
      // Table may not exist
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// Helper function to build task prompt
function buildTaskPrompt(
  title: string,
  description: string,
  instructions: string,
  options: CreateTaskRequest["options"]
): string {
  let prompt = `Please create: ${title}\n\n`;

  if (description) {
    prompt += `Description: ${description}\n\n`;
  }

  if (instructions) {
    prompt += `Instructions: ${instructions}\n\n`;
  }

  if (options) {
    const requirements: string[] = [];

    if (options.tone) {
      requirements.push(`Tone: ${options.tone}`);
    }

    if (options.length) {
      const lengthGuide =
        options.length === "short"
          ? "approximately 500 words"
          : options.length === "medium"
          ? "approximately 1000 words"
          : "approximately 2000+ words";
      requirements.push(`Length: ${lengthGuide}`);
    }

    if (options.include_seo && options.keywords?.length) {
      requirements.push(`SEO Keywords to include: ${options.keywords.join(", ")}`);
    }

    if (options.include_cta) {
      requirements.push(
        `Include a call-to-action${options.cta_text ? `: "${options.cta_text}"` : ""}`
      );
    }

    if (requirements.length > 0) {
      prompt += `Requirements:\n${requirements.map((r) => `- ${r}`).join("\n")}\n\n`;
    }
  }

  prompt += "Please provide the complete content:";

  return prompt;
}

// Helper function to infer deliverable type
function inferDeliverableType(
  title: string,
  options: CreateTaskRequest["options"]
): AgentDeliverable["type"] {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("blog") || lowerTitle.includes("article")) {
    return "blog_post";
  }
  if (lowerTitle.includes("social") || lowerTitle.includes("post")) {
    return "social_post";
  }
  if (lowerTitle.includes("email") || lowerTitle.includes("newsletter")) {
    return "email";
  }
  if (lowerTitle.includes("report") || lowerTitle.includes("analysis")) {
    return "report";
  }
  if (lowerTitle.includes("script") || lowerTitle.includes("video")) {
    return "script";
  }
  if (lowerTitle.includes("copy") || lowerTitle.includes("ad")) {
    return "copy";
  }

  return "document";
}
