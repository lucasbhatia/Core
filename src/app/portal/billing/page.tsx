import { redirect } from "next/navigation";
import { getPortalSession, getClientAutomations } from "@/app/actions/portal-auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/portal-shell";
import BillingDashboard from "./billing-dashboard";
import { PLAN_LIMITS } from "@/lib/plan-gating";

export default async function BillingPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Fetch usage data and subscription info in parallel
  const [automations, runsResult, usageResult, subscriptionResult] = await Promise.all([
    getClientAutomations(session.clientId),
    supabase
      .from("automation_runs")
      .select("id, created_at, duration_ms")
      .eq("client_id", session.clientId)
      .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
    supabase
      .from("client_usage")
      .select("*")
      .eq("client_id", session.clientId)
      .eq("month", currentMonth)
      .single(),
    supabase
      .from("client_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("client_id", session.clientId)
      .eq("status", "active")
      .single(),
  ]);

  const runs = runsResult.data || [];
  const usage = usageResult.data;
  const subscription = subscriptionResult.data;
  const activeAutomations = automations?.filter((a) => a.automation_status === "active").length || 0;

  // Get plan limits
  const planName = (subscription?.subscription_plans as { name?: string } | null)?.name?.toLowerCase() || session.client.plan_tier || "free";
  const planLimits = PLAN_LIMITS[planName] || PLAN_LIMITS.free;

  // Calculate usage from actual data
  const currentUsage = {
    automationRuns: runs.length,
    runLimit: planLimits.agent_tasks_per_day * 30, // Monthly approximation
    aiTokens: usage?.ai_tokens_used || 0,
    tokenLimit: planLimits.ai_tokens_per_month,
    activeAutomations,
    automationLimit: planLimits.automations_total,
    storageUsed: usage?.storage_used_mb || 0,
    storageLimit: 1024, // 1GB default
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

  // Get plan details
  const plan = subscription?.subscription_plans as { name?: string; price?: number } | null;
  const currentPlan = {
    name: plan?.name || planName.charAt(0).toUpperCase() + planName.slice(1),
    price: plan?.price || 0,
    billingCycle: "monthly" as const,
    nextBillingDate: subscription?.current_period_end || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  };

  return (
    <PortalShell client={session.client} pageTitle="Usage & Billing">
      <BillingDashboard
        client={session.client}
        currentUsage={currentUsage}
        dailyUsage={dailyUsage}
        currentPlan={currentPlan}
      />
    </PortalShell>
  );
}
