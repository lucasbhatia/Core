import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import UsageDashboard from "./usage-dashboard";

export default async function Page() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <UsageDashboard
      clientId={session.clientId}
      clientName={session.client?.name || "Client"}
    />
  );
}
