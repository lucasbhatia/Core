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
 * GET /api/portal/deliverables - Get client's deliverables with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    // Get filter params
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const workflowId = searchParams.get("workflow_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("deliverables")
      .select(`
        *,
        workflow:workflows(id, name, status),
        task:agent_tasks(name, agents(name, agent_type))
      `, { count: "exact" })
      .eq("client_id", clientId)
      .neq("status", "archived") // Don't show archived by default
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (workflowId) {
      query = query.eq("workflow_id", workflowId);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching deliverables:", error);
      return NextResponse.json(
        { error: "Failed to fetch deliverables" },
        { status: 500 }
      );
    }

    // Get unique categories for filtering UI
    const { data: categories } = await supabase
      .from("deliverables")
      .select("category")
      .eq("client_id", clientId)
      .neq("status", "archived");

    const uniqueCategories = [...new Set((categories || []).map(c => c.category))];

    // Get workflows for grouping
    const { data: workflows } = await supabase
      .from("workflows")
      .select("id, name")
      .eq("client_id", clientId)
      .eq("is_automation", false)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      deliverables: data || [],
      total: count || 0,
      categories: uniqueCategories,
      workflows: workflows || [],
    });
  } catch (error) {
    console.error("Portal deliverables error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliverables" },
      { status: 500 }
    );
  }
}
