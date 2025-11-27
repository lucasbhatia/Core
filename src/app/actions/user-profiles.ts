"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { UserProfile } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, client:clients(*)")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "admin";
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
  const supabase = await createSupabaseClient();

  // Only admins can see all users
  const admin = await isAdmin();
  if (!admin) return [];

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data || [];
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "client",
  clientId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can change roles
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

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
