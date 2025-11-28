"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type {
  SystemBuild,
  AutomationRun,
  AutomationLog,
  AutomationMetrics,
  AutomationStatus,
  AutomationType,
  AutomationConfig,
} from "@/types/database";
import crypto from "crypto";

// Generate a webhook secret
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Activate an automation
export async function activateAutomation(systemId: string) {
  const supabase = await createSupabaseClient();

  const webhookSecret = generateWebhookSecret();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/automation/webhook`;

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      automation_status: "active",
      webhook_url: webhookUrl,
      webhook_secret: webhookSecret,
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemBuild;
}

// Pause an automation
export async function pauseAutomation(systemId: string) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      automation_status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemBuild;
}

// Update automation configuration
export async function updateAutomationConfig(
  systemId: string,
  config: {
    automation_type?: AutomationType;
    automation_config?: AutomationConfig;
  }
) {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      ...config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SystemBuild;
}

// Get automation runs for a system
export async function getAutomationRuns(
  systemId: string,
  limit = 50
): Promise<AutomationRun[]> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("system_id", systemId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching automation runs:", error);
    return [];
  }

  return data as AutomationRun[];
}

// Get automation runs for a client (portal view)
export async function getClientAutomationRuns(
  clientId: string,
  systemId?: string,
  limit = 20
): Promise<AutomationRun[]> {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("automation_runs")
    .select("*, system:system_builds(title)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (systemId) {
    query = query.eq("system_id", systemId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching client automation runs:", error);
    return [];
  }

  return data as AutomationRun[];
}

// Get logs for a run
export async function getAutomationLogs(runId: string): Promise<AutomationLog[]> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("automation_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching automation logs:", error);
    return [];
  }

  return data as AutomationLog[];
}

// Get metrics for a system
export async function getAutomationMetrics(
  systemId: string,
  days = 30
): Promise<AutomationMetrics[]> {
  const supabase = await createSupabaseClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("automation_metrics")
    .select("*")
    .eq("system_id", systemId)
    .gte("metric_date", startDate.toISOString().split("T")[0])
    .order("metric_date", { ascending: true });

  if (error) {
    console.error("Error fetching automation metrics:", error);
    return [];
  }

  return data as AutomationMetrics[];
}

// Get aggregated stats for a system
export async function getAutomationStats(systemId: string) {
  const supabase = await createSupabaseClient();

  // Get system info
  const { data: system } = await supabase
    .from("system_builds")
    .select("run_count, error_count, last_run_at, automation_status")
    .eq("id", systemId)
    .single();

  // Get recent runs count
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const { count: recentRuns } = await supabase
    .from("automation_runs")
    .select("*", { count: "exact", head: true })
    .eq("system_id", systemId)
    .gte("created_at", last24h.toISOString());

  // Get success rate from last 100 runs
  const { data: recentResults } = await supabase
    .from("automation_runs")
    .select("status")
    .eq("system_id", systemId)
    .in("status", ["success", "failed"])
    .order("created_at", { ascending: false })
    .limit(100);

  const successCount = recentResults?.filter((r) => r.status === "success").length || 0;
  const totalCompleted = recentResults?.length || 0;
  const successRate = totalCompleted > 0 ? (successCount / totalCompleted) * 100 : 0;

  return {
    total_runs: system?.run_count || 0,
    error_count: system?.error_count || 0,
    last_run_at: system?.last_run_at,
    status: system?.automation_status || "pending",
    runs_last_24h: recentRuns || 0,
    success_rate: Math.round(successRate),
  };
}

// Manually trigger a run (creates a run record)
export async function triggerManualRun(
  systemId: string,
  inputData: Record<string, unknown> = {}
) {
  const supabase = await createSupabaseClient();

  // Get system
  const { data: system } = await supabase
    .from("system_builds")
    .select("client_id, automation_status")
    .eq("id", systemId)
    .single();

  if (!system) {
    throw new Error("System not found");
  }

  if (system.automation_status !== "active") {
    throw new Error("Automation is not active");
  }

  // Create run
  const { data: run, error } = await supabase
    .from("automation_runs")
    .insert({
      system_id: systemId,
      client_id: system.client_id,
      status: "running",
      trigger_type: "manual",
      input_data: inputData,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log the start
  await supabase.from("automation_logs").insert({
    run_id: run.id,
    system_id: systemId,
    level: "info",
    message: "Manual run triggered",
    data: inputData,
  });

  return run as AutomationRun;
}

// Regenerate webhook secret
export async function regenerateWebhookSecret(systemId: string) {
  const supabase = await createSupabaseClient();

  const newSecret = generateWebhookSecret();

  const { data, error } = await supabase
    .from("system_builds")
    .update({
      webhook_secret: newSecret,
      updated_at: new Date().toISOString(),
    })
    .eq("id", systemId)
    .select("webhook_secret")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.webhook_secret;
}
