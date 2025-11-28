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
  Code,
  Mail,
  ListChecks,
  MessageSquare,
  Copy,
  Check,
  Download,
  Zap,
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

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label || "Copy"}
        </>
      )}
    </Button>
  );
}

// Helper to safely convert any value to string
function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function DownloadButton({ content, filename, label }: { content: string; filename: string; label?: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
      <Download className="h-4 w-4" />
      {label || "Download"}
    </Button>
  );
}

function SystemBuildResultView({ result }: { result: SystemBuildResult }) {
  return (
    <div className="space-y-4">
      {/* Overview */}
      {result.systemOverview && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm">{result.systemOverview}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prompts" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-1">
            <Workflow className="h-3 w-3" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden sm:inline">Code</span>
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-1">
            <Mail className="h-3 w-3" />
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1">
            <Zap className="h-3 w-3" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1">
            <ListChecks className="h-3 w-3" />
            <span className="hidden sm:inline">Checklist</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Prompts Tab */}
        <TabsContent value="prompts" className="mt-4 space-y-4">
          {result.aiPrompts && result.aiPrompts.length > 0 ? (
            result.aiPrompts.map((prompt, index) => {
              const promptAny = prompt as unknown as Record<string, unknown>;
              const name = safeString(promptAny.name || `Prompt ${index + 1}`);
              const purpose = safeString(promptAny.purpose || "");
              const promptText = safeString(promptAny.prompt || "");
              const exampleOutput = safeString(promptAny.exampleOutput || "");
              const variables = Array.isArray(promptAny.variables)
                ? promptAny.variables.filter((v): v is string => typeof v === "string")
                : [];

              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{name}</CardTitle>
                        <CardDescription>{purpose}</CardDescription>
                      </div>
                      <CopyButton text={promptText} label="Copy Prompt" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">PROMPT (Ready to use with ChatGPT/Claude)</Label>
                      <pre className="mt-1 whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-lg max-h-48 overflow-y-auto">
                        {promptText}
                      </pre>
                    </div>
                    {variables.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">VARIABLES TO REPLACE</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {variables.map((v, i) => (
                            <Badge key={i} variant="secondary">{`{{${v}}}`}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {exampleOutput && (
                      <div>
                        <Label className="text-xs text-muted-foreground">EXAMPLE OUTPUT</Label>
                        <p className="mt-1 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {exampleOutput}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No AI prompts generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="mt-4">
          {result.automationWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-5 w-5" />
                      {result.automationWorkflow.name}
                    </CardTitle>
                    <CardDescription>{result.automationWorkflow.description}</CardDescription>
                  </div>
                  <DownloadButton
                    content={JSON.stringify(result.automationWorkflow, null, 2)}
                    filename="workflow.json"
                    label="Export JSON"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trigger */}
                <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                    <Zap className="h-4 w-4" />
                    Trigger: {result.automationWorkflow.trigger.type}
                  </div>
                  <p className="text-sm mt-1 text-muted-foreground">{result.automationWorkflow.trigger.config}</p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {result.automationWorkflow.steps.map((step, index) => (
                    <div key={step.id || index} className="flex gap-4 p-4 rounded-lg border">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {step.id || index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{step.name}</h4>
                        <Badge variant="outline" className="mt-1">{step.type}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">{step.action}</p>
                        {step.config && (
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {step.config}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connections */}
                {result.automationWorkflow.connections && result.automationWorkflow.connections.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">REQUIRED CONNECTIONS</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.automationWorkflow.connections.map((conn, i) => (
                        <Badge key={i} variant="secondary">{conn}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No workflow generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Code Snippets Tab */}
        <TabsContent value="code" className="mt-4 space-y-4">
          {result.codeSnippets && result.codeSnippets.length > 0 ? (
            result.codeSnippets.map((snippet, index) => {
              const snippetAny = snippet as unknown as Record<string, unknown>;
              const name = safeString(snippetAny.name || `Code Snippet ${index + 1}`);
              const description = safeString(snippetAny.description || "");
              const language = safeString(snippetAny.language || "text");
              const code = safeString(snippetAny.code || "");

              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          {name}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{language}</Badge>
                        <CopyButton text={code} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
                      {code}
                    </pre>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No code snippets generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="emails" className="mt-4 space-y-4">
          {result.emailTemplates && result.emailTemplates.length > 0 ? (
            result.emailTemplates.map((template, index) => {
              // Handle various formats AI might return
              const templateAny = template as unknown as Record<string, unknown>;
              const name = safeString(templateAny.name || `Email Template ${index + 1}`);
              const subject = safeString(templateAny.subject || "");
              const body = safeString(templateAny.body || "");
              const variables = Array.isArray(templateAny.variables)
                ? templateAny.variables.filter((v): v is string => typeof v === "string")
                : [];

              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {name}
                        </CardTitle>
                      </div>
                      <CopyButton text={`Subject: ${subject}\n\n${body}`} label="Copy All" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">SUBJECT</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium flex-1">{subject}</p>
                        <CopyButton text={subject} label="Copy" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">BODY</Label>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-sm bg-muted p-3 rounded-lg">
                        {body}
                      </pre>
                    </div>
                    {variables.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">VARIABLES TO PERSONALIZE</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {variables.map((v, i) => (
                            <Badge key={i} variant="secondary">{`{{${v}}}`}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No email templates generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Config Tab */}
        <TabsContent value="api" className="mt-4 space-y-4">
          {result.apiConfig && result.apiConfig.length > 0 ? (
            result.apiConfig.map((api, index) => {
              const apiAny = api as unknown as Record<string, unknown>;
              const name = safeString(apiAny.name || `API ${index + 1}`);
              const description = safeString(apiAny.description || "");
              const method = safeString(apiAny.method || "GET");
              const endpoint = safeString(apiAny.endpoint || "");
              const headers = safeString(apiAny.headers || "");
              const body = safeString(apiAny.body || "");

              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          {name}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </div>
                      <Badge>{method}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">ENDPOINT</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 text-sm bg-muted px-2 py-1 rounded">{endpoint}</code>
                        <CopyButton text={endpoint} />
                      </div>
                    </div>
                    {headers && (
                      <div>
                        <Label className="text-xs text-muted-foreground">HEADERS</Label>
                        <pre className="mt-1 text-xs bg-zinc-900 text-zinc-100 p-2 rounded overflow-x-auto">
                          {headers}
                        </pre>
                      </div>
                    )}
                    {body && (
                      <div>
                        <Label className="text-xs text-muted-foreground">REQUEST BODY</Label>
                        <pre className="mt-1 text-xs bg-zinc-900 text-zinc-100 p-2 rounded overflow-x-auto">
                          {body}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No API configurations generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Implementation Checklist Tab */}
        <TabsContent value="checklist" className="mt-4">
          {result.implementationChecklist && result.implementationChecklist.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5" />
                      Implementation Checklist
                    </CardTitle>
                    <CardDescription>Step-by-step guide to implement this system</CardDescription>
                  </div>
                  <DownloadButton
                    content={result.implementationChecklist.map(item => `[ ] ${item.task}\n   ${item.details}`).join('\n\n')}
                    filename="checklist.txt"
                    label="Export"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.implementationChecklist.map((item, index) => (
                    <div key={item.id || index} className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary font-medium text-sm">
                        {item.id || index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.task}</h4>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No checklist generated for this system.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
