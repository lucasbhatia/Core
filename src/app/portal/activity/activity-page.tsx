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
  XCircle,
  Clock,
  Zap,
  Filter,
  RefreshCw,
  Play,
  AlertTriangle,
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

  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true;
    return run.status === filter;
  });

  // Combine and sort activities
  const combinedActivity = [
    ...runs.map((run) => ({
      id: run.id,
      type: "run" as const,
      status: run.status,
      title: run.system_builds?.title || "Automation",
      description: `${run.trigger_type} trigger - ${run.status}`,
      timestamp: run.created_at,
      duration: run.duration_ms,
      error: run.error_message,
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

  function getStatusIcon(status: string) {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "running":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  }

  // Stats
  const successCount = runs.filter((r) => r.status === "success").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const runningCount = runs.filter((r) => r.status === "running").length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activity</p>
                <p className="text-2xl font-bold">{runs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-blue-600">{runningCount}</p>
              </div>
              <RefreshCw className={`w-8 h-8 text-blue-500 ${runningCount > 0 ? "animate-spin" : ""}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Successful</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
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
          <CardTitle className="text-base">Activity Timeline</CardTitle>
          <CardDescription>Recent automation runs and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {combinedActivity.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run an automation to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {combinedActivity.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border ${
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
                              : item.status === "failed"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                          }
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    {item.type === "run" && item.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{item.error}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                      <span>{format(new Date(item.timestamp), "MMM d, h:mm a")}</span>
                      {item.type === "run" && item.duration && (
                        <span>
                          Duration:{" "}
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
    </div>
  );
}
