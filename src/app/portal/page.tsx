import { redirect } from "next/navigation";
import { getPortalSession, getClientSystems } from "@/app/actions/portal-auth";
import PortalDashboard from "./portal-dashboard";

export default async function PortalPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const systems = await getClientSystems(session.clientId);

  return (
    <PortalDashboard
      client={session.client}
      systems={systems}
    />
  );
}
