import { Resend } from "resend";

// Lazy-initialize Resend to avoid build errors when API key is not set
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "CoreOS Hub <noreply@coreos.dev>";
const APP_NAME = "CoreOS Hub";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const client = getResend();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
}

// Email Templates

export function getMagicLinkEmail(link: string, clientName: string) {
  const subject = `Sign in to ${APP_NAME}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
              <p style="margin: 0; color: #71717a; font-size: 14px;">Automation Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Click the button below to securely sign in to your portal. This link will expire in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${link}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Sign In to Portal
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                This is an automated email from ${APP_NAME}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nClick this link to sign in to your ${APP_NAME} portal:\n${link}\n\nThis link expires in 1 hour.\n\nIf you didn't request this email, you can safely ignore it.`;

  return { subject, html, text };
}

export function getAutomationSuccessEmail(
  clientName: string,
  automationName: string,
  runId: string,
  duration: number
) {
  const subject = `✓ Automation completed: ${automationName}`;
  const portalUrl = `${APP_URL}/portal/automations`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">✓ Automation Completed Successfully</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your automation <strong>"${automationName}"</strong> has completed successfully.
              </p>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Run ID</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px; font-family: monospace;">${runId}</p>
                  </td>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Duration</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px;">${duration}ms</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View in Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nYour automation "${automationName}" has completed successfully.\n\nRun ID: ${runId}\nDuration: ${duration}ms\n\nView in portal: ${portalUrl}`;

  return { subject, html, text };
}

export function getAutomationFailedEmail(
  clientName: string,
  automationName: string,
  runId: string,
  errorMessage: string
) {
  const subject = `⚠ Automation failed: ${automationName}`;
  const portalUrl = `${APP_URL}/portal/automations`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">⚠ Automation Failed</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your automation <strong>"${automationName}"</strong> encountered an error.
              </p>
              <table width="100%" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Error Details</p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-family: monospace; white-space: pre-wrap;">${errorMessage}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Run ID</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px; font-family: monospace;">${runId}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View in Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nYour automation "${automationName}" encountered an error.\n\nError: ${errorMessage}\n\nRun ID: ${runId}\n\nView in portal: ${portalUrl}`;

  return { subject, html, text };
}

export function getUsageWarningEmail(
  clientName: string,
  resourceType: string,
  currentUsage: number,
  limit: number,
  percentUsed: number
) {
  const subject = `⚠ Usage alert: ${resourceType} at ${percentUsed}%`;
  const portalUrl = `${APP_URL}/portal/billing`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">⚠ Usage Warning</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your <strong>${resourceType}</strong> usage has reached <strong>${percentUsed}%</strong> of your monthly limit.
              </p>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Current Usage</p>
                    <p style="margin: 0; color: #18181b; font-size: 20px; font-weight: 600;">${currentUsage.toLocaleString()} / ${limit.toLocaleString()}</p>
                    <div style="margin-top: 12px; background-color: #e4e4e7; border-radius: 4px; height: 8px; overflow: hidden;">
                      <div style="background-color: ${percentUsed >= 90 ? '#ef4444' : '#f59e0b'}; height: 100%; width: ${percentUsed}%;"></div>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #71717a; font-size: 14px;">
                Consider upgrading your plan to avoid service interruptions.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Manage Plan
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nYour ${resourceType} usage has reached ${percentUsed}% of your monthly limit.\n\nCurrent usage: ${currentUsage.toLocaleString()} / ${limit.toLocaleString()}\n\nConsider upgrading your plan: ${portalUrl}`;

  return { subject, html, text };
}

export function getTeamInviteEmail(
  inviterName: string,
  companyName: string,
  inviteLink: string,
  role: string
) {
  const subject = `You've been invited to join ${companyName} on ${APP_NAME}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600;">You're Invited!</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on ${APP_NAME} as a <strong>${role}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `You're Invited!\n\n${inviterName} has invited you to join ${companyName} on ${APP_NAME} as a ${role}.\n\nAccept your invitation: ${inviteLink}\n\nThis invitation will expire in 7 days.\n\nIf you weren't expecting this invitation, you can safely ignore this email.`;

  return { subject, html, text };
}

// Agent Task Completed Email
export function getAgentTaskCompletedEmail(
  clientName: string,
  agentName: string,
  taskTitle: string,
  taskId: string,
  outputPreview: string
) {
  const subject = `Agent "${agentName}" completed: ${taskTitle}`;
  const portalUrl = `${APP_URL}/portal/review-queue`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">Agent Task Completed</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                <strong>"${agentName}"</strong> has completed the task: <strong>"${taskTitle}"</strong>
              </p>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Output Preview</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${outputPreview.slice(0, 300)}${outputPreview.length > 300 ? '...' : ''}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #71717a; font-size: 14px;">
                This output is waiting for your review in the Review Queue.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Review Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\n"${agentName}" has completed the task: "${taskTitle}"\n\nOutput Preview:\n${outputPreview.slice(0, 300)}${outputPreview.length > 300 ? '...' : ''}\n\nThis output is waiting for your review.\n\nReview now: ${portalUrl}`;

  return { subject, html, text };
}

