import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAndProcessRequest } from "@/lib/ai-platform/workflow-engine";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * POST /api/intake/email - Email webhook endpoint
 *
 * Receives emails forwarded from:
 * - Zapier (Gmail/Outlook integration)
 * - Make (Integromat)
 * - Postmark
 * - SendGrid Inbound Parse
 * - Custom email forwarding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support multiple email webhook formats
    const emailData = normalizeEmailData(body);

    if (!emailData.body && !emailData.subject) {
      return NextResponse.json(
        { error: "No email content found" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Try to find client by email
    let clientId: string | undefined;
    if (emailData.from) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("email", emailData.from)
        .single();

      if (client) {
        clientId = client.id;
      }
    }

    // Combine subject and body for processing
    const content = `Subject: ${emailData.subject || "(No subject)"}\n\n${emailData.body || ""}`;

    // Create and process the request
    const { requestId, workflowId } = await createAndProcessRequest(content, {
      clientId,
      source: "email",
      subject: emailData.subject,
      attachments: emailData.attachments,
    });

    // Store email metadata
    await supabase
      .from("requests")
      .update({
        source_id: emailData.messageId,
        metadata: {
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc,
          receivedAt: emailData.receivedAt || new Date().toISOString(),
          hasAttachments: (emailData.attachments?.length || 0) > 0,
        },
      })
      .eq("id", requestId);

    return NextResponse.json({
      success: true,
      requestId,
      workflowId,
      message: "Email received and processing started",
    });
  } catch (error) {
    console.error("Email intake error:", error);
    return NextResponse.json(
      { error: "Failed to process email" },
      { status: 500 }
    );
  }
}

interface NormalizedEmail {
  from?: string;
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  messageId?: string;
  receivedAt?: string;
  attachments?: Array<{ name: string; url?: string; type?: string }>;
}

/**
 * Normalize email data from different webhook sources
 */
function normalizeEmailData(data: Record<string, unknown>): NormalizedEmail {
  // Zapier format
  if (data.from_email || data.fromEmail) {
    return {
      from: (data.from_email || data.fromEmail) as string,
      to: (data.to_email || data.toEmail || data.to) as string,
      subject: (data.subject || data.email_subject) as string,
      body: (data.body || data.body_plain || data.body_html || data.text || data.html) as string,
      messageId: (data.message_id || data.messageId || data.id) as string,
      receivedAt: (data.date || data.received_at || data.timestamp) as string,
      attachments: normalizeAttachments(data.attachments),
    };
  }

  // Postmark format
  if (data.From || data.FromFull) {
    return {
      from: (data.From || (data.FromFull as Record<string, string>)?.Email) as string,
      to: (data.To || data.ToFull) as string,
      subject: data.Subject as string,
      body: (data.TextBody || data.HtmlBody) as string,
      messageId: data.MessageID as string,
      receivedAt: data.Date as string,
      attachments: normalizeAttachments(data.Attachments),
    };
  }

  // SendGrid format
  if (data.envelope || data.from) {
    return {
      from: (data.from || (data.envelope as Record<string, string>)?.from) as string,
      to: (data.to || (data.envelope as Record<string, string>)?.to) as string,
      subject: data.subject as string,
      body: (data.text || data.html) as string,
      attachments: normalizeAttachments(data.attachments),
    };
  }

  // Generic/custom format
  return {
    from: (data.from || data.sender || data.email) as string,
    to: data.to as string,
    subject: (data.subject || data.title) as string,
    body: (data.body || data.content || data.text || data.message) as string,
    messageId: (data.id || data.messageId || data.message_id) as string,
    receivedAt: (data.date || data.timestamp || data.received_at) as string,
    attachments: normalizeAttachments(data.attachments),
  };
}

function normalizeAttachments(
  attachments: unknown
): Array<{ name: string; url?: string; type?: string }> {
  if (!attachments || !Array.isArray(attachments)) {
    return [];
  }

  return attachments.map((att: Record<string, unknown>) => ({
    name: (att.name || att.filename || att.Name || "attachment") as string,
    url: (att.url || att.content_url || att.ContentID) as string | undefined,
    type: (att.type || att.content_type || att.ContentType || att.mime_type) as string | undefined,
  }));
}
