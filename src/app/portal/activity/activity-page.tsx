"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Search,
  Download,
  FileText,
  AlertCircle,
  Info,
  Bot,
  User,
  Settings,
  Database,
  Mail,
  Webhook,
  Calendar,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ArrowUpDown,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, format, isWithinInterval, subDays, subHours } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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

type ActivityType = "all" | "automations" | "agents" | "system";
type TimeRange = "1h" | "24h" | "7d" | "30d" | "all";

export default function ActivityPage({ runs, activities }: ActivityPageProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    timestamp: string;
    duration?: number | null;
    metadata?: Record<string, unknown>;
    errorMessage?: string | null;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Filter runs based on selection
  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true;
    if (filter === "completed") return run.status === "success";
    if (filter === "in_progress") return run.status === "running" || run.status === "pending";
    if (filter === "failed") return run.status === "failed" || run.status === "error";
    return run.status === filter;
  });

  // Get time range filter
  const getTimeRangeStart = () => {
    const now = new Date();
    switch (timeRange) {
      case "1h":
        return subHours(now, 1);
      case "24h":
        return subDays(now, 1);
      case "7d":
        return subDays(now, 7);
      case "30d":
        return subDays(now, 30);
      default:
        return null;
    }
  };

  // Combine and sort activities
  const combinedActivity = [
    ...filteredRuns.map((run) => ({
      id: run.id,
      type: "automation" as const,
      status: run.status,
      title: run.system_builds?.title || "Automation",
      description: getRunDescription(run),
      timestamp: run.created_at,
      duration: run.duration_ms,
      triggerType: run.trigger_type,
      errorMessage: run.error_message,
    })),
    ...activities.map((activity) => ({
      id: activity.id,
      type: "system" as const,
      status: "info",
      title: activity.action_type,
      description: activity.description,
      timestamp: activity.created_at,
      metadata: activity.metadata,
    })),
  ]
    .filter((item) => {
      // Time range filter
      const timeStart = getTimeRangeStart();
      if (timeStart) {
        const itemDate = new Date(item.timestamp);
        if (itemDate < timeStart) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      }

      // Activity type filter
      if (activityType !== "all") {
        if (activityType === "automations" && item.type !== "automation") return false;
        if (activityType === "system" && item.type !== "system") return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  function getRunDescription(run: Run) {
    const trigger =
      run.trigger_type === "manual"
        ? "Manually triggered"
        : run.trigger_type === "scheduled"
        ? "Scheduled run"
        : run.trigger_type === "webhook"
        ? "Webhook triggered"
        : "Automatically triggered";

    if (run.status === "success") return `${trigger} - Completed successfully`;
    if (run.status === "running") return `${trigger} - Currently processing`;
    if (run.status === "pending") return `${trigger} - Queued for execution`;
    if (run.status === "failed" || run.status === "error")
      return `${trigger} - Encountered an issue`;
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
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
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
      case "failed":
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
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
      case "failed":
      case "error":
        return "Failed";
      case "info":
        return "Info";
      default:
        return "Processed";
    }
  }

  function getTriggerIcon(triggerType?: string) {
    switch (triggerType) {
      case "manual":
        return <User className="w-4 h-4" />;
      case "scheduled":
        return <Calendar className="w-4 h-4" />;
      case "webhook":
        return <Webhook className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const exportLogs = () => {
    const csvContent = [
      ["ID", "Type", "Status", "Title", "Description", "Timestamp", "Duration (ms)"].join(","),
      ...combinedActivity.map((item) =>
        [
          item.id,
          item.type,
          item.status,
          `"${item.title}"`,
          `"${item.description}"`,
          item.timestamp,
          "duration" in item ? (item.duration || "") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Logs exported", description: "Activity logs have been downloaded" });
  };

  // Stats
  const completedCount = runs.filter((r) => r.status === "success").length;
  const inProgressCount = runs.filter(
    (r) => r.status === "running" || r.status === "pending"
  ).length;
  const failedCount = runs.filter(
    (r) => r.status === "failed" || r.status === "error"
  ).length;
  const totalProcessed = runs.length;

  // Calculate average processing time for successful runs
  const successfulRuns = runs.filter((r) => r.status === "success" && r.duration_ms);
  const avgDuration =
    successfulRuns.length > 0
      ? Math.round(
          successfulRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) /
            successfulRuns.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
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
        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-700">{failedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
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
                  {avgDuration < 1000
                    ? `${avgDuration}ms`
                    : `${(avgDuration / 1000).toFixed(1)}s`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Timer className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Activity Type Tabs */}
      <Tabs
        value={activityType}
        onValueChange={(v) => setActivityType(v as ActivityType)}
      >
        <TabsList>
          <TabsTrigger value="all">
            <Activity className="w-4 h-4 mr-2" />
            All Activity
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="w-4 h-4 mr-2" />
            Automation Runs
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            System Events
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            {combinedActivity.length} events found
            {searchQuery && ` matching "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combinedActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-violet-600" />
              </div>
              <p className="font-medium text-gray-900">No activity found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Run an automation to see activity here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {combinedActivity.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-xl border transition-colors hover:shadow-sm cursor-pointer",
                    getStatusColor(item.status)
                  )}
                  onClick={() =>
                    setSelectedItem({
                      ...item,
                      errorMessage:
                        item.type === "automation" ? (item as { errorMessage?: string | null }).errorMessage : null,
                    })
                  }
                >
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{item.title}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          item.status === "success" &&
                            "bg-green-100 text-green-700 border-green-300",
                          item.status === "running" &&
                            "bg-blue-100 text-blue-700 border-blue-300",
                          item.status === "pending" &&
                            "bg-yellow-100 text-yellow-700 border-yellow-300",
                          (item.status === "failed" || item.status === "error") &&
                            "bg-red-100 text-red-700 border-red-300",
                          item.status === "info" && "bg-blue-100 text-blue-700 border-blue-300",
                          !["success", "running", "pending", "failed", "error", "info"].includes(
                            item.status
                          ) && "bg-violet-100 text-violet-700 border-violet-300"
                        )}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                      {item.type === "automation" && (item as { triggerType?: string }).triggerType && (
                        <Badge variant="secondary" className="gap-1">
                          {getTriggerIcon((item as { triggerType?: string }).triggerType)}
                          <span className="capitalize">{(item as { triggerType?: string }).triggerType}</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                      <span>{format(new Date(item.timestamp), "MMM d, h:mm a")}</span>
                      {"duration" in item && item.duration && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {item.duration < 1000
                            ? `${item.duration}ms`
                            : `${(item.duration / 1000).toFixed(1)}s`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
                  Estimated time saved: ~{Math.round((completedCount * 15) / 60)} hours this
                  period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedItem && getStatusIcon(selectedItem.status)}
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>{selectedItem?.description}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      selectedItem.status === "success" &&
                        "bg-green-100 text-green-700 border-green-300",
                      selectedItem.status === "failed" &&
                        "bg-red-100 text-red-700 border-red-300"
                    )}
                  >
                    {getStatusLabel(selectedItem.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedItem.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedItem.timestamp), "PPpp")}
                  </p>
                </div>
                {selectedItem.duration && (
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {selectedItem.duration < 1000
                        ? `${selectedItem.duration}ms`
                        : `${(selectedItem.duration / 1000).toFixed(2)}s`}
                    </p>
                  </div>
                )}
              </div>

              {selectedItem.errorMessage && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-1">Error Details</p>
                  <p className="text-sm text-red-700">{selectedItem.errorMessage}</p>
                </div>
              )}

              {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                  <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{JSON.stringify(selectedItem.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">ID: {selectedItem.id}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(selectedItem.id, selectedItem.id)}
                >
                  {copiedId === selectedItem.id ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Copy ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
