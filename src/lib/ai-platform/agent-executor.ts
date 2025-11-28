import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY_HERE") {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic({ apiKey });
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  agent_type: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
}

export interface TaskResult {
  success: boolean;
  output: string;
  structuredOutput?: Record<string, unknown>;
  tokensUsed: number;
  error?: string;
}

/**
 * Execute a single agent task
 */
export async function executeAgentTask(
  agent: Agent,
  taskInstructions: string,
  inputData: Record<string, unknown>,
  context?: {
    previousOutputs?: Record<string, unknown>[];
    clientInfo?: Record<string, unknown>;
    workflowContext?: string;
  }
): Promise<TaskResult> {
  const client = getAnthropicClient();

  // Build context from previous outputs
  let contextSection = "";
  if (context?.previousOutputs && context.previousOutputs.length > 0) {
    contextSection = `\n\n## Previous Work (use as reference):\n${context.previousOutputs
      .map((o, i) => `### Step ${i + 1}:\n${JSON.stringify(o, null, 2)}`)
      .join("\n\n")}`;
  }

  if (context?.clientInfo) {
    contextSection += `\n\n## Client Information:\n${JSON.stringify(context.clientInfo, null, 2)}`;
  }

  const userPrompt = `## Your Task
${taskInstructions}

## Input Data
${JSON.stringify(inputData, null, 2)}
${contextSection}

## Instructions
Complete the task thoroughly and professionally. Provide your output in a clear, structured format.
If creating content, make it high-quality and ready for use.
If analyzing data, provide actionable insights.
If reviewing work, be specific about any issues found.`;

  try {
    const response = await client.messages.create({
      model: agent.model || "claude-sonnet-4-20250514",
      max_tokens: agent.max_tokens || 4096,
      system: agent.system_prompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const output = textContent?.text || "";

    // Calculate tokens used
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Try to extract structured output if it looks like JSON
    let structuredOutput: Record<string, unknown> | undefined;
    try {
      const jsonMatch = output.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        structuredOutput = JSON.parse(jsonMatch[1]);
      }
    } catch {
      // Not JSON, that's fine
    }

    return {
      success: true,
      output,
      structuredOutput,
      tokensUsed,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      tokensUsed: 0,
      error: error instanceof Error ? error.message : "Agent execution failed",
    };
  }
}

/**
 * Get an agent by type from the database
 */
export async function getAgentByType(agentType: string): Promise<Agent | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("name", agentType)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Agent;
}

/**
 * Get all available agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data as Agent[];
}

/**
 * Specialized agent functions for common tasks
 */

export async function runWriterAgent(
  task: string,
  context: Record<string, unknown>
): Promise<TaskResult> {
  const agent = await getAgentByType("writer");
  if (!agent) {
    return { success: false, output: "", tokensUsed: 0, error: "Writer agent not found" };
  }
  return executeAgentTask(agent, task, context);
}

export async function runResearcherAgent(
  topic: string,
  context: Record<string, unknown>
): Promise<TaskResult> {
  const agent = await getAgentByType("researcher");
  if (!agent) {
    return { success: false, output: "", tokensUsed: 0, error: "Researcher agent not found" };
  }
  return executeAgentTask(agent, `Research the following topic thoroughly: ${topic}`, context);
}

export async function runAnalystAgent(
  data: Record<string, unknown>,
  analysisType: string
): Promise<TaskResult> {
  const agent = await getAgentByType("analyst");
  if (!agent) {
    return { success: false, output: "", tokensUsed: 0, error: "Analyst agent not found" };
  }
  return executeAgentTask(agent, `Analyze this data and provide ${analysisType} insights`, data);
}

export async function runQCAgent(
  content: string,
  deliverableType: string
): Promise<TaskResult> {
  const agent = await getAgentByType("qc");
  if (!agent) {
    return { success: false, output: "", tokensUsed: 0, error: "QC agent not found" };
  }
  return executeAgentTask(agent, `Review this ${deliverableType} for quality, accuracy, and professionalism`, { content });
}

export async function runDeliveryAgent(
  deliverables: Record<string, unknown>[],
  clientInfo: Record<string, unknown>
): Promise<TaskResult> {
  const agent = await getAgentByType("delivery");
  if (!agent) {
    return { success: false, output: "", tokensUsed: 0, error: "Delivery agent not found" };
  }
  return executeAgentTask(
    agent,
    "Prepare a professional delivery summary and package the deliverables for the client",
    { deliverables },
    { clientInfo }
  );
}
