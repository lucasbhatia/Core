"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Zap,
  Activity,
  Sparkles,
  HardDrive,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Receipt,
  AlertTriangle,
  Users,
  Bot,
  MessageSquare,
  FileText,
  Crown,
  Rocket,
  Building2,
  Star,
  Gift,
  ChevronRight,
  Info,
  Coins,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@/types/database";

interface CurrentUsage {
  automationRuns: number;
  runLimit: number;
  aiTokens: number;
  tokenLimit: number;
  activeAutomations: number;
  automationLimit: number;
  storageUsed: number;
  storageLimit: number;
}

interface DailyUsage {
  date: string;
  count: number;
}

interface Plan {
  name: string;
  price: number;
  billingCycle: string;
  nextBillingDate: string;
}

interface BillingDashboardProps {
  client: Client;
  currentUsage: CurrentUsage;
  dailyUsage: DailyUsage[];
  currentPlan: Plan;
}

// New pricing model - all plans include ALL agents, just different usage limits
const PLANS = [
  {
    name: "Starter",
    price: 49,
    icon: Rocket,
    color: "blue",
    description: "Perfect for individuals and small projects",
    includedCredits: 500,
    features: [
      { text: "Access to ALL 25 AI agents", highlight: true },
      { text: "500 AI credits/month included", highlight: false },
      { text: "3 active automations", highlight: false },
      { text: "500 automation runs/month", highlight: false },
      { text: "Email support", highlight: false },
      { text: "Basic analytics", highlight: false },
    ],
    popular: false,
    savings: null,
  },
  {
    name: "Pro",
    price: 149,
    icon: Crown,
    color: "violet",
    description: "For growing businesses with more needs",
    includedCredits: 2500,
    features: [
      { text: "Access to ALL 25 AI agents", highlight: true },
      { text: "2,500 AI credits/month included", highlight: true },
      { text: "15 active automations", highlight: false },
      { text: "5,000 automation runs/month", highlight: false },
      { text: "Priority support", highlight: false },
      { text: "Advanced analytics", highlight: false },
      { text: "Custom agent instructions", highlight: false },
      { text: "Agent automations", highlight: false },
    ],
    popular: true,
    savings: "Save $51/mo",
  },
  {
    name: "Business",
    price: 399,
    icon: Building2,
    color: "indigo",
    description: "For teams that need more power",
    includedCredits: 10000,
    features: [
      { text: "Access to ALL 25 AI agents", highlight: true },
      { text: "10,000 AI credits/month included", highlight: true },
      { text: "50 active automations", highlight: false },
      { text: "25,000 automation runs/month", highlight: false },
      { text: "Dedicated support", highlight: false },
      { text: "Team access (15 users)", highlight: false },
      { text: "API access", highlight: false },
      { text: "Custom integrations", highlight: false },
      { text: "Bulk task processing", highlight: false },
    ],
    popular: false,
    savings: "Save $201/mo",
  },
  {
    name: "Enterprise",
    price: -1,
    icon: Star,
    color: "amber",
    description: "Custom solutions for large organizations",
    includedCredits: -1,
    features: [
      { text: "Access to ALL 25 AI agents", highlight: true },
      { text: "Unlimited AI credits", highlight: true },
      { text: "Unlimited automations", highlight: false },
      { text: "Unlimited automation runs", highlight: false },
      { text: "24/7 dedicated support", highlight: false },
      { text: "Unlimited team members", highlight: false },
      { text: "White-label options", highlight: false },
      { text: "Custom SLA", highlight: false },
      { text: "On-premise deployment", highlight: false },
    ],
    popular: false,
    savings: null,
  },
];

// Credit packs for additional usage
const CREDIT_PACKS = [
  { credits: 500, price: 25, perCredit: 0.05, popular: false },
  { credits: 1500, price: 60, perCredit: 0.04, popular: true, savings: "20% off" },
  { credits: 5000, price: 150, perCredit: 0.03, popular: false, savings: "40% off" },
  { credits: 15000, price: 375, perCredit: 0.025, popular: false, savings: "50% off" },
];

