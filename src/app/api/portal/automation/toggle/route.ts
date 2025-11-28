import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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
 * Calculate next run time based on schedule
 */
function calculateNextRunTime(schedule: string): string {
  const now = new Date();

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

    default:
      const defaultNext = new Date(now);
      defaultNext.setHours(defaultNext.getHours() + 1);
      return defaultNext.toISOString();
  }
}

/**
 * POST /api/portal/automation/toggle - Toggle automation status for portal clients
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Automation ID is required" },
        { status: 400 }
      );
    }

    if (!["active", "inactive", "paused"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'inactive', or 'paused'" },
        { status: 400 }
      );
    }

    // Verify automation exists and belongs to this client
    const { data: automation, error: fetchError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("client_id", clientId)
      .eq("is_automation", true)
      .single();

    if (fetchError || !automation) {
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
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update automation status:", updateError);
      return NextResponse.json(
        { error: "Failed to update automation status" },
        { status: 500 }
      );
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
