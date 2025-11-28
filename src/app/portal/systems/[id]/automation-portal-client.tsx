"use client";

import { useState } from "react";
import Link from "next/link";
import type { Client, SystemBuild, AutomationRun } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

interface AutomationPortalClientProps {
  system: SystemBuild;
  client: Client;
  recentRuns: AutomationRun[];
  stats: {
    total_runs: number;
    error_count: number;
    last_run_at: string | null;
    status: string;
    runs_last_24h: number;
    success_rate: number;
  };
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    active: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: <PlayCircle className="w-3 h-3" />,
      label: "Active",
    },
    paused: {
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <PauseCircle className="w-3 h-3" />,
      label: "Paused",
    },
    error: {
      color: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertTriangle className="w-3 h-3" />,
      label: "Error",
    },
    pending: {
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
    },
  };

  const { color, icon, label } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={`${color} flex items-center gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

// Run status icon
function RunStatusIcon({ status }: { status: string }) {
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

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Format duration
function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function AutomationPortalClient({
  system,
  client,
  recentRuns,
  stats,
}: AutomationPortalClientProps) {
  const [selectedRun, setSelectedRun] = useState<AutomationRun | null>(null);

  const automationStatus = system.automation_status || "pending";
  const isActive = automationStatus === "active";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              href="/portal"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Automation Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-green-100" : "bg-gray-100"
                }`}>
                  <Zap className={`w-6 h-6 ${isActive ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{system.title}</h1>
                  <p className="text-muted-foreground mt-0.5">
                    {system.result?.systemOverview || system.prompt}
                  </p>
                </div>
              </div>
            </div>
            <StatusBadge status={automationStatus} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold capitalize">{automationStatus}</p>
                </div>
                {isActive ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Runs</p>
                  <p className="text-2xl font-bold">{stats.total_runs.toLocaleString()}</p>
                </div>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.success_rate}%</p>
                </div>
                <TrendingUp className={`w-5 h-5 ${
                  stats.success_rate >= 90 ? "text-green-500" :
                  stats.success_rate >= 70 ? "text-yellow-500" : "text-red-500"
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="text-2xl font-bold">{formatRelativeTime(stats.last_run_at)}</p>
                </div>
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Runs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Runs</CardTitle>
                <CardDescription>
                  Last {recentRuns.length} automation executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentRuns.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">No runs yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Runs will appear here once the automation is triggered
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentRuns.map((run) => (
                      <button
                        key={run.id}
                        onClick={() => setSelectedRun(run)}
                        className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <RunStatusIcon status={run.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm capitalize">
                              {run.trigger_type} trigger
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {run.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(run.created_at)}
                            {run.duration_ms && ` • ${formatDuration(run.duration_ms)}`}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Automation Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Automation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {system.automation_type || "Webhook"} Automation
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Runs (24h)</p>
                  <p className="font-medium">{stats.runs_last_24h}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="font-medium">{stats.error_count}</p>
                </div>
                {system.last_error && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700 font-medium">Last Error</p>
                    <p className="text-sm text-red-600 mt-1">{system.last_error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you have questions about this automation or need changes,
                  contact your administrator.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Run Details Dialog */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="max-w-2xl">
          {selectedRun && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RunStatusIcon status={selectedRun.status} />
                  Run Details
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedRun.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selectedRun.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger</p>
                    <p className="font-medium capitalize">{selectedRun.trigger_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(selectedRun.duration_ms)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {selectedRun.completed_at
                        ? new Date(selectedRun.completed_at).toLocaleTimeString()
                        : "In Progress"}
                    </p>
                  </div>
                </div>

                {selectedRun.error_message && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm font-medium text-red-700">Error</p>
                    <p className="text-sm text-red-600 mt-1">{selectedRun.error_message}</p>
                  </div>
                )}

                {Object.keys(selectedRun.output_data || {}).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Output</p>
                    <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-auto max-h-48">
                      {JSON.stringify(selectedRun.output_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedRun(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
