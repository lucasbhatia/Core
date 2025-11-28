import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * GET /api/portal/automation/[id] - Get automation details for client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Query from workflows table (the unified automation source)
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("client_id", clientId)
      .eq("is_automation", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, automation: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/automation/[id] - Archive automation (client can only archive, not delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Verify ownership in workflows table
    const { data: existing } = await supabase
      .from("workflows")
      .select("id, client_id")
      .eq("id", id)
      .eq("client_id", clientId)
      .eq("is_automation", true)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    // Archive (soft delete) - clients can't permanently delete
    const { data, error } = await supabase
      .from("workflows")
      .update({
        automation_status: "archived",
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Automation archived successfully",
      automation: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
