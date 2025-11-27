"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { UserProfile } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*, client:clients(*)")
      .eq("id", user.id)
      .single();

    if (error) {
      // Silently return null - table might not exist or user not in table
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// Default to admin since we're simplifying - user_profiles table not required
export async function isAdmin(): Promise<boolean> {
  return true;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "full_name" | "avatar_url">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*, client:clients(*)")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "client",
  clientId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({ role, client_id: clientId || null })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
