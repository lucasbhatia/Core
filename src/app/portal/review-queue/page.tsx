import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import ReviewQueuePage from "./review-queue-page";

export default async function Page() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <ReviewQueuePage
      clientId={session.clientId}
      clientName={session.client?.name || "Client"}
    />
  );
}
