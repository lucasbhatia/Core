import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";

async function getClients() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, name, company")
    .order("name");

  return data || [];
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const clients = await getClients();

  return <ProjectForm clients={clients} mode="create" defaultClientId={client} />;
}
