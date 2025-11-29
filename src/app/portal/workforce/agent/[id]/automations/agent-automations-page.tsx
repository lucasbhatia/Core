"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
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
).slice(0, 6);

// Mock existing automations
const mockAutomations: AgentAutomation[] = [
  {
    id: "auto-1",
    name: "Blog to Social Posts",
    trigger: "deliverable",
    action: "send_to_agent",
    targetAgentId: "social-media-alex",
    is_active: true,
  },
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
          <div>
            <h1 className="text-2xl font-bold">Automations</h1>
            <p className="text-muted-foreground">
              Connect {mockAgent.name}'s work to other actions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm">
              {mockAgent.avatar}
            </div>
            <span className="text-muted-foreground">creates content</span>
            <ArrowRight className="w-4 h-4 text-violet-400" />
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-muted-foreground">triggers action</span>
            <ArrowRight className="w-4 h-4 text-violet-400" />
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-muted-foreground">next step</span>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No automations yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create an automation to connect {mockAgent.name}'s work.
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
            <Card key={automation.id} className={automation.is_active ? "" : "opacity-50"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Flow visualization */}
                  <div className="flex items-center gap-2">
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
                  <div className="flex-1">
                    <p className="font-medium">{automation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      When deliverable created →{" "}
                      {automation.action === "send_to_agent"
                        ? `Send to ${getTargetAgentName(automation.targetAgentId)}`
                        : `Email ${automation.email}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={() => handleToggle(automation.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
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
            className="cursor-pointer hover:border-violet-200 transition-colors"
            onClick={() => {
              setName("Blog to Social Posts");
              setAction("send_to_agent");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium">Blog to Social Posts</p>
                  <p className="text-sm text-muted-foreground">
                    Send blog posts to another agent for social content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-violet-200 transition-colors"
            onClick={() => {
              setName("Email Notification");
              setAction("send_email");
              setShowCreateDialog(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    Get an email when content is created
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
            <DialogTitle>Create Automation</DialogTitle>
            <DialogDescription>
              Set up an action when {mockAgent.name} creates content
            </DialogDescription>
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
              <label className="text-sm font-medium block mb-1.5">When</label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliverable">Deliverable is created</SelectItem>
                  <SelectItem value="task">Task is completed</SelectItem>
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
                  <SelectItem value="send_to_agent">Send to another agent</SelectItem>
                  <SelectItem value="send_email">Send email notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "send_to_agent" && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Target Agent</label>
                <Select value={targetAgentId} onValueChange={setTargetAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {receiverAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <span className="flex items-center gap-2">
                          <span>{agent.personality.avatar}</span>
                          <span>{agent.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
