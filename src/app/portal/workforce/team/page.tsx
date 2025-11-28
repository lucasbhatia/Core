import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import TeamPage from "./team-page";

export default async function WorkforceTeamRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  const clientWithPlan = session.client as { plan?: string; company?: string; name?: string } | undefined;
  const clientPlan = clientWithPlan?.plan || "free";

  return (
    <PortalShell client={session.client} pageTitle="AI Team Management">
      <TeamPage
        clientId={session.clientId}
        clientPlan={clientPlan}
        companyName={clientWithPlan?.company || clientWithPlan?.name || "Your Company"}
      />
    </PortalShell>
  );
}
