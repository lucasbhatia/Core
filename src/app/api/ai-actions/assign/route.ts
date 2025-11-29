import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { checkPlanLimit, type UsageStats } from "@/lib/plan-gating";

// Agent system prompts are loaded from the roster, but we have fallback templates
const AGENT_PROMPT_TEMPLATE = (agentName: string, agentRole: string, instructions: string, entityContext: string) => `
You are ${agentName}, a ${agentRole}. You are working on a task assigned by a business user.

Your Task Instructions:
${instructions}

Context (the item you're working on):
${entityContext}

Guidelines:
1. Complete the task thoroughly and professionally
2. Follow any specific instructions provided
3. Provide actionable, high-quality output
4. Be clear and well-organized in your response
5. If the task is unclear, make reasonable assumptions and note them

Deliver your best work.
`;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let taskId: string | null = null;

  try {
    const body = await req.json();
    const {
      clientId,
      entity,
      agentId,
      agentName,
      agentRole,
      agentDepartment,
      agentSystemPrompt,
      instructions,
      priority = "normal",
      dueDate,
      options = {},
    } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    if (!entity?.type || !entity?.id || !entity?.title) {
      return NextResponse.json({ error: "entity with type, id, and title is required" }, { status: 400 });
    }
    if (!agentId || !agentName) {
      return NextResponse.json({ error: "agentId and agentName are required" }, { status: 400 });
    }
    if (!instructions) {
      return NextResponse.json({ error: "instructions are required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const supabase = getSupabase();

    // Check plan limits
    const { data: client } = await supabase
      .from("clients")
      .select("*, subscription:client_subscriptions(*, plan:subscription_plans(*))")
      .eq("id", clientId)
      .single();

    const planTier = client?.subscription?.[0]?.plan?.name?.toLowerCase() || "free";

    // Get today's agent task count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: agentTasksToday } = await supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    const usage: UsageStats = {
      ai_actions_today: 0,
      agent_tasks_today: agentTasksToday || 0,
      automations_count: 0,
      ai_tokens_this_month: 0,
    };

    const planCheck = checkPlanLimit("agent_task", planTier, usage);
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: planCheck.reason,
          upgrade_required: planCheck.upgrade_required,
          limit: planCheck.limit,
          current: planCheck.current,
        },
        { status: 429 }
      );
    }

    // Create task entry
    const { data: taskEntry, error: taskError } = await supabase
      .from("agent_tasks")
      .insert({
        client_id: clientId,
        agent_roster_id: agentId,
        agent_name: agentName,
        agent_department: agentDepartment,
        entity_type: entity.type,
        entity_id: entity.id,
        entity_title: entity.title,
        instructions,
        priority,
        due_date: dueDate,
        status: "in_progress",
        started_at: new Date().toISOString(),
        review_status: options.autoApprove ? "approved" : "pending",
        auto_approve: options.autoApprove || false,
        notify_on_complete: options.notifyOnComplete !== false,
        chain_to_automation_id: options.chainToAutomation,
        model: "claude-sonnet-4-20250514",
        max_tokens: 3800,
      })
      .select()
      .single();

    if (taskError) {
      console.error("Failed to create task entry:", taskError);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    taskId = taskEntry.id;

    // Build entity context
    const entityContext = [
      `Type: ${entity.type}`,
      `Title: ${entity.title}`,
      entity.description ? `Description: ${entity.description}` : null,
      entity.content ? `Content:\n${entity.content}` : null,
      entity.status ? `Status: ${entity.status}` : null,
      entity.due_date ? `Due Date: ${entity.due_date}` : null,
    ].filter(Boolean).join("\n");

    // Build system prompt
    const systemPrompt = agentSystemPrompt || AGENT_PROMPT_TEMPLATE(
      agentName,
      agentRole || "AI Assistant",
      instructions,
      entityContext
    );

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3800,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Please complete this task:\n\n${instructions}\n\nContext:\n${entityContext}`,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Calculate metrics
    const processingTime = Date.now() - startTime;
    const inputTokens = message.usage?.input_tokens || 0;
    const outputTokens = message.usage?.output_tokens || 0;

    // Update task with results
    await supabase
      .from("agent_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        output_content: responseText,
        processing_time_ms: processingTime,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    // Send notification if enabled
    if (options.notifyOnComplete !== false) {
      // Create in-app notification
      try {
        await supabase.from("notifications").insert({
          client_id: clientId,
          type: "agent_task_complete",
          title: `${agentName} completed your task`,
          message: `Your task "${entity.title}" has been completed and is ready for review.`,
          data: {
            task_id: taskId,
            agent_name: agentName,
            entity_type: entity.type,
            entity_id: entity.id,
          },
          read: false,
        });
      } catch (notifyError) {
        console.error("Failed to create notification:", notifyError);
        // Don't fail the request for notification errors
      }
    }

    // Return response
    return NextResponse.json({
      id: taskId,
      entity,
      agent_id: agentId,
      agent_name: agentName,
      agent_avatar: "🤖", // Placeholder - would come from roster
      instructions,
      status: "completed",
      priority,
      created_at: taskEntry.created_at,
      started_at: taskEntry.started_at,
      completed_at: new Date().toISOString(),
      output_content: responseText,
      tokens_used: inputTokens + outputTokens,
      processing_time_ms: processingTime,
      review_status: options.autoApprove ? "approved" : "pending",
    });

  } catch (error) {
    console.error("Assign to agent error:", error);

    // Update task entry with error
    if (taskId) {
      const supabase = getSupabase();
      await supabase
        .from("agent_tasks")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          processing_time_ms: Date.now() - startTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign to agent" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve agent tasks
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const reviewStatus = searchParams.get("reviewStatus");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("agent_tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq("agent_roster_id", agentId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (reviewStatus) {
      query = query.eq("review_status", reviewStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ tasks: data });

  } catch (error) {
    console.error("Get agent tasks error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update task (approve/reject/edit)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      taskId,
      reviewStatus,
      editedContent,
      rejectionReason,
      reviewedBy,
      rating,
      feedback,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (reviewStatus) {
      updateData.review_status = reviewStatus;
      updateData.reviewed_at = new Date().toISOString();
      if (reviewedBy) updateData.reviewed_by = reviewedBy;
    }
    if (editedContent !== undefined) {
      updateData.edited_content = editedContent;
    }
    if (rejectionReason !== undefined) {
      updateData.rejection_reason = rejectionReason;
    }
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }

    const { data, error } = await supabase
      .from("agent_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ task: data });

  } catch (error) {
    console.error("Update agent task error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 }
    );
  }
}
