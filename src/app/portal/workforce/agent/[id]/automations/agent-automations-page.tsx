"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Zap,
  Plus,
  ArrowRight,
  Trash2,
  Users,
  Mail,
  FileText,
  ChevronRight,
  Play,
  Pause,
  Clock,
  CheckCircle,
  Settings,
  Workflow,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AGENT_ROSTER } from "@/lib/ai-workforce";

interface AgentAutomationsPageProps {
  agentId: string;
  clientId: string;
}

interface AgentAutomation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  targetAgentId?: string;
  email?: string;
  is_active: boolean;
  runs_count?: number;
  last_run?: string;
}

// Mock current agent
const mockAgent = {
  id: "hired-1",
  name: "Sarah",
  role: "Content Writer",
  avatar: "👩‍💻",
};

// Available agents to send to
const receiverAgents = AGENT_ROSTER.filter(
  (a) => a.id !== "content-writer-sarah"
).slice(0, 8);

// Mock existing automations
const mockAutomations: AgentAutomation[] = [
  {
    id: "auto-1",
    name: "Blog to Social Posts",
    trigger: "deliverable",
    action: "send_to_agent",
    targetAgentId: "social-media-alex",
    is_active: true,
    runs_count: 8,
    last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const triggerOptions = [
  { value: "deliverable", label: "When deliverable is created", icon: FileText },
  { value: "task", label: "When task is completed", icon: CheckCircle },
  { value: "schedule", label: "On a schedule", icon: Clock },
];

const actionOptions = [
  { value: "send_to_agent", label: "Send to another agent", icon: Users },
  { value: "send_email", label: "Send email notification", icon: Mail },
  { value: "webhook", label: "Send to webhook", icon: Workflow },
];

export default function AgentAutomationsPage({ agentId, clientId }: AgentAutomationsPageProps) {
  const { toast } = useToast();
  const [automations, setAutomations] = useState(mockAutomations);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // New automation state
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("deliverable");
  const [action, setAction] = useState("send_to_agent");
  const [targetAgentId, setTargetAgentId] = useState("");
  const [email, setEmail] = useState("");

  const resetForm = () => {
    setName("");
    setTrigger("deliverable");
    setAction("send_to_agent");
    setTargetAgentId("");
    setEmail("");
  };

  const handleCreate = () => {
    if (!name) {
      toast({ title: "Please add a name", variant: "destructive" });
      return;
    }

    const automation: AgentAutomation = {
      id: `auto-${Date.now()}`,
      name,
      trigger,
      action,
      targetAgentId: action === "send_to_agent" ? targetAgentId : undefined,
      email: action === "send_email" ? email : undefined,
      is_active: true,
      runs_count: 0,
    };

    setAutomations([...automations, automation]);
    setShowCreateDialog(false);
    resetForm();
    toast({ title: "Automation created" });
  };

  const handleToggle = (id: string) => {
    setAutomations(
      automations.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
  };

  const handleDelete = (id: string) => {
    setAutomations(automations.filter((a) => a.id !== id));
    toast({ title: "Automation deleted" });
  };

  const getTargetAgentName = (agentId?: string) => {
    const agent = AGENT_ROSTER.find((a) => a.id === agentId);
    return agent?.name || "Unknown";
  };

  const getTargetAgentAvatar = (agentId?: string) => {
    const agent = AGENT_ROSTER.find((a) => a.id === agentId);
    return agent?.personality.avatar || "🤖";
  };

  const getTriggerLabel = (value: string) => {
    return triggerOptions.find((t) => t.value === value)?.label || value;
  };

  const getActionLabel = (value: string) => {
    return actionOptions.find((a) => a.value === value)?.label || value;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/portal/workforce/agent/${agentId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xl">
              {mockAgent.avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold">Automations</h1>
              <p className="text-sm text-muted-foreground">
                {mockAgent.name}'s workflow connections
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm">
                {mockAgent.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{mockAgent.name}</p>
                <p className="text-xs text-muted-foreground">Creates content</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Trigger</p>
                <p className="text-xs text-muted-foreground">Automation runs</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Action</p>
                <p className="text-xs text-muted-foreground">Next step happens</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-violet-600" />
            </div>
            <h3 className="font-semibold mb-1">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an automation to connect {mockAgent.name}'s work to other actions
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id} className={`transition-all ${automation.is_active ? "hover:shadow-sm hover:border-violet-200" : "opacity-60"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Flow visualization */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">
                      {mockAgent.avatar}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {automation.action === "send_to_agent" ? (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">
                        {getTargetAgentAvatar(automation.targetAgentId)}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{automation.name}</p>
                      <Badge variant={automation.is_active ? "default" : "secondary"} className="text-xs">
                        {automation.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTriggerLabel(automation.trigger)} → {" "}
                      {automation.action === "send_to_agent"
                        ? `Send to ${getTargetAgentName(automation.targetAgentId)}`
                        : automation.action === "send_email"
                        ? `Email ${automation.email}`
                        : getActionLabel(automation.action)}
                    </p>
                    {automation.runs_count !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {automation.runs_count} runs
                        {automation.last_run && ` • Last run: ${new Date(automation.last_run).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={() => handleToggle(automation.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Templates */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Quick Templates</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card
            className="cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all"
            onClick={() => {
              setName("Blog to Social Posts");
              setAction("send_to_agent");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium">Blog → Social Posts</p>
                  <p className="text-sm text-muted-foreground">
                    Auto-create social content from blog posts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all"
            onClick={() => {
              setName("Email Notification");
              setAction("send_email");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when content is created
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all"
            onClick={() => {
              setName("Content Review Chain");
              setAction("send_to_agent");
              setTrigger("deliverable");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Review Chain</p>
                  <p className="text-sm text-muted-foreground">
                    Send content for editing or review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all"
            onClick={() => {
              setName("SEO Optimization");
              setAction("send_to_agent");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">SEO Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Send to SEO agent for optimization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              Create Automation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Blog to Social Posts"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">When (Trigger)</label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Then (Action)</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {action === "send_to_agent" && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Target Agent</label>
                <Select value={targetAgentId} onValueChange={setTargetAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {receiverAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <span className="flex items-center gap-2">
                          <span>{agent.personality.avatar}</span>
                          <span>{agent.name}</span>
                          <span className="text-muted-foreground text-xs">({agent.role})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === "send_email" && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700">
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
