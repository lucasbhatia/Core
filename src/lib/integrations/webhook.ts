export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  data?: unknown;
  error?: string;
}

export interface WebhookOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * Send a webhook request to any URL
 */
export async function sendWebhook(
  url: string,
  options: WebhookOptions = {}
): Promise<WebhookResult> {
  const { method = "POST", headers = {}, body, timeout = 30000 } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      statusCode: response.status,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook request failed",
    };
  }
}

/**
 * Send data to a Zapier webhook
 */
export async function sendToZapier(
  webhookUrl: string,
  data: Record<string, unknown>
): Promise<WebhookResult> {
  return sendWebhook(webhookUrl, {
    method: "POST",
    body: data,
  });
}

/**
 * Send data to a Make (Integromat) webhook
 */
export async function sendToMake(
  webhookUrl: string,
  data: Record<string, unknown>
): Promise<WebhookResult> {
  return sendWebhook(webhookUrl, {
    method: "POST",
    body: data,
  });
}

/**
 * Send a Slack notification
 */
export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
  options?: {
    channel?: string;
    username?: string;
    icon_emoji?: string;
    attachments?: Array<{
      color?: string;
      title?: string;
      text?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
    }>;
  }
): Promise<WebhookResult> {
  return sendWebhook(webhookUrl, {
    method: "POST",
    body: {
      text: message,
      channel: options?.channel,
      username: options?.username || "CoreOS Hub",
      icon_emoji: options?.icon_emoji || ":robot_face:",
      attachments: options?.attachments,
    },
  });
}

/**
 * Send a Discord notification
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  content: string,
  options?: {
    username?: string;
    avatar_url?: string;
    embeds?: Array<{
      title?: string;
      description?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    }>;
  }
): Promise<WebhookResult> {
  return sendWebhook(webhookUrl, {
    method: "POST",
    body: {
      content,
      username: options?.username || "CoreOS Hub",
      avatar_url: options?.avatar_url,
      embeds: options?.embeds,
    },
  });
}

/**
 * Call a custom API endpoint with authentication
 */
export async function callAPI(
  url: string,
  options: WebhookOptions & {
    auth?: {
      type: "bearer" | "basic" | "api-key";
      token?: string;
      username?: string;
      password?: string;
      apiKeyHeader?: string;
      apiKeyValue?: string;
    };
  }
): Promise<WebhookResult> {
  const headers: Record<string, string> = { ...options.headers };

  if (options.auth) {
    switch (options.auth.type) {
      case "bearer":
        headers["Authorization"] = `Bearer ${options.auth.token}`;
        break;
      case "basic":
        const credentials = btoa(`${options.auth.username}:${options.auth.password}`);
        headers["Authorization"] = `Basic ${credentials}`;
        break;
      case "api-key":
        if (options.auth.apiKeyHeader && options.auth.apiKeyValue) {
          headers[options.auth.apiKeyHeader] = options.auth.apiKeyValue;
        }
        break;
    }
  }

  return sendWebhook(url, { ...options, headers });
}
