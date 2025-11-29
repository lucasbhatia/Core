"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle,
  UserPlus,
  Bot,
  Zap,
  FileText,
  Sparkles,
  ArrowRight,
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

// Storage key for hired agents
const HIRED_AGENTS_KEY = "hired_agents";

// Get hired agents from localStorage
function getStoredHiredAgents(): HiredAgent[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(HIRED_AGENTS_KEY);
  if (!stored) return [];
  try {
    const agents = JSON.parse(stored);
    // Rehydrate roster_agent references
    return agents.map((agent: HiredAgent) => ({
      ...agent,
      roster_agent: AGENT_ROSTER.find((a) => a.id === agent.roster_id) || agent.roster_agent,
    })).filter((a: HiredAgent) => a.roster_agent);
  } catch {
    return [];
  }
}

// Save hired agents to localStorage
function saveHiredAgents(agents: HiredAgent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIRED_AGENTS_KEY, JSON.stringify(agents));
}

export default function WorkforcePage({ clientId, clientPlan }: WorkforcePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>(() => getStoredHiredAgents());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | "all">("all");
  const [activeTab, setActiveTab] = useState(hiredAgents.length > 0 ? "team" : "hire");
  const [isHiring, setIsHiring] = useState<string | null>(null);

  // Calculate stats
  const totalTasks = hiredAgents.reduce((sum, a) => sum + a.tasks_completed, 0);
  const totalDeliverables = hiredAgents.reduce((sum, a) => sum + a.deliverables_created, 0);
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

  // Get hired agent by roster ID
  const getHiredAgent = (rosterId: string) => {
    return hiredAgents.find((h) => h.roster_id === rosterId);
  };

  // Handle hire agent and immediately open workspace
  async function handleHireAndOpen(agent: AgentRosterItem) {
    setIsHiring(agent.id);

    try {
      const newHiredAgent: HiredAgent = {
        id: `hired-${Date.now()}`,
        client_id: clientId,
        roster_id: agent.id,
        roster_agent: agent,
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

      const updatedAgents = [...hiredAgents, newHiredAgent];
      setHiredAgents(updatedAgents);
      saveHiredAgents(updatedAgents);

      toast({
        title: `${agent.name} is ready to work!`,
        description: "Opening workspace...",
      });

      // Navigate to the agent workspace
      router.push(`/portal/workforce/agent/${newHiredAgent.id}`);
    } catch {
      toast({
        title: "Failed to hire agent",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsHiring(null);
    }
  }

  // Handle fire agent
  function handleFireAgent(agentId: string) {
    const agent = hiredAgents.find((h) => h.id === agentId);
    const updatedAgents = hiredAgents.filter((h) => h.id !== agentId);
    setHiredAgents(updatedAgents);
    saveHiredAgents(updatedAgents);
    toast({
      title: `${agent?.roster_agent.name} removed from team`,
    });
  }

  // Handle toggle agent status
  function handleToggleStatus(agentId: string) {
    const updatedAgents = hiredAgents.map((h) =>
      h.id === agentId
        ? { ...h, status: h.status === "active" ? "paused" as const : "active" as const }
        : h
    );
    setHiredAgents(updatedAgents);
    saveHiredAgents(updatedAgents);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Simple Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">AI Workforce</h1>
          </div>
          <p className="text-muted-foreground">
            Hire AI agents and put them to work
          </p>
        </div>
      </div>

      {/* Quick Stats - Only show if have agents */}
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
                  <p className="text-xs text-muted-foreground">Agents</p>
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
                  <p className="text-xs text-muted-foreground">Tasks</p>
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
                  <p className="text-xs text-muted-foreground">Outputs</p>
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
                    <p className="text-2xl font-bold">{avgRating ? avgRating.toFixed(1) : "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
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
                <h3 className="text-xl font-semibold mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Hire an AI agent to start creating content, handling tasks, and getting work done.
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
                  className={`group transition-all hover:shadow-md cursor-pointer ${
                    agent.status === "active" ? "hover:border-violet-300" : "opacity-70"
                  }`}
                  onClick={() => router.push(`/portal/workforce/agent/${agent.id}`)}
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
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
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
                              <DropdownMenuItem asChild>
                                <Link href={`/portal/workforce/agent/${agent.id}/automations`}>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Automations
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleStatus(agent.id); }}>
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
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFireAgent(agent.id); }} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Quick tagline */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.roster_agent.personality.tagline}
                    </p>

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

                    {/* Action Button */}
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 group-hover:bg-violet-700" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Workspace
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Card */}
              <Card
                className="border-dashed cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                onClick={() => setActiveTab("hire")}
              >
                <CardContent className="p-5 h-full flex flex-col items-center justify-center text-center min-h-[280px]">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                    <UserPlus className="w-6 h-6 text-violet-600" />
                  </div>
                  <p className="font-medium">Hire More Agents</p>
                  <p className="text-sm text-muted-foreground">Expand your team</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Hire Agents Tab */}
        <TabsContent value="hire" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDepartment === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDepartment("all")}
              className={selectedDepartment === "all" ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              All
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

          {/* Agent Grid - Simplified */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const hired = isAgentHired(agent.id);
              const hiredAgent = getHiredAgent(agent.id);
              const hiring = isHiring === agent.id;

              return (
                <Card
                  key={agent.id}
                  className={`group transition-all ${
                    hired
                      ? "bg-green-50/50 border-green-200"
                      : "cursor-pointer hover:shadow-lg hover:border-violet-300"
                  }`}
                  onClick={() => {
                    if (hired && hiredAgent) {
                      router.push(`/portal/workforce/agent/${hiredAgent.id}`);
                    } else if (!hiring) {
                      handleHireAndOpen(agent);
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
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.personality.tagline}
                    </p>

                    {/* Capabilities preview */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.capabilities.slice(0, 3).map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-normal">
                          {cap}
                        </Badge>
                      ))}
                    </div>

                    {/* Action */}
                    {hired ? (
                      <Button variant="outline" className="w-full group-hover:border-green-400" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Workspace
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-violet-600 hover:bg-violet-700 group-hover:bg-violet-700"
                        size="sm"
                        disabled={hiring}
                      >
                        {hiring ? (
                          <>
                            <span className="animate-pulse">Hiring...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Hire & Start Working
                            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </>
                        )}
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
                <p className="text-sm text-muted-foreground">Try a different search</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
