"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Activity,
  Sparkles,
  PlusCircle,
  Timer,
  CheckSquare,
  Calendar,
  FolderKanban,
  ArrowUpRight,
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
  const totalRuns = usage.automationRuns;
  const timeSaved = Math.round((totalRuns * 15) / 60 * 10) / 10;
  const valueGenerated = Math.round(timeSaved * 50);

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {client.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button asChild size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200">
          <Link href="/portal/builder">
            <Sparkles className="w-4 h-4 mr-2" />
            Create with AI
          </Link>
        </Button>
      </div>

      {/* Productivity Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/tasks" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-violet-200 bg-gradient-to-br from-violet-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <CheckSquare className="w-6 h-6 text-violet-600" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Tasks</h3>
              <p className="text-sm text-muted-foreground">Organize and track your work</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/calendar" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Calendar</h3>
              <p className="text-sm text-muted-foreground">Schedule and plan ahead</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/projects" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-green-200 bg-gradient-to-br from-green-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FolderKanban className="w-6 h-6 text-green-600" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Projects</h3>
              <p className="text-sm text-muted-foreground">Manage your initiatives</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAutomations.length}</p>
                <p className="text-sm text-muted-foreground">Active Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usage.automationRuns}</p>
                <p className="text-sm text-muted-foreground">Runs This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">${valueGenerated.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Value Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timeSaved}h</p>
                <p className="text-sm text-muted-foreground">Time Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Automations */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Your Automations</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/automations" className="text-violet-600 hover:text-violet-700">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No automations yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Create your first automation to start saving time and effort
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
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
                          <p className="font-medium">{automation.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {automation.automation_status === "active" ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                            {automation.last_run_at && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(automation.last_run_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {automation.automation_status === "active" && (
                        <Button
                          size="sm"
                          variant="secondary"
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

        {/* Activity Feed */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/activity" className="text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 6).map((activity) => (
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
                          <Activity className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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

          {/* Usage Card */}
          <Card className="border-0 shadow-sm mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Automation Runs</span>
                  <span className="font-medium">{usage.automationRuns}/{usage.runLimit}</span>
                </div>
                <Progress value={(usage.automationRuns / usage.runLimit) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Active Automations</span>
                  <span className="font-medium">{usage.activeAutomations}/{usage.automationLimit}</span>
                </div>
                <Progress value={(usage.activeAutomations / usage.automationLimit) * 100} className="h-2" />
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/portal/billing">Manage Plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
