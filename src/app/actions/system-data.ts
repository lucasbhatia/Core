"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type { SystemData, SystemActivity } from "@/types/database";

export async function getSystemSubmissions(systemId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_data")
    .select("*")
    .eq("system_id", systemId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching system submissions:", error);
    return [];
  }

  return data as SystemData[];
}

export async function getSystemActivity(systemId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_activity")
    .select("*")
    .eq("system_id", systemId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching system activity:", error);
    return [];
  }

  return data as SystemActivity[];
}

export async function getClientActivity(clientId: string, systemId?: string) {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("system_activity")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (systemId) {
    query = query.eq("system_id", systemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching client activity:", error);
    return [];
  }

  return data as SystemActivity[];
}

export async function getClientSubmissions(clientId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_data")
    .select("*, system:system_builds(title)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client submissions:", error);
    return [];
  }

  return data;
}

export async function getAllSubmissions() {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_data")
    .select("*, system:system_builds(title), client:clients(name, company)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching all submissions:", error);
    return [];
  }

  return data;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: "active" | "processed" | "archived"
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_data")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemData;
}
