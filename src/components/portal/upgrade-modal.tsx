"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  priceYearly?: number;
  aiActionsDaily: number;
  agentsLimit: number;
  automationsLimit: number;
  models: string[];
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

const PLANS: PlanDetails[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    aiActionsDaily: 10,
    agentsLimit: 5,
    automationsLimit: 3,
    models: ["Haiku"],
    features: [
      "10 AI actions/day",
      "5 agent tasks/day",
      "3 automations",
      "Basic AI model (Haiku)",
      "Review queue",
    ],
    icon: Sparkles,
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceYearly: 39,
    aiActionsDaily: 50,
    agentsLimit: 25,
    automationsLimit: 15,
    models: ["Haiku", "Sonnet"],
    features: [
      "50 AI actions/day",
      "25 agent tasks/day",
      "15 automations",
      "Sonnet AI model",
      "Webhook triggers",
      "Email notifications",
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    priceYearly: 119,
    aiActionsDaily: 200,
    agentsLimit: 100,
    automationsLimit: 50,
    models: ["Haiku", "Sonnet"],
    features: [
      "200 AI actions/day",
      "100 agent tasks/day",
      "50 automations",
      "All AI models",
      "Custom agents",
      "Team collaboration",
      "Priority support",
    ],
    icon: Crown,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1,
    aiActionsDaily: -1,
    agentsLimit: -1,
    automationsLimit: -1,
    models: ["Haiku", "Sonnet", "Opus"],
    features: [
      "Unlimited AI actions",
      "Unlimited agents",
      "Unlimited automations",
      "All AI models + Opus",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    icon: Building2,
  },
];

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  triggerReason?: {
    type: "ai_actions" | "agent_tasks" | "automations" | "feature";
    current?: number;
    limit?: number;
    featureName?: string;
  };
  clientId: string;
  hasExistingSubscription?: boolean;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  triggerReason,
  clientId,
  hasExistingSubscription = false,
}: UpgradeModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const currentPlanIndex = PLANS.findIndex((p) => p.id === currentPlan);

  const getLimitMessage = () => {
    if (!triggerReason) return null;

    switch (triggerReason.type) {
      case "ai_actions":
        return `You've used ${triggerReason.current} of ${triggerReason.limit} AI actions today`;
      case "agent_tasks":
        return `You've used ${triggerReason.current} of ${triggerReason.limit} agent tasks today`;
      case "automations":
        return `You have ${triggerReason.current} of ${triggerReason.limit} automations`;
      case "feature":
        return `${triggerReason.featureName} is not available on your current plan`;
      default:
        return null;
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "enterprise") {
      // Redirect to contact sales
      router.push("/portal/billing?contact=enterprise");
      onClose();
      return;
    }

    setIsLoading(true);
    setSelectedPlan(planId);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          planId,
          billingPeriod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        console.error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageBilling = () => {
    router.push("/portal/billing");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription className="text-center">
            {getLimitMessage() || "Unlock more AI power and automation capabilities"}
          </DialogDescription>
        </DialogHeader>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-3 my-4">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              billingPeriod === "monthly"
                ? "bg-violet-100 text-violet-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              billingPeriod === "yearly"
                ? "bg-violet-100 text-violet-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save 20%
            </Badge>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {PLANS.map((plan, index) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isUpgrade = index > currentPlanIndex;
            const price = billingPeriod === "yearly" && plan.priceYearly
              ? plan.priceYearly
              : plan.price;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative p-4 transition-all",
                  plan.popular && "border-violet-500 border-2",
                  isCurrentPlan && "bg-gray-50"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600">
                    Most Popular
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    plan.id === "free" && "bg-gray-100",
                    plan.id === "starter" && "bg-blue-100",
                    plan.id === "pro" && "bg-violet-100",
                    plan.id === "enterprise" && "bg-amber-100"
                  )}>
                    <plan.icon className={cn(
                      "h-5 w-5",
                      plan.id === "free" && "text-gray-600",
                      plan.id === "starter" && "text-blue-600",
                      plan.id === "pro" && "text-violet-600",
                      plan.id === "enterprise" && "text-amber-600"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  {plan.price === -1 ? (
                    <p className="text-2xl font-bold">Custom</p>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular && "bg-violet-600 hover:bg-violet-700"
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {plan.id === "enterprise" ? "Contact Sales" : "Upgrade"}
                  </Button>
                ) : (
                  <Button variant="ghost" className="w-full" disabled>
                    Downgrade
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial
          </p>
          <div className="flex gap-2">
            {hasExistingSubscription && (
              <Button variant="outline" onClick={handleManageBilling}>
                Manage Billing
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage upgrade modal state
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState<UpgradeModalProps["triggerReason"]>();

  const openModal = (reason?: UpgradeModalProps["triggerReason"]) => {
    setTriggerReason(reason);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTriggerReason(undefined);
  };

  return {
    isOpen,
    triggerReason,
    openModal,
    closeModal,
  };
}

// Upgrade Banner Component
interface UpgradeBannerProps {
  currentPlan: string;
  usage: {
    aiActions: { current: number; limit: number };
    agentTasks: { current: number; limit: number };
    automations: { current: number; limit: number };
  };
  onUpgradeClick: () => void;
}

export function UpgradeBanner({ currentPlan, usage, onUpgradeClick }: UpgradeBannerProps) {
  const aiActionsPercent = usage.aiActions.limit > 0
    ? (usage.aiActions.current / usage.aiActions.limit) * 100
    : 0;

  if (aiActionsPercent < 80) return null;

  const isAtLimit = aiActionsPercent >= 100;

  return (
    <div className={cn(
      "rounded-lg p-4 mb-4 flex items-center justify-between",
      isAtLimit ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          isAtLimit ? "bg-red-100" : "bg-amber-100"
        )}>
          <Zap className={cn(
            "h-5 w-5",
            isAtLimit ? "text-red-600" : "text-amber-600"
          )} />
        </div>
        <div>
          <p className={cn(
            "font-medium",
            isAtLimit ? "text-red-800" : "text-amber-800"
          )}>
            {isAtLimit
              ? "You've reached your daily AI action limit"
              : `You've used ${Math.round(aiActionsPercent)}% of your daily AI actions`}
          </p>
          <p className={cn(
            "text-sm",
            isAtLimit ? "text-red-600" : "text-amber-600"
          )}>
            {usage.aiActions.current} / {usage.aiActions.limit} actions used today
          </p>
        </div>
      </div>
      <Button
        onClick={onUpgradeClick}
        className={isAtLimit ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
      >
        <Crown className="h-4 w-4 mr-2" />
        Upgrade Now
      </Button>
    </div>
  );
}
