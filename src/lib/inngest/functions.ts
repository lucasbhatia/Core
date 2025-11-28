import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";

// Lazy load Supabase client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

// Types for automation events
type AutomationRunEvent = {
  data: {
    runId: string;
    systemId: string;
    clientId: string | null;
    automationType: string;
    triggerType: string;
    inputData: Record<string, unknown>;
  };
};

// Main automation runner function
export const runAutomation = inngest.createFunction(
  {
    id: "run-automation",
    name: "Run Automation",
    retries: 3,
  },
  { event: "automation/run" },
  async ({ event, step }) => {
    const { runId, systemId, clientId, automationType, inputData } =
      event.data as AutomationRunEvent["data"];

    const supabase = getSupabase();

    // Step 1: Log start
    await step.run("log-start", async () => {
      await supabase.from("automation_logs").insert({
        run_id: runId,
        system_id: systemId,
        level: "info",
        message: "Automation started",
        step_name: "initialization",
        step_index: 0,
      });
    });

    // Step 2: Execute automation based on type
    const result = await step.run("execute-automation", async () => {
      switch (automationType) {
        case "email_to_crm":
          return await executeEmailToCrm(supabase, runId, systemId, inputData);

        case "scheduled_report":
          return await executeScheduledReport(
            supabase,
            runId,
            systemId,
            inputData
          );

        case "data_sync":
          return await executeDataSync(supabase, runId, systemId, inputData);

        case "ai_processor":
          return await executeAiProcessor(supabase, runId, systemId, inputData);

        case "webhook_relay":
          return await executeWebhookRelay(supabase, runId, systemId, inputData);

        case "notification_sender":
          return await executeNotificationSender(
            supabase,
            runId,
            systemId,
            inputData
          );

        default:
          return await executeGenericAutomation(
            supabase,
            runId,
            systemId,
            inputData
          );
      }
    });

    // Step 3: Mark as complete
    await step.run("mark-complete", async () => {
      const completedAt = new Date().toISOString();
      const { data: runData } = await supabase
        .from("automation_runs")
        .select("started_at")
        .eq("id", runId)
        .single();

      const startedAt = runData?.started_at
        ? new Date(runData.started_at)
        : new Date();
      const durationMs = new Date(completedAt).getTime() - startedAt.getTime();

      await supabase
        .from("automation_runs")
        .update({
          status: "success",
          completed_at: completedAt,
          duration_ms: durationMs,
          output_data: result,
        })
        .eq("id", runId);

      await supabase.from("automation_logs").insert({
        run_id: runId,
        system_id: systemId,
        level: "info",
        message: "Automation completed successfully",
        step_name: "completion",
        step_index: 99,
        data: result,
      });
    });

    return { success: true, runId, result };
  }
);

// Scheduled automation cron job
export const scheduledAutomation = inngest.createFunction(
  {
    id: "scheduled-automation-check",
    name: "Check Scheduled Automations",
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    const supabase = getSupabase();

    // Find active scheduled automations
    const { data: systems } = await step.run("find-scheduled", async () => {
      return await supabase
        .from("system_builds")
        .select("id, client_id, automation_type, automation_config")
        .eq("automation_status", "active")
        .eq("automation_type", "scheduled");
    });

    if (!systems?.data || systems.data.length === 0) {
      return { triggered: 0 };
    }

    // Trigger each scheduled automation
    let triggered = 0;
    for (const system of systems.data) {
      await step.run(`trigger-${system.id}`, async () => {
        // Create a run record
        const { data: run } = await supabase
          .from("automation_runs")
          .insert({
            system_id: system.id,
            client_id: system.client_id,
            status: "running",
            trigger_type: "scheduled",
            input_data: {},
          })
          .select()
          .single();

        if (run) {
          // Trigger the automation
          await inngest.send({
            name: "automation/run",
            data: {
              runId: run.id,
              systemId: system.id,
              clientId: system.client_id,
              automationType:
                (system.automation_config as Record<string, string>)?.type ||
                "generic",
              triggerType: "scheduled",
              inputData: {},
            },
          });
          triggered++;
        }
      });
    }

    return { triggered };
  }
);

// Automation type handlers
async function executeEmailToCrm(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Connecting to email provider...",
    step_name: "email_connect",
    step_index: 1,
  });

  // Simulate email fetch
  await new Promise((resolve) => setTimeout(resolve, 500));

  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Parsing email content with AI...",
    step_name: "ai_parse",
    step_index: 2,
  });

  await new Promise((resolve) => setTimeout(resolve, 800));

  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Creating CRM entry...",
    step_name: "crm_create",
    step_index: 3,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    emailsProcessed: 3,
    crmEntriesCreated: 3,
    processedAt: new Date().toISOString(),
  };
}

async function executeScheduledReport(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Gathering report data...",
    step_name: "gather_data",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 600));

  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Generating report...",
    step_name: "generate_report",
    step_index: 2,
  });

  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    reportGenerated: true,
    dataPoints: 150,
    generatedAt: new Date().toISOString(),
  };
}

async function executeDataSync(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Connecting to source system...",
    step_name: "connect_source",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 400));

  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Syncing records...",
    step_name: "sync_records",
    step_index: 2,
  });

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    recordsSynced: 47,
    recordsCreated: 12,
    recordsUpdated: 35,
    syncedAt: new Date().toISOString(),
  };
}

async function executeAiProcessor(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Processing with AI...",
    step_name: "ai_process",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Storing results...",
    step_name: "store_results",
    step_index: 2,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    itemsProcessed: 25,
    confidence: 0.94,
    processedAt: new Date().toISOString(),
  };
}

async function executeWebhookRelay(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Relaying webhook data...",
    step_name: "relay",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    relayed: true,
    destinations: 2,
    relayedAt: new Date().toISOString(),
  };
}

async function executeNotificationSender(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Sending notifications...",
    step_name: "send",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    notificationsSent: 5,
    channels: ["email", "slack"],
    sentAt: new Date().toISOString(),
  };
}

async function executeGenericAutomation(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  systemId: string,
  inputData: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level: "info",
    message: "Executing automation tasks...",
    step_name: "execute",
    step_index: 1,
  });

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    tasksCompleted: 3,
    processedAt: new Date().toISOString(),
  };
}

// Export all functions for the serve handler
export const functions = [runAutomation, scheduledAutomation];
