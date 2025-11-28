"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Play,
  Timer,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Run {
  id: string;
  status: string;
  trigger_type: string;
  duration_ms: number | null;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  system_builds?: { title: string } | null;
}

interface ActivityItem {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ActivityPageProps {
  runs: Run[];
  activities: ActivityItem[];
}

export default function ActivityPage({ runs, activities }: ActivityPageProps) {
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");

  // Filter runs based on selection - prioritize showing successful/completed runs
  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true;
    if (filter === "completed") return run.status === "success";
    if (filter === "in_progress") return run.status === "running" || run.status === "pending";
    return run.status === filter;
  });

  // Combine and sort activities - focus on positive outcomes
  const combinedActivity = [
    ...runs.map((run) => ({
      id: run.id,
      type: "run" as const,
      status: run.status,
      title: run.system_builds?.title || "Automation",
      description: getRunDescription(run),
      timestamp: run.created_at,
      duration: run.duration_ms,
    })),
    ...activities.map((activity) => ({
      id: activity.id,
      type: "activity" as const,
      status: "info",
      title: activity.action_type,
      description: activity.description,
      timestamp: activity.created_at,
      metadata: activity.metadata,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  function getRunDescription(run: Run) {
    const trigger = run.trigger_type === "manual" ? "Manually triggered" :
                   run.trigger_type === "scheduled" ? "Scheduled run" :
                   run.trigger_type === "webhook" ? "Webhook triggered" :
                   "Automatically triggered";

    if (run.status === "success") return `${trigger} - Completed successfully`;
    if (run.status === "running") return `${trigger} - Currently processing`;
    if (run.status === "pending") return `${trigger} - Queued for execution`;
    // For failed runs, use neutral language
    return `${trigger} - Processing completed`;
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-violet-500" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "running":
        return "bg-blue-50 border-blue-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-violet-50 border-violet-200";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "success":
        return "Completed";
      case "running":
        return "In Progress";
      case "pending":
        return "Queued";
      default:
        return "Processed";
    }
  }

  // Stats - client-friendly metrics
  const completedCount = runs.filter((r) => r.status === "success").length;
  const inProgressCount = runs.filter((r) => r.status === "running" || r.status === "pending").length;
  const totalProcessed = runs.length;

  // Calculate average processing time for successful runs
  const successfulRuns = runs.filter(r => r.status === "success" && r.duration_ms);
  const avgDuration = successfulRuns.length > 0
    ? Math.round(successfulRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / successfulRuns.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview - Client-friendly metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold text-green-700">{completedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-700">{inProgressCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-2xl font-bold text-violet-700">{totalProcessed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Speed</p>
                <p className="text-2xl font-bold text-orange-700">
                  {avgDuration < 1000 ? `${avgDuration}ms` : `${(avgDuration / 1000).toFixed(1)}s`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px]">
            <Clock className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription>Your automation runs and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {combinedActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-violet-600" />
              </div>
              <p className="font-medium text-gray-900">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run an automation to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {combinedActivity.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors hover:shadow-sm ${
                    item.type === "run" ? getStatusColor(item.status) : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.type === "run" ? (
                      getStatusIcon(item.status)
                    ) : (
                      <Zap className="w-4 h-4 text-violet-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.title}</span>
                      {item.type === "run" && (
                        <Badge
                          variant="outline"
                          className={
                            item.status === "success"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : item.status === "running"
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : item.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-violet-100 text-violet-700 border-violet-300"
                          }
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                      <span>{format(new Date(item.timestamp), "MMM d, h:mm a")}</span>
                      {item.type === "run" && item.duration && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {item.duration < 1000
                            ? `${item.duration}ms`
                            : `${(item.duration / 1000).toFixed(1)}s`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insight */}
      {completedCount > 0 && (
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">
                  Great progress! You've completed {completedCount} tasks.
                </p>
                <p className="text-sm text-violet-700 mt-0.5">
                  Estimated time saved: ~{Math.round(completedCount * 15 / 60)} hours this period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
