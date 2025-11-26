"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Cpu,
  Loader2,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Workflow,
  Bot,
  FileText,
  Timer,
  Wrench,
} from "lucide-react";
import { createSystemBuild, deleteSystemBuild } from "@/app/actions/system-builds";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import type { SystemBuild, SystemBuildResult } from "@/types/database";

interface SystemBuilderClientProps {
  initialBuilds: SystemBuild[];
}

export function SystemBuilderClient({ initialBuilds }: SystemBuilderClientProps) {
  const [builds, setBuilds] = useState(initialBuilds);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<SystemBuild | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildToDelete, setBuildToDelete] = useState<SystemBuild | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!title.trim() || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and a prompt.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Create the build record first
      const newBuild = await createSystemBuild(title, prompt);
      setBuilds([newBuild, ...builds]);

      // Call the API to generate the system
      const response = await fetch("/api/system-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, buildId: newBuild.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate system");
      }

      const data = await response.json();

      // Update the build with the result
      setBuilds((prevBuilds) =>
        prevBuilds.map((b) =>
          b.id === newBuild.id
            ? { ...b, result: data.result, status: "completed" }
            : b
        )
      );

      toast({
        title: "System generated!",
        description: "Your automation system design is ready.",
        variant: "success",
      });

      setTitle("");
      setPrompt("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!buildToDelete) return;

    setDeleting(true);
    try {
      await deleteSystemBuild(buildToDelete.id);
      setBuilds(builds.filter((b) => b.id !== buildToDelete.id));
      toast({
        title: "Build deleted",
        description: "The system build has been deleted.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setBuildToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
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
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate System Design
            </CardTitle>
            <CardDescription>
              Describe the automation you need, and AI will design the complete system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">System Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E-commerce Order Processing Automation"
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe Your Automation Need</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="I need an automation system that handles incoming orders from Shopify, processes payments, updates inventory, and sends confirmation emails to customers. It should also integrate with our CRM to track customer interactions..."
                rows={8}
                disabled={generating}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !title.trim() || !prompt.trim()}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating System...
                </>
              ) : (
                <>
                  <Cpu className="mr-2 h-4 w-4" />
                  Generate System Design
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Builds</CardTitle>
            <CardDescription>Your generated system designs</CardDescription>
          </CardHeader>
          <CardContent>
            {builds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Cpu className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No system builds yet. Create your first one!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {builds.map((build) => (
                  <div
                    key={build.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium truncate">{build.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(build.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(build.status)}
                      {build.status === "completed" && build.result && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBuild(build);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setBuildToDelete(build);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Result Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBuild?.title}</DialogTitle>
            <DialogDescription>
              Generated on {selectedBuild && formatDateTime(selectedBuild.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedBuild?.result && (
            <SystemBuildResultView result={selectedBuild.result} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System Build</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{buildToDelete?.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SystemBuildResultView({ result }: { result: SystemBuildResult }) {
  return (
    <Tabs defaultValue="diagram" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="diagram">Diagram</TabsTrigger>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
        <TabsTrigger value="agents">Agents</TabsTrigger>
        <TabsTrigger value="sop">SOP</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="diagram" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              System Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
              {result.systemDiagram}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="workflow" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflow Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.workflowSteps.map((step, index) => (
                <div
                  key={step.id || index}
                  className="flex gap-4 p-4 rounded-lg border"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {step.id || index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    {step.tools && step.tools.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step.tools.map((tool, i) => (
                          <Badge key={i} variant="secondary">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="agents" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Architecture
            </CardTitle>
            <CardDescription>
              {result.agentArchitecture.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.agentArchitecture.agents.map((agent, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <h4 className="font-semibold">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.role}
                  </p>
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {agent.capabilities.map((cap, i) => (
                        <Badge key={i} variant="outline">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {result.agentArchitecture.integrations &&
                result.agentArchitecture.integrations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Integrations</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.agentArchitecture.integrations.map((int, i) => (
                        <Badge key={i} variant="secondary">
                          {int}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sop" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Standard Operating Procedure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {result.sopText}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Implementation Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.timeline.map((phase, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{phase.phase}</h4>
                    <Badge variant="outline">{phase.duration}</Badge>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {phase.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Required Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <Badge variant="secondary">{resource.type}</Badge>
                  <div>
                    <h4 className="font-medium">{resource.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
