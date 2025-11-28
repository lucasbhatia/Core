import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { generatePortalAccessToken } from "@/app/actions/portal-auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // Find client by email
    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !client) {
      // For security, don't reveal if email exists or not
      // But in development, we'll return a more helpful message
      return NextResponse.json(
        { error: "No account found with this email. Please contact your account manager." },
        { status: 404 }
      );
    }

    // Generate magic link
    const { magicLink, expiresAt } = await generatePortalAccessToken(client.id, email);

    // In production, you would send an email here
    // For now, we'll log it and return success
    console.log("===== MAGIC LINK (Dev Mode) =====");
    console.log(`Email: ${email}`);
    console.log(`Link: ${magicLink}`);
    console.log(`Expires: ${expiresAt}`);
    console.log("=================================");

    // TODO: Send actual email using Resend, SendGrid, etc.
    // await sendEmail({
    //   to: email,
    //   subject: "Your Portal Access Link",
    //   html: `Click here to access your portal: ${magicLink}`
    // });

    return NextResponse.json({
      success: true,
      message: "Access link sent to your email",
      // Only include link in development for testing
      ...(process.env.NODE_ENV === "development" && { devLink: magicLink })
    });

  } catch (error) {
    console.error("Error requesting portal access:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
