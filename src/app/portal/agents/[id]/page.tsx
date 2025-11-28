"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  ArrowLeft,
  Save,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Settings,
  BarChart2,
  Clock,
  Zap,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { type DeployedAgent } from "@/lib/ai-agents/types";
import type { Client } from "@/types/database";

interface Execution {
  id: string;
  status: string;
  trigger: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  total_tokens: number;
  error_message: string | null;
}

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<DeployedAgent | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [isPublic, setIsPublic] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);

  useEffect(() => {
    fetchClient();
    fetchAgent();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch("/api/portal/client");
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const fetchAgent = async () => {
    try {
      const [agentRes, execsRes] = await Promise.all([
        fetch(`/api/portal/agents/${id}`),
        fetch(`/api/portal/agents/${id}/executions?limit=10`),
      ]);

      if (agentRes.ok) {
        const data = await agentRes.json();
        setAgent(data.agent);
        setName(data.agent.name);
        setDescription(data.agent.description || "");
        setSystemPrompt(data.agent.system_prompt);
        setTemperature(data.agent.temperature);
        setMaxTokens(data.agent.max_tokens);
        setIsPublic(data.agent.is_public);
        setApiEnabled(data.agent.api_enabled);
      }

      if (execsRes.ok) {
        const data = await execsRes.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/portal/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens,
          is_public: isPublic,
          api_enabled: apiEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
      }
    } catch (error) {
      console.error("Error saving agent:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";

    try {
      const res = await fetch(`/api/portal/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAgent((prev) => (prev ? { ...prev, status: newStatus as DeployedAgent["status"] } : prev));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/portal/agents/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/portal/agents");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const copyWebhookUrl = () => {
    if (agent?.webhook_url) {
      navigator.clipboard.writeText(agent.webhook_url);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />;
    }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <PortalShell client={client} pageTitle="Agent Not Found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Agent not found</h3>
            <Link href="/portal/agents">
              <Button>Back to Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  return (
    <PortalShell client={client} pageTitle={agent.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      agent.status === "active"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }
                  >
                    {agent.status}
                  </Badge>
                  <Badge variant="outline">{agent.category}</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleStatus}>
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
            </Button>
            <Button variant="outline" onClick={() => router.push(`/portal/agents/${id}/chat`)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button onClick={() => router.push(`/portal/agents/${id}/run`)}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Total Runs</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(agent.total_executions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Tokens Used</span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(agent.total_tokens_used)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {agent.avg_execution_time_ms
                  ? `${(agent.avg_execution_time_ms / 1000).toFixed(1)}s`
                  : "-"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {agent.total_executions > 0
                  ? `${((agent.error_count / agent.total_executions) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="executions">
              <BarChart2 className="h-4 w-4 mr-2" />
              Executions
            </TabsTrigger>
            <TabsTrigger value="api">
              <ExternalLink className="h-4 w-4 mr-2" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* System Prompt */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Model Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Temperature: {temperature}</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Select
                        value={maxTokens.toString()}
                        onValueChange={(v) => setMaxTokens(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024">1,024</SelectItem>
                          <SelectItem value="2048">2,048</SelectItem>
                          <SelectItem value="4096">4,096</SelectItem>
                          <SelectItem value="8192">8,192</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Access Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Public Access</Label>
                      <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>API Access</Label>
                      <Switch checked={apiEnabled} onCheckedChange={setApiEnabled} />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="executions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>Last 10 runs of this agent</CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No executions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((exec) => (
                      <div
                        key={exec.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(exec.status)}
                          <div>
                            <p className="font-medium text-sm">
                              {exec.trigger.charAt(0).toUpperCase() + exec.trigger.slice(1)} Run
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(exec.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p>{exec.total_tokens} tokens</p>
                          <p className="text-xs text-muted-foreground">
                            {exec.duration_ms ? `${(exec.duration_ms / 1000).toFixed(1)}s` : "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Use these endpoints to interact with your agent programmatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Execute Endpoint</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`POST /api/agents/${id}/execute`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(`/api/agents/${id}/execute`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Chat Endpoint</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`POST /api/agents/${id}/chat`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(`/api/agents/${id}/chat`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {agent.webhook_url && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={agent.webhook_url} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Example Request:</p>
                  <pre className="text-xs overflow-x-auto">
                    {`curl -X POST /api/agents/${id}/execute \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"input_data": {"field": "value"}}'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalShell>
  );
}
