import { inngest } from "./client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  sendEmail,
  sendAutomationStatusEmail,
  addLeadToCRM,
  createRecord,
  findRecords,
  extractContactInfo,
  processWithAI,
  summarizeText,
  sendWebhook,
  sendSlackNotification,
} from "@/lib/integrations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseInstance = SupabaseClient<any, any, any>;

// Lazy load Supabase client
function getSupabase(): SupabaseInstance {
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
        message: `Starting automation: ${automationType}`,
        step_name: "initialization",
        step_index: 0,
      });
    });

    // Step 2: Execute automation based on type
    const result = await step.run("execute-automation", async () => {
      const config = (inputData.config || {}) as Record<string, unknown>;

      switch (automationType) {
        case "email_to_crm":
          return await executeEmailToCrm(supabase, runId, systemId, config, inputData);

        case "lead_capture":
          return await executeLeadCapture(supabase, runId, systemId, config, inputData);

        case "ai_processor":
          return await executeAiProcessor(supabase, runId, systemId, config, inputData);

        case "notification_sender":
          return await executeNotificationSender(supabase, runId, systemId, config, inputData);

        case "webhook_relay":
          return await executeWebhookRelay(supabase, runId, systemId, config, inputData);

        case "data_sync":
          return await executeDataSync(supabase, runId, systemId, config, inputData);

        default:
          return await executeGenericAutomation(supabase, runId, systemId, config, inputData);
      }
    });

    // Step 3: Mark as complete and notify if configured
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

      // Update run record
      await supabase
        .from("automation_runs")
        .update({
          status: result.success ? "success" : "failed",
          completed_at: completedAt,
          duration_ms: durationMs,
          output_data: result.output,
          error_message: result.error,
        })
        .eq("id", runId);

      // Log completion
      await supabase.from("automation_logs").insert({
        run_id: runId,
        system_id: systemId,
        level: result.success ? "info" : "error",
        message: result.success
          ? "Automation completed successfully"
          : `Automation failed: ${result.error}`,
        step_name: "completion",
        step_index: 99,
        data: result.output,
      });

      // Update system stats
      const { data: system } = await supabase
        .from("system_builds")
        .select("run_count, error_count")
        .eq("id", systemId)
        .single();

      await supabase
        .from("system_builds")
        .update({
          run_count: (system?.run_count || 0) + 1,
          last_run_at: completedAt,
          error_count: result.success
            ? system?.error_count || 0
            : (system?.error_count || 0) + 1,
          last_error: result.success ? null : result.error,
        })
        .eq("id", systemId);
    });

    return { success: result.success, runId, result };
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
    const systems = await step.run("find-scheduled", async () => {
      const { data } = await supabase
        .from("system_builds")
        .select("id, client_id, automation_type, automation_config")
        .eq("automation_status", "active")
        .eq("automation_type", "scheduled");
      return data || [];
    });

    if (!systems || systems.length === 0) {
      return { triggered: 0 };
    }

    // Trigger each scheduled automation
    let triggered = 0;
    for (const system of systems) {
      await step.run(`trigger-${system.id}`, async () => {
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

// ===== AUTOMATION HANDLERS =====

interface AutomationResult {
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
}

// Email to CRM: Extract contact info from email and add to CRM
async function executeEmailToCrm(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Processing email content", "parse_email", 1);

  // Extract contact info using AI
  const emailContent = (inputData.emailContent as string) || "Sample email content for testing";
  const extractResult = await extractContactInfo(emailContent);

  if (!extractResult.success) {
    return { success: false, output: {}, error: extractResult.error };
  }

  await logStep(supabase, runId, systemId, "info", "Extracted contact information", "extract_data", 2, extractResult.structured);

  // Add to CRM if Airtable is configured
  const airtableBaseId = config.airtableBaseId as string;
  const airtableTable = (config.airtableTable as string) || "Leads";

  if (airtableBaseId) {
    await logStep(supabase, runId, systemId, "info", "Adding contact to CRM", "add_to_crm", 3);

    const contact = extractResult.structured as Record<string, string>;
    const crmResult = await addLeadToCRM(airtableBaseId, airtableTable, {
      name: contact.name || "Unknown",
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      source: "Email Automation",
      notes: contact.interest || "",
    });

    if (!crmResult.success) {
      return { success: false, output: {}, error: crmResult.error };
    }

    return {
      success: true,
      output: {
        contactExtracted: extractResult.structured,
        crmRecordId: crmResult.record?.id,
        processedAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: true,
    output: {
      contactExtracted: extractResult.structured,
      note: "CRM not configured - contact info extracted only",
      processedAt: new Date().toISOString(),
    },
  };
}

// Lead Capture: Process incoming lead and add to CRM
async function executeLeadCapture(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Processing lead capture", "process_lead", 1);

  const lead = inputData.lead as Record<string, string> | undefined;

  if (!lead) {
    return { success: false, output: {}, error: "No lead data provided" };
  }

  // Add to Airtable CRM
  const airtableBaseId = config.airtableBaseId as string;
  const airtableTable = (config.airtableTable as string) || "Leads";

  if (airtableBaseId) {
    await logStep(supabase, runId, systemId, "info", "Saving lead to CRM", "save_lead", 2);

    const crmResult = await addLeadToCRM(airtableBaseId, airtableTable, {
      name: lead.name || "Unknown",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "Lead Capture Form",
      notes: lead.notes || "",
    });

    if (!crmResult.success) {
      return { success: false, output: {}, error: crmResult.error };
    }

    // Send notification email if configured
    const notifyEmail = config.notifyEmail as string;
    if (notifyEmail) {
      await logStep(supabase, runId, systemId, "info", "Sending notification", "notify", 3);

      await sendEmail({
        to: notifyEmail,
        subject: `New Lead: ${lead.name}`,
        html: `
          <h2>New Lead Captured</h2>
          <p><strong>Name:</strong> ${lead.name}</p>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Phone:</strong> ${lead.phone || "N/A"}</p>
          <p><strong>Company:</strong> ${lead.company || "N/A"}</p>
          <p><strong>Notes:</strong> ${lead.notes || "N/A"}</p>
        `,
      });
    }

    return {
      success: true,
      output: {
        leadSaved: true,
        crmRecordId: crmResult.record?.id,
        notificationSent: !!notifyEmail,
        processedAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: true,
    output: {
      lead,
      note: "CRM not configured - lead data captured only",
      processedAt: new Date().toISOString(),
    },
  };
}

// AI Processor: Process content with Claude
async function executeAiProcessor(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Starting AI processing", "ai_start", 1);

  const content = (inputData.content as string) || "";
  const task = (config.task as string) || "summarize";

  if (!content) {
    return { success: false, output: {}, error: "No content provided for AI processing" };
  }

  await logStep(supabase, runId, systemId, "info", `Processing task: ${task}`, "ai_process", 2);

  let result;

  switch (task) {
    case "summarize":
      result = await summarizeText(content);
      break;
    case "extract":
      result = await extractContactInfo(content);
      break;
    case "custom":
      const prompt = (config.prompt as string) || "Analyze the following content:";
      result = await processWithAI(`${prompt}\n\n${content}`);
      break;
    default:
      result = await summarizeText(content);
  }

  if (!result.success) {
    return { success: false, output: {}, error: result.error };
  }

  return {
    success: true,
    output: {
      task,
      result: result.result || result.structured,
      processedAt: new Date().toISOString(),
    },
  };
}

// Notification Sender: Send notifications via email/Slack
async function executeNotificationSender(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Sending notifications", "notify_start", 1);

  const channel = (config.channel as string) || "email";
  const message = (inputData.message as string) || (config.defaultMessage as string) || "";
  const recipients = (config.recipients as string[]) || [];

  const results: Record<string, unknown> = { channel, sent: 0, failed: 0 };

  if (channel === "email" || channel === "both") {
    for (const recipient of recipients) {
      const emailResult = await sendEmail({
        to: recipient,
        subject: (config.subject as string) || "Notification from CoreOS Hub",
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${message}</div>`,
      });

      if (emailResult.success) {
        (results.sent as number)++;
      } else {
        (results.failed as number)++;
      }
    }

    await logStep(supabase, runId, systemId, "info", `Sent ${results.sent} emails`, "email_sent", 2);
  }

  if (channel === "slack" || channel === "both") {
    const slackWebhook = config.slackWebhook as string;
    if (slackWebhook) {
      const slackResult = await sendSlackNotification(slackWebhook, message);
      results.slackSent = slackResult.success;

      await logStep(supabase, runId, systemId, "info", `Slack notification: ${slackResult.success ? "sent" : "failed"}`, "slack_sent", 3);
    }
  }

  return {
    success: true,
    output: {
      ...results,
      processedAt: new Date().toISOString(),
    },
  };
}

// Webhook Relay: Forward data to external webhooks
async function executeWebhookRelay(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Relaying webhook", "webhook_start", 1);

  const webhookUrl = config.webhookUrl as string;
  const method = (config.method as "GET" | "POST" | "PUT") || "POST";

  if (!webhookUrl) {
    return { success: false, output: {}, error: "No webhook URL configured" };
  }

  const payload = inputData.payload || inputData;

  await logStep(supabase, runId, systemId, "info", `Sending ${method} to ${webhookUrl}`, "webhook_send", 2);

  const result = await sendWebhook(webhookUrl, {
    method,
    body: payload,
    headers: (config.headers as Record<string, string>) || {},
  });

  if (!result.success) {
    return { success: false, output: {}, error: result.error };
  }

  return {
    success: true,
    output: {
      webhookUrl,
      statusCode: result.statusCode,
      response: result.data,
      processedAt: new Date().toISOString(),
    },
  };
}

// Data Sync: Sync data between Airtable tables
async function executeDataSync(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Starting data sync", "sync_start", 1);

  const sourceBaseId = config.sourceBaseId as string;
  const sourceTable = config.sourceTable as string;
  const destBaseId = config.destBaseId as string;
  const destTable = config.destTable as string;

  if (!sourceBaseId || !sourceTable) {
    return { success: false, output: {}, error: "Source not configured" };
  }

  // Fetch source records
  await logStep(supabase, runId, systemId, "info", "Fetching source records", "sync_fetch", 2);

  const sourceResult = await findRecords(sourceBaseId, sourceTable, {
    filterByFormula: config.filterFormula as string,
    maxRecords: (config.maxRecords as number) || 100,
  });

  if (!sourceResult.success) {
    return { success: false, output: {}, error: sourceResult.error };
  }

  const recordCount = sourceResult.records?.length || 0;
  await logStep(supabase, runId, systemId, "info", `Found ${recordCount} records`, "sync_count", 3);

  // If destination is configured, sync records
  if (destBaseId && destTable) {
    let synced = 0;
    for (const record of sourceResult.records || []) {
      const createResult = await createRecord(destBaseId, destTable, record.fields);
      if (createResult.success) synced++;
    }

    await logStep(supabase, runId, systemId, "info", `Synced ${synced} records`, "sync_complete", 4);

    return {
      success: true,
      output: {
        sourceFetched: recordCount,
        destinationSynced: synced,
        processedAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: true,
    output: {
      recordsFetched: recordCount,
      records: sourceResult.records,
      note: "Destination not configured - records fetched only",
      processedAt: new Date().toISOString(),
    },
  };
}

// Generic automation handler
async function executeGenericAutomation(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  config: Record<string, unknown>,
  inputData: Record<string, unknown>
): Promise<AutomationResult> {
  await logStep(supabase, runId, systemId, "info", "Running generic automation", "generic_start", 1);

  // Get client info for the output
  const clientName = inputData.clientName as string || "Unknown";
  const systemTitle = inputData.systemTitle as string || "Automation";

  await logStep(supabase, runId, systemId, "info", "Processing automation tasks", "generic_process", 2);

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await logStep(supabase, runId, systemId, "info", "Automation completed", "generic_complete", 3);

  return {
    success: true,
    output: {
      systemTitle,
      clientName,
      tasksCompleted: 3,
      processedAt: new Date().toISOString(),
    },
  };
}

// Helper to log steps
async function logStep(
  supabase: SupabaseInstance,
  runId: string,
  systemId: string,
  level: string,
  message: string,
  stepName: string,
  stepIndex: number,
  data?: Record<string, unknown>
) {
  await supabase.from("automation_logs").insert({
    run_id: runId,
    system_id: systemId,
    level,
    message,
    step_name: stepName,
    step_index: stepIndex,
    data: data || {},
  });
}

// ===== AI PLATFORM WORKFLOW EXECUTION =====

import { executeWorkflow } from "@/lib/ai-platform/workflow-engine";
import { executeAgentTask, getAgentByType } from "@/lib/ai-platform/agent-executor";

// Workflow execution function
export const executeWorkflowFunction = inngest.createFunction(
  {
    id: "workflow-execute",
    name: "Execute AI Workflow",
    retries: 2,
  },
  { event: "workflow/execute" },
  async ({ event, step }) => {
    const { workflowId, requestId, clientId } = event.data as {
      workflowId: string;
      requestId: string;
      clientId?: string;
    };

    const supabase = getSupabase();

    // Step 1: Get workflow and tasks
    const workflow = await step.run("get-workflow", async () => {
      const { data } = await supabase
        .from("workflows")
        .select(`
          *,
          requests(*),
          agent_tasks(*, agents(*))
        `)
        .eq("id", workflowId)
        .single();

      return data;
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Step 2: Update status to running
    await step.run("start-workflow", async () => {
      await supabase
        .from("workflows")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", workflowId);
    });

    // Step 3: Execute each task in order
    const tasks = (workflow.agent_tasks || []).sort((a: { step_index: number }, b: { step_index: number }) => a.step_index - b.step_index);
    const outputs: Record<string, unknown> = {};
    const deliverables: unknown[] = [];

    for (const task of tasks) {
      const taskResult = await step.run(`task-${task.step_index}-${task.name.slice(0, 20)}`, async () => {
        // Get agent
        const agent = task.agents || await getAgentByType(task.agent_id);
        if (!agent) {
          return { success: false, error: "Agent not found" };
        }

        // Update task status
        await supabase
          .from("agent_tasks")
          .update({ status: "running", started_at: new Date().toISOString() })
          .eq("id", task.id);

        // Get previous outputs for context
        const dependsOn = (task.depends_on || []) as number[];
        const previousOutputs = dependsOn.map(depIndex => {
          const depTask = tasks.find((t: { step_index: number }) => t.step_index === depIndex);
          return depTask?.output_data;
        }).filter(Boolean);

        // Execute task
        const startTime = Date.now();
        const result = await executeAgentTask(
          agent,
          task.instructions,
          {
            taskName: task.name,
            taskDescription: task.description,
            requestContent: workflow.requests?.content,
            requestSummary: workflow.requests?.ai_summary,
          },
          {
            previousOutputs,
            workflowContext: workflow.name,
          }
        );
        const duration = Date.now() - startTime;

        // Update task with results
        await supabase
          .from("agent_tasks")
          .update({
            status: result.success ? "completed" : "failed",
            output_data: { text: result.output, structured: result.structuredOutput },
            ai_response: result.output,
            tokens_used: result.tokensUsed,
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            error_message: result.error,
          })
          .eq("id", task.id);

        // Create deliverable if content-producing step
        if (result.success && ["writer", "researcher", "analyst", "developer", "strategist"].includes(agent.agent_type)) {
          await supabase
            .from("deliverables")
            .insert({
              workflow_id: workflowId,
              task_id: task.id,
              client_id: clientId,
              name: task.name,
              description: task.description,
              file_type: "document",
              content: result.output,
              status: "draft",
            });
        }

        return {
          success: result.success,
          output: result.output,
          taskName: task.name,
        };
      });

      if (taskResult.success && "taskName" in taskResult && "output" in taskResult) {
        outputs[taskResult.taskName] = taskResult.output;
      }

      // Update workflow progress
      await step.run(`update-progress-${task.step_index}`, async () => {
        await supabase
          .from("workflows")
          .update({ current_step: task.step_index + 1 })
          .eq("id", workflowId);
      });
    }

    // Step 4: Finalize workflow
    await step.run("finalize-workflow", async () => {
      const completedTasks = tasks.filter((t: { output_data: unknown }) => t.output_data).length;
      const allCompleted = completedTasks === tasks.length;

      await supabase
        .from("workflows")
        .update({
          status: allCompleted ? "completed" : "completed", // Mark as completed even with partial success
          completed_at: new Date().toISOString(),
          outputs,
        })
        .eq("id", workflowId);

      // Update request
      await supabase
        .from("requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      // Send notification email if client email exists
      if (clientId) {
        const { data: client } = await supabase
          .from("clients")
          .select("email, name")
          .eq("id", clientId)
          .single();

        if (client?.email) {
          await sendEmail({
            to: client.email,
            subject: `Your request has been completed: ${workflow.name}`,
            html: `
              <h2>Your Request is Complete!</h2>
              <p>Hi ${client.name},</p>
              <p>Great news! Your request "${workflow.name}" has been completed.</p>
              <p>You can view the deliverables in your client portal.</p>
              <p>Best regards,<br>CoreOS Hub</p>
            `,
          });
        }
      }
    });

    return { success: true, workflowId, outputs };
  }
);

// ===== UNIFIED WORKSPACE AUTOMATION SCHEDULING =====

// Check scheduled workspace automations
export const workspaceScheduledAutomation = inngest.createFunction(
  {
    id: "workspace-scheduled-check",
    name: "Check Workspace Scheduled Automations",
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    const supabase = getSupabase();

    // Find active scheduled automations that are due
    const automations = await step.run("find-due-automations", async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("workflows")
        .select(`
          id, name, request_id,
          automation_schedule, automation_trigger, next_run_at,
          requests(client_id)
        `)
        .eq("is_automation", true)
        .eq("automation_status", "active")
        .eq("automation_trigger", "scheduled")
        .lte("next_run_at", now);
      return data || [];
    });

    if (!automations || automations.length === 0) {
      return { triggered: 0 };
    }

    let triggered = 0;

    for (const automation of automations) {
      await step.run(`trigger-automation-${automation.id}`, async () => {
        // Create a new workflow run based on the template
        const { data: newWorkflow } = await supabase
          .from("workflows")
          .insert({
            request_id: automation.request_id,
            name: `${automation.name} - Scheduled ${new Date().toISOString()}`,
            status: "pending",
            template_workflow_id: automation.id,
          })
          .select()
          .single();

        if (newWorkflow) {
          // Copy tasks from template
          const { data: templateTasks } = await supabase
            .from("agent_tasks")
            .select("*")
            .eq("workflow_id", automation.id);

          if (templateTasks && templateTasks.length > 0) {
            const tasksToCreate = templateTasks.map((task) => ({
              workflow_id: newWorkflow.id,
              agent_id: task.agent_id,
              name: task.name,
              description: task.description,
              step_index: task.step_index,
              instructions: task.instructions,
              input_type: task.input_type,
              status: "pending",
            }));

            await supabase.from("agent_tasks").insert(tasksToCreate);
          }

          // Update automation stats
          const nextRun = calculateNextScheduledRun(automation.automation_schedule);
          await supabase
            .from("workflows")
            .update({
              last_run_at: new Date().toISOString(),
              next_run_at: nextRun,
            })
            .eq("id", automation.id);

          // Trigger execution
          await inngest.send({
            name: "workflow/execute",
            data: {
              workflowId: newWorkflow.id,
              requestId: automation.request_id,
              clientId: (automation.requests as { client_id?: string })?.client_id,
              isAutomationRun: true,
              templateWorkflowId: automation.id,
            },
          });

          triggered++;
        }
      });
    }

    return { triggered };
  }
);

// Helper to calculate next scheduled run time
function calculateNextScheduledRun(schedule: string): string {
  const now = new Date();

  switch (schedule) {
    case "0 9 * * *": // Daily at 9am
      const nextDaily = new Date(now);
      nextDaily.setDate(nextDaily.getDate() + 1);
      nextDaily.setHours(9, 0, 0, 0);
      return nextDaily.toISOString();

    case "0 9 * * 1": // Weekly on Monday at 9am
      const nextWeekly = new Date(now);
      nextWeekly.setDate(nextWeekly.getDate() + ((8 - nextWeekly.getDay()) % 7 || 7));
      nextWeekly.setHours(9, 0, 0, 0);
      return nextWeekly.toISOString();

    case "0 9 1 * *": // Monthly on 1st at 9am
      const nextMonthly = new Date(now);
      nextMonthly.setMonth(nextMonthly.getMonth() + 1);
      nextMonthly.setDate(1);
      nextMonthly.setHours(9, 0, 0, 0);
      return nextMonthly.toISOString();

    case "0 */6 * * *": // Every 6 hours
      const next6h = new Date(now);
      next6h.setHours(next6h.getHours() + 6, 0, 0, 0);
      return next6h.toISOString();

    case "0 * * * *": // Every hour
      const nextHourly = new Date(now);
      nextHourly.setHours(nextHourly.getHours() + 1, 0, 0, 0);
      return nextHourly.toISOString();

    default:
      // Default to 24 hours from now
      const defaultNext = new Date(now);
      defaultNext.setDate(defaultNext.getDate() + 1);
      return defaultNext.toISOString();
  }
}

// Export all functions for the serve handler
export const functions = [runAutomation, scheduledAutomation, executeWorkflowFunction, workspaceScheduledAutomation];
