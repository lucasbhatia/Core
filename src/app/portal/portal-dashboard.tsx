"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logoutPortal } from "@/app/actions/portal-auth";
import {
  LogOut,
  Zap,
  Building2,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Play,
  Loader2,
  Download,
  Inbox,
  Bot,
  Eye,
  Copy,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Type definitions for workflow data
interface Workflow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  completed_at?: string;
  is_automation: boolean;
  automation_status?: string;
  automation_trigger?: string;
  automation_schedule?: string;
  last_run_at?: string;
  run_count?: number;
  requests?: {
    id: string;
    content: string;
    source: string;
    subject?: string;
    status: string;
    created_at: string;
    completed_at?: string;
  };
  agent_tasks?: { count: number }[];
  deliverables?: { count: number }[];
}

interface Deliverable {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  content?: string;
  file_url?: string;
  status: string;
  created_at: string;
  workflow?: {
    name: string;
    status: string;
  };
  task?: {
    name: string;
    agents?: {
      name: string;
      agent_type: string;
    };
  };
}

interface PortalDashboardProps {
  client: Client;
  systems?: unknown[]; // Legacy - kept for compatibility but not displayed
  workflows?: Workflow[];
  automations?: Workflow[];
  deliverables?: Deliverable[];
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
    pending: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    classifying: { variant: "secondary", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Processing" },
    planning: { variant: "secondary", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Planning" },
    in_progress: { variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "In Progress" },
    running: { variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Running" },
    review: { variant: "secondary", icon: <Eye className="w-3 h-3" />, label: "In Review" },
    completed: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Completed" },
    delivered: { variant: "default", icon: <CheckCheck className="w-3 h-3" />, label: "Delivered" },
    failed: { variant: "destructive", icon: <AlertCircle className="w-3 h-3" />, label: "Failed" },
    draft: { variant: "outline", icon: <FileText className="w-3 h-3" />, label: "Draft" },
    active: { variant: "default", icon: <Play className="w-3 h-3" />, label: "Active" },
    inactive: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Inactive" },
    paused: { variant: "outline", icon: <Clock className="w-3 h-3" />, label: "Paused" },
    approved: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Approved" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

export default function PortalDashboard({
  client,
  workflows = [],
  automations = [],
  deliverables = [],
}: PortalDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutPortal();
    router.push("/portal/login");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Count active items
  const activeJobs = workflows.filter((w) => ["running", "in_progress", "planning", "classifying"].includes(w.status)).length;
  const completedJobs = workflows.filter((w) => w.status === "completed").length;
  const activeAutomations = automations.filter((a) => a.automation_status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg">Client Portal</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden sm:inline">{client.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-muted-foreground">{client.email}</p>
                </div>
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {client.name.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            View your jobs, deliverables, and automations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{client.company || client.name}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                {activeJobs > 0 ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <Inbox className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-2xl font-bold">{activeJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedJobs} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <FileText className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{deliverables.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to view</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Automations</p>
                <Bot className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{automations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{activeAutomations} active</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span>Jobs</span>
              {workflows.length > 0 && (
                <Badge variant="secondary" className="ml-1">{workflows.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Deliverables</span>
              {deliverables.length > 0 && (
                <Badge variant="secondary" className="ml-1">{deliverables.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>Automations</span>
              {automations.length > 0 && (
                <Badge variant="secondary" className="ml-1">{automations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            {workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Jobs Yet</h3>
                  <p className="text-muted-foreground">
                    When work is submitted for you, it will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <JobCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables">
            {deliverables.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Deliverables Yet</h3>
                  <p className="text-muted-foreground">
                    Completed work will appear here for you to view and download.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {deliverables.map((deliverable) => (
                  <DeliverableCard
                    key={deliverable.id}
                    deliverable={deliverable}
                    onView={() => setSelectedDeliverable(deliverable)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations">
            {automations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Automations Yet</h3>
                  <p className="text-muted-foreground">
                    Saved automations for recurring tasks will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {automations.map((automation) => (
                  <AutomationCard key={automation.id} automation={automation} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Deliverable View Dialog */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedDeliverable?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDeliverable?.description && (
              <p className="text-sm text-muted-foreground">{selectedDeliverable.description}</p>
            )}
            {selectedDeliverable?.workflow && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">From: {selectedDeliverable.workflow.name}</Badge>
                <StatusBadge status={selectedDeliverable.status} />
              </div>
            )}
            <div className="h-[400px] w-full rounded-md border p-4 overflow-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {selectedDeliverable?.content || "No content available"}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => selectedDeliverable?.content && copyToClipboard(selectedDeliverable.content)}
              >
                {copied ? <CheckCheck className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              {selectedDeliverable?.file_url && (
                <Button asChild>
                  <a href={selectedDeliverable.file_url} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Job Card Component
function JobCard({ workflow }: { workflow: Workflow }) {
  const taskCount = workflow.agent_tasks?.[0]?.count || 0;
  const deliverableCount = workflow.deliverables?.[0]?.count || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base truncate">{workflow.name}</CardTitle>
            {workflow.requests?.subject && (
              <CardDescription className="line-clamp-1">
                {workflow.requests.subject}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={workflow.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
          </span>
          {taskCount > 0 && (
            <span className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              {taskCount} {taskCount === 1 ? "task" : "tasks"}
            </span>
          )}
          {deliverableCount > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <FileText className="w-4 h-4" />
              {deliverableCount} {deliverableCount === 1 ? "deliverable" : "deliverables"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Deliverable Card Component
function DeliverableCard({ deliverable, onView }: { deliverable: Deliverable; onView: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{deliverable.name}</span>
            </CardTitle>
            {deliverable.description && (
              <CardDescription className="line-clamp-2">
                {deliverable.description}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={deliverable.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
            </span>
            {deliverable.workflow && (
              <p className="mt-1 text-xs">From: {deliverable.workflow.name}</p>
            )}
          </div>
          {(deliverable.content || deliverable.file_url) && (
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Automation Card Component
function AutomationCard({ automation }: { automation: Workflow }) {
  const triggerLabels: Record<string, string> = {
    manual: "Run on demand",
    scheduled: "Runs on schedule",
    webhook: "Triggered by webhook",
    email: "Triggered by email",
  };

  const scheduleLabels: Record<string, string> = {
    "manual": "",
    "0 * * * *": "Every hour",
    "0 0 * * *": "Daily at midnight",
    "0 9 * * 1-5": "Weekdays at 9am",
    "0 0 * * 0": "Weekly on Sunday",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              {automation.name}
            </CardTitle>
            <CardDescription>
              {triggerLabels[automation.automation_trigger || "manual"]}
              {automation.automation_schedule && scheduleLabels[automation.automation_schedule] && (
                <> - {scheduleLabels[automation.automation_schedule]}</>
              )}
            </CardDescription>
          </div>
          <StatusBadge status={automation.automation_status || "inactive"} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {automation.last_run_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last run: {formatDistanceToNow(new Date(automation.last_run_at), { addSuffix: true })}
            </span>
          )}
          {automation.run_count !== undefined && automation.run_count > 0 && (
            <span className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              {automation.run_count} {automation.run_count === 1 ? "run" : "runs"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
