"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Search,
  Loader2,
  Check,
  ArrowRight,
  Calendar,
  AlertCircle,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EntityContext, AssignToAgentRequest, AgentAssignment } from "./types";
import { AGENT_ROSTER, AgentRosterItem, DEPARTMENT_INFO, AgentDepartment } from "@/lib/ai-workforce";

// Get hired agents from localStorage (same pattern as workforce page)
function getHiredAgents(): Array<{ roster_id: string; roster_agent: AgentRosterItem }> {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("hired_agents");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

interface AssignToAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: EntityContext;
  onSubmit: (request: AssignToAgentRequest) => Promise<AgentAssignment>;
}

export function AssignToAgentModal({
  open,
  onOpenChange,
  entity,
  onSubmit,
}: AssignToAgentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<AgentDepartment | "all">("all");
  const [selectedAgent, setSelectedAgent] = useState<AgentRosterItem | null>(null);
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [dueDate, setDueDate] = useState("");
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AgentAssignment | null>(null);
  const [step, setStep] = useState<"select" | "configure" | "result">("select");
  const [hiredAgents, setHiredAgents] = useState<Array<{ roster_id: string; roster_agent: AgentRosterItem }>>([]);

  useEffect(() => {
    setHiredAgents(getHiredAgents());
  }, [open]);

  // Get list of available agents (hired first, then available to hire)
  const availableAgents = useMemo(() => {
    const hiredIds = new Set(hiredAgents.map((h) => h.roster_id));
    const hired = hiredAgents.map((h) => ({ ...h.roster_agent, isHired: true }));
    const notHired = AGENT_ROSTER
      .filter((a: AgentRosterItem) => !hiredIds.has(a.id))
      .map((a: AgentRosterItem) => ({ ...a, isHired: false }));
    return [...hired, ...notHired];
  }, [hiredAgents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return availableAgents.filter((agent: AgentRosterItem & { isHired: boolean }) => {
      const matchesSearch =
        !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.capabilities.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDepartment =
        selectedDepartment === "all" || agent.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [availableAgents, searchQuery, selectedDepartment]);

  // Generate default instructions based on entity and selected agent
  const generateDefaultInstructions = (agent: AgentRosterItem) => {
    const entityDescription = entity.description || entity.title;
    const templates: Record<string, string> = {
      task: `Please help me complete this task: "${entity.title}"\n\nDetails: ${entityDescription}`,
      project: `Please assist with this project: "${entity.title}"\n\nContext: ${entityDescription}`,
      deliverable: `Please review and improve this deliverable: "${entity.title}"`,
      calendar_event: `Please help prepare for this event: "${entity.title}"`,
      file: `Please analyze this file: "${entity.title}"`,
      chat_message: `Please respond to or process this message: "${entityDescription}"`,
      automation: `Please help optimize this automation: "${entity.title}"`,
    };
    return templates[entity.type] || `Please work on: "${entity.title}"`;
  };

  const handleSelectAgent = (agent: AgentRosterItem & { isHired: boolean }) => {
    setSelectedAgent(agent);
    setInstructions(generateDefaultInstructions(agent));
    setStep("configure");
  };

  const handleSubmit = async () => {
    if (!selectedAgent) return;

    setIsLoading(true);
    try {
      const request: AssignToAgentRequest = {
        entity,
        agent_id: selectedAgent.id,
        instructions,
        priority,
        due_date: dueDate || undefined,
        options: {
          notify_on_complete: notifyOnComplete,
          auto_approve: autoApprove,
        },
      };

      const response = await onSubmit(request);
      setResult(response);
      setStep("result");
    } catch (error) {
      console.error("Assign to agent error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedAgent(null);
    setInstructions("");
    setResult(null);
    setStep("select");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const departments = Object.entries(DEPARTMENT_INFO) as [AgentDepartment, typeof DEPARTMENT_INFO[AgentDepartment]][];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            Assign to Agent
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose an AI agent to work on this item"}
            {step === "configure" && `Configure the task for ${selectedAgent?.name}`}
            {step === "result" && "Task assigned successfully"}
          </DialogDescription>
        </DialogHeader>

        {/* Entity Context Preview */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs shrink-0">
              {entity.type.replace("_", " ")}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{entity.title}</p>
              {entity.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {entity.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step: Select Agent */}
        {step === "select" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedDepartment}
                onValueChange={(v) => setSelectedDepartment(v as AgentDepartment | "all")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {departments.map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.icon} {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 pb-2">
                {/* Hired Agents Section */}
                {hiredAgents.length > 0 && selectedDepartment === "all" && !searchQuery && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Your Hired Agents
                    </p>
                    <div className="space-y-2">
                      {filteredAgents
                        .filter((a) => (a as AgentRosterItem & { isHired: boolean }).isHired)
                        .map((agent) => (
                          <AgentCard
                            key={agent.id}
                            agent={agent as AgentRosterItem & { isHired: boolean }}
                            onSelect={() => handleSelectAgent(agent as AgentRosterItem & { isHired: boolean })}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* All/Filtered Agents */}
                <div className="space-y-2">
                  {selectedDepartment === "all" && !searchQuery && hiredAgents.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Available to Hire
                    </p>
                  )}
                  {filteredAgents
                    .filter((a) => !(a as AgentRosterItem & { isHired: boolean }).isHired || searchQuery || selectedDepartment !== "all")
                    .slice(0, 10)
                    .map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent as AgentRosterItem & { isHired: boolean }}
                        onSelect={() => handleSelectAgent(agent as AgentRosterItem & { isHired: boolean })}
                      />
                    ))}
                </div>

                {filteredAgents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No agents found matching your criteria</p>
                  </div>
                )}

                {filteredAgents.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    Showing 10 of {filteredAgents.length} agents. Use search to find more.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && selectedAgent && (
          <div className="space-y-4 flex-1">
            {/* Selected Agent Preview */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl">{selectedAgent.personality.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{selectedAgent.name}</p>
                <p className="text-xs text-muted-foreground">{selectedAgent.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("select")}>
                Change
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Instructions for {selectedAgent.name}</Label>
              <Textarea
                placeholder="What would you like this agent to do?"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Be specific about the expected output and any constraints.
              </p>
            </div>

            {/* Priority and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notify on completion</p>
                  <p className="text-xs text-muted-foreground">Get notified when the agent finishes</p>
                </div>
                <Switch checked={notifyOnComplete} onCheckedChange={setNotifyOnComplete} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-approve output</p>
                  <p className="text-xs text-muted-foreground">
                    Skip review and publish immediately
                  </p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>

              {autoApprove && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Auto-approve will publish the output without your review. Use with caution.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && result && (
          <div className="space-y-4 flex-1">
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-lg">Task Assigned!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {result.agent_name} is working on your request
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={result.status === "queued" ? "secondary" : "default"}
                  className="text-xs"
                >
                  {result.status === "queued" && "Queued"}
                  {result.status === "in_progress" && "In Progress"}
                  {result.status === "completed" && "Completed"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <span className="text-sm font-medium capitalize">{result.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <span className="text-sm">
                  {new Date(result.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "select" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !instructions.trim()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Assign Task
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Assign Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Agent Card Component
function AgentCard({
  agent,
  onSelect,
}: {
  agent: AgentRosterItem & { isHired: boolean };
  onSelect: () => void;
}) {
  const deptInfo = DEPARTMENT_INFO[agent.department];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
        "hover:border-blue-300 hover:bg-blue-50/50",
        agent.isHired && "border-blue-200 bg-blue-50/30"
      )}
    >
      <div className="text-2xl shrink-0">{agent.personality.avatar}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{agent.name}</span>
          {agent.isHired && (
            <Badge variant="secondary" className="text-xs h-4">
              Hired
            </Badge>
          )}
          {agent.is_popular && (
            <Badge variant="outline" className="text-xs h-4 border-amber-300 text-amber-700">
              Popular
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{agent.role}</p>
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="outline" className="text-xs h-4 px-1">
            {deptInfo.icon} {deptInfo.label}
          </Badge>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}
