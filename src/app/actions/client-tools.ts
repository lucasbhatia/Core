"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ClientTool } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getClientTools(clientId?: string): Promise<ClientTool[]> {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;

  if (error) {
    // Table might not exist yet
    if (!error.message?.includes("does not exist")) {
      console.error("Error fetching client tools:", error);
    }
    return [];
  }

  return data || [];
}

export async function getClientTool(toolId: string): Promise<ClientTool | null> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .eq("id", toolId)
    .single();

  if (error) {
    console.error("Error fetching tool:", error);
    return null;
  }

  return data;
}

export async function getAllClientTools(): Promise<ClientTool[]> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (error) {
    // Table might not exist yet
    if (!error.message?.includes("does not exist")) {
      console.error("Error fetching all tools:", error);
    }
    return [];
  }

  return data || [];
}

export async function createClientTool(
  tool: Omit<ClientTool, "id" | "created_at" | "updated_at" | "created_by">
): Promise<{ success: boolean; data?: ClientTool; error?: string }> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("client_tools")
    .insert({
      ...tool,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tool-builder");
  return { success: true, data };
}

export async function updateClientTool(
  toolId: string,
  updates: Partial<Omit<ClientTool, "id" | "created_at" | "updated_at" | "created_by">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("client_tools")
    .update(updates)
    .eq("id", toolId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tool-builder");
  return { success: true };
}

export async function deleteClientTool(
  toolId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("client_tools")
    .delete()
    .eq("id", toolId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tool-builder");
  return { success: true };
}
