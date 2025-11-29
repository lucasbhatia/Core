"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AGENT_ROSTER, type HiredAgent } from "@/lib/ai-workforce";

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

// Storage keys
const HIRED_AGENTS_KEY = "hired_agents";
const AUTOMATIONS_KEY = (agentId: string) => `agent_automations_${agentId}`;

// Get hired agent from localStorage
function getHiredAgent(agentId: string): HiredAgent | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(HIRED_AGENTS_KEY);
  if (!stored) return null;
  try {
    const agents = JSON.parse(stored);
    const agent = agents.find((a: HiredAgent) => a.id === agentId);
    if (!agent) return null;
    return {
      ...agent,
      roster_agent: AGENT_ROSTER.find((a) => a.id === agent.roster_id) || agent.roster_agent,
    };
  } catch {
    return null;
  }
}

// Get automations from localStorage
function getStoredAutomations(agentId: string): AgentAutomation[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(AUTOMATIONS_KEY(agentId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save automations to localStorage
function saveAutomations(agentId: string, automations: AgentAutomation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTOMATIONS_KEY(agentId), JSON.stringify(automations));
}

const triggerOptions = [
  { value: "deliverable", label: "When output is created", icon: FileText },
  { value: "task", label: "When task completes", icon: CheckCircle },
  { value: "schedule", label: "On a schedule", icon: Clock },
];

const actionOptions = [
  { value: "send_to_agent", label: "Send to another agent", icon: Users },
  { value: "send_email", label: "Send email", icon: Mail },
];

export default function AgentAutomationsPage({ agentId, clientId }: AgentAutomationsPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<HiredAgent | null>(null);
  const [automations, setAutomations] = useState<AgentAutomation[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("deliverable");
  const [action, setAction] = useState("send_to_agent");
  const [targetAgentId, setTargetAgentId] = useState("");
  const [email, setEmail] = useState("");

  // Get other hired agents for chaining
  const [otherAgents, setOtherAgents] = useState<HiredAgent[]>([]);

  useEffect(() => {
    const loadedAgent = getHiredAgent(agentId);
    if (!loadedAgent) {
      router.push("/portal/workforce");
      return;
    }
    setAgent(loadedAgent);
    setAutomations(getStoredAutomations(agentId));

    // Get other hired agents
    const stored = localStorage.getItem(HIRED_AGENTS_KEY);
    if (stored) {
      const allAgents = JSON.parse(stored);
      const others = allAgents
        .filter((a: HiredAgent) => a.id !== agentId)
        .map((a: HiredAgent) => ({
          ...a,
          roster_agent: AGENT_ROSTER.find((r) => r.id === a.roster_id) || a.roster_agent,
        }));
      setOtherAgents(others);
    }

    setIsLoading(false);
  }, [agentId, router]);

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

    const updatedAutomations = [...automations, automation];
    setAutomations(updatedAutomations);
    saveAutomations(agentId, updatedAutomations);
    setShowCreateDialog(false);
    resetForm();
    toast({ title: "Automation created" });
  };

  const handleToggle = (id: string) => {
    const updatedAutomations = automations.map((a) =>
      a.id === id ? { ...a, is_active: !a.is_active } : a
    );
    setAutomations(updatedAutomations);
    saveAutomations(agentId, updatedAutomations);
  };

  const handleDelete = (id: string) => {
    const updatedAutomations = automations.filter((a) => a.id !== id);
    setAutomations(updatedAutomations);
    saveAutomations(agentId, updatedAutomations);
    toast({ title: "Automation deleted" });
  };

  const getTargetAgentName = (targetId?: string) => {
    const targetAgent = otherAgents.find((a) => a.id === targetId);
    return targetAgent?.roster_agent?.name || "Unknown";
  };

  const getTargetAgentAvatar = (targetId?: string) => {
    const targetAgent = otherAgents.find((a) => a.id === targetId);
    return targetAgent?.roster_agent?.personality?.avatar || "🤖";
  };

  const getTriggerLabel = (value: string) => {
    return triggerOptions.find((t) => t.value === value)?.label || value;
  };

  if (isLoading || !agent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

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
              {agent.roster_agent.personality.avatar}
            </div>
            <div>
              <h1 className="text-xl font-bold">Automations</h1>
              <p className="text-sm text-muted-foreground">
                {agent.roster_agent.name}'s workflows
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      {/* How it works - Simple */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm">
                {agent.roster_agent.personality.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{agent.roster_agent.name}</p>
                <p className="text-xs text-muted-foreground">Creates output</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Automation</p>
                <p className="text-xs text-muted-foreground">Triggers action</p>
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
              Chain {agent.roster_agent.name}'s work to other actions
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
                      {agent.roster_agent.personality.avatar}
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
                        {automation.is_active ? "Active" : "Off"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getTriggerLabel(automation.trigger)} → {" "}
                      {automation.action === "send_to_agent"
                        ? `Send to ${getTargetAgentName(automation.targetAgentId)}`
                        : `Email ${automation.email}`}
                    </p>
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

      {/* Create Dialog - Simple */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              New Automation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Send to Social Media"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">When</label>
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
              <label className="text-sm font-medium block mb-1.5">Then</label>
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
                <label className="text-sm font-medium block mb-1.5">Send to</label>
                {otherAgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                    Hire more agents to chain automations
                  </p>
                ) : (
                  <Select value={targetAgentId} onValueChange={setTargetAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherAgents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-2">
                            <span>{a.roster_agent?.personality?.avatar}</span>
                            <span>{a.roster_agent?.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {action === "send_email" && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Email</label>
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
