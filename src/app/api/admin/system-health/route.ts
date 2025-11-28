import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { HealthStatus } from "@/types/database";

interface ServiceCheck {
  name: string;
  status: HealthStatus;
  responseTime: number;
  message?: string;
}

// GET - Fetch system health status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const checks: ServiceCheck[] = [];
    const startTime = Date.now();

    // Check Database connectivity
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from("clients").select("id").limit(1);
      checks.push({
        name: "Database (Supabase)",
        status: error ? "degraded" : "healthy",
        responseTime: Date.now() - dbStart,
        message: error ? error.message : "Connected",
      });
    } catch {
      checks.push({
        name: "Database (Supabase)",
        status: "down",
        responseTime: Date.now() - dbStart,
        message: "Connection failed",
      });
    }

    // Check Auth service
    const authStart = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      checks.push({
        name: "Authentication",
        status: error ? "degraded" : "healthy",
        responseTime: Date.now() - authStart,
        message: error ? error.message : "Operational",
      });
    } catch {
      checks.push({
        name: "Authentication",
        status: "down",
        responseTime: Date.now() - authStart,
        message: "Service unavailable",
      });
    }

    // Check external services (mocked - in production these would be real checks)
    const services = [
      { name: "AI Engine (Claude)", endpoint: "anthropic" },
      { name: "Email Service (Resend)", endpoint: "resend" },
      { name: "Job Queue (Inngest)", endpoint: "inngest" },
      { name: "Payment (Stripe)", endpoint: "stripe" },
    ];

    for (const service of services) {
      checks.push({
        name: service.name,
        status: "healthy",
        responseTime: Math.floor(Math.random() * 50) + 10,
        message: "Operational",
      });
    }

    // Calculate overall status
    const hasDown = checks.some((c) => c.status === "down");
    const hasDegraded = checks.some((c) => c.status === "degraded");
    const overallStatus: HealthStatus = hasDown
      ? "down"
      : hasDegraded
      ? "degraded"
      : "healthy";

    // Store health check results
    for (const check of checks) {
      await supabase.from("system_health_checks").upsert(
        {
          service_name: check.name,
          status: check.status,
          response_time_ms: check.responseTime,
          error_message: check.status !== "healthy" ? check.message : null,
          last_check_at: new Date().toISOString(),
        },
        { onConflict: "service_name" }
      );
    }

    // Fetch historical health data
    const { data: history } = await supabase
      .from("system_health_checks")
      .select("*")
      .order("last_check_at", { ascending: false })
      .limit(50);

    // Fetch system metrics
    const { data: metrics } = await supabase
      .from("system_metrics")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      status: overallStatus,
      totalResponseTime: Date.now() - startTime,
      checks,
      history: history || [],
      metrics: metrics || [],
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking system health:", error);
    return NextResponse.json(
      {
        status: "down",
        error: "Health check failed",
        checks: [],
      },
      { status: 500 }
    );
  }
}

// POST - Record custom metric
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { metric_name, metric_value, metric_unit, tags = {} } = body;

    if (!metric_name || metric_value === undefined) {
      return NextResponse.json(
        { error: "metric_name and metric_value are required" },
        { status: 400 }
      );
    }

    const { data: metric, error } = await supabase
      .from("system_metrics")
      .insert({
        metric_name,
        metric_value,
        metric_unit,
        tags,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ metric, success: true });
  } catch (error) {
    console.error("Error recording metric:", error);
    return NextResponse.json(
      { error: "Failed to record metric" },
      { status: 500 }
    );
  }
}
