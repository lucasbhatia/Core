import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import ProjectsPage from "./projects-page";

export default async function PortalProjectsPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="AI Projects">
      <ProjectsPage clientId={session.clientId} />
    </PortalShell>
  );
}
