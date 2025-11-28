"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Inbox,
  Workflow,
  Bot,
  BarChart3,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  FileText,
  Users,
  Zap,
  MoreVertical,
  Pause,
  Save,
  Calendar,
  Webhook,
  Copy,
  Building2,
  ExternalLink,
  AlertCircle,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Request {
  id: string;
  subject: string | null;
  content: string;
  source: string;
  request_type: string | null;
  priority: string;
  complexity: string | null;
  status: string;
  ai_summary: string | null;
  created_at: string;
  clients: { id: string; name: string; email: string } | null;
  workflows: { id: string; name: string; status: string; current_step: number; total_steps: number }[] | null;
}

interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  current_step: number;
  total_steps: number;
  created_at: string;
  client_id: string | null;
  is_automation: boolean;
  automation_status: string | null;
  automation_schedule: string | null;
  automation_trigger: string | null;
  last_run_at: string | null;
  run_count: number;
  webhook_url: string | null;
  webhook_secret: string | null;
  requests: { id: string; subject: string | null; content: string; client_id: string | null } | null;
  clients: { id: string; name: string; email: string } | null;
  agent_tasks: { id: string; name: string; status: string; agent_id: string }[];
}

interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  agent_type: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface Props {
  initialRequests: Request[];
  initialWorkflows: WorkflowType[];
  agents: Agent[];
  clients: Client[];
  stats: {
    totalRequests: number;
    completedRequests: number;
    activeWorkflows: number;
    successRate: number;
  };
}

