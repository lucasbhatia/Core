"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Calendar,
  RefreshCw,
  Crown,
  Loader2,
} from "lucide-react";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { UpgradeModal, useUpgradeModal } from "@/components/portal/upgrade-modal";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface UsageDashboardProps {
  clientId: string;
  clientName: string;
}

interface DailyUsage {
  date: string;
  ai_actions: number;
  agent_tasks: number;
  tokens_used: number;
}

export default function UsageDashboard({ clientId, clientName }: UsageDashboardProps) {
  const { isLoading, usage, percentages, plan, refresh } = usePlanLimits({ clientId });
  const upgradeModal = useUpgradeModal();
  const [period, setPeriod] = useState<"7d" | "30d" | "month">("7d");
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function fetchUsageHistory() {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/portal/usage-history?clientId=${clientId}&period=${period}`);
        if (response.ok) {
          const data = await response.json();
          setDailyUsage(data.daily || []);
        }
      } catch (error) {
        console.error("Failed to fetch usage history:", error);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchUsageHistory();
  }, [clientId, period]);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-amber-500";
    return "bg-violet-500";
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) return <Badge className="bg-red-100 text-red-700">At Limit</Badge>;
    if (percent >= 80) return <Badge className="bg-amber-100 text-amber-700">Near Limit</Badge>;
    return <Badge className="bg-green-100 text-green-700">Good</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage Dashboard</h1>
          <p className="text-muted-foreground">
            Track your AI actions, agent tasks, and automation usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {plan?.tier !== "enterprise" && (
            <Button onClick={() => upgradeModal.openModal()}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>Your subscription and usage limits</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1 capitalize">
              {plan?.name || "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* AI Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <span className="font-medium">AI Actions</span>
                </div>
                {percentages && getStatusBadge(percentages.ai_actions)}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Today's usage</span>
                  <span className="font-medium">
                    {plan?.limits.ai_actions_per_day === -1
                      ? `${usage?.ai_actions_today || 0} used`
                      : `${usage?.ai_actions_today || 0} / ${plan?.limits.ai_actions_per_day}`}
                  </span>
                </div>
                {plan?.limits.ai_actions_per_day !== -1 && (
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        getProgressColor(percentages?.ai_actions || 0)
                      )}
                      style={{ width: `${Math.min(percentages?.ai_actions || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Agent Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Agent Tasks</span>
                </div>
                {percentages && getStatusBadge(percentages.agent_tasks)}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Today's usage</span>
                  <span className="font-medium">
                    {plan?.limits.agent_tasks_per_day === -1
                      ? `${usage?.agent_tasks_today || 0} used`
                      : `${usage?.agent_tasks_today || 0} / ${plan?.limits.agent_tasks_per_day}`}
                  </span>
                </div>
                {plan?.limits.agent_tasks_per_day !== -1 && (
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        getProgressColor(percentages?.agent_tasks || 0)
                      )}
                      style={{ width: `${Math.min(percentages?.agent_tasks || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Automations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Zap className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="font-medium">Automations</span>
                </div>
                {percentages && getStatusBadge(percentages.automations)}
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Active automations</span>
                  <span className="font-medium">
                    {plan?.limits.automations_total === -1
                      ? `${usage?.automations_count || 0} active`
                      : `${usage?.automations_count || 0} / ${plan?.limits.automations_total}`}
                  </span>
                </div>
                {plan?.limits.automations_total !== -1 && (
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        getProgressColor(percentages?.automations || 0)
                      )}
                      style={{ width: `${Math.min(percentages?.automations || 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Usage History</CardTitle>
              <CardDescription>Your usage over time</CardDescription>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dailyUsage.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No usage data available for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="grid grid-cols-7 gap-2">
                {dailyUsage.slice(-7).map((day, i) => {
                  const maxActions = Math.max(...dailyUsage.map(d => d.ai_actions), 1);
                  const height = (day.ai_actions / maxActions) * 100;

                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-full h-24 flex items-end">
                        <div
                          className="w-full bg-violet-500 rounded-t transition-all hover:bg-violet-600"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${day.ai_actions} AI actions`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(day.date), "EEE")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-600">
                    {dailyUsage.reduce((sum, d) => sum + d.ai_actions, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total AI Actions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {dailyUsage.reduce((sum, d) => sum + d.agent_tasks, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Agent Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {(dailyUsage.reduce((sum, d) => sum + d.tokens_used, 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-sm text-muted-foreground">Tokens Used</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Token Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Token Usage</CardTitle>
          <CardDescription>Monthly token consumption across all AI features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tokens used this month</span>
                <span className="font-medium">
                  {plan?.limits.ai_tokens_per_month === -1
                    ? `${((usage?.ai_tokens_this_month || 0) / 1000).toFixed(1)}K used`
                    : `${((usage?.ai_tokens_this_month || 0) / 1000).toFixed(1)}K / ${((plan?.limits.ai_tokens_per_month || 0) / 1000).toFixed(0)}K`}
                </span>
              </div>
              {plan?.limits.ai_tokens_per_month !== -1 && (
                <Progress
                  value={Math.min(percentages?.ai_tokens || 0, 100)}
                  className="h-3"
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Tokens are used for AI actions, agent tasks, and automated AI processing.
              {plan?.tier !== "enterprise" && " Upgrade your plan for more tokens."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={upgradeModal.closeModal}
        currentPlan={plan?.tier || "free"}
        clientId={clientId}
      />
    </div>
  );
}
