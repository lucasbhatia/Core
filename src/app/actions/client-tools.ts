"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ClientTool, InputField } from "@/types/database";
import { revalidatePath } from "next/cache";
import { isAdmin, getCurrentUserProfile } from "./user-profiles";

export async function getClientTools(clientId?: string): Promise<ClientTool[]> {
  const supabase = await createSupabaseClient();
  const profile = await getCurrentUserProfile();

  if (!profile) return [];

  let query = supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // If admin and clientId provided, filter by client
  // If client user, only show their tools
  if (profile.role === "admin" && clientId) {
    query = query.eq("client_id", clientId);
  } else if (profile.role === "client" && profile.client_id) {
    query = query.eq("client_id", profile.client_id);
  } else if (profile.role === "client") {
    // Client without linked client_id sees nothing
    return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching client tools:", error);
    return [];
  }

  return data || [];
}

export async function getClientTool(toolId: string): Promise<ClientTool | null> {
  const supabase = await createSupabaseClient();
  const profile = await getCurrentUserProfile();

  if (!profile) return null;

  const { data, error } = await supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .eq("id", toolId)
    .single();

  if (error) {
    console.error("Error fetching tool:", error);
    return null;
  }

  // Check access
  if (profile.role === "client" && data.client_id !== profile.client_id) {
    return null;
  }

  return data;
}

export async function getAllClientTools(): Promise<ClientTool[]> {
  const supabase = await createSupabaseClient();

  // Only admins can see all tools
  const admin = await isAdmin();
  if (!admin) return [];

  const { data, error } = await supabase
    .from("client_tools")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all tools:", error);
    return [];
  }

  return data || [];
}

export async function createClientTool(
  tool: Omit<ClientTool, "id" | "created_at" | "updated_at" | "created_by">
): Promise<{ success: boolean; data?: ClientTool; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can create tools
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

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
  revalidatePath("/portal");
  return { success: true, data };
}

export async function updateClientTool(
  toolId: string,
  updates: Partial<Omit<ClientTool, "id" | "created_at" | "updated_at" | "created_by">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can update tools
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("client_tools")
    .update(updates)
    .eq("id", toolId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tool-builder");
  revalidatePath("/portal");
  return { success: true };
}

export async function deleteClientTool(
  toolId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can delete tools
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

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

export async function duplicateToolForClient(
  toolId: string,
  newClientId: string
): Promise<{ success: boolean; data?: ClientTool; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can duplicate tools
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  // Get original tool
  const { data: original, error: fetchError } = await supabase
    .from("client_tools")
    .select("*")
    .eq("id", toolId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: "Tool not found" };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Create copy for new client
  const { data, error } = await supabase
    .from("client_tools")
    .insert({
      client_id: newClientId,
      name: original.name,
      description: original.description,
      icon: original.icon,
      tool_type: original.tool_type,
      system_prompt: original.system_prompt,
      input_fields: original.input_fields,
      output_format: original.output_format,
      is_active: true,
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
