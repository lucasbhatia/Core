"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Star,
  Clock,
  MessageSquare,
  FileText,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Trash2,
  Sparkles,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building2,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Target,
  Award,
  Activity,
  PieChart,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AGENT_ROSTER,
  WORKFORCE_PLAN_LIMITS,
  DEPARTMENT_INFO,
  type HiredAgent,
  type AgentTier,
  type AgentDepartment,
} from "@/lib/ai-workforce";
import { formatDistanceToNow, format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface TeamPageProps {
  clientId: string;
  clientPlan: string;
  companyName: string;
}

// Mock hired agents for demo
const mockHiredAgents: HiredAgent[] = [
  {
    id: "hired-1",
    client_id: "demo",
    roster_id: "content-writer-sarah",
    roster_agent: AGENT_ROSTER.find((a) => a.id === "content-writer-sarah")!,
    status: "active",
    hired_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tasks_completed: 12,
    deliverables_created: 15,
    total_tokens_used: 45000,
    avg_task_rating: 4.8,
    notification_enabled: true,
    auto_save_deliverables: true,
  },
  {
    id: "hired-2",
    client_id: "demo",
    roster_id: "social-media-alex",
    roster_agent: AGENT_ROSTER.find((a) => a.id === "social-media-alex")!,
    status: "active",
    hired_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_active_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    tasks_completed: 8,
    deliverables_created: 24,
    total_tokens_used: 22000,
    avg_task_rating: 4.6,
    notification_enabled: true,
    auto_save_deliverables: true,
  },
  {
    id: "hired-3",
    client_id: "demo",
    roster_id: "meeting-assistant-kai",
    roster_agent: AGENT_ROSTER.find((a) => a.id === "meeting-assistant-kai")!,
    status: "active",
    hired_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    last_active_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    tasks_completed: 25,
    deliverables_created: 25,
    total_tokens_used: 18000,
    avg_task_rating: 4.9,
    notification_enabled: true,
    auto_save_deliverables: true,
  },
];

// Weekly activity data
const weeklyActivity = [
  { day: "Mon", tasks: 5, tokens: 12000 },
  { day: "Tue", tasks: 8, tokens: 18000 },
  { day: "Wed", tasks: 6, tokens: 15000 },
  { day: "Thu", tasks: 12, tokens: 28000 },
  { day: "Fri", tasks: 9, tokens: 22000 },
  { day: "Sat", tasks: 3, tokens: 7000 },
  { day: "Sun", tasks: 2, tokens: 5000 },
];

export default function TeamPage({ clientId, clientPlan, companyName }: TeamPageProps) {
  const { toast } = useToast();
  const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>(mockHiredAgents);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState<HiredAgent | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [customName, setCustomName] = useState("");

  const planLimits = WORKFORCE_PLAN_LIMITS[clientPlan] || WORKFORCE_PLAN_LIMITS.free;
  const totalTasks = hiredAgents.reduce((sum, a) => sum + a.tasks_completed, 0);
  const totalDeliverables = hiredAgents.reduce((sum, a) => sum + a.deliverables_created, 0);
  const totalTokens = hiredAgents.reduce((sum, a) => sum + a.total_tokens_used, 0);
  const avgRating = hiredAgents.filter(a => a.avg_task_rating).reduce((sum, a) => sum + (a.avg_task_rating || 0), 0) / hiredAgents.filter(a => a.avg_task_rating).length || 0;

  // Group agents by department
  const agentsByDepartment = hiredAgents.reduce((acc, agent) => {
    const dept = agent.roster_agent.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(agent);
    return acc;
  }, {} as Record<AgentDepartment, HiredAgent[]>);

  // Usage calculations
  const agentUsagePercent = planLimits.max_hired_agents === -1
    ? 0
    : Math.round((hiredAgents.length / planLimits.max_hired_agents) * 100);
  const tokenUsagePercent = planLimits.max_tokens_per_month === -1
    ? 0
    : Math.round((totalTokens / planLimits.max_tokens_per_month) * 100);
  const taskUsagePercent = planLimits.max_tasks_per_month === -1
    ? 0
    : Math.round((totalTasks / planLimits.max_tasks_per_month) * 100);

  // Handle agent status toggle
  function handleToggleStatus(agentId: string) {
    setHiredAgents(
      hiredAgents.map((h) =>
        h.id === agentId
          ? { ...h, status: h.status === "active" ? "paused" : "active" }
          : h
      )
    );
    toast({
      title: "Agent status updated",
      description: `Agent is now ${hiredAgents.find(a => a.id === agentId)?.status === "active" ? "paused" : "active"}.`,
    });
  }

  // Handle remove agent
  function handleRemoveAgent(agentId: string) {
    const agent = hiredAgents.find((h) => h.id === agentId);
    setHiredAgents(hiredAgents.filter((h) => h.id !== agentId));
    setShowRemoveDialog(false);
    setSelectedAgent(null);
    toast({
      title: `${agent?.roster_agent.name} has left your team`,
      description: "You can hire them again anytime from the marketplace.",
    });
  }

  // Handle save settings
  function handleSaveSettings() {
    if (selectedAgent) {
      setHiredAgents(
        hiredAgents.map((h) =>
          h.id === selectedAgent.id
            ? { ...h, custom_name: customName || undefined, custom_instructions: customInstructions || undefined }
            : h
        )
      );
      setShowSettingsDialog(false);
      toast({
        title: "Settings saved",
        description: `${selectedAgent.roster_agent.name}'s settings have been updated.`,
      });
    }
  }

  // Open settings dialog
  function openSettingsDialog(agent: HiredAgent) {
    setSelectedAgent(agent);
    setCustomName(agent.custom_name || "");
    setCustomInstructions(agent.custom_instructions || "");
    setShowSettingsDialog(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal/workforce">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-violet-600" />
              {companyName}'s AI Team
            </h1>
            <p className="text-muted-foreground">
              Manage your AI workforce and track performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/portal/billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
            <Link href="/portal/workforce">
              <UserPlus className="w-4 h-4 mr-2" />
              Hire Agents
            </Link>
          </Button>
        </div>
      </div>

      {/* Plan Usage Banner */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-violet-900 capitalize">{clientPlan} Plan</p>
                <p className="text-sm text-violet-700">
                  {hiredAgents.length} of {planLimits.max_hired_agents === -1 ? "unlimited" : planLimits.max_hired_agents} agents hired
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-violet-700">Monthly Tasks</p>
                <p className="font-semibold text-violet-900">
                  {totalTasks} / {planLimits.max_tasks_per_month === -1 ? "∞" : planLimits.max_tasks_per_month}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-violet-700">Tokens Used</p>
                <p className="font-semibold text-violet-900">
                  {(totalTokens / 1000).toFixed(0)}K / {planLimits.max_tokens_per_month === -1 ? "∞" : `${planLimits.max_tokens_per_month / 1000}K`}
                </p>
              </div>
              {clientPlan !== "enterprise" && (
                <Button variant="outline" size="sm" asChild className="border-violet-200 text-violet-700 hover:bg-violet-100">
                  <Link href="/portal/billing">
                    Upgrade
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="text-3xl font-bold">{hiredAgents.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <Progress value={agentUsagePercent} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Progress value={taskUsagePercent} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <p className="text-3xl font-bold">{totalDeliverables}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Ready to use</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens Used</p>
                <p className="text-3xl font-bold">{(totalTokens / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <Progress value={tokenUsagePercent} className="h-1.5 mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold flex items-center gap-1">
                  {avgRating.toFixed(1)}
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Team performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Users className="w-4 h-4" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Agents by Department */}
          {Object.entries(agentsByDepartment).map(([dept, agents]) => (
            <div key={dept}>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <span className="text-xl">{DEPARTMENT_INFO[dept as AgentDepartment].icon}</span>
                {DEPARTMENT_INFO[dept as AgentDepartment].label} Team
                <Badge variant="secondary">{agents.length}</Badge>
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <Card
                    key={agent.id}
                    className={`group hover:shadow-lg transition-all ${
                      agent.status === "paused" ? "opacity-75" : ""
                    }`}
                  >
                    {agent.status === "active" && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-lg" />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl">
                            {agent.roster_agent.personality.avatar}
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {agent.custom_name || agent.roster_agent.name}
                              {agent.status === "active" && (
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              )}
                            </CardTitle>
                            <CardDescription>{agent.roster_agent.role}</CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/portal/workforce/agent/${agent.id}`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open Workspace
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(agent.id)}>
                              {agent.status === "active" ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Agent
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activate Agent
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSettingsDialog(agent)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Agent Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAgent(agent);
                                setShowRemoveDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-lg font-bold">{agent.tasks_completed}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-lg font-bold">{agent.deliverables_created}</p>
                          <p className="text-xs text-muted-foreground">Created</p>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-50">
                          <p className="text-lg font-bold flex items-center justify-center gap-1">
                            {agent.avg_task_rating?.toFixed(1) || "-"}
                            {agent.avg_task_rating && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                          </p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {agent.last_active_at
                            ? `Active ${formatDistanceToNow(new Date(agent.last_active_at), { addSuffix: true })}`
                            : "Not yet active"}
                        </span>
                        <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                          {agent.status}
                        </Badge>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/portal/workforce/agent/${agent.id}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1" asChild>
                          <Link href={`/portal/workforce/agent/${agent.id}`}>
                            <Zap className="w-4 h-4 mr-2" />
                            New Task
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {hiredAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-violet-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Visit the AI Workforce marketplace to hire your first AI team members.
                </p>
                <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Link href="/portal/workforce">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                  Weekly Task Activity
                </CardTitle>
                <CardDescription>Tasks completed this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end justify-between gap-2">
                  {weeklyActivity.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t transition-all hover:from-violet-500 hover:to-indigo-400"
                        style={{ height: `${(day.tasks / 12) * 150}px` }}
                        title={`${day.tasks} tasks`}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Token Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Token Consumption
                </CardTitle>
                <CardDescription>Tokens used this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-end justify-between gap-2">
                  {weeklyActivity.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t transition-all hover:from-indigo-500 hover:to-violet-400"
                        style={{ height: `${(day.tokens / 28000) * 150}px` }}
                        title={`${(day.tokens / 1000).toFixed(0)}K tokens`}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agent Performance */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Agent Performance Ranking
                </CardTitle>
                <CardDescription>Based on task completion and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...hiredAgents]
                    .sort((a, b) => (b.avg_task_rating || 0) - (a.avg_task_rating || 0))
                    .map((agent, index) => (
                      <div key={agent.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg">
                          {agent.roster_agent.personality.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{agent.custom_name || agent.roster_agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.roster_agent.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold flex items-center gap-1">
                            {agent.avg_task_rating?.toFixed(1) || "-"}
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          </p>
                          <p className="text-xs text-muted-foreground">{agent.tasks_completed} tasks</p>
                        </div>
                        <Progress
                          value={(agent.avg_task_rating || 0) * 20}
                          className="w-24 h-2"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions from your AI team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock activity feed */}
                {[
                  { agent: mockHiredAgents[0], action: "completed", item: "Blog post about remote work", time: "2 hours ago", icon: CheckCircle, color: "text-green-600 bg-green-100" },
                  { agent: mockHiredAgents[1], action: "created", item: "5 social media posts", time: "3 hours ago", icon: FileText, color: "text-blue-600 bg-blue-100" },
                  { agent: mockHiredAgents[2], action: "summarized", item: "Q4 Planning Meeting notes", time: "5 hours ago", icon: MessageSquare, color: "text-violet-600 bg-violet-100" },
                  { agent: mockHiredAgents[0], action: "started", item: "Product launch announcement", time: "1 day ago", icon: Play, color: "text-yellow-600 bg-yellow-100" },
                  { agent: mockHiredAgents[1], action: "completed", item: "Twitter thread on AI trends", time: "1 day ago", icon: CheckCircle, color: "text-green-600 bg-green-100" },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        <span className="text-violet-600">{activity.agent.roster_agent.name}</span>
                        {" "}{activity.action}{" "}
                        <span className="text-gray-900">{activity.item}</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/workforce/agent/${activity.agent.id}`}>
                        View
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-lg">
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{selectedAgent.roster_agent.personality.avatar}</span>
                  {selectedAgent.roster_agent.name} Settings
                </DialogTitle>
                <DialogDescription>
                  Customize this agent's behavior and appearance
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Name (Optional)</label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedAgent.roster_agent.name}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Give this agent a custom name for your team
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Instructions</label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add any specific instructions or context for this agent..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    These instructions will be added to every task
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Notifications</p>
                      <p className="text-xs text-muted-foreground">Get notified when tasks complete</p>
                    </div>
                    <Switch defaultChecked={selectedAgent.notification_enabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Auto-save Deliverables</p>
                      <p className="text-xs text-muted-foreground">Automatically save all outputs</p>
                    </div>
                    <Switch defaultChecked={selectedAgent.auto_save_deliverables} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  Save Settings
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Agent Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Remove {selectedAgent.roster_agent.name}?
                </DialogTitle>
                <DialogDescription>
                  This will remove {selectedAgent.roster_agent.name} from your team. You can hire them again anytime from the marketplace.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl">
                    {selectedAgent.roster_agent.personality.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{selectedAgent.roster_agent.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedAgent.roster_agent.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedAgent.tasks_completed} tasks completed • {selectedAgent.deliverables_created} deliverables
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
                  Keep Agent
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveAgent(selectedAgent.id)}
                >
                  Remove from Team
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
