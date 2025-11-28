import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  User,
  FileText,
  Clock,
  Cpu,
  Plus,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { getSystemBuildsByProject } from "@/app/actions/system-builds";
import type { Project, Client, SystemBuild } from "@/types/database";

interface ProjectWithClient extends Project {
  client: Client;
}

async function getProject(id: string): Promise<ProjectWithClient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProjectWithClient;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, systems] = await Promise.all([
    getProject(id),
    getSystemBuildsByProject(id),
  ]);

  if (!project) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="info">Active</Badge>;
      case "paused":
        return <Badge variant="warning">Paused</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSystemStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="info" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {project.title}
              </h2>
              {getStatusBadge(project.status)}
            </div>
            {project.client && (
              <p className="text-muted-foreground">
                Client: {project.client.name} ({project.client.company})
              </p>
            )}
          </div>
        </div>
        <Link href={`/projects/${id}/edit`}>
          <Button className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {project.client?.name || "Unknown"} -{" "}
                  {project.client?.company || ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timeline</p>
                <p className="font-medium">
                  {project.timeline || "Not specified"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(project.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {project.deliverables || "No deliverables specified yet."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Systems Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Automation Systems
              </CardTitle>
              <CardDescription>
                AI-generated systems and deliverables for this project
              </CardDescription>
            </div>
            <Link href={`/projects/${id}/build-system`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Build System
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {systems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Cpu className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No systems built for this project yet.
              </p>
              <Link href={`/projects/${id}/build-system`}>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Build Your First System
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {systems.map((system: SystemBuild) => (
                <div
                  key={system.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium truncate">{system.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {system.prompt.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(system.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getSystemStatusBadge(system.status)}
                    {system.status === "completed" && system.result && (
                      <Link href={`/projects/${id}/systems/${system.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {project.client && (
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{project.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{project.client.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{project.client.company}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href={`/clients/${project.client.id}`}>
                <Button variant="outline" size="sm">
                  View Client Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
