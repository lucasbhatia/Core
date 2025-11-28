"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Play,
  Pause,
  Trash2,
  Settings,
  Users,
  Mail,
  Calendar,
  Bell,
  FileText,
  MessageSquare,
  Globe,
  Clock,
  CheckCircle,
  ChevronRight,
  Webhook,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AGENT_ROSTER, DEPARTMENT_INFO } from "@/lib/ai-workforce";

interface AgentAutomationsPageProps {
  agentId: string;
  clientId: string;
}

interface AgentAutomation {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  action: string;
  actionConfig: Record<string, unknown>;
  is_active: boolean;
  times_triggered: number;
  last_triggered_at: string | null;
}

// Mock current agent
const mockAgent = {
  id: "hired-1",
  name: "Sarah",
  role: "Content Writer",
  avatar: "👩‍💻",
};

// Available trigger types
const triggerTypes = [
  {
    id: "deliverable_created",
    name: "When deliverable is created",
    description: "Triggered every time this agent creates a new deliverable",
    icon: FileText,
  },
  {
    id: "task_completed",
    name: "When task is completed",
    description: "Triggered when a task is marked as complete",
    icon: CheckCircle,
  },
  {
    id: "scheduled",
    name: "On a schedule",
    description: "Run automatically at set times",
    icon: Calendar,
  },
];

// Available action types
const actionTypes = [
  {
    id: "send_to_agent",
    name: "Send to another agent",
    description: "Pass the output to another AI agent for further processing",
    icon: Users,
    color: "violet",
  },
  {
    id: "send_email",
    name: "Send email notification",
    description: "Email the deliverable or notification to recipients",
    icon: Mail,
    color: "blue",
  },
  {
    id: "webhook",
    name: "Call webhook",
    description: "Send data to an external service via webhook",
    icon: Webhook,
    color: "green",
  },
  {
    id: "schedule_post",
    name: "Schedule social post",
    description: "Queue content for social media posting",
    icon: Globe,
    color: "pink",
  },
  {
    id: "notify",
    name: "Send notification",
    description: "Send an in-app notification",
    icon: Bell,
    color: "orange",
  },
];

// Agents that can receive content
const receiverAgents = AGENT_ROSTER.filter(
  (a) => a.id !== "content-writer-sarah"
).slice(0, 8);

