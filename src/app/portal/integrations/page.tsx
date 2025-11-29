import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import IntegrationsPage from "./integrations-page";

export default async function IntegrationsRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Integrations">
      <IntegrationsPage clientId={session.clientId} />
    </PortalShell>
  );
}
