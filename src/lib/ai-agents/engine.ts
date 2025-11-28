// AI Agents Execution Engine
// Core engine for running AI agents with tools, context, and integrations

import Anthropic from "@anthropic-ai/sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  DeployedAgent,
  AgentExecution,
  AgentExecutionResult,
  ExecuteAgentRequest,
  ExecutionStatus,
  AgentConversation,
  ConversationMessage,
  ChatWithAgentRequest,
  AgentChatResponse,
  AgentUsage,
  AgentPlanLimits,
  checkAgentLimit,
  getAgentLimitsForPlan,
} from "./types";
import { AgentTemplate, getTemplateById } from "./templates";

// ============================================
// INITIALIZATION
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "YOUR_ANTHROPIC_API_KEY_HERE") {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

// ============================================
// AGENT MANAGEMENT
// ============================================

export async function getAgentById(agentId: string): Promise<DeployedAgent | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("deployed_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error || !data) return null;
  return data as DeployedAgent;
}

export async function getClientAgents(
  clientId: string,
  options?: { status?: string; category?: string; limit?: number; offset?: number }
): Promise<{ agents: DeployedAgent[]; total: number }> {
  const supabase = getSupabase();

  let query = supabase
    .from("deployed_agents")
    .select("*", { count: "exact" })
    .eq("client_id", clientId);

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }

  query = query.order("created_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching agents:", error);
    return { agents: [], total: 0 };
  }

  return { agents: data as DeployedAgent[], total: count || 0 };
}

export async function createAgent(
  clientId: string,
  data: {
    template_id?: string;
    name: string;
    description?: string;
    icon?: string;
    category: string;
    system_prompt: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    input_fields?: Record<string, unknown>[];
    output_format?: string;
    is_public?: boolean;
    api_enabled?: boolean;
    created_by?: string;
  }
): Promise<{ agent: DeployedAgent | null; error: string | null }> {
  const supabase = getSupabase();

  // Check usage limits
  const usage = await getAgentUsage(clientId);
  const plan = await getClientPlan(clientId);
  const limits = getAgentLimitsForPlan(plan);

  const limitCheck = checkAgentLimit(usage, limits, "agents");
  if (!limitCheck.allowed) {
    return {
      agent: null,
      error: `Agent limit reached (${limitCheck.current}/${limitCheck.limit}). Please upgrade your plan.`,
    };
  }

  // Get template defaults if using a template
  let template: AgentTemplate | undefined;
  if (data.template_id) {
    template = getTemplateById(data.template_id);
  }

  const agentData = {
    client_id: clientId,
    template_id: data.template_id || null,
    name: data.name,
    description: data.description || template?.description || null,
    icon: data.icon || template?.icon || "Bot",
    category: data.category || template?.category || "custom",
    capabilities: template?.capabilities || ["chat"],
    system_prompt: data.system_prompt || template?.systemPrompt || "",
    model: data.model || "claude-sonnet-4-20250514",
    temperature: data.temperature ?? template?.temperature ?? 0.7,
    max_tokens: data.max_tokens ?? template?.maxTokens ?? 4096,
    input_fields: data.input_fields || template?.inputFields || [],
    output_format: data.output_format || template?.outputFormat || "markdown",
    tools: template?.suggestedTools || [],
    integrations: [],
    is_public: data.is_public ?? false,
    api_enabled: data.api_enabled ?? false,
    webhook_url: null,
    webhook_secret: null,
    allowed_users: [],
    status: "active" as const,
    total_executions: 0,
    total_tokens_used: 0,
    avg_execution_time_ms: null,
    last_execution_at: null,
    error_count: 0,
    last_error: null,
    created_by: data.created_by || null,
  };

  const { data: agent, error } = await supabase
    .from("deployed_agents")
    .insert(agentData)
    .select()
    .single();

  if (error) {
    console.error("Error creating agent:", error);
    return { agent: null, error: error.message };
  }

  // Update usage count
  await updateAgentUsage(clientId, { agents_created: 1, agents_active: 1 });

  return { agent: agent as DeployedAgent, error: null };
}

export async function updateAgent(
  agentId: string,
  clientId: string,
  updates: Partial<DeployedAgent>
): Promise<{ agent: DeployedAgent | null; error: string | null }> {
  const supabase = getSupabase();

  // Remove fields that shouldn't be updated
  const { id, client_id, created_at, created_by, ...allowedUpdates } = updates;

  const { data, error } = await supabase
    .from("deployed_agents")
    .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
    .eq("id", agentId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    return { agent: null, error: error.message };
  }

  return { agent: data as DeployedAgent, error: null };
}

