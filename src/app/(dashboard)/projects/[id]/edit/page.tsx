import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectForm } from "../../project-form";

async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
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

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, clients] = await Promise.all([getProject(id), getClients()]);

  if (!project) {
    notFound();
  }

  return <ProjectForm project={project} clients={clients} mode="edit" />;
}
