import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { checkPlanLimit, type UsageStats } from "@/lib/plan-gating";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

// Helper to calculate next run time for scheduled automations
function calculateNextRunAt(
  scheduleType: string,
  scheduleTime?: string,
  scheduleDays?: number[],
  timezone = "UTC"
): Date | null {
  const now = new Date();

  if (!scheduleTime) return null;

  const [hours, minutes] = scheduleTime.split(":").map(Number);
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  // If time has passed today, move to next occurrence
  if (nextRun <= now) {
    switch (scheduleType) {
      case "once":
        return null; // Already passed
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        if (scheduleDays && scheduleDays.length > 0) {
          // Find next day in the schedule
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() + i);
            if (scheduleDays.includes(checkDate.getDay())) {
              nextRun.setDate(checkDate.getDate());
              nextRun.setMonth(checkDate.getMonth());
              found = true;
              break;
            }
          }
          if (!found) nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  } else if (scheduleType === "weekly" && scheduleDays && scheduleDays.length > 0) {
    // Check if today is a scheduled day
    if (!scheduleDays.includes(now.getDay())) {
      // Find next scheduled day
      for (let i = 1; i <= 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        if (scheduleDays.includes(checkDate.getDay())) {
          nextRun.setDate(checkDate.getDate());
          nextRun.setMonth(checkDate.getMonth());
          break;
        }
      }
    }
  }

  return nextRun;
}

// Generate webhook URL and secret
function generateWebhookConfig(automationId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";
  const secret = uuidv4().replace(/-/g, "");
  return {
    url: `${baseUrl}/api/automation/webhook/${automationId}`,
    secret,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientId,
      entity,
      name,
      description,
      triggerType,
      schedule,
      condition,
      event,
      actions,
    } = body;

    // Validate required fields
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    if (!entity?.type || !entity?.id || !entity?.title) {
      return NextResponse.json({ error: "entity with type, id, and title is required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!triggerType) {
      return NextResponse.json({ error: "triggerType is required" }, { status: 400 });
    }
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: "at least one action is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check plan limits
    const { data: client } = await supabase
      .from("clients")
      .select("*, subscription:client_subscriptions(*, plan:subscription_plans(*))")
      .eq("id", clientId)
      .single();

    const planTier = client?.subscription?.[0]?.plan?.name?.toLowerCase() || "free";

    // Get current automation count
    const { count: automationsCount } = await supabase
      .from("universal_automations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_active", true)
      .neq("status", "archived");

    const usage: UsageStats = {
      ai_actions_today: 0,
      agent_tasks_today: 0,
      automations_count: automationsCount || 0,
      ai_tokens_this_month: 0,
    };

    const planCheck = checkPlanLimit("automation", planTier, usage);
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: planCheck.reason,
          upgrade_required: planCheck.upgrade_required,
          limit: planCheck.limit,
          current: planCheck.current,
        },
        { status: 429 }
      );
    }

    const automationId = uuidv4();

    // Build automation data
    const automationData: Record<string, unknown> = {
      id: automationId,
      client_id: clientId,
      name,
      description,
      entity_type: entity.type,
      entity_id: entity.id,
      entity_title: entity.title,
      trigger_type: triggerType,
      actions,
      is_active: true,
      status: "active",
      review_status: "approved", // Automations are auto-approved unless configured otherwise
    };

    // Add trigger-specific configuration
    switch (triggerType) {
      case "schedule":
        if (schedule) {
          automationData.schedule_type = schedule.type;
          automationData.schedule_time = schedule.time;
          automationData.schedule_days = schedule.days;
          automationData.schedule_cron = schedule.cron;
          automationData.timezone = schedule.timezone || "UTC";

          // Calculate next run time
          const nextRun = calculateNextRunAt(
            schedule.type,
            schedule.time,
            schedule.days,
            schedule.timezone
          );
          if (nextRun) {
            automationData.next_run_at = nextRun.toISOString();
          }
        }
        break;

      case "condition":
        if (condition) {
          automationData.condition_field = condition.field;
          automationData.condition_operator = condition.operator;
          automationData.condition_value = condition.value;
        }
        break;

      case "event":
        if (event) {
          automationData.event_source = event.source;
          automationData.event_action = event.action;
        }
        break;

      case "webhook":
        const webhookConfig = generateWebhookConfig(automationId);
        automationData.webhook_url = webhookConfig.url;
        automationData.webhook_secret = webhookConfig.secret;
        break;

      case "manual":
        // No additional config needed
        break;
    }

    // Generate Inngest event name
    automationData.inngest_event_name = `automation/${automationId}`;
    automationData.inngest_function_id = `automation-${automationId}`;

    // Create automation
    const { data: automation, error } = await supabase
      .from("universal_automations")
      .insert(automationData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create automation:", error);
      return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
    }

    // Create initial notification
    try {
      await supabase.from("notifications").insert({
        client_id: clientId,
        type: "automation_created",
        title: "New automation created",
        message: `Your automation "${name}" has been created and is now active.`,
        data: {
          automation_id: automationId,
          trigger_type: triggerType,
          entity_type: entity.type,
        },
        read: false,
      });
    } catch (notifyError) {
      console.error("Failed to create notification:", notifyError);
    }

    // Return response
    return NextResponse.json({
      id: automationId,
      name,
      entity,
      trigger_type: triggerType,
      is_active: true,
      run_count: 0,
      next_run_at: automationData.next_run_at || null,
      webhook_url: automationData.webhook_url || null,
      created_at: automation.created_at,
    });

  } catch (error) {
    console.error("Create automation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create automation" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve automations
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const triggerType = searchParams.get("triggerType");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("universal_automations")
      .select("*")
      .eq("client_id", clientId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }
    if (triggerType) {
      query = query.eq("trigger_type", triggerType);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ automations: data });

  } catch (error) {
    console.error("Get automations error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update automation
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      automationId,
      isActive,
      status,
      reviewStatus,
      reviewedBy,
      name,
      description,
    } = body;

    if (!automationId) {
      return NextResponse.json({ error: "automationId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isActive !== undefined) updateData.is_active = isActive;
    if (status !== undefined) updateData.status = status;
    if (reviewStatus !== undefined) {
      updateData.review_status = reviewStatus;
      updateData.reviewed_at = new Date().toISOString();
      if (reviewedBy) updateData.reviewed_by = reviewedBy;
    }
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from("universal_automations")
      .update(updateData)
      .eq("id", automationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ automation: data });

  } catch (error) {
    console.error("Update automation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update automation" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to archive automation
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const automationId = searchParams.get("automationId");

    if (!automationId) {
      return NextResponse.json({ error: "automationId is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Soft delete by setting status to archived
    const { error } = await supabase
      .from("universal_automations")
      .update({
        status: "archived",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", automationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete automation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete automation" },
      { status: 500 }
    );
  }
}