export async function deleteAgent(agentId: string, clientId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("deployed_agents")
    .delete()
    .eq("id", agentId)
    .eq("client_id", clientId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update usage count
  await updateAgentUsage(clientId, { agents_active: -1 });

  return { success: true, error: null };
}

// ============================================
// AGENT EXECUTION
// ============================================

export async function executeAgent(
  agentId: string,
  clientId: string,
  request: ExecuteAgentRequest
): Promise<AgentExecutionResult> {
  const supabase = getSupabase();
  const startTime = Date.now();

  // Get agent
  const agent = await getAgentById(agentId);
  if (!agent) {
    return {
      execution_id: "",
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: null,
      error: "Agent not found",
    };
  }

  // Check if agent belongs to client
  if (agent.client_id !== clientId) {
    return {
      execution_id: "",
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: null,
      error: "Unauthorized",
    };
  }

  // Check agent status
  if (agent.status !== "active") {
    return {
      execution_id: "",
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: null,
      error: `Agent is ${agent.status}`,
    };
  }

  // Check usage limits
  const usage = await getAgentUsage(clientId);
  const plan = await getClientPlan(clientId);
  const limits = getAgentLimitsForPlan(plan);

  const execCheck = checkAgentLimit(usage, limits, "executions");
  if (!execCheck.allowed) {
    return {
      execution_id: "",
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: null,
      error: `Execution limit reached (${execCheck.current}/${execCheck.limit}). Please upgrade your plan.`,
    };
  }

  // Create execution record
  const executionData = {
    agent_id: agentId,
    client_id: clientId,
    user_id: null,
    status: "running" as ExecutionStatus,
    trigger: request.trigger || "manual",
    input_data: request.input_data,
    output_data: null,
    output_text: null,
    started_at: new Date().toISOString(),
    completed_at: null,
    duration_ms: null,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    error_message: null,
    error_details: null,
    retry_count: 0,
    metadata: request.metadata || {},
  };

  const { data: execution, error: execError } = await supabase
    .from("agent_executions")
    .insert(executionData)
    .select()
    .single();

  if (execError || !execution) {
    return {
      execution_id: "",
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: null,
      error: "Failed to create execution record",
    };
  }

  try {
    const client = getAnthropicClient();

    // Build user prompt from input data
    const userPrompt = buildUserPrompt(agent, request.input_data);

    // Execute with Anthropic
    const response = await client.messages.create({
      model: agent.model || "claude-sonnet-4-20250514",
      max_tokens: agent.max_tokens || 4096,
      system: agent.system_prompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const outputText = textContent?.text || "";

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const durationMs = Date.now() - startTime;

    // Try to parse structured output
    let structuredOutput: Record<string, unknown> | null = null;
    if (agent.output_format === "json") {
      try {
        const jsonMatch = outputText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          structuredOutput = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing the whole output as JSON
          structuredOutput = JSON.parse(outputText);
        }
      } catch {
        // Not valid JSON, that's okay
      }
    }

    // Update execution record
    await supabase
      .from("agent_executions")
      .update({
        status: "success",
        output_text: outputText,
        output_data: structuredOutput,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
      })
      .eq("id", execution.id);

    // Update agent metrics
    await updateAgentMetrics(agentId, {
      total_executions: 1,
      total_tokens_used: totalTokens,
      duration_ms: durationMs,
    });

    // Update usage
    await updateAgentUsage(clientId, {
      total_executions: 1,
      successful_executions: 1,
      total_tokens_used: totalTokens,
      input_tokens_used: inputTokens,
      output_tokens_used: outputTokens,
      total_execution_time_ms: durationMs,
    });

    return {
      execution_id: execution.id,
      status: "success",
      output: outputText,
      structured_output: structuredOutput,
      tokens_used: totalTokens,
      duration_ms: durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Execution failed";

    // Update execution record with error
    await supabase
      .from("agent_executions")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        error_message: errorMessage,
        error_details: { error: String(error) },
      })
      .eq("id", execution.id);

    // Update agent error count
    await supabase
      .from("deployed_agents")
      .update({
        error_count: agent.error_count + 1,
        last_error: errorMessage,
      })
      .eq("id", agentId);

    // Update usage
    await updateAgentUsage(clientId, {
      total_executions: 1,
      failed_executions: 1,
    });

    return {
      execution_id: execution.id,
      status: "failed",
      output: null,
      structured_output: null,
      tokens_used: 0,
      duration_ms: durationMs,
      error: errorMessage,
    };
  }
}

function buildUserPrompt(agent: DeployedAgent, inputData: Record<string, unknown>): string {
  const parts: string[] = [];

  // Add input fields data
  for (const field of agent.input_fields) {
    const value = inputData[field.name];
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`## ${field.label}\n${value}`);
    }
  }

  // If no structured input, use the raw input
  if (parts.length === 0 && Object.keys(inputData).length > 0) {
    parts.push(JSON.stringify(inputData, null, 2));
  }

  return parts.join("\n\n");
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================

