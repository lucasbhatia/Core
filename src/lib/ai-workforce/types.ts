// AI Workforce Types
// Marketplace-style AI agents that businesses can "hire"

// ============================================
// AGENT ROSTER TYPES (Available to Hire)
// ============================================

export type AgentDepartment =
  | "content"
  | "marketing"
  | "sales"
  | "operations"
  | "support"
  | "research"
  | "development"
  | "finance"
  | "hr";

export type AgentTier = "free" | "starter" | "pro" | "business" | "enterprise";

export interface AgentPersonality {
  name: string;
  avatar: string; // Emoji or icon
  tagline: string;
  communication_style: "formal" | "friendly" | "direct" | "creative";
  strengths: string[];
}

export interface AgentRosterItem {
  id: string;
  name: string;
  role: string;
  department: AgentDepartment;
  personality: AgentPersonality;
  description: string;
  capabilities: string[];
  best_for: string[];
  example_tasks: string[];
  output_types: string[];
  tier_required: AgentTier;
  is_popular: boolean;
  is_new: boolean;
  monthly_cost_credits: number; // 0 for free tier
  system_prompt: string;
  default_model: string;
  default_temperature: number;
  integrations: string[];
}

// ============================================
// HIRED AGENT TYPES
// ============================================

export type HiredAgentStatus = "active" | "paused" | "onboarding";

export interface HiredAgent {
  id: string;
  client_id: string;
  roster_id: string; // Links to AgentRosterItem
  roster_agent: AgentRosterItem;

  // Custom settings
  custom_name?: string; // Optional rename
  custom_instructions?: string; // Additional context

  // Status
  status: HiredAgentStatus;
  hired_at: string;
  last_active_at: string | null;

  // Stats
  tasks_completed: number;
  deliverables_created: number;
  total_tokens_used: number;
  avg_task_rating: number | null;

  // Preferences
  notification_enabled: boolean;
  auto_save_deliverables: boolean;
}

// ============================================
// TASK TYPES
// ============================================

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface AgentTask {
  id: string;
  hired_agent_id: string;
  client_id: string;

  // Task Details
  title: string;
  description: string;
  instructions: string;
  priority: TaskPriority;

  // Input
  input_data: Record<string, unknown>;
  attachments: TaskAttachment[];

  // Options
  options: TaskOptions;

  // Status
  status: TaskStatus;
  progress: number; // 0-100

  // Output
  deliverable_id: string | null;

  // Timing
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_seconds: number;
  actual_duration_seconds: number | null;

  // Usage
  tokens_used: number;

  // Error
  error_message: string | null;

  // Automation link
  triggered_by_automation_id: string | null;
  trigger_next_automation: boolean;
}

export interface TaskAttachment {
  id: string;
  type: "file" | "url" | "text" | "image";
  name: string;
  content: string; // URL or actual content
  mime_type?: string;
}

export interface TaskOptions {
  // Content options
  tone?: "professional" | "casual" | "friendly" | "formal" | "creative";
  length?: "short" | "medium" | "long" | "custom";
  custom_length?: number;
  format?: "text" | "markdown" | "html" | "json";

  // Language
  language?: string;

  // SEO
  include_seo?: boolean;
  keywords?: string[];

  // CTA
  include_cta?: boolean;
  cta_text?: string;
  cta_url?: string;

  // Style
  style_guide?: string;
  brand_voice?: string;

  // Custom
  custom_options?: Record<string, unknown>;
}

// ============================================
// DELIVERABLE TYPES
// ============================================

export type DeliverableType =
  | "blog_post"
  | "social_post"
  | "email"
  | "report"
  | "analysis"
  | "copy"
  | "script"
  | "outline"
  | "summary"
  | "response"
  | "code"
  | "document"
  | "other";

export type DeliverableStatus = "draft" | "ready" | "approved" | "published" | "archived";

export interface AgentDeliverable {
  id: string;
  task_id: string;
  hired_agent_id: string;
  client_id: string;

  // Content
  title: string;
  type: DeliverableType;
  content: string;
  content_html?: string;
  content_json?: Record<string, unknown>;

  // Metadata
  word_count: number;
  character_count: number;
  reading_time_minutes: number;

  // SEO data if applicable
  seo_data?: {
    title?: string;
    meta_description?: string;
    keywords?: string[];
    slug?: string;
  };

  // Status
  status: DeliverableStatus;

  // Rating/Feedback
  rating: number | null; // 1-5
  feedback: string | null;

  // Versioning
  version: number;
  previous_version_id: string | null;

  // Usage
  tokens_used: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  published_at: string | null;

  // Relations
  task?: AgentTask;
  hired_agent?: HiredAgent;
}

// ============================================
// AGENT CONVERSATION TYPES
// ============================================

export interface WorkforceConversation {
  id: string;
  hired_agent_id: string;
  client_id: string;

  title: string;
  is_active: boolean;
  message_count: number;
  total_tokens: number;

  // Context that persists across messages
  context: {
    current_task_id?: string;
    deliverable_in_progress?: string;
    user_preferences?: Record<string, unknown>;
  };

  created_at: string;
  updated_at: string;
  last_message_at: string | null;

  messages?: WorkforceMessage[];
}

export interface WorkforceMessage {
  id: string;
  conversation_id: string;

  role: "user" | "assistant" | "system";
  content: string;

  // If the agent created something
  deliverable_created_id?: string;
  task_created_id?: string;

  tokens_used: number;
  created_at: string;

