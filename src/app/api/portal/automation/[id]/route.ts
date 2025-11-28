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

async function getClientSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("portal_session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value);
    return session;
  } catch {
    return null;
  }
}

/**
 * GET /api/portal/automation/[id] - Get automation details for client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("system_builds")
      .select("*")
      .eq("id", id)
      .eq("client_id", session.clientId)
      .single();

    if (error) {
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
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Verify ownership
    const { data: existing } = await supabase
      .from("system_builds")
      .select("id, client_id")
      .eq("id", id)
      .eq("client_id", session.clientId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    // Archive (soft delete) - clients can't permanently delete
    const { data, error } = await supabase
      .from("system_builds")
      .update({
        automation_status: "archived",
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
