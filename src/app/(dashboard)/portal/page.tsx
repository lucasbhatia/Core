import { getClientTools } from "@/app/actions/client-tools";
import { getCurrentUserProfile } from "@/app/actions/user-profiles";
import { redirect } from "next/navigation";
import { PortalClient } from "./portal-client";

export default async function PortalPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // If admin, show all tools (or tools for a specific client if needed)
  // If client, show only their tools
  const tools = await getClientTools(profile.client_id || undefined);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {profile.role === "admin" ? "All Client Tools" : "My Tools"}
        </h2>
        <p className="text-muted-foreground">
          {profile.role === "admin"
            ? "View and test all tools created for clients"
            : "Access your custom AI-powered tools"}
        </p>
      </div>

      <PortalClient tools={tools} profile={profile} />
    </div>
  );
}
