import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getAgentById,
  type ChatRequest,
  type WorkforceMessage,
  type WorkforceConversation,
} from "@/lib/ai-workforce";

const anthropic = new Anthropic();

// GET /api/portal/workforce/chat - Get conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");
    const conversationId = searchParams.get("conversation_id");

    // If conversation_id provided, get messages for that conversation
    if (conversationId) {
      const { data: messages } = await supabase
        .from("workforce_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        messages: messages || [],
      });
    }

    // Otherwise, get conversations for the agent
    let query = supabase
      .from("workforce_conversations")
      .select("*")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false });

    if (agentId) {
      query = query.eq("hired_agent_id", agentId);
    }

    const { data: conversations, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    return NextResponse.json({
      conversations: conversations || [],
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/portal/workforce/chat - Send a message to an agent
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Support both old format (hired_agent_id, message) and new format (agentId, userMessage, systemPrompt)
    const hired_agent_id = body.hired_agent_id;
    const conversation_id = body.conversation_id;
    const message = body.message || body.userMessage;
    const providedSystemPrompt = body.systemPrompt;
    const providedMessages = body.messages; // Full conversation history

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get roster agent for system prompt - try multiple ways
    const agentId = body.agentId || hired_agent_id;
    let rosterAgent = agentId ? getAgentById(agentId) : null;
    let hiredAgent = null;

    // Try to get hired agent from database
    if (hired_agent_id) {
      const { data } = await supabase
        .from("hired_agents")
        .select("*")
        .eq("id", hired_agent_id)
        .eq("client_id", clientId)
        .single();
      hiredAgent = data;
      if (hiredAgent && !rosterAgent) {
        rosterAgent = getAgentById(hiredAgent.roster_id);
      }
    }

    // Fallback to content writer if no agent found
    if (!rosterAgent) {
      rosterAgent = getAgentById("content-writer-sarah");
    }

    if (!rosterAgent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get or create conversation
    let currentConversationId = conversation_id;
    let conversationMessages: WorkforceMessage[] = [];

    if (currentConversationId) {
      // Get existing messages
      const { data: existingMessages } = await supabase
        .from("workforce_messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      conversationMessages = existingMessages || [];
    } else {
      // Create new conversation
      currentConversationId = `conv-${Date.now()}`;
      const conversation: Partial<WorkforceConversation> = {
        id: currentConversationId,
        hired_agent_id,
        client_id: clientId,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        is_active: true,
        message_count: 0,
        total_tokens: 0,
        context: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };

      try {
        await supabase.from("workforce_conversations").insert(conversation);
      } catch {
        // Table may not exist
      }
    }

    // Create user message
    const userMessage: WorkforceMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: currentConversationId,
      role: "user",
      content: message,
      tokens_used: Math.ceil(message.length / 4),
      created_at: new Date().toISOString(),
    };

    // Build conversation history for AI
    // Use provided messages if available, otherwise use DB messages
    const aiMessages: Anthropic.MessageParam[] = providedMessages
      ? providedMessages
          .filter((msg: { role: string }) => msg.role === "user" || msg.role === "assistant")
          .map((msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))
      : [
          // Include previous messages for context
          ...conversationMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          // Add new user message
          {
            role: "user" as const,
            content: message,
          },
        ];

    // Build personalized system prompt - use provided or build from roster
    const personalizedPrompt = providedSystemPrompt || `${rosterAgent.system_prompt}

Your name is ${rosterAgent.name} and you are a ${rosterAgent.role}.
Your communication style is ${rosterAgent.personality.communication_style}.
Your tagline is: "${rosterAgent.personality.tagline}"

${hiredAgent?.custom_instructions ? `Additional instructions from the user: ${hiredAgent.custom_instructions}` : ""}

Remember to stay in character and be helpful, professional, and on-brand.`;

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: rosterAgent.default_model || "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: rosterAgent.default_temperature || 0.7,
      system: personalizedPrompt,
      messages: aiMessages,
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

    // Create assistant message
    const assistantMessage: WorkforceMessage = {
      id: `msg-${Date.now() + 1}`,
      conversation_id: currentConversationId,
      role: "assistant",
      content: responseText,
      tokens_used: tokensUsed,
      created_at: new Date().toISOString(),
    };

    // Calculate credits used (approximately 1 credit per 100 tokens)
    const creditsUsed = Math.ceil(tokensUsed / 100);

    // Try to save messages to database and track usage
    try {
      await supabase.from("workforce_messages").insert([userMessage, assistantMessage]);

      // Update conversation
      await supabase
        .from("workforce_conversations")
        .update({
          message_count: conversationMessages.length + 2,
          total_tokens:
            conversationMessages.reduce((sum, m) => sum + m.tokens_used, 0) +
            userMessage.tokens_used +
            assistantMessage.tokens_used,
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", currentConversationId);

      // Update agent stats
      if (hiredAgent) {
        await supabase
          .from("hired_agents")
          .update({
            total_tokens_used: (hiredAgent.total_tokens_used || 0) + tokensUsed,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", hired_agent_id);
      }

      // Track usage for billing (credits)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: existingUsage } = await supabase
        .from("client_usage")
        .select("*")
        .eq("client_id", clientId)
        .eq("month", currentMonth)
        .single();

      if (existingUsage) {
        await supabase
          .from("client_usage")
          .update({
            ai_tokens_used: (existingUsage.ai_tokens_used || 0) + tokensUsed,
            ai_credits_used: (existingUsage.ai_credits_used || 0) + creditsUsed,
          })
          .eq("id", existingUsage.id);
      } else {
        await supabase.from("client_usage").insert({
          client_id: clientId,
          month: currentMonth,
          ai_tokens_used: tokensUsed,
          ai_credits_used: creditsUsed,
          automation_runs: 0,
          storage_used_mb: 0,
          api_calls: 0,
        });
      }
    } catch {
      // Database tables may not exist - still return response
    }

    return NextResponse.json({
      conversation_id: currentConversationId,
      user_message: userMessage,
      assistant_message: assistantMessage,
      content: responseText, // Direct content for simple frontend
      credits_used: creditsUsed,
      tokens_used: tokensUsed,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
