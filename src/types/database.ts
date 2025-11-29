export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  notes: string | null;
  plan_tier?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  status: "active" | "paused" | "completed";
  deliverables: string | null;
  timeline: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface Audit {
  id: string;
  client_name: string;
  email: string;
  business_url: string | null;
  description: string | null;
  status: "new" | "in-progress" | "completed";
  created_at: string;
  updated_at: string;
}

export type AutomationStatus = "pending" | "active" | "paused" | "error" | "archived";
export type AutomationType = "webhook" | "scheduled" | "manual" | "api";

export interface AutomationConfig {
  // Webhook config
  externalWebhookUrl?: string;
  headers?: Record<string, string>;
  // Scheduled config
  schedule?: string; // cron expression
  timezone?: string;
  // General config
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeout?: number;
  // n8n/external integration
  n8nWorkflowId?: string;
  n8nWebhookUrl?: string;
}

export interface SystemBuild {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  prompt: string;
  result: SystemBuildResult | null;
  actions: SystemAction[];
  status: "pending" | "processing" | "completed" | "failed";
  // Automation fields
  automation_status: AutomationStatus;
  automation_type: AutomationType;
  automation_config: AutomationConfig;
  webhook_url: string | null;
  webhook_secret: string | null;
  last_run_at: string | null;
  run_count: number;
  error_count: number;
  last_error: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  project?: Project;
  client?: Client;
}

// Action-Based System Types
export type ActionType = "form" | "dashboard" | "trigger" | "ai_chat";

