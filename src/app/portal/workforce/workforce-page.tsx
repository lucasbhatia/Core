"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AGENT_ROSTER,
  getAgentsByDepartment,
  getPopularAgents,
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Simple Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI Workforce</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Hire AI agents to handle content, marketing, research, and more.
        </p>
      </div>

      {/* Your Team - Simple Section */}
      {hiredAgents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Your Team
              <Badge variant="secondary" className="ml-1">{hiredAgents.length}</Badge>
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/workforce/team">
                Manage Team
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hiredAgents.map((agent) => (
              <Card
                key={agent.id}
                className={`group cursor-pointer transition-all hover:shadow-md ${
                  agent.status === "active" ? "hover:border-violet-300" : "opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl">
                        {agent.roster_agent.personality.avatar}
                      </div>
                      {agent.status === "active" && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{agent.roster_agent.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{agent.roster_agent.role}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/portal/workforce/agent/${agent.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
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

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {agent.tasks_completed} tasks
                    </span>
                    {agent.avg_task_rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {agent.avg_task_rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Quick Action */}
                  <Button className="w-full mt-3" size="sm" asChild>
                    <Link href={`/portal/workforce/agent/${agent.id}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Chat
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for No Team */}
      {hiredAgents.length === 0 && (
        <Card className="border-dashed bg-gradient-to-br from-violet-50/50 to-indigo-50/50">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Build your AI team</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Browse agents below and hire your first team member.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-600" />
            Hire Agents
          </h2>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
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

        {/* Agent Grid - Clean & Simple */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const hired = isAgentHired(agent.id);

            return (
              <Card
                key={agent.id}
                className={`group transition-all cursor-pointer ${
                  hired ? "bg-green-50/50 border-green-200" : "hover:shadow-md hover:border-violet-200"
                }`}
                onClick={() => {
                  if (!hired) {
                    setSelectedAgent(agent);
                    setShowHireDialog(true);
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl shrink-0">
                      {agent.personality.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{agent.name}</h3>
                        {hired && (
                          <Badge className="bg-green-100 text-green-700 border-0 shrink-0">Hired</Badge>
                        )}
                        {agent.is_popular && !hired && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.role}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {agent.personality.tagline}
                  </p>

                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.capabilities.slice(0, 3).map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {cap}
                      </Badge>
                    ))}
                  </div>

                  {/* Action */}
                  {hired ? (
                    <Button variant="outline" className="w-full mt-4" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                      <Link href={`/portal/workforce/agent/${hiredAgents.find((h) => h.roster_id === agent.id)?.id}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Chat
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full mt-4 bg-violet-600 hover:bg-violet-700" size="sm">
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
              <p className="text-sm text-muted-foreground">Try adjusting your search</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simple Hire Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="max-w-md">
          {selectedAgent && (
            <>
              <DialogHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-4xl mx-auto mb-4">
                  {selectedAgent.personality.avatar}
                </div>
                <DialogTitle className="text-xl">Hire {selectedAgent.name}?</DialogTitle>
                <DialogDescription>{selectedAgent.role}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  {selectedAgent.description}
                </p>

                {/* What they can do */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">What {selectedAgent.name.split(" ")[0]} can help with:</p>
                  <ul className="space-y-1.5">
                    {selectedAgent.best_for.slice(0, 4).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
