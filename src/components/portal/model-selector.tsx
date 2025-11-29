"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

// Model definitions with plan restrictions
export interface AIModel {
  id: string;
  name: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  requiredPlan: "free" | "starter" | "pro" | "enterprise";
}

export const AI_MODELS: AIModel[] = [
  {
    id: "haiku",
    name: "Claude Haiku",
    description: "Fast and efficient for simple tasks",
    badge: "Fast",
    badgeColor: "green",
    icon: Zap,
    requiredPlan: "free",
  },
  {
    id: "sonnet",
    name: "Claude Sonnet",
    description: "Balanced performance for most tasks",
    badge: "Recommended",
    badgeColor: "violet",
    icon: Sparkles,
    requiredPlan: "starter",
  },
  {
    id: "opus",
    name: "Claude Opus",
    description: "Most capable for complex reasoning",
    badge: "Premium",
    badgeColor: "amber",
    icon: Crown,
    requiredPlan: "enterprise",
  },
];

// Plan hierarchy for access checking
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export function canAccessModel(modelId: string, userPlan: string): boolean {
  const model = AI_MODELS.find((m) => m.id === modelId);
  if (!model) return false;

  const userPlanLevel = PLAN_HIERARCHY[userPlan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[model.requiredPlan] ?? 0;

  return userPlanLevel >= requiredLevel;
}

export function getDefaultModel(userPlan: string): string {
  // Return the best model available for the plan
  if (PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY["starter"]) {
    return "sonnet";
  }
  return "haiku";
}

export function getAllowedModels(userPlan: string): AIModel[] {
  return AI_MODELS.filter((model) => canAccessModel(model.id, userPlan));
}

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  userPlan: string;
  disabled?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
}

export function ModelSelector({
  value,
  onChange,
  userPlan,
  disabled = false,
  className,
  onUpgradeClick,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedModel = AI_MODELS.find((m) => m.id === value);
  const allowedModels = getAllowedModels(userPlan);

  const handleSelect = (modelId: string) => {
    if (canAccessModel(modelId, userPlan)) {
      onChange(modelId);
      setOpen(false);
    } else {
      // Trigger upgrade modal
      onUpgradeClick?.();
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handleSelect}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className={cn("w-[180px]", className)}>
        <SelectValue>
          {selectedModel && (
            <div className="flex items-center gap-2">
              <selectedModel.icon className="h-4 w-4" />
              <span>{selectedModel.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AI_MODELS.map((model) => {
          const hasAccess = canAccessModel(model.id, userPlan);

          return (
            <SelectItem
              key={model.id}
              value={model.id}
              disabled={!hasAccess}
              className={cn(!hasAccess && "opacity-60")}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                  <model.icon
                    className={cn(
                      "h-4 w-4",
                      model.id === "haiku" && "text-green-600",
                      model.id === "sonnet" && "text-violet-600",
                      model.id === "opus" && "text-amber-600"
                    )}
                  />
                  <div>
                    <span className="font-medium">{model.name}</span>
                    {model.badge && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2 text-xs",
                          model.badgeColor === "green" && "border-green-200 text-green-700 bg-green-50",
                          model.badgeColor === "violet" && "border-violet-200 text-violet-700 bg-violet-50",
                          model.badgeColor === "amber" && "border-amber-200 text-amber-700 bg-amber-50"
                        )}
                      >
                        {model.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                {!hasAccess && (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Compact version for inline use
interface ModelSelectorCompactProps {
  value: string;
  onChange: (modelId: string) => void;
  userPlan: string;
  disabled?: boolean;
}

export function ModelSelectorCompact({
  value,
  onChange,
  userPlan,
  disabled = false,
}: ModelSelectorCompactProps) {
  const allowedModels = getAllowedModels(userPlan);

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {allowedModels.map((model) => (
        <button
          key={model.id}
          onClick={() => onChange(model.id)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
            value === model.id
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <model.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{model.name.split(" ")[1]}</span>
        </button>
      ))}
    </div>
  );
}
