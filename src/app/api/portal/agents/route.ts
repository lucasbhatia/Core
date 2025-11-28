import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAgent, getClientAgents } from "@/lib/ai-agents/engine";
import { PLAN_LIMITS } from "@/lib/stripe";

// GET /api/portal/agents - List all agents for the client
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get client info
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, company")
      .eq("id", clientId)
      .single();

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { agents, total } = await getClientAgents(clientId, {
      status,
      category,
      limit,
      offset,
    });

    return NextResponse.json({
      agents,
      total,
      client,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/portal/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      template_id,
      name,
      description,
      icon,
      category,
      system_prompt,
      model,
      temperature,
      max_tokens,
      input_fields,
      output_format,
      is_public,
      api_enabled,
    } = body;

    // Validate required fields
    if (!name || !system_prompt) {
      return NextResponse.json(
        { error: "Name and system prompt are required" },
        { status: 400 }
      );
    }

    const { agent, error } = await createAgent(clientId, {
      template_id,
      name,
      description,
      icon,
      category: category || "custom",
      system_prompt,
      model,
      temperature,
      max_tokens,
      input_fields,
      output_format,
      is_public,
      api_enabled,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
