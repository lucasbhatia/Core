import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AgentWorkspace from "./agent-workspace";

interface AgentWorkspaceRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AgentWorkspaceRoute({ params }: AgentWorkspaceRouteProps) {
  const session = await getPortalSession();
  const { id } = await params;

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Agent Workspace">
      <AgentWorkspace
        agentId={id}
        clientId={session.clientId}
      />
    </PortalShell>
  );
}
