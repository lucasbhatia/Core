import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subDays, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const period = searchParams.get("period") || "7d";

  if (!clientId) {
    return NextResponse.json({ error: "Client ID required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case "30d":
        startDate = subDays(new Date(), 30);
        break;
      case "month":
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      default: // 7d
        startDate = subDays(new Date(), 7);
    }

    // Fetch AI action logs grouped by date
    const { data: aiActionData } = await supabase
      .from("ai_action_logs")
      .select("created_at, total_tokens")
      .eq("client_id", clientId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    // Fetch agent tasks grouped by date
    const { data: agentTaskData } = await supabase
      .from("agent_tasks")
      .select("created_at, total_tokens")
      .eq("client_id", clientId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    // Group by date
    const dailyMap = new Map<string, { ai_actions: number; agent_tasks: number; tokens_used: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dailyMap.set(format(currentDate, "yyyy-MM-dd"), {
        ai_actions: 0,
        agent_tasks: 0,
        tokens_used: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate AI actions
    if (aiActionData) {
      for (const action of aiActionData) {
        const dateKey = format(new Date(action.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(dateKey);
        if (existing) {
          existing.ai_actions += 1;
          existing.tokens_used += action.total_tokens || 0;
        }
      }
    }

    // Aggregate agent tasks
    if (agentTaskData) {
      for (const task of agentTaskData) {
        const dateKey = format(new Date(task.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(dateKey);
        if (existing) {
          existing.agent_tasks += 1;
          existing.tokens_used += task.total_tokens || 0;
        }
      }
    }

    // Convert to array sorted by date
    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      daily,
      summary: {
        total_ai_actions: daily.reduce((sum, d) => sum + d.ai_actions, 0),
        total_agent_tasks: daily.reduce((sum, d) => sum + d.agent_tasks, 0),
        total_tokens: daily.reduce((sum, d) => sum + d.tokens_used, 0),
      },
    });
  } catch (error) {
    console.error("Usage history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage history" },
      { status: 500 }
    );
  }
}
