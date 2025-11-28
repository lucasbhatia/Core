import { NextResponse } from "next/server";
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

    // Get subscription with plan details
    const { data: subscription, error } = await supabase
      .from("client_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("client_id", session.clientId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: usage } = await supabase
      .from("client_usage")
      .select("*")
      .eq("client_id", session.clientId)
      .eq("month", currentMonth)
      .single();

    // Get billing invoices
    const { data: invoices } = await supabase
      .from("billing_invoices")
      .select("*")
      .eq("client_id", session.clientId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      subscription: subscription || null,
      usage: usage || {
        automation_runs: 0,
        ai_tokens_used: 0,
        storage_used_mb: 0,
        api_calls: 0,
      },
      invoices: invoices || [],
    });
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
