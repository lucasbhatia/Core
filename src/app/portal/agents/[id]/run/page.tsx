"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Copy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type DeployedAgent, type AgentInputField } from "@/lib/ai-agents/types";
import type { Client } from "@/types/database";

export default function AgentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<DeployedAgent | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    status: string;
    output: string | null;
    tokens_used: number;
    duration_ms: number | null;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetchClient();
    fetchAgent();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch("/api/portal/client");
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const fetchAgent = async () => {
    try {
      const res = await fetch(`/api/portal/agents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);

        // Initialize input data with empty values
        const initialData: Record<string, string> = {};
        (data.agent.input_fields || []).forEach((field: AgentInputField) => {
          initialData[field.name] = field.default_value || "";
        });
        setInputData(initialData);
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch(`/api/portal/agents/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_data: inputData,
          trigger: "manual",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          status: data.status,
          output: data.output,
          tokens_used: data.tokens_used,
          duration_ms: data.duration_ms,
        });
      } else {
        setResult({
          status: "failed",
          output: null,
          tokens_used: 0,
          duration_ms: null,
          error: data.error,
        });
      }
    } catch (error) {
      setResult({
        status: "failed",
        output: null,
        tokens_used: 0,
        duration_ms: null,
        error: "Failed to execute agent",
      });
    } finally {
      setRunning(false);
    }
  };

  const updateInputField = (name: string, value: string) => {
    setInputData((prev) => ({ ...prev, [name]: value }));
  };

  const copyOutput = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output);
    }
  };

  const renderInputField = (field: AgentInputField) => {
    const value = inputData[field.name] || "";

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => updateInputField(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={(v) => updateInputField(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <Input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => updateInputField(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      default:
        return (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => updateInputField(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <PortalShell client={client} pageTitle="Agent Not Found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Agent not found</h3>
            <Link href="/portal/agents">
              <Button>Back to Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  const inputFields = agent.input_fields || [];

  return (
    <PortalShell client={client} pageTitle={`Run ${agent.name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/portal/agents/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>
                {inputFields.length > 0
                  ? "Fill in the required fields to run this agent"
                  : "This agent doesn't require any input"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.length > 0 ? (
                inputFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderInputField(field)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No input fields configured</p>
                  <p className="text-sm">This agent will run with no input data</p>
                </div>
              )}

              <Button
                onClick={handleRun}
                disabled={running}
                className="w-full mt-4"
                size="lg"
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Output</CardTitle>
                  <CardDescription>Agent execution result</CardDescription>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    {result.status === "success" ? (
                      <Badge className="bg-green-500/10 text-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-500">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Zap className="h-12 w-12 mb-4 opacity-50" />
                  <p>Run the agent to see results</p>
                </div>
              ) : result.error ? (
                <div className="p-4 bg-red-500/10 rounded-lg">
                  <p className="text-red-500 font-medium">Error</p>
                  <p className="text-sm mt-1">{result.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      {result.tokens_used} tokens
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {result.duration_ms ? `${(result.duration_ms / 1000).toFixed(2)}s` : "-"}
                    </div>
                  </div>

                  {/* Output Content */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={copyOutput}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                      {agent.output_format === "markdown" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{result.output || ""}</ReactMarkdown>
                        </div>
                      ) : agent.output_format === "json" ? (
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {result.output}
                        </pre>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{result.output}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
