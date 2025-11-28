import { NextRequest, NextResponse } from "next/server";
import { stripe, constructWebhookEvent, getPlanFromPriceId } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Initialize Supabase with service role for admin access
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Log the webhook event
  await supabase.from("webhook_events").insert({
    source: "stripe",
    event_type: event.type,
    event_id: event.id,
    payload: JSON.parse(JSON.stringify(event.data.object)) as Record<string, unknown>,
    signature,
    is_verified: true,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(supabase, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(supabase, invoice);
        break;
      }

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(supabase, customer);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Log the error
    await supabase
      .from("webhook_events")
      .update({
        error_message: error instanceof Error ? error.message : "Unknown error"
      })
      .eq("event_id", event.id);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(
  supabase: ReturnType<typeof getSupabase>,
  session: Stripe.Checkout.Session
) {
  const clientId = session.metadata?.client_id;
  if (!clientId) {
    console.error("No client_id in checkout session metadata");
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscriptionData.items.data[0]?.price.id;
  const planId = getPlanFromPriceId(priceId) || "pro";

  // Get period timestamps
  const periodStart = (subscriptionData as unknown as { current_period_start: number }).current_period_start;
  const periodEnd = (subscriptionData as unknown as { current_period_end: number }).current_period_end;

  // Update or create subscription record
  await supabase.from("client_subscriptions").upsert({
    client_id: clientId,
    plan_id: planId,
    status: "active",
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
  }, {
    onConflict: "client_id",
  });

  // Create notification
  await supabase.from("notifications").insert({
    client_id: clientId,
    type: "billing",
    title: "Subscription Activated",
    message: `Welcome to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan! Your subscription is now active.`,
    link: "/portal/billing",
  });
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof getSupabase>,
  subscription: Stripe.Subscription
) {
  const clientId = subscription.metadata?.client_id;
  if (!clientId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const planId = getPlanFromPriceId(priceId) || "pro";

  // Cast subscription to access period properties
  const sub = subscription as unknown as {
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    trial_start: number | null;
    trial_end: number | null;
  };

  await supabase.from("client_subscriptions").upsert({
    client_id: clientId,
    plan_id: planId,
    status: subscription.status as string,
    stripe_subscription_id: subscription.id,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : null,
    trial_start: sub.trial_start
      ? new Date(sub.trial_start * 1000).toISOString()
      : null,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
  }, {
    onConflict: "client_id",
  });
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof getSupabase>,
  subscription: Stripe.Subscription
) {
  const clientId = subscription.metadata?.client_id;
  if (!clientId) return;

  await supabase
    .from("client_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Create notification
  await supabase.from("notifications").insert({
    client_id: clientId,
    type: "billing",
    title: "Subscription Canceled",
    message: "Your subscription has been canceled. You will retain access until the end of your billing period.",
    link: "/portal/billing",
  });
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof getSupabase>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  // Find client by Stripe customer ID
  const { data: subscription } = await supabase
    .from("client_subscriptions")
    .select("client_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subscription) return;

  // Cast invoice to access properties
  const inv = invoice as unknown as {
    payment_intent: string | { id: string } | null;
    amount_paid: number;
    currency: string;
    description: string | null;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    period_start: number | null;
    period_end: number | null;
  };

  // Record the invoice
  await supabase.from("billing_invoices").insert({
    client_id: subscription.client_id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: typeof inv.payment_intent === "string"
      ? inv.payment_intent
      : inv.payment_intent?.id || null,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: "paid",
    description: inv.description,
    invoice_url: inv.hosted_invoice_url,
    invoice_pdf: inv.invoice_pdf,
    period_start: inv.period_start
      ? new Date(inv.period_start * 1000).toISOString()
      : null,
    period_end: inv.period_end
      ? new Date(inv.period_end * 1000).toISOString()
      : null,
    paid_at: new Date().toISOString(),
  });
}

async function handleInvoiceFailed(
  supabase: ReturnType<typeof getSupabase>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const { data: subscription } = await supabase
    .from("client_subscriptions")
    .select("client_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subscription) return;

  // Update subscription status
  await supabase
    .from("client_subscriptions")
    .update({ status: "past_due" })
    .eq("client_id", subscription.client_id);

  // Create notification
  await supabase.from("notifications").insert({
    client_id: subscription.client_id,
    type: "billing",
    title: "Payment Failed",
    message: "We were unable to process your payment. Please update your payment method to avoid service interruption.",
    link: "/portal/billing",
  });
}

async function handleCustomerCreated(
  supabase: ReturnType<typeof getSupabase>,
  customer: Stripe.Customer
) {
  const clientId = customer.metadata?.client_id;
  if (!clientId) return;

  // Update client with Stripe customer ID
  await supabase
    .from("client_subscriptions")
    .upsert({
      client_id: clientId,
      stripe_customer_id: customer.id,
      plan_id: "free",
      status: "active",
    }, {
      onConflict: "client_id",
    });
}
