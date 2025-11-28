import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AutomationBuilder from "./automation-builder";

export default async function BuilderPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Create Automation" showChat={false}>
      <AutomationBuilder clientId={session.clientId} />
    </PortalShell>
  );
}