export function WorkspaceClient({
  initialRequests,
  initialWorkflows,
  agents,
  clients,
  stats,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequestContent, setNewRequestContent] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsAutomationWorkflow, setSaveAsAutomationWorkflow] = useState<WorkflowType | null>(null);
  const [automationName, setAutomationName] = useState("");
  const [automationSchedule, setAutomationSchedule] = useState("manual");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const { toast } = useToast();

  // Filter automations from workflows
  const automations = workflows.filter(w => w.is_automation);
  const activeWorkflows = workflows.filter(w => !w.is_automation && ["running", "draft", "approved"].includes(w.status));

  // Group data by client for the Client Hub
  const clientStats = useMemo(() => {
    const statsMap = new Map<string, {
      client: Client;
      jobCount: number;
      automationCount: number;
      completedCount: number;
      activeCount: number;
    }>();

    // Initialize with all clients
    clients.forEach(client => {
      statsMap.set(client.id, {
        client,
        jobCount: 0,
        automationCount: 0,
        completedCount: 0,
        activeCount: 0,
      });
    });

    // Count workflows per client
    workflows.forEach(workflow => {
      const clientId = workflow.client_id || workflow.requests?.client_id;
      if (clientId && statsMap.has(clientId)) {
        const stat = statsMap.get(clientId)!;
        if (workflow.is_automation) {
          stat.automationCount++;
        } else {
          stat.jobCount++;
          if (workflow.status === "completed") {
            stat.completedCount++;
          } else if (["running", "in_progress"].includes(workflow.status)) {
            stat.activeCount++;
          }
        }
      }
    });

    return Array.from(statsMap.values()).filter(s => s.jobCount > 0 || s.automationCount > 0);
  }, [clients, workflows]);

  const handleSubmitRequest = async () => {
    if (!newRequestContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newRequestContent,
          source: "dashboard",
          clientId: selectedClient && selectedClient !== "none" ? selectedClient : undefined,
        }),
      });

      if (response.ok) {
        toast({ title: "Request submitted", description: "AI is processing your request..." });
        setNewRequestContent("");
        setSelectedClient("");
        setIsNewRequestOpen(false);
        window.location.reload();
      } else {
        toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsAutomation = async () => {
    if (!saveAsAutomationWorkflow || !automationName.trim()) return;

    try {
      const response = await fetch("/api/workspace/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: saveAsAutomationWorkflow.id,
          name: automationName,
          schedule: automationSchedule,
        }),
      });

      if (response.ok) {
        toast({ title: "Automation created", description: "You can now run this automation anytime" });
        setSaveAsAutomationWorkflow(null);
        setAutomationName("");
        setAutomationSchedule("manual");
        window.location.reload();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save automation", variant: "destructive" });
    }
  };

  const handleRunAutomation = async (workflowId: string) => {
    try {
      const response = await fetch("/api/workspace/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });

      if (response.ok) {
        toast({ title: "Automation started", description: "Running now..." });
        window.location.reload();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to run automation", variant: "destructive" });
    }
  };

  const handleToggleAutomation = async (workflowId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/workspace/automation/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, status: newStatus }),
      });

      if (response.ok) {
        toast({ title: `Automation ${newStatus}`, description: `Automation is now ${newStatus}` });
        window.location.reload();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update automation", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      pending: { variant: "outline", icon: <Clock className="h-3 w-3" />, label: "Pending" },
      classifying: { variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Processing" },
      planning: { variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Planning" },
      in_progress: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "In Progress" },
      running: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Running" },
      review: { variant: "secondary", icon: <Eye className="h-3 w-3" />, label: "Review" },
      completed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, label: "Completed" },
      delivered: { variant: "default", icon: <Send className="h-3 w-3" />, label: "Delivered" },
      failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: "Failed" },
      active: { variant: "default", icon: <Play className="h-3 w-3" />, label: "Active" },
      inactive: { variant: "outline", icon: <Pause className="h-3 w-3" />, label: "Inactive" },
      paused: { variant: "secondary", icon: <Pause className="h-3 w-3" />, label: "Paused" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
        {priority}
      </span>
    );
  };

  const getScheduleLabel = (schedule: string | null) => {
    const labels: Record<string, string> = {
      manual: "Manual trigger",
      "*/5 * * * *": "Every 5 minutes",
      "0 * * * *": "Every hour",
      "0 0 * * *": "Daily at midnight",
      "0 9 * * 1-5": "Weekdays at 9am",
      "0 0 * * 0": "Weekly (Sunday)",
    };
    return labels[schedule || "manual"] || schedule || "Manual trigger";
  };

  // Filter requests by selected client
  const filteredRequests = selectedClientFilter === "all"
    ? requests
    : requests.filter(r => r.clients?.id === selectedClientFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Workspace</h1>
          <p className="text-muted-foreground">
            Create automations for your clients
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>
                Describe what you need and optionally link it to a client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Client Selection - Made Prominent */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Link to Client
                </Label>
                <p className="text-xs text-blue-700 mb-2">
                  Select a client to make this job visible in their portal
                </p>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No client (internal only)</span>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{client.name}</span>
                          {client.company && (
                            <span className="text-muted-foreground">- {client.company}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && selectedClient !== "none" && (
                  <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Job and deliverables will be visible in client portal
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">What do you need?</Label>
                <Textarea
                  placeholder="Describe what you need... e.g., 'Create a marketing plan for our new product launch' or 'Research competitors in the fintech space'"
                  value={newRequestContent}
                  onChange={(e) => setNewRequestContent(e.target.value)}
                  className="mt-1.5 min-h-[150px]"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmitRequest}
                disabled={isSubmitting || !newRequestContent.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Submit Job
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Inbox className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedRequests}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automations.length}</p>
                <p className="text-sm text-muted-foreground">Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientStats.length}</p>
                <p className="text-sm text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Client Hub
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            All Jobs
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        {/* Client Hub Tab */}
        <TabsContent value="clients" className="space-y-4">
          {clientStats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No client activity yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a job linked to a client to see their activity here
                </p>
                <Button onClick={() => setIsNewRequestOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Client Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientStats.map(({ client, jobCount, automationCount, completedCount, activeCount }) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{client.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {client.company || client.email}
                          </CardDescription>
                        </div>
                      </div>
                      {activeCount > 0 && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {activeCount} active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center py-2">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{jobCount}</p>
                        <p className="text-xs text-muted-foreground">Jobs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{automationCount}</p>
                        <p className="text-xs text-muted-foreground">Automations</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedClient(client.id);
                          setIsNewRequestOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Job
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClientFilter(client.id);
                          // Switch to jobs tab
                          const jobsTab = document.querySelector('[data-state="inactive"][value="jobs"]') as HTMLButtonElement;
                          if (jobsTab) jobsTab.click();
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {/* Filter by client */}
          <div className="flex items-center gap-4">
            <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClientFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedClientFilter("all")}>
                Clear filter
              </Button>
            )}
          </div>

          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedClientFilter !== "all"
                    ? "No jobs for this client yet"
                    : "Create your first job to get started"}
                </p>
                <Button onClick={() => setIsNewRequestOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                          {request.request_type && (
                            <Badge variant="outline">{request.request_type}</Badge>
                          )}
                          {request.clients ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {request.clients.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">
                          {request.subject || request.ai_summary || "New Job"}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {request.content.slice(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {request.source}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.workflows && request.workflows[0] && (
                          <div className="text-right mr-2">
                            <p className="text-sm font-medium">
                              Step {request.workflows[0].current_step}/{request.workflows[0].total_steps}
                            </p>
                            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{
                                  width: `${(request.workflows[0].current_step / Math.max(request.workflows[0].total_steps, 1)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {request.status === "completed" && request.workflows?.[0] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const workflow = workflows.find(w => w.id === request.workflows?.[0]?.id);
                              if (workflow) {
                                setSaveAsAutomationWorkflow(workflow);
                                setAutomationName(request.ai_summary || request.subject || "");
                              }
                            }}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save as Automation
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-4">
          {automations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No automations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete a job and save it as an automation to run it again
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((automation) => (
                <Card key={automation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        {automation.clients && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {automation.clients.name}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(automation.automation_status || "inactive")}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRunAutomation(automation.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </DropdownMenuItem>
                            {automation.automation_status === "active" ? (
                              <DropdownMenuItem onClick={() => handleToggleAutomation(automation.id, "paused")}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleAutomation(automation.id, "active")}>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {getScheduleLabel(automation.automation_schedule)}
                        </span>
                        <span className="text-muted-foreground">
                          {automation.run_count} runs
                        </span>
                      </div>

                      {automation.last_run_at && (
                        <p className="text-xs text-muted-foreground">
                          Last run: {formatDistanceToNow(new Date(automation.last_run_at), { addSuffix: true })}
                        </p>
                      )}

                      {automation.webhook_secret && (
                        <div className="p-2 bg-muted rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium flex items-center gap-1">
                              <Webhook className="h-3 w-3" />
                              Webhook Trigger
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`/api/workspace/automation/webhook/${automation.id}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRunAutomation(automation.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.display_name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {agent.agent_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save as Automation Dialog */}
      <Dialog open={!!saveAsAutomationWorkflow} onOpenChange={() => setSaveAsAutomationWorkflow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Automation</DialogTitle>
            <DialogDescription>
              Save this completed job as an automation to run it again
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Automation Name</Label>
              <Input
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                placeholder="e.g., Weekly Marketing Report"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Trigger</Label>
              <Select value={automationSchedule} onValueChange={setAutomationSchedule}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (Run when needed)</SelectItem>
                  <SelectItem value="webhook">Webhook (Trigger via URL)</SelectItem>
                  <SelectItem value="0 * * * *">Every hour</SelectItem>
                  <SelectItem value="0 0 * * *">Daily at midnight</SelectItem>
                  <SelectItem value="0 9 * * 1-5">Weekdays at 9am</SelectItem>
                  <SelectItem value="0 0 * * 0">Weekly (Sunday)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {saveAsAutomationWorkflow?.clients && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  This automation is linked to <strong>{saveAsAutomationWorkflow.clients.name}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The client will see this automation in their portal
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsAutomationWorkflow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsAutomation} disabled={!automationName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
