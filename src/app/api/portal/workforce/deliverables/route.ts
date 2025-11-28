import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { type AgentDeliverable } from "@/lib/ai-workforce";

// GET /api/portal/workforce/deliverables - Get all deliverables for the client
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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("agent_deliverables")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq("hired_agent_id", agentId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data: deliverables, error } = await query;

    if (error && error.code !== "42P01") {
      throw error;
    }

    return NextResponse.json({
      deliverables: deliverables || [],
      total: deliverables?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliverables" },
      { status: 500 }
    );
  }
}

// PATCH /api/portal/workforce/deliverables - Update a deliverable (rating, status, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { id, rating, feedback, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Deliverable ID is required" },
        { status: 400 }
      );
    }

    const updates: Partial<AgentDeliverable> = {
      updated_at: new Date().toISOString(),
    };

    if (rating !== undefined) {
      updates.rating = rating;
    }

    if (feedback !== undefined) {
      updates.feedback = feedback;
    }

    if (status) {
      updates.status = status;
      if (status === "approved") {
        updates.approved_at = new Date().toISOString();
      } else if (status === "published") {
        updates.published_at = new Date().toISOString();
      }
    }

    const { data: deliverable, error } = await supabase
      .from("agent_deliverables")
      .update(updates)
      .eq("id", id)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist, return mock response
        return NextResponse.json({
          deliverable: { id, ...updates },
        });
      }
      throw error;
    }

    // Update agent's average rating if rating was provided
    if (rating !== undefined && deliverable) {
      const { data: agentDeliverables } = await supabase
        .from("agent_deliverables")
        .select("rating")
        .eq("hired_agent_id", deliverable.hired_agent_id)
        .not("rating", "is", null);

      if (agentDeliverables && agentDeliverables.length > 0) {
        const avgRating =
          agentDeliverables.reduce((sum, d) => sum + (d.rating || 0), 0) /
          agentDeliverables.length;

        await supabase
          .from("hired_agents")
          .update({ avg_task_rating: avgRating })
          .eq("id", deliverable.hired_agent_id);
      }
    }

    return NextResponse.json({ deliverable });
  } catch (error) {
    console.error("Error updating deliverable:", error);
    return NextResponse.json(
      { error: "Failed to update deliverable" },
      { status: 500 }
    );
  }
}

// DELETE /api/portal/workforce/deliverables - Delete a deliverable
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Deliverable ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("agent_deliverables")
      .delete()
      .eq("id", id)
      .eq("client_id", clientId);

    if (error && error.code !== "42P01") {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deliverable:", error);
    return NextResponse.json(
      { error: "Failed to delete deliverable" },
      { status: 500 }
    );
  }
}
