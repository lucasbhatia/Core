import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { SystemDetailClient } from "./system-detail-client";
import type { SystemBuild } from "@/types/database";

async function getSystem(systemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_builds")
    .select("*")
    .eq("id", systemId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SystemBuild;
}

async function getProject(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string; systemId: string }>;
}) {
  const { id: projectId, systemId } = await params;
  const [system, project] = await Promise.all([
    getSystem(systemId),
    getProject(projectId),
  ]);

  if (!system || !project) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Cpu className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                {system.title}
              </h2>
              <Badge variant="success">Completed</Badge>
            </div>
            <p className="text-muted-foreground">
              {project.title} • {project.client?.name}
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Original Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{system.prompt}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Generated on {formatDateTime(system.created_at)}
          </p>
        </CardContent>
      </Card>

      {system.result ? (
        <SystemDetailClient result={system.result} systemId={systemId} projectId={projectId} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No results available for this system.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
