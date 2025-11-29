"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Bot,
  Zap,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanLimits } from "@/hooks/use-plan-limits";

interface UsageMeterProps {
  clientId: string;
  onUpgradeClick?: () => void;
}

export function UsageMeter({ clientId, onUpgradeClick }: UsageMeterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, usage, percentages, plan } = usePlanLimits({ clientId });

  if (isLoading || !usage || !percentages || !plan) {
    return (
      <div className="h-8 w-32 bg-gray-100 rounded-full animate-pulse" />
    );
  }

  const isUnlimited = plan.limits.ai_actions_per_day === -1;
  const aiActionsPercent = percentages.ai_actions;
  const isWarning = aiActionsPercent >= 80 && aiActionsPercent < 100;
  const isAtLimit = aiActionsPercent >= 100;

  const getStatusColor = () => {
    if (isUnlimited) return "text-violet-600 bg-violet-50";
    if (isAtLimit) return "text-red-600 bg-red-50";
    if (isWarning) return "text-amber-600 bg-amber-50";
    return "text-gray-600 bg-gray-50";
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 80) return "bg-amber-500";
    return "bg-violet-500";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 rounded-full font-medium text-sm transition-colors",
            getStatusColor()
          )}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {isUnlimited ? (
            "Unlimited"
          ) : (
            <>
              {usage.ai_actions_today} / {plan.limits.ai_actions_per_day}
              {(isWarning || isAtLimit) && (
                <AlertCircle className="h-3.5 w-3.5 ml-1.5" />
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Usage Today</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {plan.name} Plan
            </Badge>
          </div>

          {/* AI Actions */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  <span>AI Actions</span>
                </div>
                <span className="font-medium">
                  {isUnlimited
                    ? `${usage.ai_actions_today} used`
                    : `${usage.ai_actions_today} / ${plan.limits.ai_actions_per_day}`}
                </span>
              </div>
              {!isUnlimited && (
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      getProgressColor(aiActionsPercent)
                    )}
                    style={{ width: `${Math.min(aiActionsPercent, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Agent Tasks */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span>Agent Tasks</span>
                </div>
                <span className="font-medium">
                  {plan.limits.agent_tasks_per_day === -1
                    ? `${usage.agent_tasks_today} used`
                    : `${usage.agent_tasks_today} / ${plan.limits.agent_tasks_per_day}`}
                </span>
              </div>
              {plan.limits.agent_tasks_per_day !== -1 && (
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      getProgressColor(percentages.agent_tasks)
                    )}
                    style={{ width: `${Math.min(percentages.agent_tasks, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Automations */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>Automations</span>
                </div>
                <span className="font-medium">
                  {plan.limits.automations_total === -1
                    ? `${usage.automations_count} active`
                    : `${usage.automations_count} / ${plan.limits.automations_total}`}
                </span>
              </div>
              {plan.limits.automations_total !== -1 && (
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      getProgressColor(percentages.automations)
                    )}
                    style={{ width: `${Math.min(percentages.automations, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <Link
              href="/portal/account/usage"
              className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
              onClick={() => setIsOpen(false)}
            >
              View Usage Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            {plan.tier !== "enterprise" && onUpgradeClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  onUpgradeClick();
                }}
                className="text-violet-600 border-violet-200 hover:bg-violet-50"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
