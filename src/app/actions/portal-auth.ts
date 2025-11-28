"use server";

import { createClient as createSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Client, ClientAccessToken } from "@/types/database";
import crypto from "crypto";

const PORTAL_SESSION_COOKIE = "portal_session";
const TOKEN_EXPIRY_HOURS = 24;

// Generate a magic link token for a client
export async function generatePortalAccessToken(clientId: string, email: string) {
  const supabase = await createSupabaseClient();

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("client_access_tokens")
    .insert({
      client_id: clientId,
      email,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error generating access token:", error);
    throw new Error("Failed to generate access link");
  }

  // Return the full magic link URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/portal/verify?token=${token}`;

  return { token, magicLink, expiresAt };
}

// Verify a magic link token and create a session
export async function verifyPortalToken(token: string) {
  const supabase = await createSupabaseClient();

  // Find the token
  const { data: tokenData, error: tokenError } = await supabase
    .from("client_access_tokens")
    .select("*, client:clients(*)")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return { success: false, error: "Invalid or expired link" };
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { success: false, error: "This link has expired. Please request a new one." };
  }

  // Check if token was already used
  if (tokenData.used_at) {
    return { success: false, error: "This link has already been used." };
  }

  // Mark token as used
  await supabase
    .from("client_access_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  // Create a session token
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store session in a new token (reusing the table)
  await supabase
    .from("client_access_tokens")
    .insert({
      client_id: tokenData.client_id,
      email: tokenData.email,
      token: `session_${sessionToken}`,
      expires_at: sessionExpiry.toISOString(),
    });

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: sessionExpiry,
    path: "/",
  });

  return {
    success: true,
    clientId: tokenData.client_id,
    client: tokenData.client as Client
  };
}

// Get current portal session
export async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("client_access_tokens")
    .select("*, client:clients(*)")
    .eq("token", `session_${sessionToken}`)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    await logoutPortal();
    return null;
  }

  return {
    clientId: data.client_id,
    email: data.email,
    client: data.client as Client,
  };
}

// Logout from portal
export async function logoutPortal() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;

  if (sessionToken) {
    const supabase = await createSupabaseClient();
    // Delete the session token
    await supabase
      .from("client_access_tokens")
      .delete()
      .eq("token", `session_${sessionToken}`);
  }

  cookieStore.delete(PORTAL_SESSION_COOKIE);
}

// Get client's systems (for portal display)
export async function getClientSystems(clientId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .select("*, project:projects(*)")
    .eq("client_id", clientId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client systems:", error);
    return [];
  }

  return data;
}
