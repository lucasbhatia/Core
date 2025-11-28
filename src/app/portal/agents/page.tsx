"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Plus,
  Search,
  Play,
  Pause,
  MessageSquare,
  TrendingUp,
  Users,
  Code,
  Headphones,
  Megaphone,
  Settings,
  DollarSign,
  Scale,
  BookOpen,
  Palette,
  BarChart2,
  Wand2,
  MoreVertical,
  ExternalLink,
  Zap,
  Clock,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import type { Client } from "@/types/database";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  Headphones,
  Megaphone,
  Settings,
  Code,
  Users,
  DollarSign,
  Scale,
  Search: BookOpen,
  Palette,
  BarChart2,
  Wand2,
  Bot,
};

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: "active" | "paused" | "error" | "draft";
  total_executions: number;
  total_tokens_used: number;
  last_execution_at: string | null;
  created_at: string;
}

interface AgentUsage {
  agents_active: number;
  total_executions: number;
  total_tokens_used: number;
  conversations_started: number;
}

interface PlanLimits {
  agents: number;
  agent_executions: number;
  agent_tokens: number;
  agent_conversations: number;
}

const categories = [
  { id: "all", name: "All Agents", icon: Bot },
  { id: "sales", name: "Sales", icon: TrendingUp },
  { id: "support", name: "Support", icon: Headphones },
  { id: "marketing", name: "Marketing", icon: Megaphone },
  { id: "operations", name: "Operations", icon: Settings },
  { id: "development", name: "Development", icon: Code },
  { id: "hr", name: "HR", icon: Users },
  { id: "finance", name: "Finance", icon: DollarSign },
  { id: "custom", name: "Custom", icon: Wand2 },
];

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<AgentUsage | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, usageRes, clientRes] = await Promise.all([
        fetch("/api/portal/agents"),
        fetch("/api/portal/agents/usage"),
        fetch("/api/portal/client"),
      ]);

      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data.agents || []);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data.usage);
        setLimits(data.limits);
      }

      if (clientRes.ok) {
        const data = await clientRes.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/portal/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agentId ? { ...a, status: newStatus as Agent["status"] } : a))
        );
      }
    } catch (error) {
      console.error("Error updating agent:", error);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "draft":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PortalShell client={client} pageTitle="AI Agents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground">
              Deploy and manage AI agents to automate tasks and assist your team
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/portal/agents/templates">
              <Button variant="outline">
                <Wand2 className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </Link>
            <Link href="/portal/agents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          </div>
        </div>

        {/* Usage Overview */}
        {usage && limits && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Active Agents</span>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {usage.agents_active}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{limits.agents === -1 ? "∞" : limits.agents}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.agents_active, limits.agents)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Executions</span>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(usage.total_executions)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{limits.agent_executions === -1 ? "∞" : formatNumber(limits.agent_executions)}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.total_executions, limits.agent_executions)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tokens Used</span>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(usage.total_tokens_used)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{limits.agent_tokens === -1 ? "∞" : formatNumber(limits.agent_tokens)}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.total_tokens_used, limits.agent_tokens)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Conversations</span>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {formatNumber(usage.conversations_started)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{limits.agent_conversations === -1 ? "∞" : formatNumber(limits.agent_conversations)}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.conversations_started, limits.agent_conversations)}
                  className="h-1 mt-2"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto gap-1">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <cat.icon className="h-4 w-4 mr-1" />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first AI agent to start automating tasks"}
              </p>
              <div className="flex gap-2">
                <Link href="/portal/agents/templates">
                  <Button variant="outline">Browse Templates</Button>
                </Link>
                <Link href="/portal/agents/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => {
              const IconComponent = iconMap[agent.icon] || Bot;
              return (
                <Card key={agent.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/portal/agents/${agent.id}`)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/portal/agents/${agent.id}/chat`)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/portal/agents/${agent.id}/run`)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleAgentStatus(agent.id, agent.status)}>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {agent.description || "No description"}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <div className="font-medium">{formatNumber(agent.total_executions)}</div>
                        <div className="text-xs text-muted-foreground">Runs</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <div className="font-medium">{formatNumber(agent.total_tokens_used)}</div>
                        <div className="text-xs text-muted-foreground">Tokens</div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <div className="font-medium">
                          {agent.last_execution_at
                            ? new Date(agent.last_execution_at).toLocaleDateString()
                            : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">Last Run</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/portal/agents/${agent.id}/chat`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/portal/agents/${agent.id}/run`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
