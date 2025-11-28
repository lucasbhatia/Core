import Stripe from "stripe";

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// Price IDs from Stripe Dashboard (set these after creating products in Stripe)
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || "",
  },
};

// Plan limits for local validation
export const PLAN_LIMITS = {
  free: {
    automations: 1,
    runs: 100,
    tokens: 10000,
    storage: 100,
    team: 1,
  },
  starter: {
    automations: 3,
    runs: 500,
    tokens: 50000,
    storage: 512,
    team: 1,
  },
  pro: {
    automations: 15,
    runs: 5000,
    tokens: 100000,
    storage: 2048,
    team: 5,
  },
  business: {
    automations: 50,
    runs: 25000,
    tokens: 500000,
    storage: 10240,
    team: 15,
  },
  enterprise: {
    automations: -1, // unlimited
    runs: -1,
    tokens: -1,
    storage: -1,
    team: -1,
  },
};

/**
 * Create or retrieve a Stripe customer for a client
 */
export async function getOrCreateCustomer(
  clientId: string,
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // First, check if customer already exists in our database
  // If not, create one in Stripe

  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      client_id: clientId,
      ...metadata,
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  clientId,
  successUrl,
  cancelUrl,
  trialDays,
}: {
  customerId: string;
  priceId: string;
  clientId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      client_id: clientId,
    },
    subscription_data: {
      metadata: {
        client_id: clientId,
      },
    },
  };

  // Add trial if specified
  if (trialDays && trialDays > 0) {
    sessionParams.subscription_data = {
      ...sessionParams.subscription_data,
      trial_period_days: trialDays,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<Stripe.Subscription> {
  if (cancelImmediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a new plan
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

/**
 * Get customer invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

/**
 * Verify webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get usage-based billing record (for metered billing)
 */
export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    action: "increment",
  });
}

/**
 * Get plan features from price ID
 */
export function getPlanFromPriceId(priceId: string): string | null {
  for (const [plan, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return plan;
    }
  }
  return null;
}
