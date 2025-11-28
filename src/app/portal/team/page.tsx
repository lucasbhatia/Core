import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import TeamPage from "./team-page";

export default async function TeamRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Team">
      <TeamPage client={session.client} />
    </PortalShell>
  );
}
