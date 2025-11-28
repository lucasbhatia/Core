"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client, SystemBuild, SystemAction } from "@/types/database";
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
import { logoutPortal } from "@/app/actions/portal-auth";
import {
  LogOut,
  Zap,
  PlusCircle,
  BarChart3,
  Send,
  MessageSquare,
  ChevronRight,
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
} from "lucide-react";
import Link from "next/link";

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
  systems: SystemBuild[];
  workflows?: Workflow[];
  automations?: Workflow[];
  deliverables?: Deliverable[];
}

// Icon mapping for action types
const actionIcons: Record<string, React.ReactNode> = {
  form: <PlusCircle className="w-5 h-5" />,
  dashboard: <BarChart3 className="w-5 h-5" />,
  trigger: <Send className="w-5 h-5" />,
  ai_chat: <MessageSquare className="w-5 h-5" />,
};

// Get icon by name or fallback
function getActionIcon(iconName: string, type: string) {
  const iconMap: Record<string, React.ReactNode> = {
    "plus-circle": <PlusCircle className="w-5 h-5" />,
    "bar-chart": <BarChart3 className="w-5 h-5" />,
    "send": <Send className="w-5 h-5" />,
    "message-square": <MessageSquare className="w-5 h-5" />,
    "zap": <Zap className="w-5 h-5" />,
  };
  return iconMap[iconName] || actionIcons[type] || <Zap className="w-5 h-5" />;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
    pending: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    running: { variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Running" },
    completed: { variant: "secondary", icon: <CheckCircle className="w-3 h-3" />, label: "Completed" },
    failed: { variant: "destructive", icon: <AlertCircle className="w-3 h-3" />, label: "Failed" },
    draft: { variant: "outline", icon: <FileText className="w-3 h-3" />, label: "Draft" },
    active: { variant: "default", icon: <Play className="w-3 h-3" />, label: "Active" },
    inactive: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Inactive" },
    paused: { variant: "outline", icon: <Clock className="w-3 h-3" />, label: "Paused" },
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
  systems,
  workflows = [],
  automations = [],
  deliverables = [],
}: PortalDashboardProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutPortal();
    router.push("/portal/login");
  }

  // Count active items
  const activeWorkflows = workflows.filter((w) => w.status === "running").length;
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
            View your requests, deliverables, and automations
          </p>
        </div>

        {/* Company Info + Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{client.company}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <Loader2 className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{activeWorkflows}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <FileText className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{deliverables.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Automations</p>
                <Bot className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{activeAutomations}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
              {workflows.length > 0 && (
                <Badge variant="secondary" className="ml-1">{workflows.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Deliverables</span>
              {deliverables.length > 0 && (
                <Badge variant="secondary" className="ml-1">{deliverables.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Automations</span>
              {automations.length > 0 && (
                <Badge variant="secondary" className="ml-1">{automations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="systems" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Systems</span>
              {systems.length > 0 && (
                <Badge variant="secondary" className="ml-1">{systems.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests">
            {workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Requests Yet</h3>
                  <p className="text-muted-foreground">
                    Your requests and workflows will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
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
                    Completed work will appear here for download.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {deliverables.map((deliverable) => (
                  <DeliverableCard key={deliverable.id} deliverable={deliverable} />
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
                    Your saved automations will appear here.
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

          {/* Systems Tab */}
          <TabsContent value="systems">
            {systems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Systems Yet</h3>
                  <p className="text-muted-foreground">
                    Your automation systems will appear here once they&apos;re ready.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {systems.map((system) => (
                  <SystemCard key={system.id} system={system} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Workflow Card Component
function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const taskCount = workflow.agent_tasks?.[0]?.count || 0;
  const deliverableCount = workflow.deliverables?.[0]?.count || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{workflow.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {workflow.requests?.subject || workflow.requests?.content?.slice(0, 100)}...
            </CardDescription>
          </div>
          <StatusBadge status={workflow.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(workflow.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Bot className="w-4 h-4" />
            {taskCount} tasks
          </span>
          {deliverableCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {deliverableCount} deliverables
            </span>
          )}
          <Badge variant="outline" className="ml-auto">
            {workflow.requests?.source || "dashboard"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Deliverable Card Component
function DeliverableCard({ deliverable }: { deliverable: Deliverable }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {deliverable.name}
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
              {new Date(deliverable.created_at).toLocaleDateString()}
            </span>
            {deliverable.workflow && (
              <p className="mt-1">From: {deliverable.workflow.name}</p>
            )}
          </div>
          {(deliverable.content || deliverable.file_url) && (
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
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
    manual: "Manual trigger",
    scheduled: "Scheduled",
    webhook: "Webhook trigger",
    email: "Email trigger",
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
              {automation.automation_schedule && ` - ${automation.automation_schedule}`}
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
              Last: {new Date(automation.last_run_at).toLocaleDateString()}
            </span>
          )}
          {automation.run_count !== undefined && automation.run_count > 0 && (
            <span className="flex items-center gap-1">
              <Play className="w-4 h-4" />
              {automation.run_count} runs
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// System Card Component (legacy)
function SystemCard({ system }: { system: SystemBuild }) {
  const actions = (system.actions || []) as SystemAction[];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{system.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {system.result?.systemOverview || system.prompt}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length > 0 ? (
          <div className="space-y-2">
            {actions.slice(0, 3).map((action) => (
              <Link
                key={action.id}
                href={`/portal/systems/${system.id}?action=${action.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                    {getActionIcon(action.icon, action.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </Link>
            ))}
            {actions.length > 3 && (
              <Link
                href={`/portal/systems/${system.id}`}
                className="block text-center text-sm text-primary hover:underline pt-2"
              >
                View all {actions.length} actions
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>System is being configured...</p>
            <Link
              href={`/portal/systems/${system.id}`}
              className="text-primary hover:underline"
            >
              View Details
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
