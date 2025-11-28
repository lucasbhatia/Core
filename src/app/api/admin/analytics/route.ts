import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch comprehensive admin analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y
    const metric = searchParams.get("metric"); // specific metric to fetch

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const startDateStr = startDate.toISOString();

    // Fetch all metrics in parallel
    const [
      clientsResult,
      projectsResult,
      automationsResult,
      automationRunsResult,
      usageResult,
      revenueResult,
      auditsResult,
    ] = await Promise.all([
      // Total clients & growth
      supabase.from("clients").select("id, created_at"),

      // Total projects by status
      supabase.from("projects").select("id, status, created_at"),

      // Automations (system builds) stats
      supabase.from("system_builds").select("id, automation_status, run_count, error_count, created_at"),

      // Automation runs for period
      supabase
        .from("automation_runs")
        .select("id, status, trigger_type, duration_ms, created_at")
        .gte("created_at", startDateStr),

      // Usage metrics
      supabase
        .from("client_usage")
        .select("*")
        .gte("created_at", startDateStr),

      // Revenue from subscriptions
      supabase
        .from("client_subscriptions")
        .select("*, plan:subscription_plans(price_monthly)")
        .eq("status", "active"),

      // Audit requests
      supabase.from("audits").select("id, status, created_at"),
    ]);

    // Calculate client metrics
    const totalClients = clientsResult.data?.length || 0;
    const newClients = clientsResult.data?.filter(
      (c) => new Date(c.created_at) >= startDate
    ).length || 0;

    // Calculate project metrics
    const projects = projectsResult.data || [];
    const projectsByStatus = {
      active: projects.filter((p) => p.status === "active").length,
      paused: projects.filter((p) => p.status === "paused").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };

    // Calculate automation metrics
    const automations = automationsResult.data || [];
    const automationsByStatus = {
      active: automations.filter((a) => a.automation_status === "active").length,
      pending: automations.filter((a) => a.automation_status === "pending").length,
      paused: automations.filter((a) => a.automation_status === "paused").length,
      error: automations.filter((a) => a.automation_status === "error").length,
    };
    const totalRuns = automations.reduce((sum, a) => sum + (a.run_count || 0), 0);
    const totalErrors = automations.reduce((sum, a) => sum + (a.error_count || 0), 0);

    // Calculate run metrics
    const runs = automationRunsResult.data || [];
    const runsByStatus = {
      success: runs.filter((r) => r.status === "success").length,
      failed: runs.filter((r) => r.status === "failed").length,
      running: runs.filter((r) => r.status === "running").length,
    };
    const runsByTrigger = {
      webhook: runs.filter((r) => r.trigger_type === "webhook").length,
      scheduled: runs.filter((r) => r.trigger_type === "scheduled").length,
      manual: runs.filter((r) => r.trigger_type === "manual").length,
      api: runs.filter((r) => r.trigger_type === "api").length,
    };
    const avgDuration = runs.length > 0
      ? runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / runs.length
      : 0;

    // Calculate usage metrics
    const usage = usageResult.data || [];
    const totalAutomationRuns = usage.reduce((sum, u) => sum + u.automation_runs, 0);
    const totalAiTokens = usage.reduce((sum, u) => sum + u.ai_tokens_used, 0);
    const totalApiCalls = usage.reduce((sum, u) => sum + u.api_calls, 0);

    // Calculate revenue (MRR)
    const subscriptions = revenueResult.data || [];
    const mrr = subscriptions.reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0);

    // Calculate audit metrics
    const audits = auditsResult.data || [];
    const auditsByStatus = {
      new: audits.filter((a) => a.status === "new").length,
      inProgress: audits.filter((a) => a.status === "in-progress").length,
      completed: audits.filter((a) => a.status === "completed").length,
    };

    // Generate time series data for charts
    const generateTimeSeries = (items: { created_at: string }[], days: number) => {
      const series: { date: string; count: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const count = items.filter((item) =>
          item.created_at.startsWith(dateStr)
        ).length;
        series.push({ date: dateStr, count });
      }
      return series;
    };

    const daysInPeriod = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

    return NextResponse.json({
      overview: {
        totalClients,
        newClients,
        clientGrowth: totalClients > 0 ? ((newClients / totalClients) * 100).toFixed(1) : 0,
        totalProjects: projects.length,
        totalAutomations: automations.length,
        activeAutomations: automationsByStatus.active,
        mrr,
        mrrFormatted: `$${mrr.toLocaleString()}`,
      },
      clients: {
        total: totalClients,
        new: newClients,
        timeSeries: generateTimeSeries(clientsResult.data || [], Math.min(daysInPeriod, 30)),
      },
      projects: {
        total: projects.length,
        byStatus: projectsByStatus,
        newProjects: projects.filter((p) => new Date(p.created_at) >= startDate).length,
      },
      automations: {
        total: automations.length,
        byStatus: automationsByStatus,
        totalRuns,
        totalErrors,
        errorRate: totalRuns > 0 ? ((totalErrors / totalRuns) * 100).toFixed(2) : 0,
      },
      runs: {
        total: runs.length,
        byStatus: runsByStatus,
        byTrigger: runsByTrigger,
        avgDuration: Math.round(avgDuration),
        successRate: runs.length > 0
          ? ((runsByStatus.success / runs.length) * 100).toFixed(1)
          : 0,
        timeSeries: generateTimeSeries(runs, Math.min(daysInPeriod, 30)),
      },
      usage: {
        automationRuns: totalAutomationRuns,
        aiTokens: totalAiTokens,
        apiCalls: totalApiCalls,
      },
      audits: {
        total: audits.length,
        byStatus: auditsByStatus,
        pending: auditsByStatus.new,
      },
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
