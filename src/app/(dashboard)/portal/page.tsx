import { getAllClientTools } from "@/app/actions/client-tools";
import { PortalClient } from "./portal-client";

export default async function PortalPage() {
  const tools = await getAllClientTools();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Client Tools</h2>
        <p className="text-muted-foreground">
          Preview and test tools created for clients
        </p>
      </div>

      <PortalClient tools={tools} />
    </div>
  );
}
