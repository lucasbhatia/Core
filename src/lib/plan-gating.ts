// Plan Gating - Feature limits by subscription tier
// Used to enforce plan-based restrictions on AI actions

export interface PlanLimits {
  ai_actions_per_day: number;
  agent_tasks_per_day: number;
  automations_total: number;
  ai_tokens_per_month: number;
  review_queue_enabled: boolean;
  advanced_ai_models: boolean;
  custom_agents: boolean;
  webhook_triggers: boolean;
  team_collaboration: boolean;
}

// Default plan configurations
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    ai_actions_per_day: 10,
    agent_tasks_per_day: 5,
    automations_total: 3,
    ai_tokens_per_month: 10000,
    review_queue_enabled: true,
    advanced_ai_models: false,
    custom_agents: false,
    webhook_triggers: false,
    team_collaboration: false,
  },
  starter: {
    ai_actions_per_day: 50,
    agent_tasks_per_day: 25,
    automations_total: 15,
    ai_tokens_per_month: 100000,
    review_queue_enabled: true,
    advanced_ai_models: true,
    custom_agents: false,
    webhook_triggers: true,
    team_collaboration: false,
  },
  pro: {
    ai_actions_per_day: 200,
    agent_tasks_per_day: 100,
    automations_total: 50,
    ai_tokens_per_month: 500000,
    review_queue_enabled: true,
    advanced_ai_models: true,
    custom_agents: true,
    webhook_triggers: true,
    team_collaboration: true,
  },
  enterprise: {
    ai_actions_per_day: -1, // Unlimited
    agent_tasks_per_day: -1,
    automations_total: -1,
    ai_tokens_per_month: -1,
    review_queue_enabled: true,
    advanced_ai_models: true,
    custom_agents: true,
    webhook_triggers: true,
    team_collaboration: true,
  },
};

export interface UsageStats {
  ai_actions_today: number;
  agent_tasks_today: number;
  automations_count: number;
  ai_tokens_this_month: number;
}

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  upgrade_required?: boolean;
}

export function checkPlanLimit(
  action: "ai_action" | "agent_task" | "automation" | "ai_tokens",
  planTier: string,
  usage: UsageStats,
  additionalTokens?: number
): PlanCheckResult {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;

  switch (action) {
    case "ai_action": {
      const limit = limits.ai_actions_per_day;
      if (limit === -1) return { allowed: true };
      if (usage.ai_actions_today >= limit) {
        return {
          allowed: false,
          reason: `Daily AI action limit reached (${limit}/day)`,
          limit,
          current: usage.ai_actions_today,
          upgrade_required: true,
        };
      }
      return { allowed: true, limit, current: usage.ai_actions_today };
    }

    case "agent_task": {
      const limit = limits.agent_tasks_per_day;
      if (limit === -1) return { allowed: true };
      if (usage.agent_tasks_today >= limit) {
        return {
          allowed: false,
          reason: `Daily agent task limit reached (${limit}/day)`,
          limit,
          current: usage.agent_tasks_today,
          upgrade_required: true,
        };
      }
      return { allowed: true, limit, current: usage.agent_tasks_today };
    }

    case "automation": {
      const limit = limits.automations_total;
      if (limit === -1) return { allowed: true };
      if (usage.automations_count >= limit) {
        return {
          allowed: false,
          reason: `Automation limit reached (${limit} total)`,
          limit,
          current: usage.automations_count,
          upgrade_required: true,
        };
      }
      return { allowed: true, limit, current: usage.automations_count };
    }

    case "ai_tokens": {
      const limit = limits.ai_tokens_per_month;
      if (limit === -1) return { allowed: true };
      const projectedUsage = usage.ai_tokens_this_month + (additionalTokens || 0);
      if (projectedUsage > limit) {
        return {
          allowed: false,
          reason: `Monthly AI token limit would be exceeded (${limit.toLocaleString()}/month)`,
          limit,
          current: usage.ai_tokens_this_month,
          upgrade_required: true,
        };
      }
      return { allowed: true, limit, current: usage.ai_tokens_this_month };
    }

    default:
      return { allowed: true };
  }
}

export function checkFeatureAccess(
  feature: keyof Omit<PlanLimits, "ai_actions_per_day" | "agent_tasks_per_day" | "automations_total" | "ai_tokens_per_month">,
  planTier: string
): PlanCheckResult {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  const hasAccess = limits[feature];

  if (!hasAccess) {
    const featureNames: Record<string, string> = {
      review_queue_enabled: "Review Queue",
      advanced_ai_models: "Advanced AI Models",
      custom_agents: "Custom Agents",
      webhook_triggers: "Webhook Triggers",
      team_collaboration: "Team Collaboration",
    };

    return {
      allowed: false,
      reason: `${featureNames[feature] || feature} is not available on your current plan`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

export function getPlanDisplayName(planTier: string): string {
  const names: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };
  return names[planTier] || planTier;
}

export function getUpgradeRecommendation(currentPlan: string): string | null {
  const upgradeMap: Record<string, string> = {
    free: "starter",
    starter: "pro",
    pro: "enterprise",
  };
  return upgradeMap[currentPlan] || null;
}
