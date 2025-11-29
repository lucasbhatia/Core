// AI Agents Type Definitions
// Types for deployed agents, executions, and conversations

import { AgentCategory, AgentCapability, AgentTemplate } from "./templates";

// ============================================
// AGENT INSTANCE TYPES
// ============================================

export type AgentStatus = "active" | "paused" | "error" | "draft";

export interface DeployedAgent {
  id: string;
  client_id: string;
  template_id: string | null; // null for custom agents
  name: string;
  description: string | null;
  icon: string;
  category: AgentCategory;
  capabilities: AgentCapability[];

  // Configuration
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;

  // Input/Output
  input_fields: AgentInputField[];
  output_format: "text" | "markdown" | "json" | "html";

  // Tools & Integrations
  tools: string[];
  integrations: AgentIntegration[];

  // Access & Permissions
  is_public: boolean; // Accessible via API
  api_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  allowed_users: string[]; // User IDs who can access

  // Status & Metrics
  status: AgentStatus;
  total_executions: number;
  total_tokens_used: number;
  avg_execution_time_ms: number | null;
  last_execution_at: string | null;
  error_count: number;
  last_error: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string | null;

  // Relations
  template?: AgentTemplate;
}

export interface AgentInputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "email" | "url" | "file" | "date" | "checkbox";
  placeholder?: string;
  required?: boolean;
  default_value?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface AgentIntegration {
  id: string;
  type: "webhook" | "api" | "database" | "email" | "slack" | "custom";
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

// ============================================
// AGENT EXECUTION TYPES
// ============================================

export type ExecutionStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type ExecutionTrigger = "manual" | "api" | "webhook" | "scheduled" | "chat";

export interface AgentExecution {
  id: string;
  agent_id: string;
  client_id: string;
  user_id: string | null;

  // Execution Details
  status: ExecutionStatus;
  trigger: ExecutionTrigger;

  // Input/Output
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  output_text: string | null;

  // Performance
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;

  // Token Usage
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  // Error Handling
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  retry_count: number;

  // Metadata
  metadata: {
    model?: string;
    temperature?: number;
    ip_address?: string;
    user_agent?: string;
    source?: string;
  };

  // Timestamps
  created_at: string;

  // Relations
  agent?: DeployedAgent;
}

// ============================================
// AGENT CONVERSATION TYPES (for chat agents)
// ============================================

export interface AgentConversation {
  id: string;
  agent_id: string;
  client_id: string;
  user_id: string | null;

  // Conversation State
  title: string | null;
  is_active: boolean;
  message_count: number;

  // Token Tracking
  total_tokens_used: number;

  // Context
  context: Record<string, unknown>; // Persistent context for the conversation

  // Timestamps
  created_at: string;
  updated_at: string;
  last_message_at: string | null;

  // Relations
  agent?: DeployedAgent;
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;

  // Message Content
  role: "user" | "assistant" | "system";
  content: string;

  // Attachments
  attachments: {
    type: "file" | "image" | "link";
    url: string;
    name: string;
  }[];

  // Token Usage
  tokens_used: number;

  // Metadata
  metadata: Record<string, unknown>;

  // Timestamps
  created_at: string;
}

// ============================================
// AGENT SCHEDULING TYPES
// ============================================

export interface AgentSchedule {
  id: string;
  agent_id: string;
  client_id: string;

  // Schedule Configuration
  name: string;
  description: string | null;
  cron_expression: string;
  timezone: string;

  // Input Data
  input_data: Record<string, unknown>;

  // Status
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  error_count: number;
  last_error: string | null;

  // Notifications
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notification_emails: string[];

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations
  agent?: DeployedAgent;
}

// ============================================
// AGENT USAGE & BILLING TYPES
// ============================================

export interface AgentUsage {
  id: string;
  client_id: string;
  month: string; // YYYY-MM format

  // Agent Metrics
  agents_created: number;
  agents_active: number;

  // Execution Metrics
  total_executions: number;
  successful_executions: number;
  failed_executions: number;

  // Token Metrics
  total_tokens_used: number;
  input_tokens_used: number;
  output_tokens_used: number;

  // Time Metrics
  total_execution_time_ms: number;
  avg_execution_time_ms: number | null;

  // Conversation Metrics
  conversations_started: number;
  messages_sent: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================
// API KEY & ACCESS TYPES
// ============================================

export interface AgentApiKey {
  id: string;
  client_id: string;
  agent_id: string | null; // null = access to all agents

  name: string;
  key_hash: string;
  key_prefix: string; // First 8 chars for identification

  // Permissions
  scopes: ("execute" | "read" | "write" | "admin")[];
  rate_limit: number; // requests per minute

  // Usage Tracking
  last_used_at: string | null;
  total_requests: number;

  // Status
  is_active: boolean;
  expires_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================
// AGENT WEBHOOK TYPES
// ============================================

export interface AgentWebhook {
  id: string;
  agent_id: string;
  client_id: string;

  // Configuration
  name: string;
  url: string;
  secret: string;

  // Events to trigger
  events: ("execution.started" | "execution.completed" | "execution.failed" | "conversation.message")[];

  // Status
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================
// FORM/REQUEST TYPES
// ============================================

export interface CreateAgentRequest {
  template_id?: string;
  name: string;
  description?: string;
  icon?: string;
  category: AgentCategory;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  input_fields: AgentInputField[];
  output_format?: "text" | "markdown" | "json" | "html";
  is_public?: boolean;
  api_enabled?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  icon?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  input_fields?: AgentInputField[];
  output_format?: "text" | "markdown" | "json" | "html";
  status?: AgentStatus;
  is_public?: boolean;
  api_enabled?: boolean;
}

export interface ExecuteAgentRequest {
  input_data: Record<string, unknown>;
  trigger?: ExecutionTrigger;
  metadata?: Record<string, unknown>;
}

export interface ChatWithAgentRequest {
  conversation_id?: string; // Existing conversation or new
  message: string;
  attachments?: {
    type: string; // MIME type (e.g., "image/png", "text/plain")
    name?: string;
    url?: string;
    data?: string; // Base64 encoded data for images
    content?: string; // Text content for non-image files
  }[];
  context?: Record<string, unknown>;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface AgentExecutionResult {
  execution_id: string;
  status: ExecutionStatus;
  output: string | null;
  structured_output: Record<string, unknown> | null;
  tokens_used: number;
  duration_ms: number | null;
  error?: string;
}

export interface AgentChatResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  tokens_used: number;
}

export interface AgentListResponse {
  agents: DeployedAgent[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// PLAN LIMITS TYPE
// ============================================

export interface AgentPlanLimits {
  max_agents: number; // -1 = unlimited
  max_executions_per_month: number;
  max_tokens_per_month: number;
  max_conversations: number;
  features: {
    api_access: boolean;
    webhooks: boolean;
    scheduled_runs: boolean;
    custom_agents: boolean;
    advanced_models: boolean;
    priority_support: boolean;
  };
}

export const AGENT_PLAN_LIMITS: Record<string, AgentPlanLimits> = {
  free: {
    max_agents: 1,
    max_executions_per_month: 50,
    max_tokens_per_month: 10000,
    max_conversations: 5,
    features: {
      api_access: false,
      webhooks: false,
      scheduled_runs: false,
      custom_agents: false,
      advanced_models: false,
      priority_support: false,
    },
  },
  starter: {
    max_agents: 5,
    max_executions_per_month: 500,
    max_tokens_per_month: 100000,
    max_conversations: 50,
    features: {
      api_access: true,
      webhooks: false,
      scheduled_runs: false,
      custom_agents: true,
      advanced_models: false,
      priority_support: false,
    },
  },
  pro: {
    max_agents: 25,
    max_executions_per_month: 5000,
    max_tokens_per_month: 500000,
    max_conversations: 500,
    features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
      priority_support: false,
    },
  },
  business: {
    max_agents: 100,
    max_executions_per_month: 25000,
    max_tokens_per_month: 2000000,
    max_conversations: 2500,
    features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
      priority_support: true,
    },
  },
  enterprise: {
    max_agents: -1,
    max_executions_per_month: -1,
    max_tokens_per_month: -1,
    max_conversations: -1,
    features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
      priority_support: true,
    },
  },
};

export function getAgentLimitsForPlan(plan: string): AgentPlanLimits {
  return AGENT_PLAN_LIMITS[plan] || AGENT_PLAN_LIMITS.free;
}

export function checkAgentLimit(
  usage: AgentUsage,
  limits: AgentPlanLimits,
  metric: "agents" | "executions" | "tokens" | "conversations"
): { allowed: boolean; current: number; limit: number; percentage: number } {
  let current: number;
  let limit: number;

  switch (metric) {
    case "agents":
      current = usage.agents_active;
      limit = limits.max_agents;
      break;
    case "executions":
      current = usage.total_executions;
      limit = limits.max_executions_per_month;
      break;
    case "tokens":
      current = usage.total_tokens_used;
      limit = limits.max_tokens_per_month;
      break;
    case "conversations":
      current = usage.conversations_started;
      limit = limits.max_conversations;
      break;
  }

  const allowed = limit === -1 || current < limit;
  const percentage = limit === -1 ? 0 : Math.round((current / limit) * 100);

  return { allowed, current, limit, percentage };
}
