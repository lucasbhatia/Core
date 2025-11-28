import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTemplateById } from "@/lib/automation-templates";

// Create supabase client lazily to avoid build-time errors
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

// Automation handlers
const handlers: Record<string, (config: Record<string, unknown>, context: RunContext) => Promise<RunResult>> = {
  emailToCrm: async (config, context) => {
    // Simulate email to CRM processing
    await context.log("info", "Starting email to CRM sync");
    await context.log("info", `Source: ${config.emailSource}, Destination: ${config.crmDestination}`);

    // In production, this would:
    // 1. Connect to email provider
    // 2. Fetch new emails
    // 3. Parse contact information
    // 4. Add to CRM

    await sleep(1000); // Simulate processing
    await context.log("info", "Processed 5 new emails");
    await context.log("info", "Added 3 new contacts to CRM");

    return {
      success: true,
      output: {
        emailsProcessed: 5,
        contactsAdded: 3,
        contactsUpdated: 2,
      },
    };
  },

  scheduledReport: async (config, context) => {
    await context.log("info", "Generating scheduled report");
    await context.log("info", `Report type: ${config.reportType}`);

    await sleep(1500);
    await context.log("info", "Report generated successfully");
    await context.log("info", `Sending to: ${config.recipients}`);

    return {
      success: true,
      output: {
        reportType: config.reportType,
        recipients: config.recipients,
        generatedAt: new Date().toISOString(),
      },
    };
  },

  dataSync: async (config, context) => {
    await context.log("info", "Starting data sync");
    await context.log("info", `${config.sourceSystem} → ${config.destinationSystem}`);

    await sleep(2000);
    await context.log("info", "Fetched 150 records from source");
    await context.log("info", "Synced 148 records, 2 skipped (duplicates)");

    return {
      success: true,
      output: {
        recordsFetched: 150,
        recordsSynced: 148,
        recordsSkipped: 2,
      },
    };
  },

  aiProcessor: async (config, context) => {
    await context.log("info", "Starting AI processing");
    await context.log("info", `Processing type: ${config.processingType}`);

    await sleep(1800);
    await context.log("info", "AI analysis complete");

    return {
      success: true,
      output: {
        itemsProcessed: 25,
        processingType: config.processingType,
        results: {
          positive: 15,
          neutral: 7,
          negative: 3,
        },
      },
    };
  },

  webhookRelay: async (config, context) => {
    await context.log("info", "Processing webhook relay");
    await context.log("info", `Forwarding to: ${config.destinationUrl}`);

    await sleep(500);

    if (config.transformData) {
      await context.log("info", "Applied data transformation");
    }

    await context.log("info", "Webhook forwarded successfully");

    return {
      success: true,
      output: {
        forwardedTo: config.destinationUrl,
        transformed: !!config.transformData,
        responseStatus: 200,
      },
    };
  },

  notificationSender: async (config, context) => {
    await context.log("info", "Sending notification");
    await context.log("info", `Channel: ${config.channel}`);

    await sleep(800);
    await context.log("info", `Message sent: ${config.messageTemplate}`);

    return {
      success: true,
      output: {
        channel: config.channel,
        sent: true,
        timestamp: new Date().toISOString(),
      },
    };
  },
};

interface RunContext {
  runId: string;
  systemId: string;
  log: (level: string, message: string, data?: Record<string, unknown>) => Promise<void>;
}

interface RunResult {
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// POST /api/automation/run - Run an automation
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = getSupabase();
    const { systemId, triggerType = "manual" } = await request.json();

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
        input_data: { triggered_at: new Date().toISOString() },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError || !run) {
      console.error("Failed to create run:", runError);
      return NextResponse.json({ error: "Failed to start run" }, { status: 500 });
    }

    // Create logging function
    const log = async (level: string, message: string, data?: Record<string, unknown>) => {
      await supabase.from("automation_logs").insert({
        run_id: run.id,
        system_id: systemId,
        level,
        message,
        data: data || {},
      });
    };

    const context: RunContext = {
      runId: run.id,
      systemId,
      log,
    };

    // Get automation config
    const config = system.automation_config || {};
    const templateId = config.templateId as string;

    let result: RunResult;

    if (templateId) {
      // Run template-based automation
      const template = getTemplateById(templateId);
      if (template && handlers[template.handler]) {
        await log("info", `Running automation: ${template.name}`);
        result = await handlers[template.handler](config, context);
      } else {
        result = { success: false, output: {}, error: "Unknown template" };
      }
    } else {
      // Run generic automation (simulated)
      await log("info", `Running automation: ${system.title}`);
      await log("info", "Processing automation tasks...");
      await sleep(1500);
      await log("info", "Automation completed successfully");

      result = {
        success: true,
        output: {
          systemTitle: system.title,
          clientName: system.client?.name || "Unknown",
          processedAt: new Date().toISOString(),
          tasksCompleted: Math.floor(Math.random() * 10) + 1,
        },
      };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Update run with result
    await supabase
      .from("automation_runs")
      .update({
        status: result.success ? "success" : "failed",
        output_data: result.output,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        error_message: result.error,
      })
      .eq("id", run.id);

    // Update system stats
    await supabase
      .from("system_builds")
      .update({
        run_count: (system.run_count || 0) + 1,
        last_run_at: new Date().toISOString(),
        error_count: result.success
          ? system.error_count || 0
          : (system.error_count || 0) + 1,
        last_error: result.success ? null : result.error,
      })
      .eq("id", systemId);

    return NextResponse.json({
      success: result.success,
      runId: run.id,
      duration_ms: durationMs,
      output: result.output,
    });
  } catch (error) {
    console.error("Automation run error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
