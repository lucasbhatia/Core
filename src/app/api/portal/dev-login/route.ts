import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PORTAL_SESSION_COOKIE = "portal_session";

// DEV ONLY: Direct login as a client without magic link
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev login not available in production" },
      { status: 403 }
    );
  }

  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // Get the client
    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Create a session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session
    await supabase
      .from("client_access_tokens")
      .insert({
        client_id: clientId,
        email: client.email,
        token: `session_${sessionToken}`,
        expires_at: sessionExpiry.toISOString(),
      });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set(PORTAL_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: false, // Dev mode
      sameSite: "lax",
      expires: sessionExpiry,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: `Logged in as ${client.name}`,
      redirectUrl: "/portal",
    });

  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json(
      { error: "Failed to create dev session" },
      { status: 500 }
    );
  }
}
