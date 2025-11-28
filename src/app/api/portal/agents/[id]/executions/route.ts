import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAgentExecutions, getExecutionById } from "@/lib/ai-agents/engine";

// GET /api/portal/agents/[id]/executions - Get execution history for an agent
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
    const executionId = searchParams.get("execution_id");
    const status = searchParams.get("status") as "success" | "failed" | "running" | undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (executionId) {
      // Get specific execution
      const execution = await getExecutionById(executionId, clientId);
      if (!execution) {
        return NextResponse.json({ error: "Execution not found" }, { status: 404 });
      }
      return NextResponse.json({ execution });
    }

    // Get execution history
    const executions = await getAgentExecutions(id, clientId, { status, limit, offset });

    return NextResponse.json({ executions });
  } catch (error) {
    console.error("Error fetching executions:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}
