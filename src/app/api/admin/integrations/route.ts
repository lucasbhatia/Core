import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationStatus } from "@/types/database";

// GET - Fetch all integrations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as IntegrationStatus | null;
    const provider = searchParams.get("provider");
    const isGlobal = searchParams.get("is_global");
    const clientId = searchParams.get("client_id");

    let query = supabase
      .from("integrations")
      .select("*, client:clients(id, name, company)");

    if (status) {
      query = query.eq("status", status);
    }
    if (provider) {
      query = query.eq("provider", provider);
    }
    if (isGlobal !== null) {
      query = query.eq("is_global", isGlobal === "true");
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: integrations, error } = await query
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get integration logs summary
    const { data: logsSummary } = await supabase
      .from("integration_logs")
      .select("integration_id, status")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Calculate stats per integration
    const stats: Record<string, { success: number; failed: number; total: number }> = {};
    logsSummary?.forEach((log) => {
      if (!stats[log.integration_id]) {
        stats[log.integration_id] = { success: 0, failed: 0, total: 0 };
      }
      stats[log.integration_id].total++;
      if (log.status === "success") {
        stats[log.integration_id].success++;
      } else if (log.status === "failed") {
        stats[log.integration_id].failed++;
      }
    });

    const integrationsWithStats = integrations?.map((integration) => ({
      ...integration,
      recentStats: stats[integration.id] || { success: 0, failed: 0, total: 0 },
    }));

    return NextResponse.json({ integrations: integrationsWithStats });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST - Create new integration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      type,
      provider,
      description,
      icon_url,
      config = {},
      credentials = {},
      is_global = true,
      client_id,
      created_by,
    } = body;

    if (!name || !type || !provider) {
      return NextResponse.json(
        { error: "name, type, and provider are required" },
        { status: 400 }
      );
    }

    const { data: integration, error } = await supabase
      .from("integrations")
      .insert({
        name,
        type,
        provider,
        description,
        icon_url,
        config,
        credentials,
        is_global,
        client_id: is_global ? null : client_id,
        created_by,
        status: "inactive",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ integration, success: true });
  } catch (error) {
    console.error("Error creating integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}

// PUT - Update integration
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    const { data: integration, error } = await supabase
      .from("integrations")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ integration, success: true });
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Integration ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
