import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeAgent } from "@/lib/ai-agents/engine";

// POST /api/portal/agents/[id]/execute - Execute an agent
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
    const { input_data, trigger, metadata } = body;

    if (!input_data || typeof input_data !== "object") {
      return NextResponse.json(
        { error: "input_data is required and must be an object" },
        { status: 400 }
      );
    }

    const result = await executeAgent(id, clientId, {
      input_data,
      trigger: trigger || "manual",
      metadata,
    });

    if (result.status === "failed" && result.error) {
      return NextResponse.json(
        { error: result.error, execution_id: result.execution_id },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing agent:", error);
    return NextResponse.json(
      { error: "Failed to execute agent" },
      { status: 500 }
    );
  }
}
