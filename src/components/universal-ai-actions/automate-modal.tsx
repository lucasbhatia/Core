"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Clock,
  GitBranch,
  Webhook,
  Play,
  Loader2,
  Check,
  Plus,
  Trash2,
  Mail,
  Bell,
  Bot,
  Sparkles,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EntityContext,
  AutomateRequest,
  AutomationTriggerType,
  AutomationAction,
  CreatedAutomation,
} from "./types";

interface AutomateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: EntityContext;
  onSubmit: (request: AutomateRequest) => Promise<CreatedAutomation>;
}

const TRIGGER_TYPES: {
  id: AutomationTriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "schedule",
    label: "Schedule",
    description: "Run on a recurring schedule",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "condition",
    label: "Condition",
    description: "Run when a condition is met",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: "event",
    label: "Event",
    description: "Run when something happens",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "webhook",
    label: "Webhook",
    description: "Trigger via external API",
    icon: <Webhook className="h-4 w-4" />,
  },
  {
    id: "manual",
    label: "Manual",
    description: "Run on-demand with one click",
    icon: <Play className="h-4 w-4" />,
  },
];

const ACTION_TYPES: {
  type: AutomationAction["type"];
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "ask_ai", label: "Ask AI", icon: <Sparkles className="h-4 w-4" /> },
  { type: "assign_agent", label: "Assign to Agent", icon: <Bot className="h-4 w-4" /> },
  { type: "send_email", label: "Send Email", icon: <Mail className="h-4 w-4" /> },
  { type: "webhook", label: "Trigger Webhook", icon: <Webhook className="h-4 w-4" /> },
  { type: "create_task", label: "Create Task", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "notify", label: "Send Notification", icon: <Bell className="h-4 w-4" /> },
];

