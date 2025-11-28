import { redirect } from "next/navigation";
import {
  getPortalSession,
  getClientAutomations,
  getClientDeliverables,
} from "@/app/actions/portal-auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/portal-shell";
import DashboardHome from "@/components/portal/dashboard-home";

export default async function PortalPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const supabase = await createClient();

  // Fetch all data in parallel
  const [automations, deliverables, activityResult] = await Promise.all([
    getClientAutomations(session.clientId),
    getClientDeliverables(session.clientId),
    supabase
      .from("automation_runs")
      .select("id, status, created_at, system_id")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Transform automation runs into activity items
  const recentActivity = (activityResult.data || []).map((run) => ({
    id: run.id,
    type: run.status === "success" ? "success" : run.status === "failed" ? "error" : "info",
    description: `Automation ${run.status === "success" ? "completed successfully" : run.status === "failed" ? "failed" : "ran"}`,
    created_at: run.created_at,
  }));

  // Calculate usage stats (would come from actual tracking in production)
  const usage = {
    automationRuns: 127,
    runLimit: 500,
    aiTokens: 45000,
    tokenLimit: 100000,
    activeAutomations: automations?.filter((a) => a.automation_status === "active").length || 0,
    automationLimit: 15,
  };

  return (
    <PortalShell client={session.client}>
      <DashboardHome
        client={session.client}
        automations={automations || []}
        deliverables={deliverables || []}
        recentActivity={recentActivity}
        usage={usage}
      />
    </PortalShell>
  );
}
