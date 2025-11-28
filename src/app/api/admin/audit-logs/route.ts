import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AdminAuditLog, AuditResourceType, AuditSeverity } from "@/types/database";

// GET - Fetch audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const resourceType = searchParams.get("resource_type") as AuditResourceType | null;
    const severity = searchParams.get("severity") as AuditSeverity | null;
    const userId = searchParams.get("user_id");
    const action = searchParams.get("action");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const search = searchParams.get("search");

    let query = supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" });

    // Apply filters
    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }
    if (severity) {
      query = query.eq("severity", severity);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,resource_name.ilike.%${search}%,user_email.ilike.%${search}%`
      );
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: logs, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

// POST - Create new audit log entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      user_id,
      user_email,
      action,
      resource_type,
      resource_id,
      resource_name,
      description,
      metadata = {},
      severity = "info",
    } = body;

    if (!user_id || !action || !resource_type) {
      return NextResponse.json(
        { error: "user_id, action, and resource_type are required" },
        { status: 400 }
      );
    }

    // Get IP and user agent from headers
    const ip_address = request.headers.get("x-forwarded-for") ||
                       request.headers.get("x-real-ip") ||
                       "unknown";
    const user_agent = request.headers.get("user-agent") || "";

    const { data: log, error } = await supabase
      .from("admin_audit_logs")
      .insert({
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        resource_name,
        description,
        metadata,
        ip_address,
        user_agent,
        severity,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ log, success: true });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
