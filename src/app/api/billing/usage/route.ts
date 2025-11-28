import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Get client session from portal cookie
async function getClientSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("portal_session");
  if (!sessionData?.value) return null;

  try {
    return JSON.parse(sessionData.value);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getClientSession();
    if (!session?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from("client_usage")
      .select("*")
      .eq("client_id", session.clientId)
      .eq("month", currentMonth)
      .single();

    // Get subscription limits
    const { data: subscription } = await supabase
      .from("client_subscriptions")
      .select(`
        plan:subscription_plans(
          automation_limit,
          runs_limit,
          ai_tokens_limit,
          storage_limit_mb
        )
      `)
      .eq("client_id", session.clientId)
      .single();

    const limits = subscription?.plan || {
      automation_limit: 3,
      runs_limit: 100,
      ai_tokens_limit: 10000,
      storage_limit_mb: 100,
    };

    return NextResponse.json({
      usage: usage || {
        automation_runs: 0,
        ai_tokens_used: 0,
        storage_used_mb: 0,
        api_calls: 0,
        manual_runs: 0,
        scheduled_runs: 0,
        webhook_runs: 0,
      },
      limits,
    });
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

// Internal API to track usage (called by automation system)
export async function POST(request: NextRequest) {
  try {
    const { clientId, type, amount = 1 } = await request.json();

    if (!clientId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Map type to column
    const columnMap: Record<string, string> = {
      automation_run: "automation_runs",
      ai_tokens: "ai_tokens_used",
      storage: "storage_used_mb",
      api_call: "api_calls",
      manual_run: "manual_runs",
      scheduled_run: "scheduled_runs",
      webhook_run: "webhook_runs",
    };

    const column = columnMap[type];
    if (!column) {
      return NextResponse.json({ error: "Invalid usage type" }, { status: 400 });
    }

    // Upsert usage record
    const { data: existing } = await supabase
      .from("client_usage")
      .select("*")
      .eq("client_id", clientId)
      .eq("month", currentMonth)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("client_usage")
        .update({
          [column]: (existing[column as keyof typeof existing] as number || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase.from("client_usage").insert({
        client_id: clientId,
        month: currentMonth,
        [column]: amount,
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Usage tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
