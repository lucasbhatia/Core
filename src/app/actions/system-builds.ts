"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SystemBuild } from "@/types/database";

export async function getSystemBuilds() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemBuild[];
}

export async function getSystemBuild(id: string) {
  const supabase = await createClient();
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

export async function createSystemBuild(title: string, prompt: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("system_builds")
    .insert([
      {
        title,
        prompt,
        status: "pending",
        result: null,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
  return data as SystemBuild;
}

export async function updateSystemBuildResult(
  id: string,
  result: SystemBuild["result"],
  status: "completed" | "failed"
) {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const { error } = await supabase.from("system_builds").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/system-builder");
}