// Mock existing automations
const mockAutomations: AgentAutomation[] = [
  {
    id: "auto-1",
    name: "Blog to Social Posts",
    trigger: "deliverable_created",
    triggerConfig: { deliverable_type: "blog_post" },
    action: "send_to_agent",
    actionConfig: { target_agent_id: "social-media-alex" },
    is_active: true,
    times_triggered: 12,
    last_triggered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "auto-2",
    name: "Weekly Newsletter Email",
    trigger: "scheduled",
    triggerConfig: { schedule: "0 9 * * 1" },
    action: "send_email",
    actionConfig: { recipients: ["team@example.com"] },
    is_active: false,
    times_triggered: 8,
    last_triggered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function AgentAutomationsPage({ agentId, clientId }: AgentAutomationsPageProps) {
  const { toast } = useToast();
  const [automations, setAutomations] = useState(mockAutomations);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // New automation state
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    trigger: "",
    triggerConfig: {} as Record<string, string>,
    action: "",
    actionConfig: {} as Record<string, string>,
  });

  const handleCreateAutomation = () => {
    if (!newAutomation.name || !newAutomation.trigger || !newAutomation.action) {
      toast({
        title: "Missing fields",
        description: "Please complete all steps",
        variant: "destructive",
      });
      return;
    }

    const automation: AgentAutomation = {
      id: `auto-${Date.now()}`,
      name: newAutomation.name,
      trigger: newAutomation.trigger,
      triggerConfig: newAutomation.triggerConfig,
      action: newAutomation.action,
      actionConfig: newAutomation.actionConfig,
      is_active: true,
      times_triggered: 0,
      last_triggered_at: null,
    };

    setAutomations([...automations, automation]);
    setShowCreateDialog(false);
    setCreateStep(1);
    setNewAutomation({
      name: "",
      trigger: "",
      triggerConfig: {},
      action: "",
      actionConfig: {},
    });

    toast({
      title: "Automation created!",
      description: "Your automation is now active.",
    });
  };

  const handleToggleAutomation = (id: string) => {
    setAutomations(
      automations.map((a) =>
        a.id === id ? { ...a, is_active: !a.is_active } : a
      )
    );
  };

  const handleDeleteAutomation = (id: string) => {
    setAutomations(automations.filter((a) => a.id !== id));
    toast({ title: "Automation deleted" });
  };

  const getActionIcon = (actionId: string) => {
    const action = actionTypes.find((a) => a.id === actionId);
    return action?.icon || Zap;
  };

  const getTriggerIcon = (triggerId: string) => {
    const trigger = triggerTypes.find((t) => t.id === triggerId);
    return trigger?.icon || Zap;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/portal/workforce/agent/${agentId}`}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-violet-600" />
              Agent Automations
            </h1>
            <p className="text-muted-foreground">
              Create workflows that trigger when {mockAgent.name} completes work
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* How it works */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100">
        <CardContent className="py-6">
          <h3 className="font-semibold mb-4">How Agent Automations Work</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm">
                {mockAgent.avatar}
              </div>
              <div>
                <p className="font-medium text-sm">{mockAgent.name}</p>
                <p className="text-xs text-muted-foreground">Creates content</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Zap className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Automation</p>
                <p className="text-xs text-muted-foreground">Triggers action</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-violet-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Next Step</p>
                <p className="text-xs text-muted-foreground">Another agent, email, etc.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Automations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Automations</h2>

        {automations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No automations yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create your first automation to connect {mockAgent.name}'s work to other agents or actions.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => {
              const TriggerIcon = getTriggerIcon(automation.trigger);
              const ActionIcon = getActionIcon(automation.action);
              const targetAgent = automation.actionConfig.target_agent_id
                ? AGENT_ROSTER.find((a) => a.id === automation.actionConfig.target_agent_id)
                : null;

              return (
                <Card
                  key={automation.id}
                  className={`transition-all ${
                    automation.is_active
                      ? "hover:shadow-md hover:border-violet-200"
                      : "opacity-60"
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Flow visualization */}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                            <TriggerIcon className="w-5 h-5 text-violet-600" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <ActionIcon className="w-5 h-5 text-indigo-600" />
                          </div>
                          {targetAgent && (
                            <>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xl">
                                {targetAgent.personality.avatar}
                              </div>
                            </>
                          )}
                        </div>

                        <div>
                          <h3 className="font-medium">{automation.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {triggerTypes.find((t) => t.id === automation.trigger)?.name}
                            {" → "}
                            {actionTypes.find((a) => a.id === automation.action)?.name}
                            {targetAgent && ` (${targetAgent.name})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="font-medium">{automation.times_triggered} runs</p>
                          <p className="text-xs text-muted-foreground">
                            {automation.last_triggered_at
                              ? `Last: ${new Date(automation.last_triggered_at).toLocaleDateString()}`
                              : "Never triggered"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.is_active}
                            onCheckedChange={() => handleToggleAutomation(automation.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteAutomation(automation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Automations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Suggested Automations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed hover:border-violet-200 transition-colors cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium group-hover:text-violet-600 transition-colors">
                    Auto-Post to Social Media
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    When {mockAgent.name} creates content, automatically schedule it for social posting
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed hover:border-violet-200 transition-colors cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium group-hover:text-violet-600 transition-colors">
                    Email Weekly Summary
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly email with all content created by {mockAgent.name}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed hover:border-violet-200 transition-colors cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium group-hover:text-violet-600 transition-colors">
                    SEO Review Pipeline
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Send blog posts to SEO Specialist for optimization before publishing
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed hover:border-violet-200 transition-colors cursor-pointer group">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium group-hover:text-violet-600 transition-colors">
                    Scheduled Content Creation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Have {mockAgent.name} create content automatically on a schedule
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
            <DialogDescription>
              Step {createStep} of 3: {
                createStep === 1 ? "Choose trigger" :
                createStep === 2 ? "Choose action" :
                "Configure & name"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Step 1: Choose Trigger */}
            {createStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium mb-4">When should this automation run?</p>
                {triggerTypes.map((trigger) => {
                  const Icon = trigger.icon;
                  return (
                    <div
                      key={trigger.id}
                      onClick={() => {
                        setNewAutomation({ ...newAutomation, trigger: trigger.id });
                        setCreateStep(2);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-violet-300 hover:bg-violet-50 ${
                        newAutomation.trigger === trigger.id ? "border-violet-500 bg-violet-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{trigger.name}</h4>
                          <p className="text-sm text-muted-foreground">{trigger.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2: Choose Action */}
            {createStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-medium mb-4">What should happen?</p>
                {actionTypes.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      onClick={() => {
                        setNewAutomation({ ...newAutomation, action: action.id });
                        setCreateStep(3);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-violet-300 hover:bg-violet-50 ${
                        newAutomation.action === action.id ? "border-violet-500 bg-violet-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${action.color}-600`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{action.name}</h4>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Configure */}
            {createStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Automation Name</Label>
                  <Input
                    value={newAutomation.name}
                    onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                    placeholder="e.g., Blog to Social Posts"
                    className="mt-1"
                  />
                </div>

                {newAutomation.action === "send_to_agent" && (
                  <div>
                    <Label>Target Agent</Label>
                    <Select
                      value={newAutomation.actionConfig.target_agent_id || ""}
                      onValueChange={(v) =>
                        setNewAutomation({
                          ...newAutomation,
                          actionConfig: { ...newAutomation.actionConfig, target_agent_id: v },
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select agent to receive content" />
                      </SelectTrigger>
                      <SelectContent>
                        {receiverAgents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <span className="flex items-center gap-2">
                              <span>{agent.personality.avatar}</span>
                              <span>{agent.name}</span>
                              <span className="text-muted-foreground">- {agent.role}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newAutomation.action === "send_email" && (
                  <div>
                    <Label>Email Recipients</Label>
                    <Input
                      value={newAutomation.actionConfig.recipients || ""}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          actionConfig: { ...newAutomation.actionConfig, recipients: e.target.value },
                        })
                      }
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                )}

                {newAutomation.action === "webhook" && (
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={newAutomation.actionConfig.webhook_url || ""}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          actionConfig: { ...newAutomation.actionConfig, webhook_url: e.target.value },
                        })
                      }
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    When{" "}
                    <span className="font-medium text-gray-900">
                      {triggerTypes.find((t) => t.id === newAutomation.trigger)?.name.toLowerCase()}
                    </span>
                    , then{" "}
                    <span className="font-medium text-gray-900">
                      {actionTypes.find((a) => a.id === newAutomation.action)?.name.toLowerCase()}
                    </span>
                    {newAutomation.actionConfig.target_agent_id && (
                      <>
                        {" to "}
                        <span className="font-medium text-gray-900">
                          {AGENT_ROSTER.find((a) => a.id === newAutomation.actionConfig.target_agent_id)?.name}
                        </span>
                      </>
                    )}
                    .
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {createStep > 1 && (
              <Button variant="outline" onClick={() => setCreateStep(createStep - 1)}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setCreateStep(1);
              setNewAutomation({ name: "", trigger: "", triggerConfig: {}, action: "", actionConfig: {} });
            }}>
              Cancel
            </Button>
            {createStep === 3 && (
              <Button
                onClick={handleCreateAutomation}
                disabled={!newAutomation.name}
                className="bg-gradient-to-r from-violet-600 to-indigo-600"
              >
                Create Automation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
