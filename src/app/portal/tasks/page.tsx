import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import TasksPage from "./tasks-page";

export default async function PortalTasksPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="AI Task Manager">
      <TasksPage clientId={session.clientId} />
    </PortalShell>
  );
}
