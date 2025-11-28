"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface Workflow {
  id: string;
  name: string;
  status: string;
  current_step: number;
  total_steps: number;
  created_at: string;
  requests: { id: string; subject: string | null; content: string } | null;
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

interface Props {
  initialRequests: Request[];
  initialWorkflows: Workflow[];
  agents: Agent[];
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
  stats,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequestContent, setNewRequestContent] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setNewRequestContent("");
        setSelectedClient("");
        setIsNewRequestOpen(false);
        // Refresh the page to show new request
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
      classifying: { variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      planning: { variant: "secondary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      in_progress: { variant: "default", icon: <Play className="h-3 w-3" /> },
      running: { variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      review: { variant: "secondary", icon: <FileText className="h-3 w-3" /> },
      completed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      delivered: { variant: "default", icon: <Send className="h-3 w-3" /> },
      failed: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.replace("_", " ")}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Workspace</h1>
          <p className="text-muted-foreground">
            Manage requests, workflows, and AI agents
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">What do you need?</label>
                <Textarea
                  placeholder="Describe what you need... e.g., 'Create a marketing plan for our new product launch' or 'Research competitors in the fintech space'"
                  value={newRequestContent}
                  onChange={(e) => setNewRequestContent(e.target.value)}
                  className="mt-1.5 min-h-[150px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client (optional)</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {/* Add clients here */}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
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
                    Submit Request
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
                <p className="text-sm text-muted-foreground">Total Requests</p>
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
                <Workflow className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first request to see AI agents in action
                </p>
                <Button onClick={() => setIsNewRequestOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                          {request.request_type && (
                            <Badge variant="outline">{request.request_type}</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">
                          {request.subject || request.ai_summary || "New Request"}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {request.content.slice(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </span>
                          {request.clients && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {request.clients.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {request.source}
                          </span>
                        </div>
                      </div>
                      {request.workflows && request.workflows[0] && (
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Step {request.workflows[0].current_step}/{request.workflows[0].total_steps}
                          </p>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${(request.workflows[0].current_step / request.workflows[0].total_steps) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No active workflows</h3>
                <p className="text-muted-foreground">
                  Workflows are created automatically when requests are processed
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      {getStatusBadge(workflow.status)}
                    </div>
                    {workflow.clients && (
                      <CardDescription>
                        Client: {workflow.clients.name}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {workflow.current_step}/{workflow.total_steps} steps
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{
                            width: `${(workflow.current_step / workflow.total_steps) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {workflow.agent_tasks.slice(0, 5).map((task) => (
                          <Badge
                            key={task.id}
                            variant={task.status === "completed" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {task.name}
                          </Badge>
                        ))}
                        {workflow.agent_tasks.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{workflow.agent_tasks.length - 5} more
                          </Badge>
                        )}
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
    </div>
  );
}
