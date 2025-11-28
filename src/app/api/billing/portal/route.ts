import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { cookies } from "next/headers";

// Get client session from portal cookie
async function getClientSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("portal_session");
  if (!sessionData?.value) return null;

  try {
    return JSON.parse(sessionData.value);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get client's Stripe customer ID from subscription
    const { data: subscription } = await supabase
      .from("client_subscriptions")
      .select("stripe_customer_id")
      .eq("client_id", session.clientId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const portalSession = await createBillingPortalSession(
      subscription.stripe_customer_id,
      `${origin}/portal/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
