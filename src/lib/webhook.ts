import crypto from "crypto";

const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";
const WEBHOOK_TIMESTAMP_HEADER = "x-webhook-timestamp";
const WEBHOOK_ID_HEADER = "x-webhook-id";
const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Generate a webhook secret for a new automation
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

/**
 * Generate a unique webhook ID
 */
export function generateWebhookId(): string {
  return `wh_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Sign a webhook payload
 */
export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  return `v1=${signature}`;
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number
): { valid: boolean; error?: string } {
  // Check timestamp is within tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return { valid: false, error: "Timestamp outside tolerance window" };
  }

  // Parse signature (format: v1=signature)
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "v1") {
    return { valid: false, error: "Invalid signature format" };
  }
  const providedSignature = parts[1];

  // Calculate expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Compare signatures (timing-safe)
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
    return { valid };
  } catch {
    return { valid: false, error: "Signature comparison failed" };
  }
}

/**
 * Extract webhook headers from a request
 */
export function extractWebhookHeaders(headers: Headers): {
  signature: string | null;
  timestamp: number | null;
  webhookId: string | null;
} {
  const signature = headers.get(WEBHOOK_SIGNATURE_HEADER);
  const timestampStr = headers.get(WEBHOOK_TIMESTAMP_HEADER);
  const webhookId = headers.get(WEBHOOK_ID_HEADER);

  return {
    signature,
    timestamp: timestampStr ? parseInt(timestampStr, 10) : null,
    webhookId,
  };
}

/**
 * Create headers for outgoing webhook
 */
export function createWebhookHeaders(
  payload: string,
  secret: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const webhookId = generateWebhookId();
  const signature = signWebhookPayload(payload, secret, timestamp);

  return {
    [WEBHOOK_ID_HEADER]: webhookId,
    [WEBHOOK_TIMESTAMP_HEADER]: timestamp.toString(),
    [WEBHOOK_SIGNATURE_HEADER]: signature,
    "Content-Type": "application/json",
  };
}

/**
 * Verify incoming webhook request
 */
export async function verifyWebhookRequest(
  request: Request,
  secret: string
): Promise<{ valid: boolean; payload?: unknown; error?: string }> {
  const { signature, timestamp, webhookId } = extractWebhookHeaders(
    request.headers
  );

  if (!signature || !timestamp) {
    return { valid: false, error: "Missing signature or timestamp headers" };
  }

  const bodyText = await request.text();
  const verification = verifyWebhookSignature(bodyText, signature, secret, timestamp);

  if (!verification.valid) {
    return verification;
  }

  try {
    const payload = JSON.parse(bodyText);
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Invalid JSON payload" };
  }
}

/**
 * Send a signed webhook request
 */
export async function sendSignedWebhook(
  url: string,
  payload: unknown,
  secret: string,
  options?: {
    timeout?: number;
    retries?: number;
  }
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const { timeout = 30000, retries = 3 } = options || {};

  const bodyString = JSON.stringify(payload);
  const headers = createWebhookHeaders(bodyString, secret);

  let lastError: string | undefined;
  let attempt = 0;

  while (attempt < retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: bodyString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // Retry on 5xx errors
      if (response.status >= 500) {
        lastError = `Server error: ${response.status}`;
        attempt++;
        await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        continue;
      }

      // Don't retry on 4xx errors
      return {
        success: false,
        statusCode: response.status,
        error: `Request failed with status ${response.status}`,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      attempt++;
      if (attempt < retries) {
        await delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  return { success: false, error: lastError };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a webhook payload for automation events
 */
export interface AutomationWebhookPayload {
  event: "automation.started" | "automation.completed" | "automation.failed";
  automation_id: string;
  run_id: string;
  client_id: string;
  timestamp: string;
  data: {
    title: string;
    trigger_type: string;
    status: string;
    duration_ms?: number;
    error?: string;
    output?: unknown;
  };
}

export function createAutomationWebhookPayload(
  event: AutomationWebhookPayload["event"],
  automationId: string,
  runId: string,
  clientId: string,
  data: AutomationWebhookPayload["data"]
): AutomationWebhookPayload {
  return {
    event,
    automation_id: automationId,
    run_id: runId,
    client_id: clientId,
    timestamp: new Date().toISOString(),
    data,
  };
}
