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
  model_access: string[];
}

// Model access by plan tier
export const MODEL_ACCESS: Record<string, string[]> = {
  free: ["haiku"],
  starter: ["haiku", "sonnet"],
  pro: ["haiku", "sonnet"],
  enterprise: ["haiku", "sonnet", "opus"],
};

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
    model_access: ["haiku"],
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
    model_access: ["haiku", "sonnet"],
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
    model_access: ["haiku", "sonnet"],
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
    model_access: ["haiku", "sonnet", "opus"],
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

// Check if a specific model is accessible for a plan
export function checkModelAccess(
  modelId: string,
  planTier: string
): PlanCheckResult {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  const hasAccess = limits.model_access.includes(modelId);

  if (!hasAccess) {
    const modelNames: Record<string, string> = {
      haiku: "Claude Haiku",
      sonnet: "Claude Sonnet",
      opus: "Claude Opus",
    };

    return {
      allowed: false,
      reason: `${modelNames[modelId] || modelId} is not available on your current plan`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}

// Get the default model for a plan
export function getDefaultModel(planTier: string): string {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  // Prefer sonnet if available, otherwise haiku
  if (limits.model_access.includes("sonnet")) {
    return "sonnet";
  }
  return "haiku";
}

// Get all available models for a plan
export function getAvailableModels(planTier: string): string[] {
  const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
  return limits.model_access;
}

// Map model IDs to Claude API model strings
export function getClaudeModelId(modelId: string): string {
  const modelMap: Record<string, string> = {
    haiku: "claude-3-haiku-20240307",
    sonnet: "claude-sonnet-4-20250514",
    opus: "claude-opus-4-20250514",
  };
  return modelMap[modelId] || modelMap.sonnet;
}

// Interface for DB-loaded plan limits
export interface DBPlanLimits {
  id: string;
  name: string;
  ai_actions_daily: number;
  agent_tasks_daily: number;
  automations_limit: number;
  ai_tokens_limit: number;
  model_access: string[];
  features_enabled: {
    review_queue?: boolean;
    custom_agents?: boolean;
    webhook_triggers?: boolean;
    team_collaboration?: boolean;
    api_access?: boolean;
    priority_support?: boolean;
    custom_integrations?: boolean;
    white_label?: boolean;
  };
}

// Convert DB plan limits to PlanLimits interface
export function convertDBPlanLimits(dbLimits: DBPlanLimits): PlanLimits {
  return {
    ai_actions_per_day: dbLimits.ai_actions_daily,
    agent_tasks_per_day: dbLimits.agent_tasks_daily,
    automations_total: dbLimits.automations_limit,
    ai_tokens_per_month: dbLimits.ai_tokens_limit,
    review_queue_enabled: dbLimits.features_enabled?.review_queue ?? true,
    advanced_ai_models: dbLimits.model_access.includes("sonnet") || dbLimits.model_access.includes("opus"),
    custom_agents: dbLimits.features_enabled?.custom_agents ?? false,
    webhook_triggers: dbLimits.features_enabled?.webhook_triggers ?? false,
    team_collaboration: dbLimits.features_enabled?.team_collaboration ?? false,
    model_access: dbLimits.model_access,
  };
}
