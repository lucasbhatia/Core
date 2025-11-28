import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/workspace/automation - Save a workflow as an automation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, schedule, trigger = "manual" } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Verify workflow exists and user has access
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Generate webhook URL if trigger is webhook
    const webhookUrl = trigger === "webhook"
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/workspace/automation/webhook/${workflowId}`
      : null;

    // Update workflow with automation settings
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from("workflows")
      .update({
        is_automation: true,
        automation_trigger: trigger,
        automation_schedule: schedule || null,
        automation_status: "inactive",
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to save automation:", updateError);
      return NextResponse.json(
        { error: "Failed to save automation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      automation: updatedWorkflow,
      message: "Workflow saved as automation",
    });
  } catch (error) {
    console.error("Save automation error:", error);
    return NextResponse.json(
      { error: "Failed to save automation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/automation - List all automations
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: automations, error } = await supabase
      .from("workflows")
      .select(`
        *,
        requests(content, source, subject),
        agent_tasks(count)
      `)
      .eq("is_automation", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch automations:", error);
      return NextResponse.json(
        { error: "Failed to fetch automations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ automations });
  } catch (error) {
    console.error("Get automations error:", error);
    return NextResponse.json(
      { error: "Failed to get automations" },
      { status: 500 }
    );
  }
}
