"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SystemBuild } from "@/types/database";

export async function getSystemBuilds() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching system builds:", error);
    throw new Error(error.message);
  }

  return data as SystemBuild[];
}

export async function getSystemBuild(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemBuild;
}

export async function createSystemBuild(title: string, prompt: string, projectId?: string) {
  const supabase = await createSupabaseClient();

  // If building from a project, auto-assign the project's client
  let clientId: string | null = null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();

    if (project?.client_id) {
      clientId = project.client_id;
    }
  }

  const { data, error } = await supabase
    .from("system_builds")
    .insert([
      {
        title,
        prompt,
        project_id: projectId || null,
        client_id: clientId,
        status: "pending",
        result: null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating system build:", error);
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  if (clientId) {
    revalidatePath(`/clients/${clientId}`);
  }
  return data as SystemBuild;
}

export async function getSystemBuildsByProject(projectId: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project systems:", error);
    return [];
  }

  return data as SystemBuild[];
}

export async function updateSystemBuildResult(
  id: string,
  result: SystemBuild["result"],
  status: "completed" | "failed"
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      result,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
  revalidatePath(`/system-builder/${id}`);
  return data as SystemBuild;
}

export async function deleteSystemBuild(id: string) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase.from("system_builds").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
}

export async function assignClientToSystem(systemId: string, clientId: string | null) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      client_id: clientId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select()
    .single();

  if (error) {
    console.error("Error assigning client to system:", error);
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
  return data as SystemBuild;
}

export async function updateSystemActions(systemId: string, actions: SystemBuild["actions"]) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      actions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating system actions:", error);
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
  return data as SystemBuild;
}
