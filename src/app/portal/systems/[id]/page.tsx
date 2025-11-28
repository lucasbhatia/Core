import { redirect, notFound } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import { getSystemBuild } from "@/app/actions/system-builds";
import { getClientAutomationRuns, getAutomationStats } from "@/app/actions/automations";
import AutomationPortalClient from "./automation-portal-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function SystemPortalPage({ params, searchParams }: PageProps) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const { id } = await params;

  try {
    const system = await getSystemBuild(id);

    // Verify client has access to this system
    if (system.client_id !== session.clientId) {
      notFound();
    }

    // Fetch automation data
    const [recentRuns, stats] = await Promise.all([
      getClientAutomationRuns(session.clientId, id, 10),
      getAutomationStats(id),
    ]);

    return (
      <AutomationPortalClient
        system={system}
        client={session.client}
        recentRuns={recentRuns}
        stats={stats}
      />
    );
  } catch (error) {
    notFound();
  }
}
