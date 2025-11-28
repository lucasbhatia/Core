import { redirect } from "next/navigation";
import { getPortalSession, getClientAutomations } from "@/app/actions/portal-auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/portal-shell";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AnalyticsPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const supabase = await createClient();

  // Fetch data for analytics
  const [automations, runsResult, metricsResult] = await Promise.all([
    getClientAutomations(session.clientId),
    supabase
      .from("automation_runs")
      .select("*")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("automation_metrics")
      .select("*")
      .eq("client_id", session.clientId)
      .order("metric_date", { ascending: false })
      .limit(30),
  ]);

  const runs = runsResult.data || [];
  const metrics = metricsResult.data || [];

  // Calculate analytics
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.status === "success").length;
  const failedRuns = runs.filter((r) => r.status === "failed").length;
  const avgDuration = runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / (totalRuns || 1);
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

  // Group runs by day for chart
  const runsByDay: Record<string, { success: number; failed: number }> = {};
  runs.forEach((run) => {
    const day = run.created_at.split("T")[0];
    if (!runsByDay[day]) {
      runsByDay[day] = { success: 0, failed: 0 };
    }
    if (run.status === "success") {
      runsByDay[day].success++;
    } else if (run.status === "failed") {
      runsByDay[day].failed++;
    }
  });

  const chartData = Object.entries(runsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, data]) => ({
      date,
      success: data.success,
      failed: data.failed,
    }));

  return (
    <PortalShell client={session.client} pageTitle="Analytics">
      <AnalyticsDashboard
        automations={automations || []}
        stats={{
          totalRuns,
          successfulRuns,
          failedRuns,
          avgDuration: Math.round(avgDuration),
          successRate,
        }}
        chartData={chartData}
        recentRuns={runs.slice(0, 10)}
      />
    </PortalShell>
  );
}
