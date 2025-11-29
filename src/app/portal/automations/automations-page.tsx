"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  Zap,
  Clock,
  Play,
  Pause,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Archive,
  Eye,
  Activity,
  CheckCircle,
  Calendar,
  Webhook,
  MousePointer,
  PlusCircle,
  AlertTriangle,
  LayoutTemplate,
  Copy,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { UniversalAIActionsBar } from "@/components/universal-ai-actions";

interface Automation {
  id: string;
  name: string;
  description?: string;
  automation_status?: string;
  automation_trigger?: string;
  automation_type?: string;
  last_run_at?: string;
  run_count?: number;
  error_count?: number;
  webhook_url?: string;
  result?: {
    systemOverview?: string;
  };
}

interface AutomationsPageProps {
  automations: Automation[];
  clientId: string;
}

export default function AutomationsPage({ automations, clientId }: AutomationsPageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  // Filter automations
  const filteredAutomations = automations.filter((a) => {
    if (a.automation_status === "archived") return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && a.automation_status !== statusFilter) return false;
    return true;
  });

  const activeCount = automations.filter((a) => a.automation_status === "active").length;
  const pausedCount = automations.filter((a) => a.automation_status === "paused").length;
  const totalRuns = automations.reduce((sum, a) => sum + (a.run_count || 0), 0);

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
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const data = await response.json();
        toast({
          title: "Failed to start",
          description: data.error || "Could not start automation",
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

  async function handleToggleAutomation(automationId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const response = await fetch("/api/portal/automation/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: automationId, status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: newStatus === "active" ? "Automation activated" : "Automation paused",
        });
        window.location.reload();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update automation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update automation",
        variant: "destructive",
      });
    }
  }

  async function handleArchiveAutomation(automationId: string) {
    try {
      const response = await fetch(`/api/portal/automation/${automationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Automation archived" });
        window.location.reload();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to archive automation",
        variant: "destructive",
      });
    }
  }

  function getTriggerIcon(trigger?: string) {
    switch (trigger) {
      case "webhook":
        return <Webhook className="w-4 h-4" />;
      case "scheduled":
        return <Calendar className="w-4 h-4" />;
      case "manual":
        return <MousePointer className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Automations</p>
                <p className="text-2xl font-bold">{automations.length}</p>
              </div>
              <Bot className="w-8 h-8 text-violet-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{pausedCount}</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{totalRuns.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Link href="/portal/builder">
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Automation
          </Link>
        </Button>
      </div>

      {/* Automations List */}
      {filteredAutomations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== "all"
                ? "No matching automations"
                : "No automations yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Automations help you save time by running tasks automatically. Get started with a template or create your own."}
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/portal/templates">
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  Browse Templates
                </Link>
              </Button>
              <Button asChild>
                <Link href="/portal/builder">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Custom
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAutomations.map((automation) => (
            <Card
              key={automation.id}
              className="hover:shadow-lg transition-all hover:border-violet-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        automation.automation_status === "active"
                          ? "bg-green-100"
                          : automation.automation_status === "error"
                          ? "bg-red-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Zap
                        className={`w-6 h-6 ${
                          automation.automation_status === "active"
                            ? "text-green-600"
                            : automation.automation_status === "error"
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {automation.description || automation.result?.systemOverview || "Automated workflow"}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedAutomation(automation)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {automation.automation_status === "active" && (
                        <DropdownMenuItem onClick={() => handleRunAutomation(automation.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Run Now
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleAutomation(automation.id, automation.automation_status || "")
                        }
                      >
                        {automation.automation_status === "active" ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleArchiveAutomation(automation.id)}
                        className="text-destructive"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {/* Status and Trigger */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant="outline"
                    className={
                      automation.automation_status === "active"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : automation.automation_status === "error"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }
                  >
                    {automation.automation_status === "active" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    )}
                    {automation.automation_status || "Inactive"}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getTriggerIcon(automation.automation_trigger)}
                    <span className="capitalize">{automation.automation_trigger || "Manual"}</span>
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-3 border-t border-b mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{automation.run_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Runs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {automation.run_count && automation.error_count
                        ? Math.round(
                            ((automation.run_count - automation.error_count) /
                              automation.run_count) *
                              100
                          )
                        : 100}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{automation.error_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>

                {/* Last Run */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {automation.last_run_at
                      ? `Last run ${formatDistanceToNow(new Date(automation.last_run_at), {
                          addSuffix: true,
                        })}`
                      : "Never run"}
                  </span>
                </div>

                {/* Universal AI Actions Bar */}
                <div className="mb-4">
                  <UniversalAIActionsBar
                    entity={{
                      type: "automation",
                      id: automation.id,
                      title: automation.name,
                      description: automation.description || automation.result?.systemOverview || "Automated workflow",
                      status: automation.automation_status,
                      metadata: {
                        trigger: automation.automation_trigger,
                        runCount: automation.run_count,
                        errorCount: automation.error_count,
                      },
                    }}
                    clientId={clientId}
                    variant="compact"
                  />
                </div>

                {/* Action Button */}
                {automation.automation_status === "active" ? (
                  <Button
                    className="w-full"
                    onClick={() => handleRunAutomation(automation.id)}
                    disabled={runningAutomation === automation.id}
                  >
                    {runningAutomation === automation.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>
                ) : automation.automation_status === "error" ? (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span>This automation has errors. Check logs for details.</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      handleToggleAutomation(automation.id, automation.automation_status || "")
                    }
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Activate Automation
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Automation Details Dialog */}
      <Dialog open={!!selectedAutomation} onOpenChange={() => setSelectedAutomation(null)}>
        <DialogContent className="max-w-2xl">
          {selectedAutomation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-600" />
                  {selectedAutomation.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedAutomation.description || selectedAutomation.result?.systemOverview || "Automation details"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedAutomation.automation_status === "active"
                          ? "bg-green-50 text-green-700"
                          : ""
                      }
                    >
                      {selectedAutomation.automation_status || "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger Type</p>
                    <p className="font-medium capitalize">
                      {selectedAutomation.automation_trigger || "Manual"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Runs</p>
                    <p className="font-medium">{selectedAutomation.run_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="font-medium text-red-600">
                      {selectedAutomation.error_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Run</p>
                    <p className="font-medium">
                      {selectedAutomation.last_run_at
                        ? format(new Date(selectedAutomation.last_run_at), "PPp")
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="font-medium">
                      {selectedAutomation.run_count && selectedAutomation.error_count
                        ? Math.round(
                            ((selectedAutomation.run_count - selectedAutomation.error_count) /
                              selectedAutomation.run_count) *
                              100
                          )
                        : 100}
                      %
                    </p>
                  </div>
                </div>

                {/* Webhook URL if applicable */}
                {selectedAutomation.automation_trigger === "webhook" && selectedAutomation.webhook_url && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border truncate">
                        {selectedAutomation.webhook_url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedAutomation.webhook_url || "");
                          toast({ title: "Copied to clipboard" });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Send a POST request to this URL to trigger the automation
                    </p>
                  </div>
                )}
              </div>
              {/* Universal AI Actions Bar in Dialog */}
              <div className="py-2 border-t">
                <p className="text-sm font-medium mb-2">AI Actions</p>
                <UniversalAIActionsBar
                  entity={{
                    type: "automation",
                    id: selectedAutomation.id,
                    title: selectedAutomation.name,
                    description: selectedAutomation.description || selectedAutomation.result?.systemOverview || "Automated workflow",
                    status: selectedAutomation.automation_status,
                    metadata: {
                      trigger: selectedAutomation.automation_trigger,
                      runCount: selectedAutomation.run_count,
                      errorCount: selectedAutomation.error_count,
                    },
                  }}
                  clientId={clientId}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedAutomation(null)}>
                  Close
                </Button>
                {selectedAutomation.automation_status === "active" && (
                  <Button onClick={() => handleRunAutomation(selectedAutomation.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