export async function chatWithAgent(
  agentId: string,
  clientId: string,
  request: ChatWithAgentRequest
): Promise<AgentChatResponse> {
  const supabase = getSupabase();

  // Get agent
  const agent = await getAgentById(agentId);
  if (!agent || agent.client_id !== clientId || agent.status !== "active") {
    throw new Error("Agent not found or inactive");
  }

  // Check usage limits
  const usage = await getAgentUsage(clientId);
  const plan = await getClientPlan(clientId);
  const limits = getAgentLimitsForPlan(plan);

  if (!request.conversation_id) {
    const convCheck = checkAgentLimit(usage, limits, "conversations");
    if (!convCheck.allowed) {
      throw new Error(`Conversation limit reached (${convCheck.current}/${convCheck.limit}). Please upgrade your plan.`);
    }
  }

  // Get or create conversation
  let conversation: AgentConversation;
  if (request.conversation_id) {
    const { data: existingConv } = await supabase
      .from("agent_conversations")
      .select("*")
      .eq("id", request.conversation_id)
      .eq("client_id", clientId)
      .single();

    if (!existingConv) {
      throw new Error("Conversation not found");
    }
    conversation = existingConv as AgentConversation;
  } else {
    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("agent_conversations")
      .insert({
        agent_id: agentId,
        client_id: clientId,
        user_id: null,
        title: request.message.substring(0, 100),
        is_active: true,
        message_count: 0,
        total_tokens_used: 0,
        context: request.context || {},
      })
      .select()
      .single();

    if (error || !newConv) {
      throw new Error("Failed to create conversation");
    }
    conversation = newConv as AgentConversation;

    // Update usage
    await updateAgentUsage(clientId, { conversations_started: 1 });
  }

  // Get conversation history
  const { data: messages } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(20); // Last 20 messages for context

  // Build messages array for API
  const apiMessages: { role: "user" | "assistant"; content: string }[] = (messages || []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Add new user message
  apiMessages.push({ role: "user", content: request.message });

  // Save user message
  const { data: userMessage, error: userMsgError } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id: conversation.id,
      role: "user",
      content: request.message,
      attachments: request.attachments || [],
      tokens_used: 0,
      metadata: {},
    })
    .select()
    .single();

  if (userMsgError) {
    throw new Error("Failed to save message");
  }

  try {
    const client = getAnthropicClient();

    // Execute with Anthropic
    const response = await client.messages.create({
      model: agent.model || "claude-sonnet-4-20250514",
      max_tokens: agent.max_tokens || 4096,
      system: agent.system_prompt,
      messages: apiMessages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    const responseText = textContent?.text || "";
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Save assistant message
    const { data: assistantMessage } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: responseText,
        attachments: [],
        tokens_used: tokensUsed,
        metadata: {},
      })
      .select()
      .single();

    // Update conversation
    await supabase
      .from("agent_conversations")
      .update({
        message_count: conversation.message_count + 2,
        total_tokens_used: conversation.total_tokens_used + tokensUsed,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // Update usage
    await updateAgentUsage(clientId, {
      messages_sent: 2,
      total_tokens_used: tokensUsed,
    });

    return {
      conversation_id: conversation.id,
      message_id: assistantMessage?.id || "",
      response: responseText,
      tokens_used: tokensUsed,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Chat failed");
  }
}

export async function getConversations(
  agentId: string,
  clientId: string,
  options?: { limit?: number; offset?: number }
): Promise<AgentConversation[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("agent_conversations")
    .select("*")
    .eq("agent_id", agentId)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data } = await query;
  return (data || []) as AgentConversation[];
}

export async function getConversationMessages(
  conversationId: string,
  clientId: string,
  options?: { limit?: number; offset?: number }
): Promise<ConversationMessage[]> {
  const supabase = getSupabase();

  // Verify conversation belongs to client
  const { data: conv } = await supabase
    .from("agent_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("client_id", clientId)
    .single();

  if (!conv) {
    return [];
  }

  let query = supabase
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data || []) as ConversationMessage[];
}

// ============================================
// USAGE TRACKING
// ============================================

async function getAgentUsage(clientId: string): Promise<AgentUsage> {
  const supabase = getSupabase();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data } = await supabase
    .from("agent_usage")
    .select("*")
    .eq("client_id", clientId)
    .eq("month", currentMonth)
    .single();

  if (data) {
    return data as AgentUsage;
  }

  // Create new usage record for this month
  const newUsage: Partial<AgentUsage> = {
    client_id: clientId,
    month: currentMonth,
    agents_created: 0,
    agents_active: 0,
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    total_tokens_used: 0,
    input_tokens_used: 0,
    output_tokens_used: 0,
    total_execution_time_ms: 0,
    avg_execution_time_ms: null,
    conversations_started: 0,
    messages_sent: 0,
  };

  // Get current active agents count
  const { count } = await supabase
    .from("deployed_agents")
    .select("id", { count: "exact" })
    .eq("client_id", clientId)
    .eq("status", "active");

  newUsage.agents_active = count || 0;

  const { data: created, error } = await supabase
    .from("agent_usage")
    .insert(newUsage)
    .select()
    .single();

  if (error) {
    console.error("Failed to create usage record:", error);
    return newUsage as AgentUsage;
  }

  return created as AgentUsage;
}

