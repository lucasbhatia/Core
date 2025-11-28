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
 * GET /api/workspace/automation/[id] - Get automation details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("system_builds")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, automation: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workspace/automation/[id] - Update automation (archive/restore/pause)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const supabase = getSupabase();

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case "archive":
        updateData.automation_status = "archived";
        break;
      case "restore":
        updateData.automation_status = "paused";
        break;
      case "pause":
        updateData.automation_status = "paused";
        break;
      case "activate":
        updateData.automation_status = "active";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: archive, restore, pause, or activate" },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from("system_builds")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Automation ${action}d successfully`,
      automation: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspace/automation/[id] - Delete automation permanently
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    const supabase = getSupabase();

    if (permanent) {
      // Permanently delete - first clean up related data
      const { data: runs } = await supabase
        .from("automation_runs")
        .select("id")
        .eq("system_id", id);

      if (runs && runs.length > 0) {
        const runIds = runs.map((r) => r.id);
        await supabase.from("automation_logs").delete().in("run_id", runIds);
        await supabase.from("automation_runs").delete().eq("system_id", id);
      }

      await supabase.from("automation_metrics").delete().eq("system_id", id);

      const { error } = await supabase
        .from("system_builds")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Automation permanently deleted",
        deleted_runs: runs?.length || 0,
      });
    } else {
      // Soft delete (archive)
      const { data, error } = await supabase
        .from("system_builds")
        .update({
          automation_status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Automation archived",
        automation: data,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
