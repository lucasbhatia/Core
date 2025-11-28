import { redirect } from "next/navigation";
import { getPortalSession, getClientAutomations } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AutomationsPage from "./automations-page";

export default async function AutomationsRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const automations = await getClientAutomations(session.clientId);

  return (
    <PortalShell client={session.client} pageTitle="My Automations">
      <AutomationsPage
        automations={automations || []}
        clientId={session.clientId}
      />
    </PortalShell>
  );
}
