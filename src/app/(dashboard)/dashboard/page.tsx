import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, ClipboardList, Cpu, TrendingUp, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

async function getStats() {
  const supabase = await createClient();

  const [clientsResult, projectsResult, auditsResult, systemBuildsResult] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("audits").select("*", { count: "exact", head: true }),
    supabase.from("system_builds").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalClients: clientsResult.count || 0,
    totalProjects: projectsResult.count || 0,
    totalAudits: auditsResult.count || 0,
    totalSystemBuilds: systemBuildsResult.count || 0,
  };
}

async function getRecentActivity() {
  const supabase = await createClient();

  const [clients, projects, audits] = await Promise.all([
    supabase.from("clients").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("projects").select("id, title, created_at, status").order("created_at", { ascending: false }).limit(3),
    supabase.from("audits").select("id, client_name, created_at, status").order("created_at", { ascending: false }).limit(3),
  ]);

  const activities = [
    ...(clients.data || []).map(c => ({ type: "client" as const, id: c.id, title: c.name, timestamp: c.created_at, action: "New client added" })),
    ...(projects.data || []).map(p => ({ type: "project" as const, id: p.id, title: p.title, timestamp: p.created_at, action: "Project created", status: p.status })),
    ...(audits.data || []).map(a => ({ type: "audit" as const, id: a.id, title: a.client_name, timestamp: a.created_at, action: "Audit request received", status: a.status })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

  return activities;
}

const statCards = [
  { title: "Total Clients", key: "totalClients" as const, icon: Users, color: "from-blue-500 to-blue-600" },
  { title: "Total Projects", key: "totalProjects" as const, icon: FolderKanban, color: "from-purple-500 to-purple-600" },
  { title: "Audit Requests", key: "totalAudits" as const, icon: ClipboardList, color: "from-orange-500 to-orange-600" },
  { title: "System Builds", key: "totalSystemBuilds" as const, icon: Cpu, color: "from-green-500 to-green-600" },
];

export default async function DashboardPage() {
  const stats = await getStats();
  const activities = await getRecentActivity();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome section */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your automation agency.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key} className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg bg-gradient-to-br ${card.color} p-2`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats[card.key]}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-muted-foreground">
                  Active and growing
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates across your automation agency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No recent activity yet.</p>
              <p className="text-sm text-muted-foreground">Start by adding clients or projects.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`rounded-lg p-2 ${
                    activity.type === "client" ? "bg-blue-500/10 text-blue-500" :
                    activity.type === "project" ? "bg-purple-500/10 text-purple-500" :
                    "bg-orange-500/10 text-orange-500"
                  }`}>
                    {activity.type === "client" && <Users className="h-4 w-4" />}
                    {activity.type === "project" && <FolderKanban className="h-4 w-4" />}
                    {activity.type === "audit" && <ClipboardList className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  {"status" in activity && activity.status && (
                    <Badge variant={
                      activity.status === "completed" ? "success" :
                      activity.status === "active" || activity.status === "in-progress" ? "info" :
                      activity.status === "new" ? "warning" : "secondary"
                    }>
                      {activity.status}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
