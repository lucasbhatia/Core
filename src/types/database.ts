export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  notes: string | null;
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

export interface SystemBuild {
  id: string;
  project_id: string | null;
  title: string;
  prompt: string;
  result: SystemBuildResult | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  project?: Project;
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
