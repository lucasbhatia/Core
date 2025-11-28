import { redirect } from "next/navigation";
import { getPortalSession, getClientAutomations } from "@/app/actions/portal-auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/portal-shell";
import BillingDashboard from "./billing-dashboard";

export default async function BillingPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const supabase = await createClient();

  // Fetch usage data
  const [automations, runsResult] = await Promise.all([
    getClientAutomations(session.clientId),
    supabase
      .from("automation_runs")
      .select("id, created_at, duration_ms")
      .eq("client_id", session.clientId)
      .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
  ]);

  const runs = runsResult.data || [];
  const activeAutomations = automations?.filter((a) => a.automation_status === "active").length || 0;

  // Calculate usage
  const currentUsage = {
    automationRuns: runs.length,
    runLimit: 500,
    aiTokens: Math.floor(Math.random() * 50000) + 10000, // Placeholder - would come from actual tracking
    tokenLimit: 100000,
    activeAutomations,
    automationLimit: 15,
    storageUsed: 256, // MB - placeholder
    storageLimit: 1024, // MB
  };

  // Group runs by day for billing period
  const runsByDay: Record<string, number> = {};
  runs.forEach((run) => {
    const day = run.created_at.split("T")[0];
    runsByDay[day] = (runsByDay[day] || 0) + 1;
  });

  const dailyUsage = Object.entries(runsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return (
    <PortalShell client={session.client} pageTitle="Usage & Billing">
      <BillingDashboard
        client={session.client}
        currentUsage={currentUsage}
        dailyUsage={dailyUsage}
        currentPlan={{
          name: "Pro",
          price: 149,
          billingCycle: "monthly",
          nextBillingDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        }}
      />
    </PortalShell>
  );
}
