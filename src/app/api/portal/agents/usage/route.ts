import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAgentUsage, getClientPlan } from "@/lib/ai-agents/engine";
import { PLAN_LIMITS } from "@/lib/stripe";

// GET /api/portal/agents/usage - Get agent usage for the client
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get("portal_client_id")?.value;

    if (!clientId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get usage
    const usage = await getAgentUsage(clientId);

    // Get plan limits
    const plan = await getClientPlan(clientId);
    const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    const limits = {
      agents: planLimits.agents,
      agent_executions: planLimits.agent_executions,
      agent_tokens: planLimits.agent_tokens,
      agent_conversations: planLimits.agent_conversations,
      features: planLimits.agent_features,
    };

    return NextResponse.json({
      usage,
      limits,
      plan,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
