"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Loader2,
  FileText,
  Activity,
  Sparkles,
  PlusCircle,
  BarChart3,
  Timer,
  Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import type { Client } from "@/types/database";

interface Automation {
  id: string;
  name: string;
  automation_status?: string;
  automation_trigger?: string;
  last_run_at?: string;
  run_count?: number;
}

interface Deliverable {
  id: string;
  name: string;
  category?: string;
  status: string;
  created_at: string;
}

interface UsageStats {
  automationRuns: number;
  runLimit: number;
  aiTokens: number;
  tokenLimit: number;
  activeAutomations: number;
  automationLimit: number;
}

interface DashboardHomeProps {
  client: Client;
  automations: Automation[];
  deliverables: Deliverable[];
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
  usage?: UsageStats;
}

export default function DashboardHome({
  client,
  automations,
  deliverables,
  recentActivity,
  usage = {
    automationRuns: 127,
    runLimit: 500,
    aiTokens: 45000,
    tokenLimit: 100000,
    activeAutomations: 3,
    automationLimit: 15,
  },
}: DashboardHomeProps) {
  const { toast } = useToast();
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);

  const activeAutomations = automations.filter((a) => a.automation_status === "active");
  const successRate = 94; // This would come from actual data
  const timeSaved = 12.5; // Hours saved this month

  async function handleRunAutomation(automationId: string) {
    setRunningAutomation(automationId);
    try {
      const response = await fetch("/api/portal/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationId }),
      });

      if (response.ok) {
        toast({
          title: "Automation started",
          description: "Your automation is now running.",
        });
      } else {
        toast({
          title: "Failed to start",
          description: "Could not start automation. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start automation",
        variant: "destructive",
      });
    } finally {
      setRunningAutomation(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {client.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your automations today.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Link href="/portal/builder">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Automation
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Automations</p>
                <p className="text-3xl font-bold">{activeAutomations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {usage.activeAutomations} of {usage.automationLimit}
                </span>
                <span className="font-medium">
                  {Math.round((usage.activeAutomations / usage.automationLimit) * 100)}%
                </span>
              </div>
              <Progress value={(usage.activeAutomations / usage.automationLimit) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month&apos;s Runs</p>
                <p className="text-3xl font-bold">{usage.automationRuns}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {usage.automationRuns} of {usage.runLimit}
                </span>
                <span className="font-medium">
                  {Math.round((usage.automationRuns / usage.runLimit) * 100)}%
                </span>
              </div>
              <Progress value={(usage.automationRuns / usage.runLimit) * 100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">{successRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              <span className="text-green-600 font-medium">+2.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-3xl font-bold">{timeSaved}h</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <Timer className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This month&apos;s automation savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Automations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Automations</CardTitle>
                <CardDescription>Run and manage your active automations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/automations">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No automations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation to start saving time
                  </p>
                  <Button asChild>
                    <Link href="/portal/builder">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Automation
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {automations.slice(0, 5).map((automation) => (
                    <div
                      key={automation.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            automation.automation_status === "active"
                              ? "bg-green-100"
                              : "bg-gray-200"
                          }`}
                        >
                          <Zap
                            className={`w-5 h-5 ${
                              automation.automation_status === "active"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{automation.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {automation.automation_status === "active" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                            {automation.last_run_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(automation.last_run_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                            {automation.run_count !== undefined && (
                              <span>{automation.run_count} runs</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {automation.automation_status === "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleRunAutomation(automation.id)}
                          disabled={runningAutomation === automation.id}
                        >
                          {runningAutomation === automation.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Run
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portal/builder">
                  <Sparkles className="w-4 h-4 mr-2 text-violet-600" />
                  Create with AI
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portal/templates">
                  <Bot className="w-4 h-4 mr-2 text-blue-600" />
                  Browse Templates
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/portal/analytics">
                  <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/activity">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "success"
                            ? "bg-green-100"
                            : activity.type === "error"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {activity.type === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : activity.type === "error" ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Deliverables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest outputs from your automations</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/deliverables">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No deliverables yet. Results from your automations will appear here.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {deliverables.slice(0, 4).map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="p-4 rounded-xl border hover:border-violet-200 hover:bg-violet-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {deliverable.category || "General"}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm truncate">{deliverable.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(deliverable.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
