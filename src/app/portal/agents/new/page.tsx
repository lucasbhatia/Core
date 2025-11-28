"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Trash2,
  Save,
  Wand2,
  Info,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { getTemplateById, agentCategories, type AgentTemplate } from "@/lib/ai-agents/templates";

interface InputField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

function AgentBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<AgentTemplate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);

  useEffect(() => {
    if (templateId) {
      const t = getTemplateById(templateId);
      if (t) {
        setTemplate(t);
        setName(t.name);
        setDescription(t.description);
        setCategory(t.category);
        setSystemPrompt(t.systemPrompt);
        setTemperature(t.temperature);
        setMaxTokens(t.maxTokens);
        setOutputFormat(t.outputFormat);
        setInputFields(t.inputFields.map((f) => ({ ...f })));
      }
    }
  }, [templateId]);

  const addInputField = () => {
    setInputFields([
      ...inputFields,
      {
        name: `field_${inputFields.length + 1}`,
        label: "New Field",
        type: "text",
        placeholder: "",
        required: false,
      },
    ]);
  };

  const removeInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const updateInputField = (index: number, updates: Partial<InputField>) => {
    setInputFields(
      inputFields.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/portal/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: templateId || undefined,
          name,
          description,
          category,
          system_prompt: systemPrompt,
          model,
          temperature,
          max_tokens: maxTokens,
          output_format: outputFormat,
          input_fields: inputFields,
          is_public: isPublic,
          api_enabled: apiEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/portal/agents/${data.agent.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell pageTitle="Create Agent">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {template ? `Create from "${template.name}"` : "Create Custom Agent"}
              </h1>
              <p className="text-muted-foreground">
                {template
                  ? "Customize this template to fit your needs"
                  : "Build a custom AI agent from scratch"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name || !systemPrompt}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and describe your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Lead Qualifier"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {agentCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this agent do?"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Prompt */}
            <Card>
              <CardHeader>
                <CardTitle>System Prompt *</CardTitle>
                <CardDescription>
                  Instructions that define how your agent behaves and responds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are an expert... Your job is to..."
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Be specific about the agent&apos;s role, expertise, and expected output format.
                </p>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Input Fields</CardTitle>
                    <CardDescription>
                      Define the data your agent needs to process
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addInputField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inputFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No input fields defined</p>
                    <p className="text-sm">Click &quot;Add Field&quot; to create input fields</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inputFields.map((field, index) => (
                      <div
                        key={index}
                        className="grid gap-4 p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Field {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeInputField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Field Name</Label>
                            <Input
                              value={field.name}
                              onChange={(e) =>
                                updateInputField(index, {
                                  name: e.target.value.replace(/\s+/g, "_").toLowerCase(),
                                })
                              }
                              placeholder="field_name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateInputField(index, { label: e.target.value })}
                              placeholder="Display Label"
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateInputField(index, { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) =>
                                updateInputField(index, { placeholder: e.target.value })
                              }
                              placeholder="Placeholder text..."
                            />
                          </div>
                          <div className="flex items-end pb-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`required-${index}`}
                                checked={field.required || false}
                                onCheckedChange={(checked) =>
                                  updateInputField(index, { required: checked })
                                }
                              />
                              <Label htmlFor={`required-${index}`}>Required</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            {/* Model Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Model Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4-20250514">
                        Claude Sonnet 4 (Recommended)
                      </SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">
                        Claude 3.5 Haiku (Faster)
                      </SelectItem>
                      <SelectItem value="claude-opus-4-20250514">
                        Claude Opus 4 (Advanced)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Temperature: {temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Select value={maxTokens.toString()} onValueChange={(v) => setMaxTokens(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024">1,024 (Short)</SelectItem>
                      <SelectItem value="2048">2,048 (Medium)</SelectItem>
                      <SelectItem value="4096">4,096 (Default)</SelectItem>
                      <SelectItem value="8192">8,192 (Long)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Access Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Access & API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Access</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow access without authentication
                    </p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Access</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable programmatic access via API
                    </p>
                  </div>
                  <Switch checked={apiEnabled} onCheckedChange={setApiEnabled} />
                </div>
              </CardContent>
            </Card>

            {/* Template Info */}
            {template && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Template Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Based on</span>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tier</span>
                    <Badge variant="outline">{template.tier}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </PortalShell>
  );
}

export default function CreateAgentPage() {
  return (
    <Suspense fallback={
      <PortalShell pageTitle="Create Agent">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PortalShell>
    }>
      <AgentBuilderContent />
    </Suspense>
  );
}
