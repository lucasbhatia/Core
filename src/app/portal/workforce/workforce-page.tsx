"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sparkles,
  Star,
  Clock,
  MessageSquare,
  FileText,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Trash2,
  TrendingUp,
  Zap,
  Lock,
  ChevronRight,
  CheckCircle,
  Briefcase,
  UserPlus,
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
  type AgentTier,
  type HiredAgent,
} from "@/lib/ai-workforce";
import { formatDistanceToNow } from "date-fns";

interface WorkforcePageProps {
  clientId: string;
  clientPlan: string;
}

// Mock hired agents for demo (in production, this would come from the API)
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

const tierOrder: AgentTier[] = ["free", "starter", "pro", "business", "enterprise"];

function canAccessTier(userPlan: string, requiredTier: AgentTier): boolean {
  const userTierIndex = tierOrder.indexOf(userPlan as AgentTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  return userTierIndex >= requiredTierIndex;
}

export default function WorkforcePage({ clientId, clientPlan }: WorkforcePageProps) {
  const { toast } = useToast();
  const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>(mockHiredAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | "all" | "popular">("all");
  const [selectedAgent, setSelectedAgent] = useState<AgentRosterItem | null>(null);
  const [showHireDialog, setShowHireDialog] = useState(false);
  const [isHiring, setIsHiring] = useState(false);

  // Filter agents based on search and department
  const filteredAgents = searchQuery
    ? searchAgents(searchQuery)
    : selectedDepartment === "all"
    ? AGENT_ROSTER
    : selectedDepartment === "popular"
    ? getPopularAgents()
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
      // In production, this would be an API call
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
        title: `${selectedAgent.name} has joined your team!`,
        description: `Your new ${selectedAgent.role} is ready to work.`,
      });
      setShowHireDialog(false);
      setSelectedAgent(null);
    } catch (error) {
      toast({
        title: "Failed to hire agent",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsHiring(false);
    }
  }

  // Handle fire agent
  async function handleFireAgent(agentId: string) {
    const agent = hiredAgents.find((h) => h.id === agentId);
    setHiredAgents(hiredAgents.filter((h) => h.id !== agentId));
    toast({
      title: `${agent?.roster_agent.name} has left your team`,
      description: "You can hire them again anytime.",
    });
  }

  // Handle toggle agent status
  async function handleToggleStatus(agentId: string) {
    setHiredAgents(
      hiredAgents.map((h) =>
        h.id === agentId
          ? { ...h, status: h.status === "active" ? "paused" : "active" }
          : h
      )
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Your Team</p>
                <p className="text-3xl font-bold text-violet-700">{hiredAgents.length}</p>
                <p className="text-xs text-violet-500 mt-1">AI agents hired</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-3xl font-bold">
                  {hiredAgents.reduce((sum, a) => sum + a.tasks_completed, 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">+12 this week</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <p className="text-3xl font-bold">
                  {hiredAgents.reduce((sum, a) => sum + a.deliverables_created, 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Ready to use</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold">
                  {(
                    hiredAgents
                      .filter((a) => a.avg_task_rating)
                      .reduce((sum, a) => sum + (a.avg_task_rating || 0), 0) /
                    hiredAgents.filter((a) => a.avg_task_rating).length || 0
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Team performance</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Team Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-600" />
              Your Team
            </h2>
            <p className="text-sm text-muted-foreground">
              {hiredAgents.length} agent{hiredAgents.length !== 1 ? "s" : ""} working for you
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/workforce/team">
              Manage Team
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {hiredAgents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Hire AI agents from the marketplace below to build your virtual team.
                Each agent specializes in different tasks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hiredAgents.map((agent) => (
              <Card
                key={agent.id}
                className="group hover:shadow-lg transition-all hover:border-violet-200 relative overflow-hidden"
              >
                {agent.status === "active" && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/portal/workforce/agent/${agent.id}/settings`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleFireAgent(agent.id)}
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
                  {/* Stats Row */}
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

                  {/* Action Button */}
                  <Button className="w-full" asChild>
                    <Link href={`/portal/workforce/agent/${agent.id}`}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Workspace
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Add Agent Card */}
            <Card className="border-dashed hover:border-violet-300 hover:bg-violet-50/50 transition-colors cursor-pointer group">
              <CardContent className="h-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center mb-3 transition-colors">
                  <UserPlus className="w-6 h-6 text-violet-600" />
                </div>
                <p className="font-medium text-violet-700">Hire Another Agent</p>
                <p className="text-sm text-muted-foreground mt-1">Browse the marketplace below</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Marketplace Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Agent Marketplace
            </h2>
            <p className="text-sm text-muted-foreground">
              {AGENT_ROSTER.length} AI agents available to hire
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 sm:max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex-1 overflow-x-auto">
            <Tabs
              value={selectedDepartment}
              onValueChange={(v) => setSelectedDepartment(v as AgentDepartment | "all" | "popular")}
            >
              <TabsList className="inline-flex h-10 w-auto">
                <TabsTrigger value="all" className="px-4">All</TabsTrigger>
                <TabsTrigger value="popular" className="px-4">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </TabsTrigger>
                {(Object.keys(DEPARTMENT_INFO) as AgentDepartment[]).map((dept) => (
                  <TabsTrigger key={dept} value={dept} className="px-4">
                    <span className="mr-1">{DEPARTMENT_INFO[dept].icon}</span>
                    {DEPARTMENT_INFO[dept].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const hired = isAgentHired(agent.id);
            const canAccess = canAccessTier(clientPlan, agent.tier_required);

            return (
              <Card
                key={agent.id}
                className={`group transition-all ${
                  hired
                    ? "border-green-200 bg-green-50/30"
                    : canAccess
                    ? "hover:shadow-lg hover:border-violet-200"
                    : "opacity-75"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl">
                        {agent.personality.avatar}
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {agent.name}
                          {agent.is_new && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              New
                            </Badge>
                          )}
                          {hired && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Hired
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{agent.role}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {DEPARTMENT_INFO[agent.department].icon} {DEPARTMENT_INFO[agent.department].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.personality.tagline}
                  </p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Tier and Popularity */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {agent.is_popular && (
                        <span className="flex items-center text-yellow-600">
                          <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                          Popular
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        agent.tier_required === "free"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : agent.tier_required === "starter"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : agent.tier_required === "pro"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {agent.tier_required === "free" ? "Free" : `${agent.tier_required} plan`}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  {hired ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={`/portal/workforce/agent/${
                          hiredAgents.find((h) => h.roster_id === agent.id)?.id
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Workspace
                      </Link>
                    </Button>
                  ) : canAccess ? (
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowHireDialog(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Hire {agent.name}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade to {agent.tier_required}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAgents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No agents found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hire Agent Dialog */}
      <Dialog open={showHireDialog} onOpenChange={setShowHireDialog}>
        <DialogContent className="max-w-lg">
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAgent.personality.avatar}</span>
                  Hire {selectedAgent.name}?
                </DialogTitle>
                <DialogDescription>
                  {selectedAgent.role} - {selectedAgent.personality.tagline}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-medium mb-2">About {selectedAgent.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.capabilities.map((cap, idx) => (
                      <Badge key={idx} variant="secondary">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Best for</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedAgent.best_for.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Communication Style</h4>
                  <Badge variant="outline" className="capitalize">
                    {selectedAgent.personality.communication_style}
                  </Badge>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowHireDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleHireAgent}
                  disabled={isHiring}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  {isHiring ? (
                    "Hiring..."
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Hire {selectedAgent.name}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