export default function BillingDashboard({
  client,
  currentUsage,
  dailyUsage,
  currentPlan,
}: BillingDashboardProps) {
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const runUsagePercent = Math.round((currentUsage.automationRuns / currentUsage.runLimit) * 100);
  const tokenUsagePercent = Math.round((currentUsage.aiTokens / currentUsage.tokenLimit) * 100);
  const automationUsagePercent = Math.round(
    (currentUsage.activeAutomations / currentUsage.automationLimit) * 100
  );
  const storageUsagePercent = Math.round(
    (currentUsage.storageUsed / currentUsage.storageLimit) * 100
  );

  const isNearLimit = runUsagePercent >= 80 || tokenUsagePercent >= 80;
  const maxDailyRuns = Math.max(...dailyUsage.map((d) => d.count), 1);

  // Mock AI workforce usage
  const aiWorkforceUsage = {
    hiredAgents: 3,
    tasksCompleted: 45,
    creditsUsed: 1850,
    creditsRemaining: 650,
  };

  return (
    <div className="space-y-6">
      {/* Near Limit Warning */}
      {isNearLimit && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4 flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Approaching usage limits</p>
              <p className="text-sm text-yellow-700">
                You&apos;re using {Math.max(runUsagePercent, tokenUsagePercent)}% of your plan.
                Add more credits or upgrade for uninterrupted service.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                onClick={() => setShowCreditDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Credits
              </Button>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan + AI Workforce Banner */}
      <Card className="bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 border-violet-100">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                {currentPlan.name === "Enterprise" ? (
                  <Star className="w-7 h-7 text-white" />
                ) : currentPlan.name === "Business" ? (
                  <Building2 className="w-7 h-7 text-white" />
                ) : currentPlan.name === "Pro" ? (
                  <Crown className="w-7 h-7 text-white" />
                ) : (
                  <Rocket className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{currentPlan.name} Plan</h2>
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  ${currentPlan.price}/month • Renews {format(new Date(currentPlan.nextBillingDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">AI Credits</p>
                <p className="text-2xl font-bold text-violet-700">
                  {aiWorkforceUsage.creditsRemaining.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal"> remaining</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreditDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  Manage Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="workforce" className="gap-2">
            <Bot className="w-4 h-4" />
            AI Workforce
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Receipt className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Usage Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-violet-600" />
                    <p className="text-sm font-medium">AI Credits</p>
                  </div>
                  <Badge variant={tokenUsagePercent >= 80 ? "destructive" : "secondary"}>
                    {tokenUsagePercent}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {aiWorkforceUsage.creditsUsed.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}/ {currentUsage.tokenLimit / 1000 * 2}
                  </span>
                </p>
                <Progress
                  value={tokenUsagePercent}
                  className={`h-2 ${tokenUsagePercent >= 80 ? "[&>div]:bg-red-500" : ""}`}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Used by your AI workforce
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-medium">Automation Runs</p>
                  </div>
                  <Badge variant={runUsagePercent >= 80 ? "destructive" : "secondary"}>
                    {runUsagePercent}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {currentUsage.automationRuns.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}/ {currentUsage.runLimit.toLocaleString()}
                  </span>
                </p>
                <Progress
                  value={runUsagePercent}
                  className={`h-2 ${runUsagePercent >= 80 ? "[&>div]:bg-red-500" : ""}`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm font-medium">Automations</p>
                  </div>
                  <Badge variant="secondary">{automationUsagePercent}%</Badge>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {currentUsage.activeAutomations}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}/ {currentUsage.automationLimit}
                  </span>
                </p>
                <Progress value={automationUsagePercent} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium">AI Agents</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Active
                  </Badge>
                </div>
                <p className="text-2xl font-bold mb-2">
                  {aiWorkforceUsage.hiredAgents}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}agents hired
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {aiWorkforceUsage.tasksCompleted} tasks completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Usage Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Daily Usage This Month
              </CardTitle>
              <CardDescription>Automation runs and AI credit usage per day</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyUsage.length === 0 ? (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No usage data this month
                </div>
              ) : (
                <div className="h-[150px] flex items-end gap-1">
                  {dailyUsage.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t transition-all hover:from-violet-500 hover:to-indigo-400"
                        style={{
                          height: `${(day.count / maxDailyRuns) * 120}px`,
                        }}
                        title={`${day.date}: ${day.count} runs`}
                      />
                      {i % 5 === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(day.date), "d")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Workforce Tab */}
        <TabsContent value="workforce" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    AI Workforce Usage
                  </CardTitle>
                  <CardDescription>
                    Your plan includes access to ALL 25 AI agents
                  </CardDescription>
                </div>
                <Button asChild variant="outline">
                  <Link href="/portal/workforce/team">
                    Manage Team
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-violet-700">Hired Agents</p>
                      <p className="text-2xl font-bold text-violet-900">{aiWorkforceUsage.hiredAgents}</p>
                    </div>
                  </div>
                  <p className="text-xs text-violet-600">
                    All 25 agents available to hire
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Tasks Completed</p>
                      <p className="text-2xl font-bold text-green-900">{aiWorkforceUsage.tasksCompleted}</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600">
                    This billing period
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Credits Used</p>
                      <p className="text-2xl font-bold text-blue-900">{aiWorkforceUsage.creditsUsed.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    {aiWorkforceUsage.creditsRemaining.toLocaleString()} credits remaining
                  </p>
                </div>
              </div>

              {/* How credits work */}
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">How AI Credits Work</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Each task your AI agents complete uses credits based on complexity.
                      Simple tasks (social posts, summaries) use ~10-20 credits.
                      Complex tasks (blog posts, reports) use ~50-100 credits.
                      All plans include access to every agent - you only pay for usage.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold">{aiWorkforceUsage.creditsRemaining.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">AI credits available</p>
                </div>
                <Button onClick={() => setShowCreditDialog(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Buy More Credits
                </Button>
              </div>
              <Progress
                value={100 - (aiWorkforceUsage.creditsRemaining / (aiWorkforceUsage.creditsUsed + aiWorkforceUsage.creditsRemaining) * 100)}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{aiWorkforceUsage.creditsUsed.toLocaleString()} used</span>
                <span>{aiWorkforceUsage.creditsRemaining.toLocaleString()} remaining</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          {/* Key benefit banner */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">All Plans Include Full Access to Every AI Agent</p>
                <p className="text-sm text-green-700">
                  No agent is locked behind higher tiers. Upgrade for more credits and features, not access.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isCurrentPlan = plan.name === currentPlan.name;
              const PlanIcon = plan.icon;

              return (
                <Card
                  key={plan.name}
                  className={`relative ${
                    isCurrentPlan
                      ? "border-violet-500 bg-violet-50 shadow-lg"
                      : plan.popular
                      ? "border-indigo-200 shadow-md"
                      : ""
                  }`}
                >
                  {plan.popular && !isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600">
                      Current Plan
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        plan.color === "violet" ? "bg-violet-100" :
                        plan.color === "indigo" ? "bg-indigo-100" :
                        plan.color === "amber" ? "bg-amber-100" :
                        "bg-blue-100"
                      }`}>
                        <PlanIcon className={`w-5 h-5 ${
                          plan.color === "violet" ? "text-violet-600" :
                          plan.color === "indigo" ? "text-indigo-600" :
                          plan.color === "amber" ? "text-amber-600" :
                          "text-blue-600"
                        }`} />
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">{plan.description}</CardDescription>
                    <div className="flex items-baseline gap-1 mt-2">
                      {plan.price === -1 ? (
                        <span className="text-2xl font-bold">Custom</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </>
                      )}
                    </div>
                    {plan.savings && (
                      <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                        {plan.savings}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {plan.includedCredits !== -1 && (
                      <div className="mb-4 p-3 rounded-lg bg-violet-50 border border-violet-100">
                        <p className="text-sm font-medium text-violet-900">
                          {plan.includedCredits.toLocaleString()} AI credits/month
                        </p>
                      </div>
                    )}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            feature.highlight ? "text-violet-600" : "text-green-500"
                          }`} />
                          <span className={feature.highlight ? "font-medium" : ""}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {isCurrentPlan ? (
                      <Button variant="outline" disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : plan.price === -1 ? (
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                        Contact Sales
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${
                          plan.price > currentPlan.price
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600"
                            : ""
                        }`}
                        variant={plan.price < currentPlan.price ? "outline" : "default"}
                      >
                        {plan.price > currentPlan.price ? "Upgrade" : "Change Plan"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-violet-600" />
                  Billing History
                </CardTitle>
                <CardDescription>Your recent invoices and payments</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Download All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "Nov 1, 2024", description: "Pro Plan - Monthly", amount: 149, status: "Paid", type: "subscription" },
                  { date: "Nov 15, 2024", description: "AI Credits - 1,500 pack", amount: 60, status: "Paid", type: "credits" },
                  { date: "Oct 1, 2024", description: "Pro Plan - Monthly", amount: 149, status: "Paid", type: "subscription" },
                  { date: "Sep 1, 2024", description: "Pro Plan - Monthly", amount: 149, status: "Paid", type: "subscription" },
                ].map((invoice, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        invoice.type === "credits" ? "bg-yellow-100" : "bg-violet-100"
                      }`}>
                        {invoice.type === "credits" ? (
                          <Coins className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-violet-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invoice.description}</p>
                        <p className="text-xs text-muted-foreground">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">${invoice.amount}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Buy Credits Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-600" />
              Buy AI Credits
            </DialogTitle>
            <DialogDescription>
              Purchase additional credits to power your AI workforce. Credits never expire.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 py-4">
            {CREDIT_PACKS.map((pack, i) => (
              <Card
                key={i}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  pack.popular ? "border-violet-500 bg-violet-50" : ""
                }`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600">
                    Best Value
                  </Badge>
                )}
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold">{pack.credits.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">credits</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${pack.price}</p>
                      <p className="text-xs text-muted-foreground">${pack.perCredit}/credit</p>
                    </div>
                  </div>
                  {pack.savings && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-3">
                      {pack.savings}
                    </Badge>
                  )}
                  <Button className={`w-full ${pack.popular ? "bg-gradient-to-r from-violet-600 to-indigo-600" : ""}`}>
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Credits Never Expire</p>
                <p className="text-sm text-gray-600">
                  Any credits you purchase are added to your balance and can be used anytime.
                  Monthly included credits reset each billing cycle.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
