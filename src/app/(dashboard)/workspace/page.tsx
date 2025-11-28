import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkspaceClient } from "./workspace-client";

export default async function WorkspacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, company")
    .order("name", { ascending: true });

  // Get recent requests
  const { data: requests } = await supabase
    .from("requests")
    .select(`
      *,
      clients(id, name, email),
      workflows(id, name, status, current_step, total_steps)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get all workflows (including automations)
  const { data: workflows } = await supabase
    .from("workflows")
    .select(`
      *,
      requests(id, subject, content, client_id),
      agent_tasks(id, name, status, agent_id)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get stats
  const { count: totalRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true });

  const { count: completedRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: activeWorkflows } = await supabase
    .from("workflows")
    .select("*", { count: "exact", head: true })
    .eq("status", "running");

  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true);

  return (
    <WorkspaceClient
      initialRequests={requests || []}
      initialWorkflows={workflows || []}
      agents={agents || []}
      clients={clients || []}
      stats={{
        totalRequests: totalRequests || 0,
        completedRequests: completedRequests || 0,
        activeWorkflows: activeWorkflows || 0,
        successRate: totalRequests
          ? Math.round(((completedRequests || 0) / totalRequests) * 100)
          : 0,
      }}
    />
  );
}
