import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PLAN_LIMITS,
  checkPlanLimit,
  checkFeatureAccess,
  getPlanDisplayName,
  getUpgradeRecommendation,
  type UsageStats,
  type PlanLimits,
} from "@/lib/plan-gating";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get client's subscription plan
    const { data: client } = await supabase
      .from("clients")
      .select("*, subscription:client_subscriptions(*, plan:subscription_plans(*))")
      .eq("id", clientId)
      .single();

    const planTier = client?.subscription?.[0]?.plan?.name?.toLowerCase() || "free";

    // Get today's date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get this month's date boundaries
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Count today's AI actions
    const { count: aiActionsToday } = await supabase
      .from("ai_action_logs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    // Count today's agent tasks
    const { count: agentTasksToday } = await supabase
      .from("agent_tasks")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    // Count total active automations
    const { count: automationsCount } = await supabase
      .from("universal_automations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_active", true)
      .neq("status", "archived");

    // Sum this month's AI tokens
    const { data: tokenData } = await supabase
      .from("ai_action_logs")
      .select("total_tokens")
      .eq("client_id", clientId)
      .gte("created_at", monthStart.toISOString());

    const aiTokensThisMonth = tokenData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;

    // Add agent task tokens
    const { data: agentTokenData } = await supabase
      .from("agent_tasks")
      .select("total_tokens")
      .eq("client_id", clientId)
      .gte("created_at", monthStart.toISOString());

    const totalTokensThisMonth = aiTokensThisMonth +
      (agentTokenData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0);

    // Build usage stats
    const usage: UsageStats = {
      ai_actions_today: aiActionsToday || 0,
      agent_tasks_today: agentTasksToday || 0,
      automations_count: automationsCount || 0,
      ai_tokens_this_month: totalTokensThisMonth,
    };

    // Get plan limits
    const limits: PlanLimits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;

    // Check each limit
    const checks = {
      ai_action: checkPlanLimit("ai_action", planTier, usage),
      agent_task: checkPlanLimit("agent_task", planTier, usage),
      automation: checkPlanLimit("automation", planTier, usage),
      ai_tokens: checkPlanLimit("ai_tokens", planTier, usage),
      advanced_ai_models: checkFeatureAccess("advanced_ai_models", planTier),
      custom_agents: checkFeatureAccess("custom_agents", planTier),
      webhook_triggers: checkFeatureAccess("webhook_triggers", planTier),
      team_collaboration: checkFeatureAccess("team_collaboration", planTier),
    };

    // Calculate usage percentages
    const percentages = {
      ai_actions: limits.ai_actions_per_day === -1 ? 0 :
        Math.round((usage.ai_actions_today / limits.ai_actions_per_day) * 100),
      agent_tasks: limits.agent_tasks_per_day === -1 ? 0 :
        Math.round((usage.agent_tasks_today / limits.agent_tasks_per_day) * 100),
      automations: limits.automations_total === -1 ? 0 :
        Math.round((usage.automations_count / limits.automations_total) * 100),
      ai_tokens: limits.ai_tokens_per_month === -1 ? 0 :
        Math.round((usage.ai_tokens_this_month / limits.ai_tokens_per_month) * 100),
    };

    return NextResponse.json({
      plan: {
        tier: planTier,
        name: getPlanDisplayName(planTier),
        limits,
      },
      usage,
      percentages,
      checks,
      upgrade_recommendation: getUpgradeRecommendation(planTier),
    });

  } catch (error) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check usage" },
      { status: 500 }
    );
  }
}

// POST endpoint to check if a specific action is allowed
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, action, additionalTokens } = body;

    if (!clientId || !action) {
      return NextResponse.json(
        { error: "clientId and action are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get client's subscription plan
    const { data: client } = await supabase
      .from("clients")
      .select("*, subscription:client_subscriptions(*, plan:subscription_plans(*))")
      .eq("id", clientId)
      .single();

    const planTier = client?.subscription?.[0]?.plan?.name?.toLowerCase() || "free";

    // Get today's date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Build usage stats based on action type
    let usage: UsageStats = {
      ai_actions_today: 0,
      agent_tasks_today: 0,
      automations_count: 0,
      ai_tokens_this_month: 0,
    };

    if (action === "ai_action") {
      const { count } = await supabase
        .from("ai_action_logs")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());
      usage.ai_actions_today = count || 0;
    } else if (action === "agent_task") {
      const { count } = await supabase
        .from("agent_tasks")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());
      usage.agent_tasks_today = count || 0;
    } else if (action === "automation") {
      const { count } = await supabase
        .from("universal_automations")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .eq("is_active", true)
        .neq("status", "archived");
      usage.automations_count = count || 0;
    } else if (action === "ai_tokens") {
      const { data: tokenData } = await supabase
        .from("ai_action_logs")
        .select("total_tokens")
        .eq("client_id", clientId)
        .gte("created_at", monthStart.toISOString());
      usage.ai_tokens_this_month = tokenData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;
    }

    const result = checkPlanLimit(action, planTier, usage, additionalTokens);

    return NextResponse.json({
      ...result,
      plan: planTier,
      plan_name: getPlanDisplayName(planTier),
      upgrade_to: !result.allowed ? getUpgradeRecommendation(planTier) : null,
    });

  } catch (error) {
    console.error("Plan check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check plan" },
      { status: 500 }
    );
  }
}