async function updateAgentUsage(
  clientId: string,
  updates: {
    agents_created?: number;
    agents_active?: number;
    total_executions?: number;
    successful_executions?: number;
    failed_executions?: number;
    total_tokens_used?: number;
    input_tokens_used?: number;
    output_tokens_used?: number;
    total_execution_time_ms?: number;
    conversations_started?: number;
    messages_sent?: number;
  }
): Promise<void> {
  const supabase = getSupabase();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Ensure usage record exists
  await getAgentUsage(clientId);

  // Build increment updates
  const incrementFields: string[] = [];
  const values: unknown[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      incrementFields.push(`${key} = ${key} + $${values.length + 1}`);
      values.push(value);
    }
  });

  if (incrementFields.length > 0) {
    // Use RPC or direct SQL for atomic increments
    await supabase.rpc("increment_agent_usage", {
      p_client_id: clientId,
      p_month: currentMonth,
      ...updates,
    });
  }
}

async function getClientPlan(clientId: string): Promise<string> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("client_subscriptions")
    .select("plan_id, subscription_plans(name)")
    .eq("client_id", clientId)
    .eq("status", "active")
    .single();

  if (data?.subscription_plans) {
    return (data.subscription_plans as { name: string }).name.toLowerCase();
  }

  return "free";
}

async function updateAgentMetrics(
  agentId: string,
  updates: {
    total_executions?: number;
    total_tokens_used?: number;
    duration_ms?: number;
  }
): Promise<void> {
  const supabase = getSupabase();

  const { data: agent } = await supabase
    .from("deployed_agents")
    .select("total_executions, total_tokens_used, avg_execution_time_ms")
    .eq("id", agentId)
    .single();

  if (!agent) return;

  const newTotalExecutions = agent.total_executions + (updates.total_executions || 0);
  const newTotalTokens = agent.total_tokens_used + (updates.total_tokens_used || 0);

  // Calculate new average execution time
  let newAvgTime = agent.avg_execution_time_ms;
  if (updates.duration_ms) {
    if (agent.avg_execution_time_ms) {
      newAvgTime = Math.round(
        (agent.avg_execution_time_ms * agent.total_executions + updates.duration_ms) / newTotalExecutions
      );
    } else {
      newAvgTime = updates.duration_ms;
    }
  }

  await supabase
    .from("deployed_agents")
    .update({
      total_executions: newTotalExecutions,
      total_tokens_used: newTotalTokens,
      avg_execution_time_ms: newAvgTime,
      last_execution_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);
}

// ============================================
// EXECUTION HISTORY
// ============================================

export async function getAgentExecutions(
  agentId: string,
  clientId: string,
  options?: { status?: ExecutionStatus; limit?: number; offset?: number }
): Promise<AgentExecution[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("agent_executions")
    .select("*")
    .eq("agent_id", agentId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data } = await query;
  return (data || []) as AgentExecution[];
}

export async function getExecutionById(
  executionId: string,
  clientId: string
): Promise<AgentExecution | null> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("agent_executions")
    .select("*")
    .eq("id", executionId)
    .eq("client_id", clientId)
    .single();

  return data as AgentExecution | null;
}

// ============================================
// EXPORTS
// ============================================

export {
  getAgentUsage,
  getClientPlan,
};
