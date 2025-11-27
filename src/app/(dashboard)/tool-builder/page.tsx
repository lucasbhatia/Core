import { getAllClientTools } from "@/app/actions/client-tools";
import { getClients } from "@/app/actions/clients";
import { ToolBuilderClient } from "./tool-builder-client";

export default async function ToolBuilderPage() {
  const [tools, clients] = await Promise.all([
    getAllClientTools(),
    getClients(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tool Builder</h2>
        <p className="text-muted-foreground">
          Create and manage AI-powered tools for your clients
        </p>
      </div>

      <ToolBuilderClient initialTools={tools} clients={clients} />
    </div>
  );
}