// AI Draft Ready for Review Email
export function getAIDraftReadyEmail(
  clientName: string,
  actionType: string,
  entityTitle: string,
  outputPreview: string
) {
  const subject = `AI Draft Ready: ${actionType} for "${entityTitle}"`;
  const portalUrl = `${APP_URL}/portal/review-queue`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #ede9fe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #5b21b6; font-size: 14px; font-weight: 600;">AI Draft Ready for Review</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                An AI <strong>${actionType}</strong> has been generated for <strong>"${entityTitle}"</strong> and is ready for your review.
              </p>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase;">Preview</p>
                    <p style="margin: 0; color: #18181b; font-size: 14px; line-height: 1.6;">${outputPreview.slice(0, 250)}${outputPreview.length > 250 ? '...' : ''}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Review & Approve
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nAn AI ${actionType} has been generated for "${entityTitle}" and is ready for your review.\n\nPreview:\n${outputPreview.slice(0, 250)}${outputPreview.length > 250 ? '...' : ''}\n\nReview now: ${portalUrl}`;

  return { subject, html, text };
}

// Automation Failed Email (enhanced version)
export function getAutomationFailedDetailedEmail(
  clientName: string,
  automationName: string,
  runId: string,
  errorMessage: string,
  triggerType: string,
  failedStep?: string
) {
  const subject = `Automation Failed: ${automationName}`;
  const portalUrl = `${APP_URL}/portal/automations`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">Automation Failed</p>
              </div>
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your automation <strong>"${automationName}"</strong> failed to complete.
              </p>

              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%">
                      <tr>
                        <td width="50%" style="padding: 4px 0;">
                          <p style="margin: 0; color: #71717a; font-size: 12px;">Trigger Type</p>
                          <p style="margin: 4px 0 0; color: #18181b; font-size: 14px; font-weight: 500;">${triggerType}</p>
                        </td>
                        <td width="50%" style="padding: 4px 0;">
                          <p style="margin: 0; color: #71717a; font-size: 12px;">Run ID</p>
                          <p style="margin: 4px 0 0; color: #18181b; font-size: 14px; font-family: monospace;">${runId.slice(0, 8)}...</p>
                        </td>
                      </tr>
                      ${failedStep ? `
                      <tr>
                        <td colspan="2" style="padding: 8px 0 0;">
                          <p style="margin: 0; color: #71717a; font-size: 12px;">Failed Step</p>
                          <p style="margin: 4px 0 0; color: #18181b; font-size: 14px;">${failedStep}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px; color: #991b1b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Error Details</p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-family: monospace; white-space: pre-wrap;">${errorMessage}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View Automation
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nYour automation "${automationName}" failed to complete.\n\nTrigger Type: ${triggerType}\nRun ID: ${runId}\n${failedStep ? `Failed Step: ${failedStep}\n` : ''}\nError: ${errorMessage}\n\nView automation: ${portalUrl}`;

  return { subject, html, text };
}

export function getWeeklyReportEmail(
  clientName: string,
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    timeSaved: number;
    topAutomations: { name: string; runs: number }[];
  }
) {
  const subject = `Your weekly automation report`;
  const portalUrl = `${APP_URL}/portal/analytics`;
  const successRate = stats.totalRuns > 0
    ? Math.round((stats.successfulRuns / stats.totalRuns) * 100)
    : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 8px; color: #7c3aed; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
              <p style="margin: 0; color: #71717a; font-size: 14px;">Weekly Report</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 18px; font-weight: 600;">Hi ${clientName},</h2>
              <p style="margin: 0 0 24px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Here's a summary of your automation activity this week.
              </p>

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="padding: 0 8px 16px 0;">
                    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0 0 4px; color: #71717a; font-size: 12px; text-transform: uppercase;">Total Runs</p>
                      <p style="margin: 0; color: #18181b; font-size: 24px; font-weight: 600;">${stats.totalRuns}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 0 0 16px 8px;">
                    <div style="background-color: #dcfce7; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0 0 4px; color: #166534; font-size: 12px; text-transform: uppercase;">Success Rate</p>
                      <p style="margin: 0; color: #166534; font-size: 24px; font-weight: 600;">${successRate}%</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 0 8px 0 0;">
                    <div style="background-color: #ede9fe; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0 0 4px; color: #5b21b6; font-size: 12px; text-transform: uppercase;">Time Saved</p>
                      <p style="margin: 0; color: #5b21b6; font-size: 24px; font-weight: 600;">${stats.timeSaved}h</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 0 0 0 8px;">
                    <div style="background-color: #fee2e2; border-radius: 8px; padding: 16px;">
                      <p style="margin: 0 0 4px; color: #991b1b; font-size: 12px; text-transform: uppercase;">Failed</p>
                      <p style="margin: 0; color: #991b1b; font-size: 24px; font-weight: 600;">${stats.failedRuns}</p>
                    </div>
                  </td>
                </tr>
              </table>

              ${stats.topAutomations.length > 0 ? `
              <h3 style="margin: 0 0 12px; color: #18181b; font-size: 14px; font-weight: 600;">Top Automations</h3>
              <table width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 24px;">
                ${stats.topAutomations.map((auto, i) => `
                <tr>
                  <td style="padding: ${i === 0 ? '16px 16px 8px' : i === stats.topAutomations.length - 1 ? '8px 16px 16px' : '8px 16px'};">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #3f3f46; font-size: 14px;">${auto.name}</span>
                      <span style="color: #71717a; font-size: 14px;">${auto.runs} runs</span>
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      View Full Analytics
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0 0 20px;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                You can manage notification preferences in your portal settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${clientName},\n\nHere's your weekly automation report:\n\n- Total Runs: ${stats.totalRuns}\n- Success Rate: ${successRate}%\n- Time Saved: ${stats.timeSaved}h\n- Failed: ${stats.failedRuns}\n\nView analytics: ${portalUrl}`;

  return { subject, html, text };
}
