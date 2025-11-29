"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  ArrowLeft,
  Users,
  UserPlus,
  Star,
  MessageSquare,
  MoreVertical,
  Play,
  Pause,
  Settings,
  Trash2,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AGENT_ROSTER,
  DEPARTMENT_INFO,
  type HiredAgent,
  type AgentDepartment,
} from "@/lib/ai-workforce";

interface TeamPageProps {
  clientId: string;
  clientPlan: string;
  companyName: string;
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
  {
    id: "hired-3",
    client_id: "demo",
    roster_id: "meeting-assistant-kai",
    roster_agent: AGENT_ROSTER.find((a) => a.id === "meeting-assistant-kai")!,
    status: "paused",
    hired_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    last_active_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    tasks_completed: 25,
    deliverables_created: 25,
    total_tokens_used: 18000,
    avg_task_rating: 4.9,
    notification_enabled: true,
    auto_save_deliverables: true,
  },
];

export default function TeamPage({ clientId, clientPlan, companyName }: TeamPageProps) {
  const { toast } = useToast();
  const [hiredAgents, setHiredAgents] = useState<HiredAgent[]>(mockHiredAgents);
  const [selectedAgent, setSelectedAgent] = useState<HiredAgent | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [customName, setCustomName] = useState("");

  const totalTasks = hiredAgents.reduce((sum, a) => sum + a.tasks_completed, 0);
  const totalDeliverables = hiredAgents.reduce((sum, a) => sum + a.deliverables_created, 0);
  const activeCount = hiredAgents.filter((a) => a.status === "active").length;

  // Group agents by department
  const agentsByDepartment = hiredAgents.reduce((acc, agent) => {
    const dept = agent.roster_agent.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(agent);
    return acc;
  }, {} as Record<AgentDepartment, HiredAgent[]>);

  function handleToggleStatus(agentId: string) {
    setHiredAgents(
      hiredAgents.map((h) =>
        h.id === agentId
          ? { ...h, status: h.status === "active" ? "paused" : "active" }
          : h
      )
    );
    const agent = hiredAgents.find((a) => a.id === agentId);
    toast({
      title: `${agent?.roster_agent.name} ${agent?.status === "active" ? "paused" : "activated"}`,
    });
  }

  function handleRemoveAgent(agentId: string) {
    const agent = hiredAgents.find((h) => h.id === agentId);
    setHiredAgents(hiredAgents.filter((h) => h.id !== agentId));
    setShowRemoveDialog(false);
    setSelectedAgent(null);
    toast({
      title: `${agent?.roster_agent.name} removed from team`,
    });
  }

  function handleSaveSettings() {
    if (selectedAgent) {
      setHiredAgents(
        hiredAgents.map((h) =>
          h.id === selectedAgent.id
            ? { ...h, custom_name: customName || undefined, custom_instructions: customInstructions || undefined }
            : h
        )
      );
      setShowSettingsDialog(false);
      toast({ title: "Settings saved" });
    }
  }

  function openSettingsDialog(agent: HiredAgent) {
    setSelectedAgent(agent);
    setCustomName(agent.custom_name || "");
    setCustomInstructions(agent.custom_instructions || "");
    setShowSettingsDialog(true);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal/workforce">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              {hiredAgents.length} agents • {activeCount} active
            </p>
          </div>
        </div>
        <Button asChild className="bg-violet-600 hover:bg-violet-700">
          <Link href="/portal/workforce">
            <UserPlus className="w-4 h-4 mr-2" />
            Hire More
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hiredAgents.length}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDeliverables}</p>
                <p className="text-sm text-muted-foreground">Deliverables</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      {Object.entries(agentsByDepartment).map(([dept, agents]) => (
        <div key={dept} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span>{DEPARTMENT_INFO[dept as AgentDepartment].icon}</span>
            {DEPARTMENT_INFO[dept as AgentDepartment].label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className={`group transition-all ${
                  agent.status === "paused" ? "opacity-60" : "hover:shadow-sm"
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
                      <h3 className="font-medium truncate">
                        {agent.custom_name || agent.roster_agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {agent.roster_agent.role}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        <DropdownMenuItem onClick={() => openSettingsDialog(agent)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowRemoveDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
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
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                      className="ml-auto text-xs"
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {hiredAgents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Hire AI agents to start building your team.
            </p>
            <Button asChild className="bg-violet-600 hover:bg-violet-700">
              <Link href="/portal/workforce">
                <UserPlus className="w-4 h-4 mr-2" />
                Browse Agents
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{selectedAgent.roster_agent.personality.avatar}</span>
                  Settings
                </DialogTitle>
                <DialogDescription>
                  Customize {selectedAgent.roster_agent.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Custom Name</label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedAgent.roster_agent.name}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">Custom Instructions</label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add specific instructions for this agent..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    These will be added to every task.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">Get notified when tasks complete</p>
                  </div>
                  <Switch defaultChecked={selectedAgent.notification_enabled} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings} className="bg-violet-600 hover:bg-violet-700">
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-sm">
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Remove Agent?
                </DialogTitle>
                <DialogDescription>
                  Remove {selectedAgent.roster_agent.name} from your team? You can hire them again later.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveAgent(selectedAgent.id)}
                >
                  Remove
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
