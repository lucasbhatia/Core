"use client";

import { useState, useEffect, useCallback } from "react";
import type { PlanLimits, UsageStats, PlanCheckResult } from "@/lib/plan-gating";

interface UsePlanLimitsOptions {
  clientId: string;
  refreshInterval?: number; // in milliseconds, defaults to 60000 (1 minute)
}

interface UsePlanLimitsResult {
  isLoading: boolean;
  error: string | null;
  plan: {
    tier: string;
    name: string;
    limits: PlanLimits;
  } | null;
  usage: UsageStats | null;
  percentages: {
    ai_actions: number;
    agent_tasks: number;
    automations: number;
    ai_tokens: number;
  } | null;
  checks: Record<string, PlanCheckResult> | null;
  upgradeRecommendation: string | null;
  refresh: () => Promise<void>;
  checkAction: (action: "ai_action" | "agent_task" | "automation" | "ai_tokens", additionalTokens?: number) => Promise<PlanCheckResult>;
  canPerformAction: (action: "ai_action" | "agent_task" | "automation") => boolean;
}

export function usePlanLimits({ clientId, refreshInterval = 60000 }: UsePlanLimitsOptions): UsePlanLimitsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    plan: { tier: string; name: string; limits: PlanLimits } | null;
    usage: UsageStats | null;
    percentages: { ai_actions: number; agent_tasks: number; automations: number; ai_tokens: number } | null;
    checks: Record<string, PlanCheckResult> | null;
    upgradeRecommendation: string | null;
  }>({
    plan: null,
    usage: null,
    percentages: null,
    checks: null,
    upgradeRecommendation: null,
  });

  const fetchUsage = useCallback(async () => {
    if (!clientId) return;

    try {
      const response = await fetch(`/api/ai-actions/usage?clientId=${clientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch usage");
      }

      const result = await response.json();
      setData({
        plan: result.plan,
        usage: result.usage,
        percentages: result.percentages,
        checks: result.checks,
        upgradeRecommendation: result.upgrade_recommendation,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan limits");
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchUsage, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchUsage, refreshInterval]);

  const checkAction = useCallback(
    async (action: "ai_action" | "agent_task" | "automation" | "ai_tokens", additionalTokens?: number): Promise<PlanCheckResult> => {
      if (!clientId) {
        return { allowed: false, reason: "No client ID" };
      }

      try {
        const response = await fetch("/api/ai-actions/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, action, additionalTokens }),
        });

        if (!response.ok) {
          return { allowed: false, reason: "Failed to check plan limits" };
        }

        return await response.json();
      } catch {
        return { allowed: false, reason: "Failed to check plan limits" };
      }
    },
    [clientId]
  );

  const canPerformAction = useCallback(
    (action: "ai_action" | "agent_task" | "automation"): boolean => {
      if (!data.checks) return true; // Optimistically allow if data not loaded
      return data.checks[action]?.allowed ?? true;
    },
    [data.checks]
  );

  return {
    isLoading,
    error,
    plan: data.plan,
    usage: data.usage,
    percentages: data.percentages,
    checks: data.checks,
    upgradeRecommendation: data.upgradeRecommendation,
    refresh: fetchUsage,
    checkAction,
    canPerformAction,
  };
}
