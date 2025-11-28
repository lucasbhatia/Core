import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/workspace/automation/run - Run an automation manually
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, inputData } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Fetch the automation workflow with its tasks
    const { data: automation, error: workflowError } = await supabase
      .from("workflows")
      .select(`
        *,
        requests(id, content, source, subject, client_id),
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
      .eq("id", workflowId)
      .eq("is_automation", true)
      .single();

    if (workflowError || !automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    // Create a new workflow run based on the automation template
    const { data: newWorkflow, error: createError } = await supabase
      .from("workflows")
      .insert({
        request_id: automation.request_id,
        client_id: automation.client_id,
        name: `${automation.name} - Run ${new Date().toLocaleDateString()}`,
        description: automation.description,
        status: "pending",
        steps: automation.steps || [],
        current_step: 0,
        total_steps: automation.total_steps || 0,
        template_workflow_id: workflowId,
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

      const { error: tasksError } = await supabase
        .from("agent_tasks")
        .insert(tasksToCreate);

      if (tasksError) {
        console.error("Failed to create tasks:", tasksError);
      }
    }

    // Update automation run stats
    await supabase
      .from("workflows")
      .update({
        last_run_at: new Date().toISOString(),
        run_count: (automation.run_count || 0) + 1,
      })
      .eq("id", workflowId);

    // Log the run in client_automation_runs if client exists
    if (automation.client_id) {
      await supabase.from("client_automation_runs").insert({
        client_id: automation.client_id,
        automation_id: workflowId,
        workflow_run_id: newWorkflow.id,
        status: "pending",
        input_data: inputData || {},
      });
    }

    // Trigger workflow execution via Inngest
    await inngest.send({
      name: "workflow/execute",
      data: {
        workflowId: newWorkflow.id,
        requestId: automation.request_id,
        clientId: automation.client_id,
        isAutomationRun: true,
        templateWorkflowId: workflowId,
      },
    });

    return NextResponse.json({
      success: true,
      workflowId: newWorkflow.id,
      message: "Automation started",
    });
  } catch (error) {
    console.error("Run automation error:", error);
    return NextResponse.json(
      { error: "Failed to run automation" },
      { status: 500 }
    );
  }
}
