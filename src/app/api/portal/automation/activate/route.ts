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
      // Default to 1 hour from now
      const defaultNext = new Date(now);
      defaultNext.setHours(defaultNext.getHours() + 1);
      return defaultNext.toISOString();
  }
}

/**
 * POST /api/portal/automation/activate - Activate a client's automation
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

    const body = await request.json();
    const { automationId } = body;

    if (!automationId) {
      return NextResponse.json(
        { error: "Automation ID is required" },
        { status: 400 }
      );
    }

    // Verify automation exists and belongs to this client
    const { data: automation, error: fetchError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", automationId)
      .eq("client_id", clientId)
      .eq("is_automation", true)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json(
        { error: "Automation not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate next run time if scheduled
    let nextRunAt = null;
    if (automation.automation_trigger === "scheduled" && automation.automation_schedule) {
      nextRunAt = calculateNextRunTime(automation.automation_schedule);
    }

    // Activate the automation
    const { data: updatedAutomation, error: updateError } = await supabase
      .from("workflows")
      .update({
        automation_status: "active",
        status: "active",
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", automationId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to activate automation:", updateError);
      return NextResponse.json(
        { error: "Failed to activate automation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      automation: updatedAutomation,
      message: "Automation activated successfully",
    });
  } catch (error) {
    console.error("Activate automation error:", error);
    return NextResponse.json(
      { error: "Failed to activate automation" },
      { status: 500 }
    );
  }
}
