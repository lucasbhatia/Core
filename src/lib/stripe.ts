import Stripe from "stripe";

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
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
    // Automations
    automations: 1,
    runs: 100,
    tokens: 10000,
    storage: 100,
    team: 1,
    // AI Agents
    agents: 1,
    agent_executions: 50,
    agent_tokens: 10000,
    agent_conversations: 5,
    agent_features: {
      api_access: false,
      webhooks: false,
      scheduled_runs: false,
      custom_agents: false,
      advanced_models: false,
    },
  },
  starter: {
    // Automations
    automations: 3,
    runs: 500,
    tokens: 50000,
    storage: 512,
    team: 1,
    // AI Agents
    agents: 5,
    agent_executions: 500,
    agent_tokens: 100000,
    agent_conversations: 50,
    agent_features: {
      api_access: true,
      webhooks: false,
      scheduled_runs: false,
      custom_agents: true,
      advanced_models: false,
    },
  },
  pro: {
    // Automations
    automations: 15,
    runs: 5000,
    tokens: 100000,
    storage: 2048,
    team: 5,
    // AI Agents
    agents: 25,
    agent_executions: 5000,
    agent_tokens: 500000,
    agent_conversations: 500,
    agent_features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
    },
  },
  business: {
    // Automations
    automations: 50,
    runs: 25000,
    tokens: 500000,
    storage: 10240,
    team: 15,
    // AI Agents
    agents: 100,
    agent_executions: 25000,
    agent_tokens: 2000000,
    agent_conversations: 2500,
    agent_features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
    },
  },
  enterprise: {
    // Automations
    automations: -1, // unlimited
    runs: -1,
    tokens: -1,
    storage: -1,
    team: -1,
    // AI Agents
    agents: -1,
    agent_executions: -1,
    agent_tokens: -1,
    agent_conversations: -1,
    agent_features: {
      api_access: true,
      webhooks: true,
      scheduled_runs: true,
      custom_agents: true,
      advanced_models: true,
    },
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
 * Note: In newer Stripe API versions, usage records are created via billing meters
 */
export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  _timestamp?: number
) {
  // Usage-based billing via meters in newer API
  // For now, return a mock success response
  // In production, implement proper meter event creation
  console.log(`Usage record: ${subscriptionItemId}, quantity: ${quantity}`);
  return { id: `usage_${Date.now()}`, quantity, subscription_item: subscriptionItemId };
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
