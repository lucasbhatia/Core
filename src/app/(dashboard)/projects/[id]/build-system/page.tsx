import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BuildSystemClient } from "./build-system-client";

async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function BuildSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <BuildSystemClient
      projectId={id}
      projectTitle={project.title}
      clientName={project.client?.name || "Unknown Client"}
    />
  );
}
