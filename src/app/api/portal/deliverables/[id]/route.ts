import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * GET /api/portal/deliverables/[id] - Get single deliverable
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("deliverables")
      .select(`
        *,
        workflow:workflows(id, name, status, created_at),
        task:agent_tasks(name, description, agents(name, agent_type))
      `)
      .eq("id", id)
      .eq("client_id", clientId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Portal deliverable GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliverable" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portal/deliverables/[id] - Update deliverable (rename, categorize, archive)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .from("deliverables")
      .select("id")
      .eq("id", id)
      .eq("client_id", clientId)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const allowedFields = ["name", "description", "category", "status", "tags"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (updates.category) {
      const validCategories = ["report", "document", "analysis", "presentation", "code", "data", "general"];
      if (!validCategories.includes(updates.category as string)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["draft", "review", "approved", "delivered", "rejected", "archived"];
      if (!validStatuses.includes(updates.status as string)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from("deliverables")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update deliverable:", error);
      return NextResponse.json(
        { error: "Failed to update deliverable" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deliverable: data,
    });
  } catch (error) {
    console.error("Portal deliverable PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update deliverable" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/deliverables/[id] - Archive a deliverable
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    // Archive instead of delete
    const { error } = await supabase
      .from("deliverables")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("client_id", clientId);

    if (error) {
      console.error("Failed to archive deliverable:", error);
      return NextResponse.json(
        { error: "Failed to archive deliverable" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portal deliverable DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to archive deliverable" },
      { status: 500 }
    );
  }
}
