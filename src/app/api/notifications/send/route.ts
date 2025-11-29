import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  getAutomationSuccessEmail,
  getAutomationFailedEmail,
  getUsageWarningEmail,
  getTeamInviteEmail,
} from "@/lib/email";
import type { NotificationType } from "@/types/database";

interface NotificationPayload {
  clientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Verify internal request (add proper auth in production)
    const authHeader = request.headers.get("x-internal-key");
    if (authHeader !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: NotificationPayload = await request.json();
    const { clientId, type, title, message, link, metadata, sendEmail: shouldSendEmail = true } = payload;

    if (!clientId || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Create notification in database
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        client_id: clientId,
        type,
        title,
        message,
        link,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (notifError) {
      console.error("Notification insert error:", notifError);
      throw notifError;
    }

    // Check if email should be sent
    if (shouldSendEmail) {
      // Get client details
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (!client) {
        return NextResponse.json({ notification, emailSent: false });
      }

      // Get notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("client_id", clientId)
        .single();

      // Default preferences if none set
      const preferences = prefs || {
        email_automation_success: true,
        email_automation_failed: true,
        email_usage_warnings: true,
        email_billing_alerts: true,
        email_team_updates: true,
      };

      // Check if this type of email is enabled
      const emailTypeMap: Record<NotificationType, keyof typeof preferences> = {
        automation_success: "email_automation_success",
        automation_failed: "email_automation_failed",
        automation_created: "email_automation_success",
        agent_task_complete: "email_automation_success",
        ai_action_complete: "email_automation_success",
        usage_warning: "email_usage_warnings",
        billing: "email_billing_alerts",
        team: "email_team_updates",
        system: "email_automation_success",
      };

      const prefKey = emailTypeMap[type];
      if (!preferences[prefKey]) {
        return NextResponse.json({ notification, emailSent: false, reason: "disabled_by_preference" });
      }

      // Generate email based on type
      let emailContent;
      switch (type) {
        case "automation_success":
          emailContent = getAutomationSuccessEmail(
            client.name,
            (metadata?.automationName as string) || "Automation",
            (metadata?.runId as string) || "",
            (metadata?.duration as number) || 0
          );
          break;
        case "automation_failed":
          emailContent = getAutomationFailedEmail(
            client.name,
            (metadata?.automationName as string) || "Automation",
            (metadata?.runId as string) || "",
            (metadata?.errorMessage as string) || "Unknown error"
          );
          break;
        case "usage_warning":
          emailContent = getUsageWarningEmail(
            client.name,
            (metadata?.resourceType as string) || "Resources",
            (metadata?.currentUsage as number) || 0,
            (metadata?.limit as number) || 100,
            (metadata?.percentUsed as number) || 0
          );
          break;
        case "team":
          if (metadata?.inviteLink) {
            emailContent = getTeamInviteEmail(
              (metadata?.inviterName as string) || client.name,
              client.company || client.name,
              metadata.inviteLink as string,
              (metadata?.role as string) || "member"
            );
          } else {
            // Generic team notification
            emailContent = {
              subject: title,
              html: `<p>${message}</p>`,
              text: message,
            };
          }
          break;
        default:
          // Generic notification email
          emailContent = {
            subject: title,
            html: `<p>${message}</p>`,
            text: message,
          };
      }

      // Send email
      const emailResult = await sendEmail({
        to: client.email,
        ...emailContent,
      });

      // Update notification with email status
      await supabase
        .from("notifications")
        .update({
          email_sent: emailResult.success,
          email_sent_at: emailResult.success ? new Date().toISOString() : null,
        })
        .eq("id", notification.id);

      return NextResponse.json({
        notification,
        emailSent: emailResult.success,
      });
    }

    return NextResponse.json({ notification, emailSent: false });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
