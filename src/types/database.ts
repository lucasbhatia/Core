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
