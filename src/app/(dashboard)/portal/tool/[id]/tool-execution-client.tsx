"use client";

import { useState } from "react";
import { ClientTool, UserProfile } from "@/types/database";
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
import { ArrowLeft, Wand2, Loader2, Copy, Check, Download } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface ToolExecutionClientProps {
  tool: ClientTool;
  profile: UserProfile;
}

export function ToolExecutionClient({ tool, profile }: ToolExecutionClientProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");

  const handleInputChange = (fieldName: string, value: string) => {
    setInputs({ ...inputs, [fieldName]: value });
  };

  const handleExecute = async () => {
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch("/api/execute-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          inputs,
          userId: profile.id,
          clientId: profile.client_id || tool.client_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute tool");
      }

      setOutput(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, "-")}-output.${
      tool.output_format === "json" ? "json" :
      tool.output_format === "html" ? "html" : "md"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderInputField = (field: typeof tool.input_fields[0], index: number) => {
    const commonProps = {
      id: field.name,
      value: inputs[field.name] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        handleInputChange(field.name, e.target.value),
      placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
      required: field.required,
    };

    return (
      <div key={index} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.type === "textarea" ? (
          <Textarea {...commonProps} rows={4} />
        ) : (
          <Input {...commonProps} type={field.type} />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/portal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{tool.name}</h2>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input</CardTitle>
            <CardDescription>
              Fill in the fields below to generate your output
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tool.input_fields && tool.input_fields.length > 0 ? (
              <>
                {tool.input_fields.map((field, index) =>
                  renderInputField(field, index)
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="default_input">Your Request</Label>
                <Textarea
                  id="default_input"
                  value={inputs.default_input || ""}
                  onChange={(e) => handleInputChange("default_input", e.target.value)}
                  placeholder="Enter your request..."
                  rows={6}
                />
              </div>
            )}

            <Button
              onClick={handleExecute}
              disabled={loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Output</CardTitle>
                <CardDescription>Generated result will appear here</CardDescription>
              </div>
              {output && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {!output && !error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wand2 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Your generated content will appear here</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Generating your content...</p>
              </div>
            )}

            {output && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {tool.output_format === "markdown" ? (
                  <ReactMarkdown>{output}</ReactMarkdown>
                ) : tool.output_format === "json" ? (
                  <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(output), null, 2)}
                  </pre>
                ) : tool.output_format === "html" ? (
                  <div dangerouslySetInnerHTML={{ __html: output }} />
                ) : (
                  <p className="whitespace-pre-wrap">{output}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
