import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";

// Create supabase client lazily to avoid build-time errors
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

// POST /api/automation/run - Trigger an automation run via Inngest
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { systemId, triggerType = "manual", inputData = {} } = await request.json();

    if (!systemId) {
      return NextResponse.json({ error: "systemId is required" }, { status: 400 });
    }

    // Get the system
    const { data: system, error: systemError } = await supabase
      .from("system_builds")
      .select("*, client:clients(id, name, email)")
      .eq("id", systemId)
      .single();

    if (systemError || !system) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }

    if (system.automation_status !== "active") {
      return NextResponse.json(
        { error: "Automation is not active" },
        { status: 400 }
      );
    }

    // Create a run record
    const { data: run, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        system_id: systemId,
        client_id: system.client_id,
        status: "running",
        trigger_type: triggerType,
        input_data: {
          triggered_at: new Date().toISOString(),
          ...inputData,
        },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("Failed to create run:", runError);
      return NextResponse.json({ error: "Failed to start run" }, { status: 500 });
    }

    // Get automation type from config
    const config = (system.automation_config || {}) as Record<string, string>;
    const automationType = config.templateId || config.type || "generic";

    // Send event to Inngest for background processing
    await inngest.send({
      name: "automation/run",
      data: {
        runId: run.id,
        systemId: system.id,
        clientId: system.client_id,
        automationType,
        triggerType,
        inputData: {
          systemTitle: system.title,
          clientName: system.client?.name || "Unknown",
          config,
          ...inputData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      status: "running",
      message: "Automation triggered successfully",
    });
  } catch (error) {
    console.error("Automation trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
