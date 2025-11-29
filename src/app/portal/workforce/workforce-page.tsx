"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
  Search,
  Users,
  Star,
  MessageSquare,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  CheckCircle,
  UserPlus,
  Bot,
  Zap,
  TrendingUp,
  Clock,
  FileText,
  Settings,
  Sparkles,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AGENT_ROSTER,
  getAgentsByDepartment,
  searchAgents,
  DEPARTMENT_INFO,
  type AgentRosterItem,
  type AgentDepartment,
  type HiredAgent,
} from "@/lib/ai-workforce";

interface WorkforcePageProps {
  clientId: string;
  clientPlan: string;
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
];

export default function WorkforcePage({ clientId, clientPlan }: WorkforcePageProps) {
  const { toast } = useToast();
  const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>(mockHiredAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | "all">("all");
  const [selectedAgent, setSelectedAgent] = useState<AgentRosterItem | null>(null);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
  const [activeTab, setActiveTab] = useState("team");

  // Calculate stats
  const totalTasks = hiredAgents.reduce((sum, a) => sum + a.tasks_completed, 0);
  const totalDeliverables = hiredAgents.reduce((sum, a) => sum + a.deliverables_created, 0);
  const activeAgents = hiredAgents.filter((a) => a.status === "active").length;
  const avgRating = hiredAgents.filter(a => a.avg_task_rating).reduce((sum, a) => sum + (a.avg_task_rating || 0), 0) / hiredAgents.filter(a => a.avg_task_rating).length || 0;

  // Filter agents based on search and department
  const filteredAgents = searchQuery
    ? searchAgents(searchQuery)
    : selectedDepartment === "all"
    ? AGENT_ROSTER
    : getAgentsByDepartment(selectedDepartment);

  // Check if agent is already hired
  const isAgentHired = (agentId: string) => {
    return hiredAgents.some((h) => h.roster_id === agentId);
  };

  // Handle hire agent
  async function handleHireAgent() {
    if (!selectedAgent) return;

    setIsHiring(true);
    try {
      const newHiredAgent: HiredAgent = {
        id: `hired-${Date.now()}`,
        client_id: clientId,
        roster_id: selectedAgent.id,
        roster_agent: selectedAgent,
        status: "active",
        hired_at: new Date().toISOString(),
        last_active_at: null,
        tasks_completed: 0,
        deliverables_created: 0,
        total_tokens_used: 0,
        avg_task_rating: null,
        notification_enabled: true,
        auto_save_deliverables: true,
      };

      setHiredAgents([...hiredAgents, newHiredAgent]);
      toast({
        title: `${selectedAgent.name} joined your team!`,
        description: "Start chatting to assign your first task.",
      });
      setShowHireDialog(false);
      setSelectedAgent(null);
      setActiveTab("team");
    } catch {
      toast({
        title: "Failed to hire agent",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsHiring(false);
    }
  }

  // Handle fire agent
  function handleFireAgent(agentId: string) {
    const agent = hiredAgents.find((h) => h.id === agentId);
    setHiredAgents(hiredAgents.filter((h) => h.id !== agentId));
    toast({
      title: `${agent?.roster_agent.name} removed from team`,
    });
  }

  // Handle toggle agent status
  function handleToggleStatus(agentId: string) {
    setHiredAgents(
      hiredAgents.map((h) =>
        h.id === agentId
          ? { ...h, status: h.status === "active" ? "paused" : "active" }
          : h
      )
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">AI Workforce</h1>
          </div>
          <p className="text-muted-foreground">
            Your team of AI agents ready to work
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/portal/workforce/team">
              <Settings className="w-4 h-4 mr-2" />
              Manage Team
            </Link>
          </Button>
          <Button onClick={() => setActiveTab("hire")} className="bg-violet-600 hover:bg-violet-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Hire Agent
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {hiredAgents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hiredAgents.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDeliverables}</p>
                  <p className="text-xs text-muted-foreground">Deliverables</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Your Team
            {hiredAgents.length > 0 && (
              <Badge variant="secondary" className="ml-1">{hiredAgents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hire" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Hire Agents
          </TabsTrigger>
        </TabsList>

        {/* Your Team Tab */}
        <TabsContent value="team" className="space-y-4">
          {hiredAgents.length === 0 ? (
            <Card className="border-dashed bg-gradient-to-br from-violet-50/50 to-indigo-50/50">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Build your AI team</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Hire AI agents to handle content creation, marketing, research, and more. Each agent specializes in specific tasks.
                </p>
                <Button onClick={() => setActiveTab("hire")} className="bg-violet-600 hover:bg-violet-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Hire Your First Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hiredAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`group transition-all hover:shadow-md ${
                    agent.status === "active" ? "hover:border-violet-300" : "opacity-70"
                  }`}
                >
                  <CardContent className="p-5">
                    {/* Agent Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                          {agent.roster_agent.personality.avatar}
                        </div>
                        {agent.status === "active" && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{agent.roster_agent.name}</h3>
                            <p className="text-sm text-muted-foreground">{agent.roster_agent.role}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/portal/workforce/agent/${agent.id}`}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Open Chat
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/portal/workforce/agent/${agent.id}/automations`}>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Automations
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(agent.id)}>
                                {agent.status === "active" ? (
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
                              <DropdownMenuItem onClick={() => handleFireAgent(agent.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Agent Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-semibold">{agent.tasks_completed}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-semibold">{agent.deliverables_created}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Outputs</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <p className="text-lg font-semibold">{agent.avg_task_rating?.toFixed(1) || "-"}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">Rating</p>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.roster_agent.capabilities.slice(0, 3).map((cap, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] font-normal px-2 py-0">
                          {cap}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Button className="w-full bg-violet-600 hover:bg-violet-700" size="sm" asChild>
                      <Link href={`/portal/workforce/agent/${agent.id}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Workspace
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Card */}
              <Card
                className="border-dashed cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                onClick={() => setActiveTab("hire")}
              >
                <CardContent className="p-5 h-full flex flex-col items-center justify-center text-center min-h-[240px]">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                    <UserPlus className="w-6 h-6 text-violet-600" />
                  </div>
                  <p className="font-medium">Hire More Agents</p>
                  <p className="text-sm text-muted-foreground">Expand your AI team</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Hire Agents Tab */}
        <TabsContent value="hire" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, role, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDepartment === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDepartment("all")}
              className={selectedDepartment === "all" ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              All Agents
            </Button>
            {(Object.keys(DEPARTMENT_INFO) as AgentDepartment[]).map((dept) => (
              <Button
                key={dept}
                variant={selectedDepartment === dept ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDepartment(dept)}
                className={selectedDepartment === dept ? "bg-violet-600 hover:bg-violet-700" : ""}
              >
                <span className="mr-1.5">{DEPARTMENT_INFO[dept].icon}</span>
                {DEPARTMENT_INFO[dept].label}
              </Button>
            ))}
          </div>

          {/* Agent Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const hired = isAgentHired(agent.id);

              return (
                <Card
                  key={agent.id}
                  className={`group transition-all ${
                    hired
                      ? "bg-green-50/50 border-green-200"
                      : "cursor-pointer hover:shadow-md hover:border-violet-200"
                  }`}
                  onClick={() => {
                    if (!hired) {
                      setSelectedAgent(agent);
                      setShowHireDialog(true);
                    }
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {agent.personality.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold truncate">{agent.name}</h3>
                          {hired && (
                            <Badge className="bg-green-100 text-green-700 border-0 shrink-0 text-[10px]">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Hired
                            </Badge>
                          )}
                          {agent.is_popular && !hired && (
                            <Badge className="bg-amber-100 text-amber-700 border-0 shrink-0 text-[10px]">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Popular
                            </Badge>
                          )}
                          {agent.is_new && !hired && (
                            <Badge className="bg-blue-100 text-blue-700 border-0 shrink-0 text-[10px]">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {agent.personality.tagline}
                    </p>

                    {/* Best For */}
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1.5 font-medium">Best for</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.best_for.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] font-normal">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    {hired ? (
                      <Button variant="outline" className="w-full" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href={`/portal/workforce/agent/${hiredAgents.find((h) => h.roster_id === agent.id)?.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Open Workspace
                        </Link>
                      </Button>
                    ) : (
                      <Button className="w-full bg-violet-600 hover:bg-violet-700" size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Hire {agent.name.split(" ")[0]}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* No Results */}
          {filteredAgents.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No agents found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Hire Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="max-w-lg">
          {selectedAgent && (
            <>
              <DialogHeader className="text-center pb-2">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">
                  {selectedAgent.personality.avatar}
                </div>
                <DialogTitle className="text-xl">Hire {selectedAgent.name}?</DialogTitle>
                <p className="text-muted-foreground">{selectedAgent.role}</p>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <p className="text-sm text-center text-muted-foreground">
                  {selectedAgent.description}
                </p>

                {/* What they can do */}
                <div className="bg-violet-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-600" />
                    What {selectedAgent.name.split(" ")[0]} can help with
                  </p>
                  <ul className="space-y-2">
                    {selectedAgent.best_for.slice(0, 4).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-sm font-medium mb-2">Capabilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.capabilities.slice(0, 6).map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Personality</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedAgent.personality.communication_style} communicator</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {selectedAgent.personality.communication_style}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowHireDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleHireAgent}
                  disabled={isHiring}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isHiring ? "Hiring..." : `Hire ${selectedAgent.name.split(" ")[0]}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
