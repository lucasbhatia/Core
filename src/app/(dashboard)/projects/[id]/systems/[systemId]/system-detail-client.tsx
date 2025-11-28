"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
  Workflow,
  Code,
  Mail,
  ListChecks,
  MessageSquare,
  Copy,
  Check,
  Download,
  Zap,
  Trash2,
} from "lucide-react";
import { deleteSystemBuild } from "@/app/actions/system-builds";
import { useToast } from "@/components/ui/use-toast";
import type { SystemBuildResult } from "@/types/database";

interface SystemDetailClientProps {
  result: SystemBuildResult;
  systemId: string;
  projectId: string;
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

export function SystemDetailClient({ result, systemId, projectId }: SystemDetailClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSystemBuild(systemId);
      toast({
        title: "System deleted",
        description: "The system has been deleted.",
        variant: "success",
      });
      router.push(`/projects/${projectId}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete system.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <>
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
                        <Label className="text-xs text-muted-foreground">PROMPT</Label>
                        <pre className="mt-1 whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-lg max-h-60 overflow-y-auto">
                          {promptText}
                        </pre>
                      </div>
                      {variables.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">VARIABLES</Label>
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
                  No AI prompts generated.
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
                        {safeString(result.automationWorkflow.name)}
                      </CardTitle>
                      <CardDescription>{safeString(result.automationWorkflow.description)}</CardDescription>
                    </div>
                    <DownloadButton
                      content={JSON.stringify(result.automationWorkflow, null, 2)}
                      filename="workflow.json"
                      label="Export JSON"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                      <Zap className="h-4 w-4" />
                      Trigger: {safeString(result.automationWorkflow.trigger?.type)}
                    </div>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {safeString(result.automationWorkflow.trigger?.config)}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {result.automationWorkflow.steps?.map((step, index) => (
                      <div key={index} className="flex gap-4 p-4 rounded-lg border">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{safeString(step.name)}</h4>
                          <Badge variant="outline" className="mt-1">{safeString(step.type)}</Badge>
                          <p className="text-sm text-muted-foreground mt-2">{safeString(step.action)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.automationWorkflow.connections && result.automationWorkflow.connections.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">REQUIRED CONNECTIONS</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.automationWorkflow.connections.map((conn, i) => (
                          <Badge key={i} variant="secondary">{safeString(conn)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No workflow generated.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="mt-4 space-y-4">
            {result.codeSnippets && result.codeSnippets.length > 0 ? (
              result.codeSnippets.map((snippet, index) => {
                const snippetAny = snippet as unknown as Record<string, unknown>;
                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            {safeString(snippetAny.name)}
                          </CardTitle>
                          <CardDescription>{safeString(snippetAny.description)}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{safeString(snippetAny.language)}</Badge>
                          <CopyButton text={safeString(snippetAny.code)} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap font-mono text-sm bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto">
                        {safeString(snippetAny.code)}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No code snippets generated.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="emails" className="mt-4 space-y-4">
            {result.emailTemplates && result.emailTemplates.length > 0 ? (
              result.emailTemplates.map((template, index) => {
                const templateAny = template as unknown as Record<string, unknown>;
                const name = safeString(templateAny.name || `Email ${index + 1}`);
                const subject = safeString(templateAny.subject || "");
                const body = safeString(templateAny.body || "");
                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {name}
                        </CardTitle>
                        <CopyButton text={`Subject: ${subject}\n\n${body}`} label="Copy All" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">SUBJECT</Label>
                        <p className="mt-1 font-medium">{subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">BODY</Label>
                        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm bg-muted p-3 rounded-lg">
                          {body}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No email templates generated.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="mt-4 space-y-4">
            {result.apiConfig && result.apiConfig.length > 0 ? (
              result.apiConfig.map((api, index) => {
                const apiAny = api as unknown as Record<string, unknown>;
                return (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            {safeString(apiAny.name)}
                          </CardTitle>
                          <CardDescription>{safeString(apiAny.description)}</CardDescription>
                        </div>
                        <Badge>{safeString(apiAny.method)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">ENDPOINT</Label>
                        <code className="block mt-1 text-sm bg-muted px-2 py-1 rounded">
                          {safeString(apiAny.endpoint)}
                        </code>
                      </div>
                      {safeString(apiAny.headers) && (
                        <div>
                          <Label className="text-xs text-muted-foreground">HEADERS</Label>
                          <pre className="mt-1 text-xs bg-zinc-900 text-zinc-100 p-2 rounded overflow-x-auto">
                            {safeString(apiAny.headers)}
                          </pre>
                        </div>
                      )}
                      {safeString(apiAny.body) && (
                        <div>
                          <Label className="text-xs text-muted-foreground">BODY</Label>
                          <pre className="mt-1 text-xs bg-zinc-900 text-zinc-100 p-2 rounded overflow-x-auto">
                            {safeString(apiAny.body)}
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
                  No API configurations generated.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Checklist Tab */}
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
                      <CardDescription>Step-by-step guide</CardDescription>
                    </div>
                    <DownloadButton
                      content={result.implementationChecklist.map((item) => {
                        const itemAny = item as unknown as Record<string, unknown>;
                        return `[ ] ${safeString(itemAny.task)}\n   ${safeString(itemAny.details)}`;
                      }).join('\n\n')}
                      filename="checklist.txt"
                      label="Export"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.implementationChecklist.map((item, index) => {
                      const itemAny = item as unknown as Record<string, unknown>;
                      return (
                        <div key={index} className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary font-medium text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{safeString(itemAny.task)}</h4>
                              <Badge variant="outline" className="text-xs">{safeString(itemAny.category)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{safeString(itemAny.details)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No checklist generated.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Button */}
        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete System
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this system? This action cannot be undone.
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
