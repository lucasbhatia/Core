import { createClient } from "@/lib/supabase/server";
import { SystemBuilderClient } from "./system-builder-client";

async function getSystemBuilds() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching system builds:", error);
    return [];
  }

  return data;
}

async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }

  return data;
}

export default async function SystemBuilderPage() {
  const [builds, clients] = await Promise.all([getSystemBuilds(), getClients()]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Builder</h2>
        <p className="text-muted-foreground">
          AI-powered automation system design and planning
        </p>
      </div>

      <SystemBuilderClient initialBuilds={builds} clients={clients} />
    </div>
  );
}