export interface ActionField {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "number" | "select" | "date";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface SystemAction {
  id: string;
  label: string;
  icon: string;
  type: ActionType;
  description: string;
  // For form actions
  fields?: ActionField[];
  // For AI processing
  aiPrompt?: string;
  // For dashboard actions
  dataSource?: string;
  // For trigger actions
  triggerAction?: string;
}

export interface SystemBuildResult {
  systemOverview: string;
  aiPrompts: AIPrompt[];
  automationWorkflow: AutomationWorkflow;
  codeSnippets: CodeSnippet[];
  emailTemplates: EmailTemplate[];
  apiConfig: APIConfig[];
  implementationChecklist: ChecklistItem[];
}

export interface AIPrompt {
  name: string;
  purpose: string;
  prompt: string;
  variables: string[];
  exampleOutput: string;
}

export interface AutomationWorkflow {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  connections: string[];
}

export interface WorkflowTrigger {
  type: string;
  config: string;
}

export interface WorkflowStep {
  id: number;
  name: string;
  type: string;
  action: string;
  config: string;
  nextStep?: number;
}

export interface CodeSnippet {
  name: string;
  language: string;
  description: string;
  code: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface APIConfig {
  name: string;
  endpoint: string;
  method: string;
  headers: string;
  body: string;
  description: string;
}

export interface ChecklistItem {
  id: number;
  task: string;
  details: string;
  category: string;
  completed?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "client" | "project" | "audit" | "system";
  action: string;
  title: string;
  timestamp: string;
}

// Client Portal Types
export type UserRole = "admin" | "client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export type ToolType = "ai_generator" | "workflow" | "form" | "dashboard";
export type OutputFormat = "text" | "markdown" | "json" | "html";

export interface InputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "email" | "url";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ClientTool {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  icon: string;
  tool_type: ToolType;
  system_prompt: string;
  input_fields: InputField[];
  output_format: OutputFormat;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ToolUsageLog {
  id: string;
  tool_id: string;
  user_id: string;
  client_id: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  tokens_used: number;
  execution_time_ms: number | null;
  status: "success" | "error" | "pending";
  error_message: string | null;
  created_at: string;
  tool?: ClientTool;
}

export interface ClientInvitation {
  id: string;
  client_id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  client?: Client;
}

// Client Portal Types (Action-Based)
export interface ClientAccessToken {
  id: string;
  client_id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  client?: Client;
}

export interface SystemData {
  id: string;
  system_id: string;
  client_id: string;
  action_id: string;
  data: Record<string, unknown>;
  ai_result: Record<string, unknown> | null;
  status: "active" | "processed" | "archived";
  created_at: string;
  updated_at: string;
  system?: SystemBuild;
}

export interface SystemActivity {
  id: string;
  system_id: string;
  client_id: string;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Automation Platform Types
export type RunStatus = "running" | "success" | "failed" | "cancelled";
export type TriggerType = "webhook" | "scheduled" | "manual" | "api";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AutomationRun {
  id: string;
  system_id: string;
  client_id: string | null;
  status: RunStatus;
  trigger_type: TriggerType;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
  system?: SystemBuild;
}

export interface AutomationLog {
  id: string;
  run_id: string;
  system_id: string;
  level: LogLevel;
  message: string;
  data: Record<string, unknown>;
  step_name: string | null;
  step_index: number | null;
  created_at: string;
}

export interface AutomationMetrics {
  id: string;
  system_id: string;
  client_id: string | null;
  metric_date: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  avg_duration_ms: number | null;
  min_duration_ms: number | null;
  max_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

// Billing & Subscription Types
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "paused";
export type TeamRole = "admin" | "member" | "viewer";
export type TeamMemberStatus = "pending" | "active" | "inactive" | "removed";
export type NotificationType =
  | "automation_success"
  | "automation_failed"
  | "automation_created"
  | "agent_task_complete"
  | "ai_action_complete"
  | "usage_warning"
  | "billing"
  | "team"
  | "system";
export type InvoiceStatus = "draft" | "open" | "pending" | "paid" | "void" | "uncollectible";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly?: number;
  automation_limit: number;
  runs_limit: number;
  ai_tokens_limit: number;
  storage_limit_mb: number;
  team_members_limit: number;
  features: string[];
  is_active: boolean;
  stripe_price_id?: string;
  stripe_price_id_yearly?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSubscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  client?: Client;
}

export interface ClientUsage {
  id: string;
  client_id: string;
  month: string;
  automation_runs: number;
  ai_tokens_used: number;
  storage_used_mb: number;
  api_calls: number;
  manual_runs: number;
  scheduled_runs: number;
  webhook_runs: number;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  client_id: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  description?: string;
  invoice_url?: string;
  invoice_pdf?: string;
  period_start?: string;
  period_end?: string;
  paid_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PortalChatLog {
  id: string;
  client_id: string;
  user_message: string;
  ai_response: string;
  tokens_used: number;
  context_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TeamMember {
  id: string;
  client_id: string;
  email: string;
  name?: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invite_token?: string;
  invite_expires_at?: string;
  accepted_at?: string;
  last_active_at?: string;
  permissions: {
    can_run_automations: boolean;
    can_view_analytics: boolean;
    can_view_billing: boolean;
    can_manage_team: boolean;
    can_create_automations: boolean;
  };
  invited_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  client_id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  read_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  client_id: string;
  user_id?: string;
  email_automation_success: boolean;
  email_automation_failed: boolean;
  email_usage_warnings: boolean;
  email_weekly_reports: boolean;
  email_billing_alerts: boolean;
  email_team_updates: boolean;
  email_marketing: boolean;
  push_enabled: boolean;
  push_automation_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  client_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  event_id?: string;
  payload: Record<string, unknown>;
  signature?: string;
  is_verified: boolean;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  created_at: string;
}

// ============================================
// CLIENT THEME CUSTOMIZATION
// ============================================

export interface ClientTheme {
  id: string;
  client_id: string;

  // Color Settings
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  text_muted_color: string;
  border_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;

  // Dark Mode Colors
  dark_background_color: string;
  dark_surface_color: string;
  dark_text_color: string;
  dark_text_muted_color: string;
  dark_border_color: string;

  // Branding
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  company_name?: string;

  // Typography
  font_family: string;
  heading_font_family: string;
  font_size_base: number;
  border_radius: number;

  // Layout Preferences
  sidebar_style: "default" | "compact" | "minimal";
  header_style: "default" | "minimal" | "branded";
  card_style: "default" | "bordered" | "elevated" | "flat";

  // Feature Toggles
  show_powered_by: boolean;
  custom_css?: string;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  client?: Client;
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  preview_image_url?: string;

  // Color Settings
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  text_muted_color: string;
  border_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;

  // Dark Mode Colors
  dark_background_color: string;
  dark_surface_color: string;
  dark_text_color: string;
  dark_text_muted_color: string;
  dark_border_color: string;

  // Settings
  font_family: string;
  border_radius: number;

  // Metadata
  is_default: boolean;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

// ============================================
// ADMIN ACTIVITY AUDIT LOG
// ============================================

export type AuditSeverity = "info" | "warning" | "critical";
export type AuditResourceType = "client" | "project" | "automation" | "settings" | "billing" | "team" | "integration" | "api_key" | "user";

export interface AdminAuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource_type: AuditResourceType;
  resource_id?: string;
  resource_name?: string;
  description?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  severity: AuditSeverity;
  created_at: string;
}

// ============================================
// SYSTEM HEALTH & MONITORING
// ============================================

export type HealthStatus = "healthy" | "degraded" | "down";

export interface SystemHealthCheck {
  id: string;
  service_name: string;
  status: HealthStatus;
  response_time_ms?: number;
  last_check_at: string;
  error_message?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  tags: Record<string, unknown>;
  recorded_at: string;
}

// ============================================
// INTEGRATION HUB
// ============================================

export type IntegrationType = "api" | "webhook" | "oauth" | "database";
export type IntegrationStatus = "active" | "inactive" | "error";
export type IntegrationProvider = "stripe" | "airtable" | "n8n" | "slack" | "zapier" | "hubspot" | "salesforce" | "google" | "custom";

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  description?: string;
  icon_url?: string;

  // Configuration
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;

  // Status
  status: IntegrationStatus;
  last_sync_at?: string;
  last_error?: string;
  error_count: number;

  // Usage
  total_calls: number;
  successful_calls: number;
  failed_calls: number;

  // Metadata
  is_global: boolean;
  client_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Relations
  client?: Client;
}

export type IntegrationLogDirection = "inbound" | "outbound";
export type IntegrationLogStatus = "success" | "failed" | "pending";

export interface IntegrationLog {
  id: string;
  integration_id: string;
  action: string;
  direction: IntegrationLogDirection;
  status: IntegrationLogStatus;
  request_data?: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  error_message?: string;
  duration_ms?: number;
  created_at: string;

