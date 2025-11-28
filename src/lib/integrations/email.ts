import { Resend } from "resend";

// Initialize Resend client lazily
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: params.from || "CoreOS Hub <notifications@coreautomations.com>",
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: params.replyTo,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send a notification email to client
 */
export async function sendClientNotification(
  clientEmail: string,
  clientName: string,
  subject: string,
  message: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CoreOS Hub</h1>
        </div>
        <div class="content">
          <p>Hi ${clientName},</p>
          ${message}
          <p>Best regards,<br>CoreOS Hub Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from CoreOS Hub</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  });
}

/**
 * Send automation status update to client
 */
export async function sendAutomationStatusEmail(
  clientEmail: string,
  clientName: string,
  automationName: string,
  status: "success" | "failed",
  details: Record<string, unknown>
): Promise<EmailResult> {
  const statusColor = status === "success" ? "#22c55e" : "#ef4444";
  const statusText = status === "success" ? "Completed Successfully" : "Failed";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .status { padding: 15px; background: ${statusColor}; color: white; text-align: center; font-weight: bold; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Automation Update</h1>
        </div>
        <div class="status">${statusText}</div>
        <div class="content">
          <p>Hi ${clientName},</p>
          <p>Your automation <strong>"${automationName}"</strong> has ${status === "success" ? "completed successfully" : "encountered an issue"}.</p>
          <div class="details">
            <h3>Details:</h3>
            <pre>${JSON.stringify(details, null, 2)}</pre>
          </div>
        </div>
        <div class="footer">
          <p>Log in to your portal to view full details</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: clientEmail,
    subject: `Automation ${statusText}: ${automationName}`,
    html,
  });
}
