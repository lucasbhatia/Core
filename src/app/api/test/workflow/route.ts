import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * GET /api/test/workflow - Test the workflow system
 *
 * Creates a test request and workflow to verify the system works
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    // Step 1: Create a test request
    const { data: testRequest, error: requestError } = await supabase
      .from("requests")
      .insert({
        content: "Test request: Please analyze market trends for AI automation tools",
        subject: "Test - Market Analysis Request",
        source: "test",
        status: "pending",
        priority: "medium",
        request_type: "research",
        client_id: clientId || null,
      })
      .select()
      .single();

    if (requestError) {
      return NextResponse.json({
        success: false,
        step: "create_request",
        error: requestError.message,
        hint: "Make sure the 'requests' table exists. Run the AI platform migration.",
      }, { status: 500 });
    }

    // Step 2: Create a test workflow
    const { data: testWorkflow, error: workflowError } = await supabase
      .from("workflows")
      .insert({
        request_id: testRequest.id,
        name: "Test Workflow - Market Analysis",
        description: "Testing the workflow system",
        status: "pending",
        workflow_type: "research",
        priority: "medium",
        total_steps: 3,
        current_step: 0,
      })
      .select()
      .single();

    if (workflowError) {
      // Cleanup the request
      await supabase.from("requests").delete().eq("id", testRequest.id);
      return NextResponse.json({
        success: false,
        step: "create_workflow",
        error: workflowError.message,
        hint: "Make sure the 'workflows' table exists. Run the AI platform migration.",
      }, { status: 500 });
    }

    // Step 3: Get an agent (researcher)
    const { data: agent } = await supabase
      .from("agents")
      .select("id, name")
      .eq("agent_type", "researcher")
      .eq("is_active", true)
      .single();

    if (!agent) {
      return NextResponse.json({
        success: true,
        warning: "No researcher agent found. Create agents first.",
        request: testRequest,
        workflow: testWorkflow,
        nextStep: "Add agents to the 'agents' table or run the AI platform migration",
      });
    }

    // Step 4: Create a test task
    const { data: testTask, error: taskError } = await supabase
      .from("agent_tasks")
      .insert({
        workflow_id: testWorkflow.id,
        agent_id: agent.id,
        name: "Research AI Tools Market",
        description: "Analyze current market trends",
        instructions: "Research and summarize the top AI automation tools",
        step_index: 1,
        status: "pending",
      })
      .select()
      .single();

    if (taskError) {
      return NextResponse.json({
        success: true,
        warning: "Could not create task: " + taskError.message,
        request: testRequest,
        workflow: testWorkflow,
        agent: agent,
      });
    }

    // Step 5: Update workflow status to running
    await supabase
      .from("workflows")
      .update({ status: "running" })
      .eq("id", testWorkflow.id);

    await supabase
      .from("requests")
      .update({ status: "processing" })
      .eq("id", testRequest.id);

    return NextResponse.json({
      success: true,
      message: "Test workflow created successfully!",
      data: {
        request: {
          id: testRequest.id,
          subject: testRequest.subject,
          status: "processing",
        },
        workflow: {
          id: testWorkflow.id,
          name: testWorkflow.name,
          status: "running",
        },
        task: {
          id: testTask.id,
          name: testTask.name,
          agent: agent.name,
        },
      },
      viewAt: {
        workspace: "/workspace",
        portal: clientId ? "/portal" : null,
      },
    });
  } catch (error) {
    console.error("Test workflow error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * POST /api/test/workflow - Trigger the actual workflow execution
 */
export async function POST(request: NextRequest) {
  try {
    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId required" }, { status: 400 });
    }

    // Import inngest dynamically to avoid build issues
    const { inngest } = await import("@/lib/inngest/client");

    await inngest.send({
      name: "workflow/execute",
      data: { workflowId },
    });

    return NextResponse.json({
      success: true,
      message: "Workflow execution triggered via Inngest",
      workflowId,
      checkAt: "http://localhost:8288 (Inngest Dev Server)",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * DELETE /api/test/workflow - Clean up test data
 */
export async function DELETE() {
  try {
    const supabase = getSupabase();

    // Delete test requests and their related data
    const { data: testRequests } = await supabase
      .from("requests")
      .select("id")
      .eq("source", "test");

    if (testRequests && testRequests.length > 0) {
      const requestIds = testRequests.map(r => r.id);

      // Delete workflows (cascades to tasks)
      await supabase
        .from("workflows")
        .delete()
        .in("request_id", requestIds);

      // Delete requests
      await supabase
        .from("requests")
        .delete()
        .in("id", requestIds);
    }

    return NextResponse.json({
      success: true,
      message: "Test data cleaned up",
      deleted: testRequests?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
