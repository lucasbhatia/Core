import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { checkPlanLimit, PLAN_LIMITS, type UsageStats } from "@/lib/plan-gating";

// Model configuration based on action type and plan
const MODEL_CONFIG = {
  default: {
    model: "claude-sonnet-4-20250514",
    maxTokens: 1800,
  },
  summarize: {
    model: "claude-3-haiku-20240307",
    maxTokens: 800,
  },
  expand: {
    model: "claude-sonnet-4-20250514",
    maxTokens: 2400,
  },
  analyze: {
    model: "claude-sonnet-4-20250514",
    maxTokens: 2000,
  },
};

// Temperature settings by action type
const TEMPERATURE_CONFIG: Record<string, number> = {
  summarize: 0.2,
  analyze: 0.4,
  explain: 0.3,
  rewrite: 0.7,
  expand: 0.6,
  improve: 0.5,
  translate: 0.2,
  extract: 0.2,
  format: 0.2,
  custom: 0.7,
};

// System prompts for each action type
const ACTION_PROMPTS: Record<string, string> = {
  explain: `You are an expert at explaining complex concepts clearly. Break down the content into understandable parts, provide context, and ensure the explanation is accessible to a general business audience.`,

  rewrite: `You are an expert writer. Rewrite the content with the specified tone while maintaining the core message. Improve clarity and flow.`,

  summarize: `You are an expert at creating concise summaries. Extract the key points and present them in a clear, organized manner. Be thorough but brief.`,

  expand: `You are an expert at expanding content with valuable details. Add context, examples, supporting information, and depth while maintaining coherence.`,

  analyze: `You are a business analyst. Provide insightful analysis including strengths, weaknesses, opportunities, patterns, and actionable recommendations.`,

  improve: `You are an expert editor. Enhance the content's quality, clarity, and effectiveness. Fix issues and strengthen the message while preserving the author's voice.`,

  translate: `You are an expert translator. Translate the content accurately while preserving meaning, tone, and cultural context. Maintain formatting.`,

  extract: `You are an expert at information extraction. Identify and extract key information including names, dates, numbers, action items, and important facts. Present in a structured format.`,

  format: `You are an expert at content formatting. Restructure the content for better readability using appropriate headers, lists, and formatting. Preserve all information.`,

  custom: `You are a helpful AI assistant. Follow the user's specific instructions carefully and provide high-quality output.`,
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const body = await req.json();
    const {
      clientId,
      entity,
      action,
      customPrompt,
      options = {},
    } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    if (!entity?.type || !entity?.id || !entity?.title) {
      return NextResponse.json({ error: "entity with type, id, and title is required" }, { status: 400 });
    }
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
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

    // Get today's AI action count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: aiActionsToday } = await supabase
      .from("ai_action_logs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    const usage: UsageStats = {
      ai_actions_today: aiActionsToday || 0,
      agent_tasks_today: 0,
      automations_count: 0,
      ai_tokens_this_month: 0,
    };

    const planCheck = checkPlanLimit("ai_action", planTier, usage);
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

    // Get model config
    const modelConfig = MODEL_CONFIG[action as keyof typeof MODEL_CONFIG] || MODEL_CONFIG.default;
    const temperature = TEMPERATURE_CONFIG[action] || 0.7;

    // Create initial log entry
    const { data: logEntry, error: logError } = await supabase
      .from("ai_action_logs")
      .insert({
        client_id: clientId,
        entity_type: entity.type,
        entity_id: entity.id,
        entity_title: entity.title,
        entity_content: entity.content || entity.description || entity.title,
        action_type: action,
        custom_prompt: customPrompt,
        model: modelConfig.model,
        temperature,
        max_tokens: modelConfig.maxTokens,
        tone: options.tone || "professional",
        output_length: options.length || "medium",
        target_language: options.language,
        status: "processing",
        review_status: "pending",
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to create log entry:", logError);
      // Continue anyway - logging shouldn't block the request
    } else {
      logId = logEntry.id;
    }

    // Build the prompt
    const systemPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.custom;
    const content = entity.content || entity.description || entity.title;

    let userPrompt = "";
    if (action === "custom" && customPrompt) {
      userPrompt = `${customPrompt}\n\nContent to process:\n${content}`;
    } else if (action === "translate") {
      userPrompt = `Translate the following content to ${options.language || "English"}:\n\n${content}`;
    } else if (action === "rewrite") {
      userPrompt = `Rewrite the following content with a ${options.tone || "professional"} tone. Target length: ${options.length || "medium"}.\n\nContent:\n${content}`;
    } else {
      userPrompt = `${action.charAt(0).toUpperCase() + action.slice(1)} the following content:\n\n${content}`;
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: modelConfig.maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Calculate processing time and tokens
    const processingTime = Date.now() - startTime;
    const inputTokens = message.usage?.input_tokens || 0;
    const outputTokens = message.usage?.output_tokens || 0;

    // Update log entry with results
    if (logId) {
      await supabase
        .from("ai_action_logs")
        .update({
          output_content: responseText,
          status: "completed",
          processing_time_ms: processingTime,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          updated_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    // Create notification
    try {
      await supabase.from("notifications").insert({
        client_id: clientId,
        type: "ai_action_complete",
        title: "AI response ready",
        message: `Your "${action}" request for "${entity.title}" is ready for review.`,
        data: {
          log_id: logId,
          action_type: action,
          entity_type: entity.type,
          entity_id: entity.id,
        },
        read: false,
      });
    } catch (notifyError) {
      console.error("Failed to create notification:", notifyError);
    }

    // Return response
    return NextResponse.json({
      id: logId || `temp-${Date.now()}`,
      entity_id: entity.id,
      action,
      original_content: content,
      result: responseText,
      tokens_used: inputTokens + outputTokens,
      processing_time_ms: processingTime,
      created_at: new Date().toISOString(),
      review_status: "pending",
    });

  } catch (error) {
    console.error("Ask AI error:", error);

    // Update log entry with error
    if (logId) {
      const supabase = getSupabase();
      await supabase
        .from("ai_action_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          processing_time_ms: Date.now() - startTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve AI action logs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const reviewStatus = searchParams.get("reviewStatus");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("ai_action_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    if (reviewStatus) {
      query = query.eq("review_status", reviewStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ logs: data });

  } catch (error) {
    console.error("Get AI action logs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
