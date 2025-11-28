import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * POST /api/workspace/automation/webhook/[id] - Trigger automation via webhook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = getSupabase();

    // Fetch the automation
    const { data: automation, error: workflowError } = await supabase
      .from("workflows")
      .select(`
        *,
        requests(content, source, subject, client_id),
        agent_tasks(*)
      `)
      .eq("id", workflowId)
      .eq("is_automation", true)
      .eq("automation_trigger", "webhook")
      .single();

    if (workflowError || !automation) {
      return NextResponse.json(
        { error: "Automation not found or not configured for webhooks" },
        { status: 404 }
      );
    }

    // Verify webhook secret if provided
    const signature = request.headers.get("x-webhook-signature");
    if (automation.webhook_secret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac("sha256", automation.webhook_secret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Check if automation is active
    if (automation.automation_status !== "active") {
      return NextResponse.json(
        { error: "Automation is not active" },
        { status: 400 }
      );
    }

    // Parse request body for input data
    let inputData = {};
    try {
      const rawBody = await request.clone().json();
      inputData = rawBody;
    } catch {
      // Body might not be JSON, that's okay
    }

    // Create a new workflow run based on the automation template
    const { data: newWorkflow, error: createError } = await supabase
      .from("workflows")
      .insert({
        request_id: automation.request_id,
        name: `${automation.name} - Webhook Trigger ${new Date().toISOString()}`,
        description: automation.description,
        status: "pending",
        workflow_type: automation.workflow_type,
        priority: automation.priority,
        template_workflow_id: workflowId,
        input_data: { ...automation.input_data, webhookPayload: inputData },
      })
      .select()
      .single();

    if (createError || !newWorkflow) {
      console.error("Failed to create workflow run:", createError);
      return NextResponse.json(
        { error: "Failed to create workflow run" },
        { status: 500 }
      );
    }

    // Copy agent tasks from the automation template
    if (automation.agent_tasks && automation.agent_tasks.length > 0) {
      const tasksToCreate = automation.agent_tasks.map((task: {
        agent_id: string;
        task_order: number;
        instructions: string;
        input_type: string;
      }) => ({
        workflow_id: newWorkflow.id,
        agent_id: task.agent_id,
        task_order: task.task_order,
        instructions: task.instructions,
        input_type: task.input_type,
        status: "pending",
      }));

      await supabase.from("agent_tasks").insert(tasksToCreate);
    }

    // Update automation run stats
    await supabase
      .from("workflows")
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (automation.run_count || 0) + 1,
      })
      .eq("id", workflowId);

    // Trigger workflow execution via Inngest
    await inngest.send({
      name: "workflow/execute",
      data: {
        workflowId: newWorkflow.id,
        isAutomationRun: true,
        templateWorkflowId: workflowId,
        triggerType: "webhook",
      },
    });

    return NextResponse.json({
      success: true,
      workflowId: newWorkflow.id,
      message: "Automation triggered via webhook",
    });
  } catch (error) {
    console.error("Webhook trigger error:", error);
    return NextResponse.json(
      { error: "Failed to trigger automation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/automation/webhook/[id] - Get webhook info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params;
    const supabase = getSupabase();

    const { data: automation, error } = await supabase
      .from("workflows")
      .select("id, name, automation_trigger, automation_status, webhook_url, webhook_secret")
      .eq("id", workflowId)
      .eq("is_automation", true)
      .single();

    if (error || !automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: automation.id,
      name: automation.name,
      webhookUrl: automation.webhook_url,
      isActive: automation.automation_status === "active",
      // Don't expose the secret in GET requests
    });
  } catch (error) {
    console.error("Get webhook info error:", error);
    return NextResponse.json(
      { error: "Failed to get webhook info" },
      { status: 500 }
    );
  }
}
