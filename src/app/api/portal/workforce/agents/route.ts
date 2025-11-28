import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  AGENT_ROSTER,
  getAgentById,
  getWorkforceLimits,
  type HiredAgent,
  type HireAgentRequest,
} from "@/lib/ai-workforce";

// GET /api/portal/workforce/agents - Get all hired agents for the client
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get client's plan
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, plan")
      .eq("id", clientId)
      .single();

    const plan = client?.plan || "free";
    const limits = getWorkforceLimits(plan);

    // Get hired agents from database
    const { data: hiredAgents, error } = await supabase
      .from("hired_agents")
      .select("*")
      .eq("client_id", clientId)
      .order("hired_at", { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({
          agents: [],
          total: 0,
          limits,
          roster: AGENT_ROSTER,
        });
      }
      throw error;
    }

    // Enrich hired agents with roster data
    const enrichedAgents = (hiredAgents || []).map((agent) => ({
      ...agent,
      roster_agent: getAgentById(agent.roster_id),
    }));

    return NextResponse.json({
      agents: enrichedAgents,
      total: enrichedAgents.length,
      limits,
      roster: AGENT_ROSTER,
    });
  } catch (error) {
    console.error("Error fetching hired agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch hired agents" },
      { status: 500 }
    );
  }
}

// POST /api/portal/workforce/agents - Hire a new agent
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body: HireAgentRequest = await request.json();
    const { roster_id, custom_name, custom_instructions } = body;

    // Validate roster_id
    const rosterAgent = getAgentById(roster_id);
    if (!rosterAgent) {
      return NextResponse.json(
        { error: "Invalid agent ID" },
        { status: 400 }
      );
    }

    // Get client's plan and check limits
    const { data: client } = await supabase
      .from("clients")
      .select("id, plan")
      .eq("id", clientId)
      .single();

    const plan = client?.plan || "free";
    const limits = getWorkforceLimits(plan);

    // Check tier access
    const tierOrder = ["free", "starter", "pro", "business", "enterprise"];
    const userTierIndex = tierOrder.indexOf(plan);
    const requiredTierIndex = tierOrder.indexOf(rosterAgent.tier_required);

    if (userTierIndex < requiredTierIndex) {
      return NextResponse.json(
        { error: `This agent requires ${rosterAgent.tier_required} plan or higher` },
        { status: 403 }
      );
    }

    // Check if already at limit
    const { count } = await supabase
      .from("hired_agents")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId);

    if (limits.max_hired_agents !== -1 && (count || 0) >= limits.max_hired_agents) {
      return NextResponse.json(
        { error: `You've reached the maximum of ${limits.max_hired_agents} hired agents for your plan` },
        { status: 403 }
      );
    }

    // Check if agent is already hired
    const { data: existing } = await supabase
      .from("hired_agents")
      .select("id")
      .eq("client_id", clientId)
      .eq("roster_id", roster_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You've already hired this agent" },
        { status: 400 }
      );
    }

    // Create hired agent record
    const newHiredAgent = {
      client_id: clientId,
      roster_id,
      custom_name: custom_name || null,
      custom_instructions: custom_instructions || null,
      status: "active",
      hired_at: new Date().toISOString(),
      last_active_at: null,
      tasks_completed: 0,
      deliverables_created: 0,
      total_tokens_used: 0,
      avg_task_rating: null,
      notification_enabled: true,
      auto_save_deliverables: true,
    };

    const { data: hiredAgent, error } = await supabase
      .from("hired_agents")
      .insert(newHiredAgent)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return mock data
      if (error.code === "42P01") {
        return NextResponse.json({
          agent: {
            id: `hired-${Date.now()}`,
            ...newHiredAgent,
            roster_agent: rosterAgent,
          },
        }, { status: 201 });
      }
      throw error;
    }

    return NextResponse.json({
      agent: {
        ...hiredAgent,
        roster_agent: rosterAgent,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error hiring agent:", error);
    return NextResponse.json(
      { error: "Failed to hire agent" },
      { status: 500 }
    );
  }
}
