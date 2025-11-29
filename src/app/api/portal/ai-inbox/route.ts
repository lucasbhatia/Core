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

interface Step {
  id: number;
  name: string;
  description: string;
}

interface AIResponse {
  message: string;
  type: "text" | "automation_proposal" | "workflow_sequence" | "project_plan" | "suggestion";
  metadata?: {
    title?: string;
    steps?: Step[];
    automationId?: string;
    projectId?: string;
  };
}

// Parse AI response to extract structured data
function parseAIResponse(content: string, userMessage: string): AIResponse {
  const lowerMessage = userMessage.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Check for automation-related keywords in the response
  const isAutomationResponse =
    (lowerMessage.includes("automat") ||
     lowerMessage.includes("trigger") ||
     lowerMessage.includes("when")) &&
    (lowerContent.includes("step") ||
     lowerContent.includes("workflow") ||
     lowerContent.includes("automation"));

  // Check for project/plan-related response
  const isProjectResponse =
    (lowerMessage.includes("project") ||
     lowerMessage.includes("plan") ||
     lowerMessage.includes("organize") ||
     lowerMessage.includes("campaign")) &&
    (lowerContent.includes("phase") ||
     lowerContent.includes("step") ||
     lowerContent.includes("milestone"));

  // Check for workflow/process-related response
  const isWorkflowResponse =
    (lowerMessage.includes("workflow") ||
     lowerMessage.includes("process") ||
     lowerMessage.includes("report") ||
     lowerMessage.includes("data")) &&
    (lowerContent.includes("step") ||
     lowerContent.includes("stage"));

  // Try to extract steps from numbered lists in the content
  const stepPattern = /(?:^|\n)\s*(?:step\s*)?(\d+)[.):]\s*\*?\*?([^*\n]+)\*?\*?(?:\s*[-–—]\s*|\s*:\s*)?([^\n]+)?/gi;
  const matches = [...content.matchAll(stepPattern)];

  let steps: Step[] = [];

  if (matches.length >= 2) {
    steps = matches.slice(0, 6).map((match, index) => ({
      id: index + 1,
      name: match[2].trim().replace(/\*+/g, ''),
      description: match[3]?.trim().replace(/\*+/g, '') || `Execute ${match[2].trim()}`,
    }));
  }

  // Determine response type
  if (steps.length >= 2) {
    if (isAutomationResponse) {
      return {
        message: content,
        type: "automation_proposal",
        metadata: {
          title: "Automation Proposal",
          steps,
        },
      };
    } else if (isProjectResponse) {
      return {
        message: content,
        type: "project_plan",
        metadata: {
          title: "Project Plan",
          steps,
        },
      };
    } else if (isWorkflowResponse) {
      return {
        message: content,
        type: "workflow_sequence",
        metadata: {
          title: "Workflow Design",
          steps,
        },
      };
    }
  }

  return {
    message: content,
    type: "text",
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // Get client info and their automations for context
    const [clientResult, automationsResult] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("id", session.clientId)
        .single(),
      supabase
        .from("system_builds")
        .select("id, title, automation_status, automation_type, run_count, last_run_at")
        .eq("client_id", session.clientId)
        .neq("automation_status", "archived")
        .limit(10),
    ]);

    const client = clientResult.data;
    const automations = automationsResult.data || [];
    const activeAutomations = automations.filter(a => a.automation_status === "active").length;

    // Build system prompt optimized for Ask AI page
    const systemPrompt = `You are an AI assistant for ${client?.company || client?.name || "the client"}'s automation portal. Your primary role is to help users create automations, workflows, and project plans through natural language.

## Client Context
- Name: ${client?.name || "Client"}
- Company: ${client?.company || "N/A"}
- Current automations: ${automations.length} total (${activeAutomations} active)

## Your Capabilities
1. **Create Automations** - Design automation workflows based on user descriptions
2. **Build Project Plans** - Create structured project plans with phases and milestones
3. **Design Workflows** - Map out business processes and data flows
4. **Analyze & Report** - Help with data analysis and reporting needs
5. **Provide Suggestions** - Offer optimization ideas and best practices

## Response Guidelines
When helping with automations, workflows, or projects:
1. Always provide a clear, structured response
2. Break down complex tasks into numbered steps (use format: "1. **Step Name** - Description")
3. Be specific and actionable
4. Include 3-6 steps for most proposals
5. Explain the benefits of each step briefly

## Response Format Examples

For automation requests, structure like:
"I've designed an automation for you:

**Automation Overview**
[Brief description]

**Steps:**
1. **Trigger** - What starts the automation
2. **Process** - What data is collected/transformed
3. **Action** - What actions are performed
4. **Notify** - How users are informed

Would you like me to refine any of these steps?"

For project plans, structure like:
"Here's a project plan for your initiative:

**Project Structure**
[Brief overview]

**Phases:**
1. **Discovery** - Define requirements and goals
2. **Planning** - Create timeline and allocate resources
3. **Implementation** - Execute the core work
4. **Review** - Test and validate
5. **Launch** - Deploy and monitor

Should I expand on any phase?"

## Guidelines
- Be helpful, concise, and professional
- Use markdown for formatting (bold for emphasis, bullets for lists)
- If the request is unclear, ask 1-2 clarifying questions
- Always offer to refine or expand on your proposals
- Reference the client's existing automations when relevant`;

    // Build conversation messages (only include last 10 for context)
    const recentHistory = conversationHistory.slice(-10);
    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map((msg: { role: string; content: string }) => ({
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
    const aiMessage = textContent?.text || "I apologize, I couldn't generate a response. Please try again.";

    // Parse the response to determine type and extract metadata
    const parsedResponse = parseAIResponse(aiMessage, message);

    // Log the chat interaction (ignore errors if table doesn't exist)
    try {
      await supabase.from("portal_chat_logs").insert({
        client_id: session.clientId,
        user_message: message,
        ai_response: aiMessage,
        tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        context_type: "ai_inbox",
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
      message: parsedResponse.message,
      type: parsedResponse.type,
      metadata: parsedResponse.metadata,
      usage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    });
  } catch (error) {
    console.error("AI Inbox API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
