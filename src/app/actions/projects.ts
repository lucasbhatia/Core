"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Project } from "@/types/database";

export async function getProjects(clientId?: string) {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("projects")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
    throw new Error(error.message);
  }

  return data as Project[];
}

export async function getProject(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Project;
}

export async function createProject(formData: {
  client_id: string;
  title: string;
  status: "active" | "paused" | "completed";
  deliverables?: string;
  timeline?: string;
}) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        client_id: formData.client_id,
        title: formData.title,
        status: formData.status,
        deliverables: formData.deliverables || null,
        timeline: formData.timeline || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return data as Project;
}

export async function updateProject(
  id: string,
  formData: {
    client_id: string;
    title: string;
    status: "active" | "paused" | "completed";
    deliverables?: string;
    timeline?: string;
  }
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .update({
      client_id: formData.client_id,
      title: formData.title,
      status: formData.status,
      deliverables: formData.deliverables || null,
      timeline: formData.timeline || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return data as Project;
}

export async function deleteProject(id: string) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
