import { redirect } from "next/navigation";
import { getPortalSession, getClientDeliverables } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import DeliverablesPage from "./deliverables-page";

export default async function DeliverablesRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const deliverables = await getClientDeliverables(session.clientId);

  return (
    <PortalShell client={session.client} pageTitle="Results Library">
      <DeliverablesPage deliverables={deliverables || []} />
    </PortalShell>
  );
}
