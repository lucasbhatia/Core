"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { ToolUsageLog } from "@/types/database";
import { getCurrentUserProfile, isAdmin } from "./user-profiles";

export async function getToolUsageLogs(
  options?: {
    toolId?: string;
    clientId?: string;
    limit?: number;
  }
): Promise<ToolUsageLog[]> {
  const supabase = await createSupabaseClient();
  const profile = await getCurrentUserProfile();

  if (!profile) return [];

  let query = supabase
    .from("tool_usage_logs")
    .select("*, tool:client_tools(*)")
    .order("created_at", { ascending: false });

  // Apply filters
  if (options?.toolId) {
    query = query.eq("tool_id", options.toolId);
  }

  // Access control
  if (profile.role === "admin") {
    if (options?.clientId) {
      query = query.eq("client_id", options.clientId);
    }
  } else if (profile.client_id) {
    query = query.eq("client_id", profile.client_id);
  } else {
    // Client without linked client_id
    query = query.eq("user_id", profile.id);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching usage logs:", error);
    return [];
  }

  return data || [];
}

export async function getUsageStats(clientId?: string): Promise<{
  totalExecutions: number;
  totalTokens: number;
  avgExecutionTime: number;
  executionsByTool: { toolName: string; count: number }[];
  executionsByDay: { date: string; count: number }[];
}> {
  const supabase = await createSupabaseClient();
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return {
      totalExecutions: 0,
      totalTokens: 0,
      avgExecutionTime: 0,
      executionsByTool: [],
      executionsByDay: [],
    };
  }

  // Get the client ID to filter by
  const filterClientId = profile.role === "admin"
    ? clientId
    : profile.client_id;

  let query = supabase
    .from("tool_usage_logs")
    .select("*, tool:client_tools(name)")
    .eq("status", "success");

  if (filterClientId) {
    query = query.eq("client_id", filterClientId);
  } else if (profile.role !== "admin") {
    query = query.eq("user_id", profile.id);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching usage stats:", error);
    return {
      totalExecutions: 0,
      totalTokens: 0,
      avgExecutionTime: 0,
      executionsByTool: [],
      executionsByDay: [],
    };
  }

  // Calculate stats
  const totalExecutions = data.length;
  const totalTokens = data.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
  const avgExecutionTime = data.length > 0
    ? Math.round(data.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / data.length)
    : 0;

  // Group by tool
  const toolCounts: Record<string, number> = {};
  data.forEach((log) => {
    const toolName = (log.tool as any)?.name || "Unknown Tool";
    toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
  });
  const executionsByTool = Object.entries(toolCounts)
    .map(([toolName, count]) => ({ toolName, count }))
    .sort((a, b) => b.count - a.count);

  // Group by day (last 30 days)
  const dayCounts: Record<string, number> = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  data.forEach((log) => {
    const date = new Date(log.created_at).toISOString().split("T")[0];
    if (new Date(date) >= thirtyDaysAgo) {
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    }
  });
  const executionsByDay = Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalExecutions,
    totalTokens,
    avgExecutionTime,
    executionsByTool,
    executionsByDay,
  };
}
