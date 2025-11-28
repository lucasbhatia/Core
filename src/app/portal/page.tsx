import { redirect } from "next/navigation";
import {
  getPortalSession,
  getClientSystems,
  getClientWorkflows,
  getClientAutomations,
  getClientDeliverables,
} from "@/app/actions/portal-auth";
import PortalDashboard from "./portal-dashboard";

export default async function PortalPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  // Fetch all data in parallel
  const [systems, workflows, automations, deliverables] = await Promise.all([
    getClientSystems(session.clientId),
    getClientWorkflows(session.clientId),
    getClientAutomations(session.clientId),
    getClientDeliverables(session.clientId),
  ]);

  return (
    <PortalDashboard
      client={session.client}
      systems={systems}
      workflows={workflows}
      automations={automations}
      deliverables={deliverables}
    />
  );
}
