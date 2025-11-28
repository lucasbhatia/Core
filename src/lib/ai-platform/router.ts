import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client lazily
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY_HERE") {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
}

export interface RequestClassification {
  requestType: string;
  priority: "low" | "normal" | "high" | "urgent";
  complexity: "simple" | "moderate" | "complex" | "enterprise";
  summary: string;
  requiredAgents: string[];
  estimatedMinutes: number;
  suggestedWorkflow: WorkflowStep[];
}

export interface WorkflowStep {
  stepIndex: number;
  agentType: string;
  taskName: string;
  description: string;
  instructions: string;
  dependsOn: number[];
  estimatedMinutes: number;
}

/**
 * AI Router - Classifies incoming requests and generates execution plans
 */
export async function classifyRequest(
  content: string,
  subject?: string,
  context?: {
    clientName?: string;
    clientIndustry?: string;
    previousRequests?: string[];
  }
): Promise<RequestClassification> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an AI request classifier and workflow planner for a business automation agency.

Your job is to:
1. Understand what the client is asking for
2. Classify the request type and priority
3. Determine which AI agents are needed
4. Create a step-by-step workflow to fulfill the request

Available agent types:
- writer: Content creation (blogs, emails, social posts, marketing copy)
- researcher: Research and analysis (market research, competitor analysis, data gathering)
- analyst: Data analysis and reporting (metrics, dashboards, insights)
- developer: Technical work (code, automations, integrations)
- strategist: Strategy development (marketing strategy, growth plans, business planning)
- support: Customer support (inquiries, issue resolution)
- manager: Project coordination (planning, tracking, updates)
- qc: Quality control (review, approval)
- delivery: Final delivery to client

Request types:
- marketing: Content, campaigns, social media, SEO
- sales: Lead generation, proposals, outreach
- support: Customer inquiries, issue resolution
- operations: Process improvement, automation
- development: Technical projects, code, integrations
- research: Market research, analysis, reports
- strategy: Planning, consulting, advisory
- creative: Design, branding, visual content

Always respond with valid JSON only.`;

  const userPrompt = `Classify this request and create a workflow:

${subject ? `Subject: ${subject}\n` : ""}
Request: ${content}

${context?.clientName ? `Client: ${context.clientName}` : ""}
${context?.clientIndustry ? `Industry: ${context.clientIndustry}` : ""}

Respond with this exact JSON structure:
{
  "requestType": "marketing|sales|support|operations|development|research|strategy|creative",
  "priority": "low|normal|high|urgent",
  "complexity": "simple|moderate|complex|enterprise",
  "summary": "Brief summary of what the client wants",
  "requiredAgents": ["agent_type1", "agent_type2"],
  "estimatedMinutes": 60,
  "suggestedWorkflow": [
    {
      "stepIndex": 0,
      "agentType": "researcher",
      "taskName": "Task name",
      "description": "What this step accomplishes",
      "instructions": "Detailed instructions for the agent",
      "dependsOn": [],
      "estimatedMinutes": 15
    }
  ]
}

The workflow should always end with a "qc" step for review and a "delivery" step for sending to client.
Create a realistic, thorough workflow that would actually deliver quality results.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.text || "";

  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse classification response");
  }

  const classification = JSON.parse(jsonMatch[0]) as RequestClassification;

  // Ensure QC and delivery steps exist
  const hasQc = classification.suggestedWorkflow.some(s => s.agentType === "qc");
  const hasDelivery = classification.suggestedWorkflow.some(s => s.agentType === "delivery");

  if (!hasQc) {
    const maxIndex = Math.max(...classification.suggestedWorkflow.map(s => s.stepIndex));
    classification.suggestedWorkflow.push({
      stepIndex: maxIndex + 1,
      agentType: "qc",
      taskName: "Quality Review",
      description: "Review all outputs for quality and accuracy",
      instructions: "Review all deliverables from previous steps. Check for errors, inconsistencies, and ensure brand guidelines are followed. Approve or request revisions.",
      dependsOn: [maxIndex],
      estimatedMinutes: 10,
    });
  }

  if (!hasDelivery) {
    const maxIndex = Math.max(...classification.suggestedWorkflow.map(s => s.stepIndex));
    classification.suggestedWorkflow.push({
      stepIndex: maxIndex + 1,
      agentType: "delivery",
      taskName: "Deliver to Client",
      description: "Package and deliver final outputs to client",
      instructions: "Compile all approved deliverables, write a summary, and send to the client via their preferred channel.",
      dependsOn: [maxIndex],
      estimatedMinutes: 5,
    });
  }

  return classification;
}

/**
 * Generate a detailed workflow from a high-level request
 */
export async function generateWorkflow(
  requestSummary: string,
  requiredAgents: string[],
  complexity: string
): Promise<WorkflowStep[]> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a workflow generator. Create detailed step-by-step workflows for business tasks.
Each step should have clear, actionable instructions that an AI agent can execute.
Always include quality control and delivery steps at the end.`,
    messages: [{
      role: "user",
      content: `Create a detailed workflow for:
${requestSummary}

Required agents: ${requiredAgents.join(", ")}
Complexity: ${complexity}

Return a JSON array of workflow steps with this structure:
[
  {
    "stepIndex": 0,
    "agentType": "agent_type",
    "taskName": "Task name",
    "description": "What this accomplishes",
    "instructions": "Detailed instructions",
    "dependsOn": [],
    "estimatedMinutes": 15
  }
]`
    }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const responseText = textContent?.text || "";

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse workflow response");
  }

  return JSON.parse(jsonMatch[0]) as WorkflowStep[];
}
