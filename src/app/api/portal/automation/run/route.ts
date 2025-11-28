import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * POST /api/portal/automation/run - Client runs one of their automations
 */
export async function POST(request: NextRequest) {
  try {
    // Get client from portal session
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = getSupabase();

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 401 });
    }

    const body = await request.json();
    const { automationId, inputData } = body;

    if (!automationId) {
      return NextResponse.json(
        { error: "Automation ID is required" },
        { status: 400 }
      );
    }

    // Fetch the automation - must belong to this client
    const { data: automation, error: automationError } = await supabase
      .from("workflows")
      .select(`
        *,
        requests(id, content, source, subject),
        agent_tasks(
          id,
          agent_id,
          name,
          description,
          instructions,
          step_index,
          depends_on
        )
      `)
      .eq("id", automationId)
      .eq("client_id", clientId)
      .eq("is_automation", true)
      .single();

    if (automationError || !automation) {
      return NextResponse.json(
        { error: "Automation not found or access denied" },
        { status: 404 }
      );
    }

    // Check if automation is active
    if (automation.automation_status !== "active") {
      return NextResponse.json(
        { error: "This automation is not currently active" },
        { status: 400 }
      );
    }

    // Create a new workflow run
    const { data: newWorkflow, error: createError } = await supabase
      .from("workflows")
      .insert({
        request_id: automation.request_id,
        client_id: clientId,
        name: `${automation.name} - Client Run ${new Date().toLocaleDateString()}`,
        description: automation.description,
        status: "pending",
        steps: automation.steps || [],
        current_step: 0,
        total_steps: automation.total_steps || 0,
        template_workflow_id: automationId,
      })
      .select()
      .single();

    if (createError || !newWorkflow) {
      console.error("Failed to create workflow run:", createError);
      return NextResponse.json(
        { error: "Failed to start automation" },
        { status: 500 }
      );
    }

    // Copy agent tasks
    const tasks = automation.agent_tasks || [];
    if (tasks.length > 0) {
      const tasksToCreate = tasks.map((task: {
        agent_id: string;
        name: string;
        description: string;
        instructions: string;
        step_index: number;
        depends_on: number[];
      }) => ({
        workflow_id: newWorkflow.id,
        agent_id: task.agent_id,
        name: task.name,
        description: task.description,
        instructions: task.instructions,
        step_index: task.step_index,
        depends_on: task.depends_on || [],
        status: "pending",
      }));

      await supabase.from("agent_tasks").insert(tasksToCreate);
    }

    // Update automation stats
    await supabase
      .from("workflows")
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (automation.run_count || 0) + 1,
      })
      .eq("id", automationId);

    // Log the client run
    await supabase.from("client_automation_runs").insert({
      client_id: clientId,
      automation_id: automationId,
      workflow_run_id: newWorkflow.id,
      status: "pending",
      input_data: inputData || {},
    });

    // Trigger workflow execution
    await inngest.send({
      name: "workflow/execute",
      data: {
        workflowId: newWorkflow.id,
        requestId: automation.request_id,
        clientId: clientId,
        isAutomationRun: true,
        isClientInitiated: true,
        templateWorkflowId: automationId,
      },
    });

    return NextResponse.json({
      success: true,
      runId: newWorkflow.id,
      message: "Automation started successfully",
    });
  } catch (error) {
    console.error("Portal automation run error:", error);
    return NextResponse.json(
      { error: "Failed to run automation" },
      { status: 500 }
    );
  }
}
