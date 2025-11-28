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

    // Fetch the automation workflow
    const { data: automation, error: workflowError } = await supabase
      .from("workflows")
      .select(`
        *,
        requests(content, source, subject, client_id),
        agent_tasks(*)
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
        name: `${automation.name} - Run ${new Date().toISOString()}`,
        description: automation.description,
        status: "pending",
        workflow_type: automation.workflow_type,
        priority: automation.priority,
        template_workflow_id: workflowId, // Reference to the automation template
        input_data: inputData || automation.input_data,
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
