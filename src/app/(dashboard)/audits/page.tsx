import { createClient } from "@/lib/supabase/server";
import { AuditsTable } from "./audits-table";

async function getAudits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching audits:", error);
    return [];
  }

  return data;
}

async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, company")
    .order("name");

  return data || [];
}

export default async function AuditsPage() {
  const audits = await getAudits();
  const clients = await getClients();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Requests</h2>
        <p className="text-muted-foreground">
          Incoming audit requests from your marketing website
        </p>
      </div>

      <AuditsTable initialAudits={audits} clients={clients} />
    </div>
  );
}
