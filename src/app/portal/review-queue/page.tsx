import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import ReviewQueuePage from "./review-queue-page";

export default async function Page() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Review Queue">
      <ReviewQueuePage
        clientId={session.clientId}
        clientName={session.client?.name || "Client"}
      />
    </PortalShell>
  );
}
