import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import PlannerPage from "./planner-page";

export default async function PlannerRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Planner">
      <PlannerPage clientId={session.client.id} />
    </PortalShell>
  );
}
