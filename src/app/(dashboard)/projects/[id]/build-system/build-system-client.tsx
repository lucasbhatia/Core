"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Cpu, Loader2, Sparkles } from "lucide-react";
import { createSystemBuild } from "@/app/actions/system-builds";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface BuildSystemClientProps {
  projectId: string;
  projectTitle: string;
  clientName: string;
}

export function BuildSystemClient({
  projectId,
  projectTitle,
  clientName,
}: BuildSystemClientProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGenerate = async () => {
    if (!title.trim() || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and a description.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Create the build record linked to project
      const newBuild = await createSystemBuild(title, prompt, projectId);

      // Call the API to generate the system
      const response = await fetch("/api/system-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, buildId: newBuild.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate system");
      }

      toast({
        title: "System generated!",
        description: "Your automation system is ready to view.",
        variant: "success",
      });

      // Redirect to the system detail page
      router.push(`/projects/${projectId}/systems/${newBuild.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate system. Please try again.",
        variant: "destructive",
      });
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Build System</h2>
          <p className="text-muted-foreground">
            for {projectTitle} ({clientName})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Automation System
          </CardTitle>
          <CardDescription>
            Describe what you want to automate and AI will create usable
            deliverables including prompts, code, workflows, and templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">System Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Email Automation System, Lead Follow-up Workflow"
              disabled={generating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe What You Need</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the automation you need in detail. For example:

I need a system that automatically responds to customer support emails, categorizes them by type (billing, technical, general), and sends appropriate auto-replies while escalating complex issues to the team.

The more detail you provide, the better the output will be."
              rows={10}
              disabled={generating}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !title.trim() || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating System...
              </>
            ) : (
              <>
                <Cpu className="mr-2 h-5 w-5" />
                Generate Automation System
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">What You&apos;ll Get</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Ready-to-use AI prompts for ChatGPT/Claude
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Automation workflow steps
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Copy-paste code snippets
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Email templates with variables
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              API configurations
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Implementation checklist
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
