import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import AIInboxPage from "./ai-inbox-page";

export default async function AIInboxRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Ask AI">
      <AIInboxPage clientId={session.clientId} clientName={session.client.name || "User"} />
    </PortalShell>
  );
}
