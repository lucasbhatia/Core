import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AgentAutomationsPage from "./agent-automations-page";

interface AgentAutomationsRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AgentAutomationsRoute({ params }: AgentAutomationsRouteProps) {
  const session = await getPortalSession();
  const { id } = await params;

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Agent Automations">
      <AgentAutomationsPage
        agentId={id}
        clientId={session.clientId}
      />
    </PortalShell>
  );
}
