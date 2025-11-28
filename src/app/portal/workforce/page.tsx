import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import WorkforcePage from "./workforce-page";

export default async function WorkforceRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  // Get plan from client data (with fallback to free tier)
  const clientWithPlan = session.client as { plan?: string } | undefined;
  const clientPlan = clientWithPlan?.plan || "free";

  return (
    <PortalShell client={session.client} pageTitle="AI Workforce">
      <WorkforcePage
        clientId={session.clientId}
        clientPlan={clientPlan}
      />
    </PortalShell>
  );
}
