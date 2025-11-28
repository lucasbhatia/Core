import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import CalendarPage from "./calendar-page";

export default async function PortalCalendarPage() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="AI Calendar">
      <CalendarPage clientId={session.clientId} />
    </PortalShell>
  );
}
