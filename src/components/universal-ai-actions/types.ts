// Universal AI Actions Types
// Types for the entity context that flows through Ask AI, Assign to Agent, and Automate

export type EntityType =
  | "task"
  | "project"
  | "calendar_event"
  | "deliverable"
  | "file"
  | "chat_message"
  | "automation"
  | "notification"
  | "agent"
  | "workflow_node";

export interface EntityContext {
  type: EntityType;
  id: string;
  title: string;
  description?: string;
  content?: string;
  metadata?: Record<string, unknown>;

  // Optional relations
  project_id?: string;
  project_name?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status?: string;
  priority?: string;
  tags?: string[];
}

// Ask AI action types
export type AskAIAction =
  | "explain"
  | "rewrite"
  | "summarize"
  | "expand"
  | "analyze"
  | "improve"
  | "translate"
  | "extract"
  | "format"
  | "custom";

export interface AskAIRequest {
  entity: EntityContext;
  action: AskAIAction;
  custom_prompt?: string;
  options?: {
    tone?: "professional" | "casual" | "friendly" | "formal" | "creative";
    length?: "short" | "medium" | "long";
    language?: string;
    format?: "text" | "markdown" | "json" | "html";
  };
}

export interface AskAIResponse {
  id: string;
  entity_id: string;
  action: AskAIAction;
  original_content: string;
  result: string;
  tokens_used: number;
  created_at: string;

  // Human review status
  review_status: "pending" | "approved" | "rejected" | "edited";
  reviewed_at?: string;
  edited_content?: string;
}

// Assign to Agent types
export interface AssignToAgentRequest {
  entity: EntityContext;
  agent_id: string;
  instructions: string;
  priority?: "low" | "normal" | "high" | "urgent";
  due_date?: string;
  options?: {
    notify_on_complete?: boolean;
    auto_approve?: boolean;
    chain_to_automation?: string;
  };
}

export interface AgentAssignment {
  id: string;
  entity: EntityContext;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  instructions: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  deliverable_id?: string;
  error_message?: string;
}

// Automate types
export type AutomationTriggerType =
  | "schedule"
  | "condition"
  | "event"
  | "webhook"
  | "manual";

export interface AutomateRequest {
  entity: EntityContext;
  trigger_type: AutomationTriggerType;
  name: string;
  description?: string;

  // Schedule config
  schedule?: {
    type: "once" | "daily" | "weekly" | "monthly" | "custom";
    time?: string;
    days?: number[];
    cron?: string;
  };

  // Condition config
  condition?: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater" | "less" | "changed";
    value: string;
  };

  // Event config
  event?: {
    source: "task" | "project" | "deliverable" | "agent" | "calendar";
    action: "created" | "updated" | "completed" | "deleted" | "assigned";
  };

  // Actions to perform
  actions: AutomationAction[];
}

export interface AutomationAction {
  type: "ask_ai" | "assign_agent" | "send_email" | "webhook" | "create_task" | "update_status" | "notify";
  config: Record<string, unknown>;
}

export interface CreatedAutomation {
  id: string;
  name: string;
  entity: EntityContext;
  trigger_type: AutomationTriggerType;
  is_active: boolean;
  run_count: number;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
}

// Callback types for parent components
export interface UniversalAIActionsCallbacks {
  onAskAI?: (request: AskAIRequest) => Promise<AskAIResponse>;
  onAssignToAgent?: (request: AssignToAgentRequest) => Promise<AgentAssignment>;
  onAutomate?: (request: AutomateRequest) => Promise<CreatedAutomation>;
  onSuccess?: (action: "ask_ai" | "assign_agent" | "automate", result: unknown) => void;
  onError?: (action: "ask_ai" | "assign_agent" | "automate", error: Error) => void;
}

// Component props
export interface UniversalAIActionsBarProps {
  entity: EntityContext;
  callbacks?: UniversalAIActionsCallbacks;
  variant?: "default" | "compact" | "icon-only";
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}
