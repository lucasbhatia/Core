"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Search,
  Filter,
  MoreVertical,
  Archive,
  Edit2,
  FolderOpen,
  BarChart3,
  FileCode,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

// Type definitions
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
  category?: string;
  tags?: string[];
  content?: string;
  file_url?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  workflow?: {
    id: string;
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
  systems?: unknown[];
  workflows?: Workflow[];
  automations?: Workflow[];
  deliverables?: Deliverable[];
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  report: <BarChart3 className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  analysis: <BarChart3 className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  code: <FileCode className="w-4 h-4" />,
  data: <FileSpreadsheet className="w-4 h-4" />,
  general: <File className="w-4 h-4" />,
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
    pending: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    running: { variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" />, label: "Running" },
    completed: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Completed" },
    delivered: { variant: "default", icon: <CheckCheck className="w-3 h-3" />, label: "Delivered" },
    failed: { variant: "destructive", icon: <AlertCircle className="w-3 h-3" />, label: "Failed" },
    draft: { variant: "outline", icon: <FileText className="w-3 h-3" />, label: "Draft" },
    active: { variant: "default", icon: <Play className="w-3 h-3" />, label: "Active" },
    inactive: { variant: "secondary", icon: <Clock className="w-3 h-3" />, label: "Inactive" },
    approved: { variant: "default", icon: <CheckCircle className="w-3 h-3" />, label: "Approved" },
    review: { variant: "secondary", icon: <Eye className="w-3 h-3" />, label: "Review" },
    archived: { variant: "outline", icon: <Archive className="w-3 h-3" />, label: "Archived" },
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
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [copied, setCopied] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);

  // Deliverables filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupByWorkflow, setGroupByWorkflow] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logoutPortal();
    router.push("/portal/login");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  }

  async function handleRunAutomation(automationId: string) {
    setRunningAutomation(automationId);
    try {
      const response = await fetch("/api/portal/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Automation started",
          description: "Your automation is now running. Results will appear shortly.",
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
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

  async function handleUpdateDeliverable(id: string, updates: Partial<Deliverable>) {
    try {
      const response = await fetch(`/api/portal/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast({ title: "Deliverable updated" });
        setEditingDeliverable(null);
        window.location.reload();
      } else {
        toast({ title: "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error updating deliverable", variant: "destructive" });
    }
  }

  async function handleArchiveDeliverable(id: string) {
    try {
      const response = await fetch(`/api/portal/deliverables/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Deliverable archived" });
        window.location.reload();
      }
    } catch {
      toast({ title: "Error archiving deliverable", variant: "destructive" });
    }
  }

  async function handleArchiveAutomation(id: string) {
    try {
      const response = await fetch(`/api/portal/automation/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Automation archived", description: "The automation has been archived" });
        window.location.reload();
      } else {
        const data = await response.json();
        toast({ title: "Failed to archive", description: data.error || "Could not archive automation", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error archiving automation", variant: "destructive" });
    }
  }

  // Filter deliverables
  const filteredDeliverables = deliverables.filter((d) => {
    if (d.status === "archived") return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  });

  // Group deliverables by workflow if enabled
  const groupedDeliverables = groupByWorkflow
    ? filteredDeliverables.reduce((acc, d) => {
        const workflowName = d.workflow?.name || "Other";
        if (!acc[workflowName]) acc[workflowName] = [];
        acc[workflowName].push(d);
        return acc;
      }, {} as Record<string, Deliverable[]>)
    : null;

  // Get unique categories
  const categories = [...new Set(deliverables.map((d) => d.category).filter(Boolean))];

  // Count stats
  const activeJobs = workflows.filter((w) => ["running", "in_progress"].includes(w.status)).length;
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
                <DropdownMenuSeparator />
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
            Manage your automations and view deliverables
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
              <p className="text-2xl font-bold">{deliverables.filter(d => d.status !== "archived").length}</p>
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
        <Tabs defaultValue="automations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>My Automations</span>
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>Results Library</span>
              {filteredDeliverables.length > 0 && (
                <Badge variant="secondary" className="ml-1">{filteredDeliverables.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span>Job History</span>
            </TabsTrigger>
          </TabsList>

          {/* Automations Tab */}
          <TabsContent value="automations">
            {automations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Automations Available</h3>
                  <p className="text-muted-foreground">
                    Automations set up for you will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {automations.map((automation) => (
                  <Card key={automation.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Bot className="w-4 h-4 text-purple-500" />
                            {automation.name}
                          </CardTitle>
                          <CardDescription>
                            {automation.automation_trigger === "manual" && "Run on demand"}
                            {automation.automation_trigger === "scheduled" && "Runs automatically"}
                            {automation.automation_trigger === "webhook" && "Triggered by events"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={automation.automation_status || "inactive"} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {automation.automation_status === "active" && (
                                <DropdownMenuItem onClick={() => handleRunAutomation(automation.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Now
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchiveAutomation(automation.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {automation.last_run_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Last: {formatDistanceToNow(new Date(automation.last_run_at), { addSuffix: true })}
                            </span>
                          )}
                          {automation.run_count !== undefined && (
                            <span>{automation.run_count} runs</span>
                          )}
                        </div>

                        {automation.automation_status === "active" && (
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
                        )}

                        {automation.automation_status !== "active" && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            This automation is currently {automation.automation_status || "inactive"}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search deliverables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat || ""}>
                      <div className="flex items-center gap-2">
                        {categoryIcons[cat || "general"]}
                        <span className="capitalize">{cat}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={groupByWorkflow ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupByWorkflow(!groupByWorkflow)}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                Group by Job
              </Button>
            </div>

            {filteredDeliverables.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No Results Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Completed work will appear here"}
                  </p>
                </CardContent>
              </Card>
            ) : groupByWorkflow && groupedDeliverables ? (
              // Grouped view
              <div className="space-y-6">
                {Object.entries(groupedDeliverables).map(([workflowName, items]) => (
                  <div key={workflowName}>
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {workflowName}
                      <Badge variant="secondary">{items.length}</Badge>
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((deliverable) => (
                        <DeliverableCard
                          key={deliverable.id}
                          deliverable={deliverable}
                          onView={() => setSelectedDeliverable(deliverable)}
                          onEdit={() => setEditingDeliverable(deliverable)}
                          onArchive={() => handleArchiveDeliverable(deliverable.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid view
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDeliverables.map((deliverable) => (
                  <DeliverableCard
                    key={deliverable.id}
                    deliverable={deliverable}
                    onView={() => setSelectedDeliverable(deliverable)}
                    onEdit={() => setEditingDeliverable(deliverable)}
                    onArchive={() => handleArchiveDeliverable(deliverable.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

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
                    Work submitted for you will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <JobCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* View Deliverable Dialog */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {categoryIcons[selectedDeliverable?.category || "general"]}
              {selectedDeliverable?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDeliverable?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selectedDeliverable?.status || "draft"} />
              {selectedDeliverable?.category && (
                <Badge variant="outline" className="capitalize">
                  {selectedDeliverable.category}
                </Badge>
              )}
              {selectedDeliverable?.workflow && (
                <Badge variant="secondary">From: {selectedDeliverable.workflow.name}</Badge>
              )}
            </div>
            <div className="h-[400px] w-full rounded-md border p-4 overflow-auto bg-gray-50">
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

      {/* Edit Deliverable Dialog */}
      <Dialog open={!!editingDeliverable} onOpenChange={() => setEditingDeliverable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
          </DialogHeader>
          {editingDeliverable && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingDeliverable.name}
                  onChange={(e) => setEditingDeliverable({ ...editingDeliverable, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={editingDeliverable.category || "general"}
                  onValueChange={(value) => setEditingDeliverable({ ...editingDeliverable, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeliverable(null)}>
              Cancel
            </Button>
            <Button onClick={() => editingDeliverable && handleUpdateDeliverable(editingDeliverable.id, {
              name: editingDeliverable.name,
              category: editingDeliverable.category,
            })}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Deliverable Card Component
function DeliverableCard({
  deliverable,
  onView,
  onEdit,
  onArchive,
}: {
  deliverable: Deliverable;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm flex items-center gap-2">
              {categoryIcons[deliverable.category || "general"]}
              <span className="truncate">{deliverable.name}</span>
            </CardTitle>
            {deliverable.description && (
              <CardDescription className="line-clamp-1 text-xs">
                {deliverable.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive} className="text-destructive">
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
          </span>
          <StatusBadge status={deliverable.status} />
        </div>
        {(deliverable.content || deliverable.file_url) && (
          <Button variant="outline" size="sm" className="w-full mt-3" onClick={onView}>
            <Eye className="w-4 h-4 mr-2" />
            View Content
          </Button>
        )}
      </CardContent>
    </Card>
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
              {deliverableCount} {deliverableCount === 1 ? "result" : "results"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
