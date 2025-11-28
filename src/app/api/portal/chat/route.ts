import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get client session from cookie
async function getClientSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("portal_session");
  if (!sessionData?.value) return null;

  try {
    return JSON.parse(sessionData.value);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationHistory = [], context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // Get client info and their automations for context
    const [clientResult, automationsResult, deliverablesResult, runsResult] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("id", session.clientId)
        .single(),
      supabase
        .from("system_builds")
        .select("id, title, automation_status, automation_type, run_count, last_run_at, result")
        .eq("client_id", session.clientId)
        .neq("automation_status", "archived"),
      supabase
        .from("deliverables")
        .select("id, name, category, status, created_at")
        .eq("client_id", session.clientId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("automation_runs")
        .select("id, status, trigger_type, created_at, duration_ms, system_id")
        .eq("client_id", session.clientId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const client = clientResult.data;
    const automations = automationsResult.data || [];
    const deliverables = deliverablesResult.data || [];
    const recentRuns = runsResult.data || [];

    // Calculate stats for AI context
    const totalRuns = recentRuns.length;
    const successfulRuns = recentRuns.filter(r => r.status === "success").length;
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
    const activeAutomations = automations.filter(a => a.automation_status === "active").length;

    // Build system prompt with client context
    const systemPrompt = `You are an AI assistant for ${client?.company || client?.name || "the client"}'s automation portal. You help them understand and manage their automated systems.

## Client Context
- Name: ${client?.name || "Client"}
- Company: ${client?.company || "N/A"}
- Email: ${client?.email || "N/A"}

## Their Automations (${automations.length} total, ${activeAutomations} active)
${automations.map(a => `- "${a.title}" (${a.automation_status}) - ${a.run_count || 0} runs total`).join("\n") || "No automations yet"}

## Recent Deliverables (${deliverables.length})
${deliverables.slice(0, 5).map(d => `- ${d.name} (${d.category || "general"}) - ${d.status}`).join("\n") || "No deliverables yet"}

## Performance Stats
- Total runs (last 20): ${totalRuns}
- Success rate: ${successRate}%
- Active automations: ${activeAutomations}

## Your Capabilities
You can help with:
1. **Understanding automations** - Explain what each automation does, how it works
2. **Viewing results** - Summarize deliverables, reports, and outputs
3. **Troubleshooting** - Help diagnose failed runs or issues
4. **Suggestions** - Recommend new automations or improvements
5. **Reports** - Generate summaries of activity, performance, ROI
6. **General questions** - Answer questions about the platform

## Guidelines
- Be helpful, concise, and professional
- Reference specific automations and data when relevant
- If you don't have enough info, ask clarifying questions
- For actions you can't perform (like running automations), explain how the user can do it
- Use markdown formatting for better readability
- When discussing metrics, be specific with numbers

${context ? `## Additional Context\n${context}` : ""}`;

    // Build conversation messages
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    const aiMessage = textContent?.text || "I apologize, I couldn't generate a response.";

    // Log the chat interaction for analytics (ignore errors if table doesn't exist)
    try {
      await supabase.from("portal_chat_logs").insert({
        client_id: session.clientId,
        user_message: message,
        ai_response: aiMessage,
        tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        context_type: context?.type || "general",
      });
    } catch {
      // Table might not exist yet, ignore error
    }

    // Track usage (ignore errors if table doesn't exist)
    try {
      await supabase.from("client_usage").upsert({
        client_id: session.clientId,
        month: new Date().toISOString().slice(0, 7),
        ai_tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      }, {
        onConflict: "client_id,month",
      });
    } catch {
      // Table might not exist yet, ignore error
    }

    return NextResponse.json({
      message: aiMessage,
      usage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
