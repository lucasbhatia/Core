"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const PLANS = [
  {
    name: "Starter",
    price: 49,
    features: ["3 automations", "500 runs/month", "10K AI tokens", "Email support"],
    popular: false,
  },
  {
    name: "Pro",
    price: 149,
    features: [
      "15 automations",
      "5,000 runs/month",
      "100K AI tokens",
      "AI chat assistant",
      "Analytics dashboard",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Business",
    price: 399,
    features: [
      "50 automations",
      "25,000 runs/month",
      "500K AI tokens",
      "Team access (5 users)",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    popular: false,
  },
];

export default function BillingDashboard({
  client,
  currentUsage,
  dailyUsage,
  currentPlan,
}: BillingDashboardProps) {
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
                Consider upgrading to avoid interruptions.
              </p>
            </div>
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-600" />
              Current Plan
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-lg px-4 py-1">
            {currentPlan.name}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="text-3xl font-bold">${currentPlan.price}</p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="text-xl font-semibold capitalize">{currentPlan.billingCycle}</p>
              <p className="text-sm text-muted-foreground">Auto-renews</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="text-xl font-semibold">
                {format(new Date(currentPlan.nextBillingDate), "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.ceil(
                  (new Date(currentPlan.nextBillingDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" />
                <p className="text-sm font-medium">Automation Runs</p>
              </div>
              <Badge variant={runUsagePercent >= 80 ? "destructive" : "secondary"}>
                {runUsagePercent}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mb-2">
              {currentUsage.automationRuns.toLocaleString()}
              <span className="text-sm text-muted-foreground font-normal">
                {" "}
                / {currentUsage.runLimit.toLocaleString()}
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
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <p className="text-sm font-medium">AI Tokens</p>
              </div>
              <Badge variant={tokenUsagePercent >= 80 ? "destructive" : "secondary"}>
                {tokenUsagePercent}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mb-2">
              {(currentUsage.aiTokens / 1000).toFixed(0)}K
              <span className="text-sm text-muted-foreground font-normal">
                {" "}
                / {currentUsage.tokenLimit / 1000}K
              </span>
            </p>
            <Progress
              value={tokenUsagePercent}
              className={`h-2 ${tokenUsagePercent >= 80 ? "[&>div]:bg-red-500" : ""}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium">Automations</p>
              </div>
              <Badge variant="secondary">{automationUsagePercent}%</Badge>
            </div>
            <p className="text-2xl font-bold mb-2">
              {currentUsage.activeAutomations}
              <span className="text-sm text-muted-foreground font-normal">
                {" "}
                / {currentUsage.automationLimit}
              </span>
            </p>
            <Progress value={automationUsagePercent} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium">Storage</p>
              </div>
              <Badge variant="secondary">{storageUsagePercent}%</Badge>
            </div>
            <p className="text-2xl font-bold mb-2">
              {currentUsage.storageUsed} MB
              <span className="text-sm text-muted-foreground font-normal">
                {" "}
                / {currentUsage.storageLimit / 1024} GB
              </span>
            </p>
            <Progress value={storageUsagePercent} className="h-2" />
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
          <CardDescription>Automation runs per day</CardDescription>
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

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.name === currentPlan.name
                  ? "border-violet-500 bg-violet-50"
                  : plan.popular
                  ? "border-indigo-200"
                  : ""
              }`}
            >
              {plan.popular && plan.name !== currentPlan.name && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-600">
                  Most Popular
                </Badge>
              )}
              {plan.name === currentPlan.name && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600">
                  Current Plan
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.name === currentPlan.name ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
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
                    {plan.price > currentPlan.price ? "Upgrade" : "Downgrade"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-600" />
              Billing History
            </CardTitle>
            <CardDescription>Your recent invoices</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Download All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Nov 1, 2024", amount: 149, status: "Paid" },
              { date: "Oct 1, 2024", amount: 149, status: "Paid" },
              { date: "Sep 1, 2024", amount: 149, status: "Paid" },
            ].map((invoice, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{currentPlan.name} Plan</p>
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
    </div>
  );
}
