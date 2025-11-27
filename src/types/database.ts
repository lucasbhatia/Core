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
  title: string;
  prompt: string;
  result: SystemBuildResult | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface SystemBuildResult {
  systemDiagram: string;
  workflowSteps: WorkflowStep[];
  agentArchitecture: AgentArchitecture;
  sopText: string;
  timeline: TimelineItem[];
  resources: Resource[];
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  tools: string[];
}

export interface AgentArchitecture {
  name: string;
  description: string;
  agents: Agent[];
  integrations: string[];
}

export interface Agent {
  name: string;
  role: string;
  capabilities: string[];
}

export interface TimelineItem {
  phase: string;
  duration: string;
  tasks: string[];
}

export interface Resource {
  name: string;
  type: string;
  description: string;
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
