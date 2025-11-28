import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/workspace/automation/toggle - Activate or pause an automation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, status } = body;

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    if (!["active", "inactive", "paused"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'inactive', or 'paused'" },
        { status: 400 }
      );
    }

    // Verify automation exists
    const { data: automation, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("is_automation", true)
      .single();

    if (workflowError || !automation) {
      return NextResponse.json(
        { error: "Automation not found" },
        { status: 404 }
      );
    }

    // Calculate next run time if activating a scheduled automation
    let nextRunAt = null;
    if (status === "active" && automation.automation_trigger === "scheduled" && automation.automation_schedule) {
      nextRunAt = calculateNextRunTime(automation.automation_schedule);
    }

    // Update automation status
    const { data: updatedAutomation, error: updateError } = await supabase
      .from("workflows")
      .update({
        automation_status: status,
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update automation status:", updateError);
      return NextResponse.json(
        { error: "Failed to update automation status" },
        { status: 500 }
      );
    }

    // If activating a scheduled automation, schedule it via Inngest
    if (status === "active" && automation.automation_trigger === "scheduled" && automation.automation_schedule) {
      await inngest.send({
        name: "automation/schedule",
        data: {
          workflowId,
          schedule: automation.automation_schedule,
        },
      });
    }

    return NextResponse.json({
      success: true,
      automation: updatedAutomation,
      message: `Automation ${status === "active" ? "activated" : status === "paused" ? "paused" : "deactivated"}`,
    });
  } catch (error) {
    console.error("Toggle automation error:", error);
    return NextResponse.json(
      { error: "Failed to toggle automation" },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRunTime(schedule: string): string {
  const now = new Date();

  // Handle preset schedules
  switch (schedule) {
    case "0 9 * * *": // Daily at 9am
      const nextDaily = new Date(now);
      nextDaily.setHours(9, 0, 0, 0);
      if (nextDaily <= now) {
        nextDaily.setDate(nextDaily.getDate() + 1);
      }
      return nextDaily.toISOString();

    case "0 9 * * 1": // Weekly on Monday at 9am
      const nextWeekly = new Date(now);
      nextWeekly.setHours(9, 0, 0, 0);
      const daysUntilMonday = (8 - nextWeekly.getDay()) % 7 || 7;
      nextWeekly.setDate(nextWeekly.getDate() + daysUntilMonday);
      return nextWeekly.toISOString();

    case "0 9 1 * *": // Monthly on 1st at 9am
      const nextMonthly = new Date(now);
      nextMonthly.setDate(1);
      nextMonthly.setHours(9, 0, 0, 0);
      if (nextMonthly <= now) {
        nextMonthly.setMonth(nextMonthly.getMonth() + 1);
      }
      return nextMonthly.toISOString();

    case "0 */6 * * *": // Every 6 hours
      const next6h = new Date(now);
      const currentHour = next6h.getHours();
      const nextHour = Math.ceil(currentHour / 6) * 6;
      next6h.setHours(nextHour >= 24 ? 6 : nextHour, 0, 0, 0);
      if (next6h <= now) {
        next6h.setHours(next6h.getHours() + 6);
      }
      return next6h.toISOString();

    case "0 * * * *": // Every hour
      const nextHourly = new Date(now);
      nextHourly.setHours(nextHourly.getHours() + 1, 0, 0, 0);
      return nextHourly.toISOString();

    default:
      // For custom cron expressions, default to 1 hour from now
      const defaultNext = new Date(now);
      defaultNext.setHours(defaultNext.getHours() + 1);
      return defaultNext.toISOString();
  }
}
