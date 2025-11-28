import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import TemplatesPage from "./templates-page";

export default async function TemplatesRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Automation Templates">
      <TemplatesPage clientId={session.clientId} />
    </PortalShell>
  );
}
