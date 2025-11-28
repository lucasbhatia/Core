import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  STRIPE_PRICES,
} from "@/lib/stripe";
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

    const { planId, interval = "monthly" } = await request.json();

    if (!planId || !["starter", "pro", "business"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get client details
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", session.clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      client.id,
      client.email,
      client.name,
      { company: client.company }
    );

    // Get the price ID
    const priceKey = interval === "yearly" ? "yearly" : "monthly";
    const priceId = STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES]?.[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured. Please contact support." },
        { status: 400 }
      );
    }

    // Create checkout session
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const checkoutSession = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      clientId: client.id,
      successUrl: `${origin}/portal/billing?success=true`,
      cancelUrl: `${origin}/portal/billing?canceled=true`,
      trialDays: planId === "pro" ? 14 : undefined, // 14-day trial for Pro
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