  // Relations
  integration?: Integration;
}

// ============================================
// REPORTS & EXPORTS
// ============================================

export type ReportType = "analytics" | "billing" | "usage" | "performance" | "client" | "automation";
export type ScheduleType = "daily" | "weekly" | "monthly" | "quarterly";
export type ExportFormat = "pdf" | "csv" | "excel" | "json";
export type ExportStatus = "pending" | "processing" | "completed" | "failed";

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  report_type: ReportType;

  // Schedule
  schedule_type: ScheduleType;
  schedule_day?: number;
  schedule_time: string;
  timezone: string;

  // Configuration
  config: Record<string, unknown>;
  filters: Record<string, unknown>;
  format: ExportFormat;

  // Recipients
  recipients: string[];

  // Status
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  last_error?: string;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportExport {
  id: string;
  report_type: ReportType;
  name: string;
  description?: string;

  // Export Configuration
  format: ExportFormat;
  filters: Record<string, unknown>;

  // File Info
  file_url?: string;
  file_size_bytes?: number;
  row_count?: number;

  // Status
  status: ExportStatus;
  started_at?: string;
  completed_at?: string;
  error_message?: string;

  // Metadata
  created_by?: string;
  created_at: string;
}

// ============================================
// DASHBOARD METRICS CACHE
// ============================================

export interface DashboardMetricsCache {
  id: string;
  metric_type: string;
  metric_data: Record<string, unknown>;
  calculated_at: string;
  expires_at: string;
}

// ============================================
// API KEY USAGE
// ============================================

export interface ApiKeyUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;

  // Relations
  api_key?: ApiKey;
}

// ============================================
// AI AGENTS
// ============================================

export type AgentStatus = "active" | "paused" | "error" | "draft";
export type AgentCategory =
  | "sales"
  | "support"
  | "marketing"
  | "operations"
  | "development"
  | "hr"
  | "finance"
  | "legal"
  | "research"
  | "creative"
  | "data"
  | "custom";

export interface DeployedAgent {
  id: string;
  client_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  category: AgentCategory;
  capabilities: string[];
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  input_fields: AgentInputField[];
  output_format: "text" | "markdown" | "json" | "html";
  tools: string[];
  integrations: AgentIntegration[];
  is_public: boolean;
  api_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  allowed_users: string[];
  status: AgentStatus;
  total_executions: number;
  total_tokens_used: number;
  avg_execution_time_ms: number | null;
  last_execution_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  client?: Client;
}

export interface AgentInputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "email" | "url" | "file" | "date" | "checkbox";
  placeholder?: string;
  required?: boolean;
  default_value?: string;
  options?: { value: string; label: string }[];
}

export interface AgentIntegration {
  id: string;
  type: "webhook" | "api" | "database" | "email" | "slack" | "custom";
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
}

export type AgentExecutionStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type AgentExecutionTrigger = "manual" | "api" | "webhook" | "scheduled" | "chat";

export interface AgentExecution {
  id: string;
  agent_id: string;
  client_id: string;
  user_id: string | null;
  status: AgentExecutionStatus;
  trigger: AgentExecutionTrigger;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown> | null;
  output_text: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  agent?: DeployedAgent;
}

export interface AgentConversation {
  id: string;
  agent_id: string;
  client_id: string;
  user_id: string | null;
  title: string | null;
  is_active: boolean;
  message_count: number;
  total_tokens_used: number;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  agent?: DeployedAgent;
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: { type: "file" | "image" | "link"; url: string; name: string }[];
  tokens_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentUsage {
  id: string;
  client_id: string;
  month: string;
  agents_created: number;
  agents_active: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  total_tokens_used: number;
  input_tokens_used: number;
  output_tokens_used: number;
  total_execution_time_ms: number;
  avg_execution_time_ms: number | null;
  conversations_started: number;
  messages_sent: number;
  created_at: string;
  updated_at: string;
}

export interface AgentSchedule {
  id: string;
  agent_id: string;
  client_id: string;
  name: string;
  description: string | null;
  cron_expression: string;
  timezone: string;
  input_data: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  error_count: number;
  last_error: string | null;
  notify_on_success: boolean;
  notify_on_failure: boolean;
  notification_emails: string[];
  created_at: string;
  updated_at: string;
  agent?: DeployedAgent;
}

export interface AgentApiKey {
  id: string;
  client_id: string;
  agent_id: string | null;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: ("execute" | "read" | "write" | "admin")[];
  rate_limit: number;
  last_used_at: string | null;
  total_requests: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
