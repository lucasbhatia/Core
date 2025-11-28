import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * POST /api/portal/automation/create - Create a new automation for a client
 */
export async function POST(request: NextRequest) {
  try {
    // Get client from portal session
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = getSupabase();

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, trigger = "manual", templateId } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Generate webhook URL and secret if webhook trigger
    const webhookSecret = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create the automation as a workflow
    const { data: automation, error: createError } = await supabase
      .from("workflows")
      .insert({
        name,
        description,
        client_id: clientId,
        status: "draft",
        is_automation: true,
        automation_trigger: trigger,
        automation_status: "inactive",
        automation_schedule: trigger === "scheduled" ? "0 9 * * *" : null, // Default to daily at 9am
        webhook_secret: trigger === "webhook" ? webhookSecret : null,
        template_id: templateId || null,
        steps: [],
        current_step: 0,
        total_steps: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create automation:", createError);
      return NextResponse.json(
        { error: "Failed to create automation" },
        { status: 500 }
      );
    }

    // Update with webhook URL now that we have the ID
    if (trigger === "webhook") {
      await supabase
        .from("workflows")
        .update({
          webhook_url: `${baseUrl}/api/automation/webhook/${automation.id}`,
        })
        .eq("id", automation.id);
    }

    return NextResponse.json({
      success: true,
      automation: {
        ...automation,
        webhook_url: trigger === "webhook" ? `${baseUrl}/api/automation/webhook/${automation.id}` : null,
      },
      message: "Automation created successfully",
    });
  } catch (error) {
    console.error("Create automation error:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
