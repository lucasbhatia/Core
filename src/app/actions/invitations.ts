"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ClientInvitation } from "@/types/database";
import { revalidatePath } from "next/cache";
import { isAdmin } from "./user-profiles";
import { randomBytes } from "crypto";

export async function createInvitation(
  clientId: string,
  email: string
): Promise<{ success: boolean; data?: ClientInvitation; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can create invitations
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Generate unique token
  const token = randomBytes(32).toString("hex");

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("client_invitations")
    .insert({
      client_id: clientId,
      email: email.toLowerCase(),
      token,
      expires_at: expiresAt.toISOString(),
      created_by: user?.id,
    })
    .select("*, client:clients(*)")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clients");
  return { success: true, data };
}

export async function getInvitations(): Promise<ClientInvitation[]> {
  const supabase = await createSupabaseClient();

  // Only admins can see invitations
  const admin = await isAdmin();
  if (!admin) return [];

  const { data, error } = await supabase
    .from("client_invitations")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }

  return data || [];
}

export async function getInvitationByToken(token: string): Promise<ClientInvitation | null> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("client_invitations")
    .select("*, client:clients(*)")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }

  return data;
}

export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can revoke invitations
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("client_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function resendInvitation(
  invitationId: string
): Promise<{ success: boolean; data?: ClientInvitation; error?: string }> {
  const supabase = await createSupabaseClient();

  // Only admins can resend invitations
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  // Generate new token and extend expiration
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("client_invitations")
    .update({
      token,
      expires_at: expiresAt.toISOString(),
      accepted_at: null,
    })
    .eq("id", invitationId)
    .select("*, client:clients(*)")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/clients");
  return { success: true, data };
}