const SCHEDULE_TYPES = [
  { id: "once", label: "Once" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const EVENT_SOURCES = [
  { id: "task", label: "Task" },
  { id: "project", label: "Project" },
  { id: "deliverable", label: "Deliverable" },
  { id: "agent", label: "Agent" },
  { id: "calendar", label: "Calendar" },
];

const EVENT_ACTIONS = [
  { id: "created", label: "Created" },
  { id: "updated", label: "Updated" },
  { id: "completed", label: "Completed" },
  { id: "deleted", label: "Deleted" },
  { id: "assigned", label: "Assigned" },
];

export function AutomateModal({ open, onOpenChange, entity, onSubmit }: AutomateModalProps) {
  const [step, setStep] = useState<"trigger" | "configure" | "actions" | "result">("trigger");
  const [name, setName] = useState(`Automate: ${entity.title}`);
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<AutomationTriggerType | null>(null);

  // Schedule config
  const [scheduleType, setScheduleType] = useState<"once" | "daily" | "weekly" | "monthly">("daily");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri

  // Condition config
  const [conditionField, setConditionField] = useState("status");
  const [conditionOperator, setConditionOperator] = useState<"equals" | "not_equals" | "contains" | "changed">("equals");
  const [conditionValue, setConditionValue] = useState("");

  // Event config
  const [eventSource, setEventSource] = useState("task");
  const [eventAction, setEventAction] = useState("completed");

  // Actions
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [selectedActionType, setSelectedActionType] = useState<AutomationAction["type"] | null>(null);

  // Result
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreatedAutomation | null>(null);

  const handleSelectTrigger = (trigger: AutomationTriggerType) => {
    setTriggerType(trigger);
    setStep("configure");
  };

  const handleAddAction = () => {
    if (!selectedActionType) return;

    const newAction: AutomationAction = {
      type: selectedActionType,
      config: getDefaultActionConfig(selectedActionType),
    };
    setActions([...actions, newAction]);
    setSelectedActionType(null);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const getDefaultActionConfig = (type: AutomationAction["type"]): Record<string, unknown> => {
    switch (type) {
      case "ask_ai":
        return { action: "summarize", prompt: "" };
      case "assign_agent":
        return { agent_id: "", instructions: "" };
      case "send_email":
        return { to: "", subject: "", body: "" };
      case "webhook":
        return { url: "", method: "POST" };
      case "create_task":
        return { title: "", description: "" };
      case "notify":
        return { message: "", channels: ["in_app"] };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (!triggerType || actions.length === 0) return;

    setIsLoading(true);
    try {
      const request: AutomateRequest = {
        entity,
        trigger_type: triggerType,
        name,
        description,
        schedule: triggerType === "schedule" ? {
          type: scheduleType,
          time: scheduleTime,
          days: scheduleType === "weekly" ? scheduleDays : undefined,
        } : undefined,
        condition: triggerType === "condition" ? {
          field: conditionField,
          operator: conditionOperator,
          value: conditionValue,
        } : undefined,
        event: triggerType === "event" ? {
          source: eventSource as "task" | "project" | "deliverable" | "agent" | "calendar",
          action: eventAction as "created" | "updated" | "completed" | "deleted" | "assigned",
        } : undefined,
        actions,
      };

      const response = await onSubmit(request);
      setResult(response);
      setStep("result");
    } catch (error) {
      console.error("Automate error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTriggerType(null);
    setActions([]);
    setResult(null);
    setStep("trigger");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const canProceedToActions = () => {
    if (!triggerType) return false;
    if (triggerType === "condition" && !conditionValue) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Create Automation
          </DialogTitle>
          <DialogDescription>
            {step === "trigger" && "Choose how this automation should be triggered"}
            {step === "configure" && "Configure trigger settings"}
            {step === "actions" && "Add actions to run when triggered"}
            {step === "result" && "Automation created successfully"}
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
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {entity.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step: Select Trigger */}
        {step === "trigger" && (
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Give your automation a name"
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGER_TYPES.map((trigger) => (
                  <button
                    key={trigger.id}
                    onClick={() => handleSelectTrigger(trigger.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      "hover:border-amber-300 hover:bg-amber-50/50",
                      triggerType === trigger.id && "border-amber-500 bg-amber-50"
                    )}
                  >
                    <div className="p-2 rounded-md bg-amber-100 text-amber-600 shrink-0">
                      {trigger.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{trigger.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {trigger.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Configure Trigger */}
        {step === "configure" && triggerType && (
          <div className="space-y-4 flex-1">
            {/* Schedule Config */}
            {triggerType === "schedule" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as typeof scheduleType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_TYPES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>

                {scheduleType === "weekly" && (
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <div className="flex gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (scheduleDays.includes(i)) {
                              setScheduleDays(scheduleDays.filter((d) => d !== i));
                            } else {
                              setScheduleDays([...scheduleDays, i]);
                            }
                          }}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-medium transition-all",
                            scheduleDays.includes(i)
                              ? "bg-amber-500 text-white"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Condition Config */}
            {triggerType === "condition" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Select value={conditionField} onValueChange={setConditionField}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="assignee">Assignee</SelectItem>
                        <SelectItem value="due_date">Due Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select value={conditionOperator} onValueChange={(v) => setConditionOperator(v as typeof conditionOperator)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="changed">Changed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">When </span>
                  <span className="font-medium">{conditionField}</span>
                  <span className="text-muted-foreground"> {conditionOperator.replace("_", " ")} </span>
                  <span className="font-medium">{conditionValue || "..."}</span>
                </div>
              </div>
            )}

            {/* Event Config */}
            {triggerType === "event" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>When a</Label>
                    <Select value={eventSource} onValueChange={setEventSource}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_SOURCES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Is</Label>
                    <Select value={eventAction} onValueChange={setEventAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_ACTIONS.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">When a </span>
                  <span className="font-medium">{eventSource}</span>
                  <span className="text-muted-foreground"> is </span>
                  <span className="font-medium">{eventAction}</span>
                </div>
              </div>
            )}

            {/* Webhook Config */}
            {triggerType === "webhook" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Webhook URL</p>
                  <code className="text-xs bg-background p-2 rounded border block break-all">
                    https://api.yourapp.com/webhooks/automation/{"<id>"}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Send a POST request to this URL to trigger the automation
                  </p>
                </div>
              </div>
            )}

            {/* Manual Config */}
            {triggerType === "manual" && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  This automation will only run when you manually trigger it. Perfect for one-click actions you want to run on demand.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Actions */}
        {step === "actions" && (
          <div className="space-y-4 flex-1">
            {/* Current Actions */}
            <div className="space-y-2">
              <Label>Actions ({actions.length})</Label>
              {actions.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  No actions added yet. Add at least one action.
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action, index) => {
                    const actionInfo = ACTION_TYPES.find((a) => a.type === action.type);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="p-2 rounded-md bg-amber-100 text-amber-600">
                          {actionInfo?.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{actionInfo?.label}</p>
                          <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAction(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Action */}
            <div className="space-y-2">
              <Label>Add Action</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedActionType || ""}
                  onValueChange={(v) => setSelectedActionType(v as AutomationAction["type"])}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.type} value={action.type}>
                        <div className="flex items-center gap-2">
                          {action.icon}
                          {action.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleAddAction}
                  disabled={!selectedActionType}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Flow Preview */}
            {actions.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-800 mb-2">Automation Flow</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-white">
                    {TRIGGER_TYPES.find((t) => t.id === triggerType)?.label}
                  </Badge>
                  {actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-amber-600" />
                      <Badge variant="outline" className="bg-white">
                        {ACTION_TYPES.find((a) => a.type === action.type)?.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && result && (
          <div className="space-y-4 flex-1">
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-lg">Automation Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your automation is now active
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{result.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trigger</span>
                <Badge variant="outline" className="text-xs">
                  {TRIGGER_TYPES.find((t) => t.id === result.trigger_type)?.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="default" className="text-xs bg-green-600">
                  Active
                </Badge>
              </div>
              {result.next_run_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Run</span>
                  <span className="text-sm">
                    {new Date(result.next_run_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "trigger" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("trigger")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("actions")}
                disabled={!canProceedToActions()}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                Next: Add Actions
              </Button>
            </>
          )}

          {step === "actions" && (
            <>
              <Button variant="outline" onClick={() => setStep("configure")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || actions.length === 0}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Automation
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Create Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
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
