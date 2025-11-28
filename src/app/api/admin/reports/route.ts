import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportType, ExportFormat, ScheduleType } from "@/types/database";

// GET - Fetch scheduled reports and export history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // scheduled, exports, or both
    const reportType = searchParams.get("report_type") as ReportType | null;

    let response: {
      scheduledReports?: unknown[];
      recentExports?: unknown[];
    } = {};

    if (!type || type === "scheduled" || type === "both") {
      let query = supabase.from("scheduled_reports").select("*");

      if (reportType) {
        query = query.eq("report_type", reportType);
      }

      const { data: scheduledReports, error } = await query
        .order("created_at", { ascending: false });

      if (error) throw error;
      response.scheduledReports = scheduledReports || [];
    }

    if (!type || type === "exports" || type === "both") {
      let query = supabase.from("report_exports").select("*");

      if (reportType) {
        query = query.eq("report_type", reportType);
      }

      const { data: recentExports, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      response.recentExports = recentExports || [];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST - Create scheduled report or trigger export
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    if (action === "schedule") {
      // Create scheduled report
      const {
        name,
        description,
        report_type,
        schedule_type,
        schedule_day,
        schedule_time,
        timezone,
        config,
        filters,
        format,
        recipients,
        created_by,
      } = body;

      if (!name || !report_type || !schedule_type || !format) {
        return NextResponse.json(
          { error: "name, report_type, schedule_type, and format are required" },
          { status: 400 }
        );
      }

      // Calculate next run time
      const now = new Date();
      let nextRun = new Date(now);

      switch (schedule_type as ScheduleType) {
        case "daily":
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case "weekly":
          nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay() + (schedule_day || 1)) % 7);
          break;
        case "monthly":
          nextRun.setMonth(nextRun.getMonth() + 1);
          if (schedule_day) nextRun.setDate(schedule_day);
          break;
        case "quarterly":
          nextRun.setMonth(nextRun.getMonth() + 3);
          break;
      }

      const { data: report, error } = await supabase
        .from("scheduled_reports")
        .insert({
          name,
          description,
          report_type,
          schedule_type,
          schedule_day,
          schedule_time: schedule_time || "09:00:00",
          timezone: timezone || "America/New_York",
          config: config || {},
          filters: filters || {},
          format,
          recipients: recipients || [],
          is_active: true,
          next_run_at: nextRun.toISOString(),
          created_by,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ report, success: true });
    } else if (action === "export") {
      // Trigger immediate export
      const {
        report_type,
        name,
        description,
        format,
        filters,
        created_by,
      } = body;

      if (!report_type || !name || !format) {
        return NextResponse.json(
          { error: "report_type, name, and format are required" },
          { status: 400 }
        );
      }

      // Create export record
      const { data: exportRecord, error } = await supabase
        .from("report_exports")
        .insert({
          report_type,
          name,
          description,
          format,
          filters: filters || {},
          status: "processing",
          started_at: new Date().toISOString(),
          created_by,
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would trigger an async job
      // For now, we'll simulate completion
      setTimeout(async () => {
        await supabase
          .from("report_exports")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            file_url: `/exports/${exportRecord.id}.${format}`,
            file_size_bytes: Math.floor(Math.random() * 1000000),
            row_count: Math.floor(Math.random() * 1000),
          })
          .eq("id", exportRecord.id);
      }, 2000);

      return NextResponse.json({ export: exportRecord, success: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'schedule' or 'export'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

// PUT - Update scheduled report
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    const { data: report, error } = await supabase
      .from("scheduled_reports")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ report, success: true });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete scheduled report
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("scheduled_reports")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
