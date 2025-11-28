import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { chatWithAgent, getConversations, getConversationMessages } from "@/lib/ai-agents/engine";

// GET /api/portal/agents/[id]/chat - Get conversations for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await getConversationMessages(conversationId, clientId, { limit, offset });
      return NextResponse.json({ messages });
    } else {
      // Get all conversations for the agent
      const conversations = await getConversations(id, clientId, { limit, offset });
      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/portal/agents/[id]/chat - Send a message to an agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, message, attachments, context } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await chatWithAgent(id, clientId, {
      conversation_id,
      message,
      attachments,
      context,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error chatting with agent:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to chat with agent";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