  // Feedback
  reaction?: "thumbs_up" | "thumbs_down" | null;
}

// ============================================
// AGENT-AUTOMATION INTEGRATION
// ============================================

export interface AgentAutomationTrigger {
  id: string;
  client_id: string;

  // Trigger source
  source_type: "agent_deliverable" | "agent_task_complete" | "scheduled";
  source_agent_id: string;
  deliverable_type?: DeliverableType;

  // Action
  action_type: "notify" | "send_to_agent" | "webhook" | "email" | "schedule_post";
  target_agent_id?: string;

  // Configuration
  config: {
    // For send_to_agent
    task_template?: string;
    auto_start?: boolean;

    // For webhook
    webhook_url?: string;

    // For email
    email_recipients?: string[];
    email_template?: string;

    // For schedule_post
    platforms?: string[];
    schedule_time?: string;
    schedule_pattern?: string; // cron
  };

  is_active: boolean;

  // Stats
  times_triggered: number;
  last_triggered_at: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface HireAgentRequest {
  roster_id: string;
  custom_name?: string;
  custom_instructions?: string;
}

export interface CreateTaskRequest {
  hired_agent_id: string;
  title: string;
  description: string;
  instructions: string;
  priority?: TaskPriority;
  options?: TaskOptions;
  attachments?: Omit<TaskAttachment, "id">[];
  execute_immediately?: boolean;
  trigger_automation?: boolean;
}

export interface QuickTaskRequest {
  hired_agent_id: string;
  prompt: string; // Natural language request
  options?: TaskOptions;
}

export interface ChatRequest {
  hired_agent_id: string;
  conversation_id?: string;
  message: string;
  create_deliverable?: boolean;
}

// ============================================
// PLAN LIMITS
// ============================================

export interface WorkforcePlanLimits {
  max_hired_agents: number;
  max_tasks_per_month: number;
  max_tokens_per_month: number;
  max_deliverables_stored: number;
  features: {
    agent_automations: boolean;
    custom_instructions: boolean;
    priority_tasks: boolean;
    bulk_tasks: boolean;
    api_access: boolean;
    team_sharing: boolean;
  };
}

export const WORKFORCE_PLAN_LIMITS: Record<string, WorkforcePlanLimits> = {
  free: {
    max_hired_agents: 2,
    max_tasks_per_month: 20,
    max_tokens_per_month: 50000,
    max_deliverables_stored: 10,
    features: {
      agent_automations: false,
      custom_instructions: false,
      priority_tasks: false,
      bulk_tasks: false,
      api_access: false,
      team_sharing: false,
    },
  },
  starter: {
    max_hired_agents: 5,
    max_tasks_per_month: 100,
    max_tokens_per_month: 250000,
    max_deliverables_stored: 50,
    features: {
      agent_automations: false,
      custom_instructions: true,
      priority_tasks: false,
      bulk_tasks: false,
      api_access: false,
      team_sharing: false,
    },
  },
  pro: {
    max_hired_agents: 15,
    max_tasks_per_month: 500,
    max_tokens_per_month: 1000000,
    max_deliverables_stored: 500,
    features: {
      agent_automations: true,
      custom_instructions: true,
      priority_tasks: true,
      bulk_tasks: true,
      api_access: true,
      team_sharing: false,
    },
  },
  business: {
    max_hired_agents: 50,
    max_tasks_per_month: 2500,
    max_tokens_per_month: 5000000,
    max_deliverables_stored: 5000,
    features: {
      agent_automations: true,
      custom_instructions: true,
      priority_tasks: true,
      bulk_tasks: true,
      api_access: true,
      team_sharing: true,
    },
  },
  enterprise: {
    max_hired_agents: -1,
    max_tasks_per_month: -1,
    max_tokens_per_month: -1,
    max_deliverables_stored: -1,
    features: {
      agent_automations: true,
      custom_instructions: true,
      priority_tasks: true,
      bulk_tasks: true,
      api_access: true,
      team_sharing: true,
    },
  },
};

export function getWorkforceLimits(plan: string): WorkforcePlanLimits {
  return WORKFORCE_PLAN_LIMITS[plan] || WORKFORCE_PLAN_LIMITS.free;
}

// ============================================
// DEPARTMENT INFO
// ============================================

export const DEPARTMENT_INFO: Record<AgentDepartment, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  content: {
    label: "Content",
    description: "Writers, editors, and content strategists",
    icon: "📝",
    color: "violet",
  },
  marketing: {
    label: "Marketing",
    description: "Brand, social, and growth specialists",
    icon: "📣",
    color: "pink",
  },
  sales: {
    label: "Sales",
    description: "Lead gen, outreach, and closing experts",
    icon: "💼",
    color: "green",
  },
  operations: {
    label: "Operations",
    description: "Process, data, and efficiency experts",
    icon: "⚙️",
    color: "blue",
  },
  support: {
    label: "Support",
    description: "Customer success and service agents",
    icon: "🎧",
    color: "orange",
  },
  research: {
    label: "Research",
    description: "Analysts and market intelligence",
    icon: "🔬",
    color: "indigo",
  },
  development: {
    label: "Development",
    description: "Technical and product specialists",
    icon: "💻",
    color: "cyan",
  },
  finance: {
    label: "Finance",
    description: "Financial analysis and reporting",
    icon: "📊",
    color: "emerald",
  },
  hr: {
    label: "HR",
    description: "People and culture specialists",
    icon: "👥",
    color: "amber",
  },
};
