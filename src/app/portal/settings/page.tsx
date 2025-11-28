import { redirect } from "next/navigation";
import { getPortalSession } from "@/app/actions/portal-auth";
import PortalShell from "@/components/portal/portal-shell";
import SettingsPage from "./settings-page";

export default async function SettingsRoute() {
  const session = await getPortalSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <PortalShell client={session.client} pageTitle="Settings">
      <SettingsPage client={session.client} />
    </PortalShell>
  );
}
