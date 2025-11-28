import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import { createClient } from "@/lib/supabase/server";
import PortalShell from "@/components/portal/portal-shell";
import ActivityPage from "./activity-page";

export default async function ActivityRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const supabase = await createClient();

  const [runsResult, activityResult] = await Promise.all([
    supabase
      .from("automation_runs")
      .select("*, system_builds(title)")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("system_activity")
      .select("*")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <PortalShell client={session.client} pageTitle="Activity">
      <ActivityPage
        runs={runsResult.data || []}
        activities={activityResult.data || []}
      />
    </PortalShell>
  );
}
