import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAndProcessRequest } from "@/lib/ai-platform/workflow-engine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * POST /api/intake - Universal request intake endpoint
 *
 * Accepts requests from:
 * - Dashboard (direct)
 * - Email webhooks (Zapier, Make, etc.)
 * - Forms
 * - API integrations
 * - Slack
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      content,
      subject,
      source = "api",
      sourceId,
      clientId,
      clientEmail,
      attachments = [],
      metadata = {},
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // If clientEmail provided but no clientId, try to find or create client
    let resolvedClientId = clientId;
    if (clientEmail && !clientId) {
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", clientEmail)
        .single();

      if (existingClient) {
        resolvedClientId = existingClient.id;
      }
    }

    // Create and process the request
    const { requestId, workflowId } = await createAndProcessRequest(content, {
      clientId: resolvedClientId,
      source,
      subject,
      attachments,
    });

    return NextResponse.json({
      success: true,
      requestId,
      workflowId,
      message: "Request received and processing started",
    });
  } catch (error) {
    console.error("Intake error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intake/:id - Get request status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: requestData, error } = await supabase
      .from("requests")
      .select(`
        *,
        workflows(
          *,
          agent_tasks(*),
          deliverables(*)
        )
      `)
      .eq("id", requestId)
      .single();

    if (error || !requestData) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(requestData);
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json(
      { error: "Failed to get request" },
      { status: 500 }
    );
  }
}
