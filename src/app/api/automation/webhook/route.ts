import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Use service role for webhook access (no auth required)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify webhook signature
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// POST /api/automation/webhook - Start a new run or log to existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);

    const {
      system_id,
      action,
      run_id,
      // For start action
      trigger_type = "webhook",
      input_data = {},
      // For log action
      level = "info",
      message,
      step_name,
      step_index,
      log_data,
      // For complete action
      status,
      output_data,
      error_message,
      error_details,
    } = data;

    if (!system_id) {
      return NextResponse.json(
        { error: "system_id is required" },
        { status: 400 }
      );
    }

    // Get system and verify webhook secret
    const { data: system, error: systemError } = await supabase
      .from("system_builds")
      .select("id, client_id, webhook_secret, automation_status")
      .eq("id", system_id)
      .single();

    if (systemError || !system) {
      return NextResponse.json(
        { error: "System not found" },
        { status: 404 }
      );
    }

    // Verify webhook signature if secret is set
    const signature = request.headers.get("x-webhook-signature");
    if (system.webhook_secret) {
      if (!verifySignature(body, signature, system.webhook_secret)) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Handle different actions
    switch (action) {
      case "start": {
        // Create a new automation run
        const { data: run, error: runError } = await supabase
          .from("automation_runs")
          .insert({
            system_id,
            client_id: system.client_id,
            status: "running",
            trigger_type,
            input_data,
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (runError) {
          console.error("Error creating run:", runError);
          return NextResponse.json(
            { error: "Failed to create run" },
            { status: 500 }
          );
        }

        // Log the start
        await supabase.from("automation_logs").insert({
          run_id: run.id,
          system_id,
          level: "info",
          message: "Automation run started",
          data: { trigger_type, input_data },
        });

        return NextResponse.json({
          success: true,
          run_id: run.id,
          message: "Run started",
        });
      }

      case "log": {
        if (!run_id) {
          return NextResponse.json(
            { error: "run_id is required for log action" },
            { status: 400 }
          );
        }

        // Add log entry
        const { error: logError } = await supabase
          .from("automation_logs")
          .insert({
            run_id,
            system_id,
            level,
            message: message || "Log entry",
            data: log_data || {},
            step_name,
            step_index,
          });

        if (logError) {
          console.error("Error creating log:", logError);
          return NextResponse.json(
            { error: "Failed to create log" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Log entry created",
        });
      }

      case "complete": {
        if (!run_id) {
          return NextResponse.json(
            { error: "run_id is required for complete action" },
            { status: 400 }
          );
        }

        // Get run start time for duration calculation
        const { data: existingRun } = await supabase
          .from("automation_runs")
          .select("started_at")
          .eq("id", run_id)
          .single();

        const completedAt = new Date();
        const startedAt = existingRun?.started_at
          ? new Date(existingRun.started_at)
          : completedAt;
        const durationMs = completedAt.getTime() - startedAt.getTime();

        // Update run with completion status
        const { error: updateError } = await supabase
          .from("automation_runs")
          .update({
            status: status || "success",
            output_data: output_data || {},
            completed_at: completedAt.toISOString(),
            duration_ms: durationMs,
            error_message: status === "failed" ? error_message : null,
            error_details: status === "failed" ? error_details : null,
          })
          .eq("id", run_id);

        if (updateError) {
          console.error("Error completing run:", updateError);
          return NextResponse.json(
            { error: "Failed to complete run" },
            { status: 500 }
          );
        }

        // Log completion
        await supabase.from("automation_logs").insert({
          run_id,
          system_id,
          level: status === "failed" ? "error" : "info",
          message:
            status === "failed"
              ? `Automation failed: ${error_message || "Unknown error"}`
              : "Automation completed successfully",
          data: { output_data, duration_ms: durationMs },
        });

        return NextResponse.json({
          success: true,
          message: `Run ${status || "completed"}`,
          duration_ms: durationMs,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: start, log, or complete" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/automation/webhook - Get webhook URL info
export async function GET(request: NextRequest) {
  const systemId = request.nextUrl.searchParams.get("system_id");

  if (!systemId) {
    return NextResponse.json({
      message: "Automation Webhook API",
      usage: {
        start: {
          method: "POST",
          body: {
            system_id: "uuid",
            action: "start",
            trigger_type: "webhook|scheduled|manual|api",
            input_data: {},
          },
        },
        log: {
          method: "POST",
          body: {
            system_id: "uuid",
            action: "log",
            run_id: "uuid",
            level: "debug|info|warn|error",
            message: "string",
            step_name: "optional",
            step_index: 0,
            log_data: {},
          },
        },
        complete: {
          method: "POST",
          body: {
            system_id: "uuid",
            action: "complete",
            run_id: "uuid",
            status: "success|failed",
            output_data: {},
            error_message: "optional",
          },
        },
      },
    });
  }

  // Get system webhook info
  const { data: system, error } = await supabase
    .from("system_builds")
    .select("id, title, webhook_url, automation_status, run_count, last_run_at")
    .eq("id", systemId)
    .single();

  if (error || !system) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }

  return NextResponse.json({
    system_id: system.id,
    title: system.title,
    webhook_url: system.webhook_url,
    status: system.automation_status,
    run_count: system.run_count,
    last_run_at: system.last_run_at,
  });
}
