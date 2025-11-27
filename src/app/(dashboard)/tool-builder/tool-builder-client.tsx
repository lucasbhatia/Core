"use client";

import { useState } from "react";
import { ClientTool, Client, InputField } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  Wand2,
  FileText,
  LayoutDashboard,
  Workflow,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye
} from "lucide-react";
import { createClientTool, updateClientTool, deleteClientTool } from "@/app/actions/client-tools";
import { useRouter } from "next/navigation";
import Link from "next/link";

const toolTypeIcons = {
  ai_generator: Wand2,
  workflow: Workflow,
  form: FileText,
  dashboard: LayoutDashboard,
};

const toolTypeLabels = {
  ai_generator: "AI Generator",
  workflow: "Workflow",
  form: "Form",
  dashboard: "Dashboard",
};

interface ToolBuilderClientProps {
  initialTools: ClientTool[];
  clients: Client[];
}

export function ToolBuilderClient({ initialTools, clients }: ToolBuilderClientProps) {
  const router = useRouter();
  const [tools, setTools] = useState<ClientTool[]>(initialTools);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ClientTool | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Multi-step creation flow
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [aiDescription, setAiDescription] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    name: "",
    description: "",
    tool_type: "ai_generator" as const,
    system_prompt: "",
    output_format: "markdown" as const,
    input_fields: [] as InputField[],
  });

  const resetForm = () => {
    setFormData({
      client_id: "",
      name: "",
      description: "",
      tool_type: "ai_generator",
      system_prompt: "",
      output_format: "markdown",
      input_fields: [],
    });
    setAiDescription("");
    setSelectedClientId("");
    setCreateStep(1);
  };

  const handleGenerateTool = async () => {
    if (!selectedClientId || !aiDescription) {
      alert("Please select a client and describe what you want to build");
      return;
    }

    setGenerating(true);
    try {
      const selectedClient = clients.find(c => c.id === selectedClientId);

      const response = await fetch("/api/generate-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiDescription,
          clientName: selectedClient?.company || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate tool");
      }

      // Populate form with generated data
      setFormData({
        client_id: selectedClientId,
        name: data.tool.name,
        description: data.tool.description,
        tool_type: data.tool.tool_type,
        system_prompt: data.tool.system_prompt,
        output_format: data.tool.output_format,
        input_fields: data.tool.input_fields,
      });

      setCreateStep(2);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to generate tool");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.client_id || !formData.name || !formData.system_prompt) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await createClientTool({
        client_id: formData.client_id,
        name: formData.name,
        description: formData.description || null,
        icon: "Wand2",
        tool_type: formData.tool_type,
        system_prompt: formData.system_prompt,
        input_fields: formData.input_fields,
        output_format: formData.output_format,
        is_active: true,
      });

      if (result.success && result.data) {
        setTools([result.data, ...tools]);
        setIsCreateOpen(false);
        resetForm();
        router.refresh();
      } else {
        alert(result.error || "Failed to create tool");
      }
    } catch (error) {
      alert("Failed to create tool");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tool: ClientTool) => {
    setEditingTool(tool);
    setFormData({
      client_id: tool.client_id,
      name: tool.name,
      description: tool.description || "",
      tool_type: tool.tool_type,
      system_prompt: tool.system_prompt,
      output_format: tool.output_format,
      input_fields: tool.input_fields || [],
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTool) return;

    setLoading(true);
    try {
      const result = await updateClientTool(editingTool.id, {
        name: formData.name,
        description: formData.description || null,
        tool_type: formData.tool_type,
        system_prompt: formData.system_prompt,
        input_fields: formData.input_fields,
        output_format: formData.output_format,
      });

      if (result.success) {
        setTools(tools.map(t =>
          t.id === editingTool.id
            ? { ...t, ...formData }
            : t
        ));
        setIsEditOpen(false);
        setEditingTool(null);
        resetForm();
        router.refresh();
      } else {
        alert(result.error || "Failed to update tool");
      }
    } catch (error) {
      alert("Failed to update tool");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (toolId: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;

    try {
      const result = await deleteClientTool(toolId);
      if (result.success) {
        setTools(tools.filter(t => t.id !== toolId));
        router.refresh();
      } else {
        alert(result.error || "Failed to delete tool");
      }
    } catch (error) {
      alert("Failed to delete tool");
    }
  };

  const addInputField = () => {
    setFormData({
      ...formData,
      input_fields: [
        ...formData.input_fields,
        { name: "", label: "", type: "text", required: true },
      ],
    });
  };

  const updateInputField = (index: number, field: Partial<InputField>) => {
    const newFields = [...formData.input_fields];
    newFields[index] = { ...newFields[index], ...field };
    setFormData({ ...formData, input_fields: newFields });
  };

  const removeInputField = (index: number) => {
    setFormData({
      ...formData,
      input_fields: formData.input_fields.filter((_, i) => i !== index),
    });
  };

  // Step 1: Describe what you want
  const Step1Content = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client">Select Client *</Label>
        <Select
          value={selectedClientId}
          onValueChange={setSelectedClientId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a client for this tool" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.company} ({client.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">What do you want to build? *</Label>
        <Textarea
          id="description"
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          placeholder="Describe the tool you want to create for this client. For example:

• 'A tool that generates personalized follow-up emails for leads based on their industry and pain points'

• 'An AI assistant that creates social media posts for their restaurant, matching their casual brand voice'

• 'A content generator that writes product descriptions for their e-commerce store'

Be specific about what the tool should do and what output the client needs."
          rows={8}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI will generate:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Tool name and description</li>
          <li>• AI instructions (system prompt)</li>
          <li>• Input fields the client will fill out</li>
          <li>• Output format configuration</li>
        </ul>
      </div>
    </div>
  );

  // Step 2: Review and edit generated tool
  const Step2Content = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Tool generated! Review and customize below, then save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Tool Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Email Generator, Lead Qualifier"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of what this tool does"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tool_type">Tool Type</Label>
          <Select
            value={formData.tool_type}
            onValueChange={(value: any) => setFormData({ ...formData, tool_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_generator">AI Generator</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="form">Form</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="output_format">Output Format</Label>
          <Select
            value={formData.output_format}
            onValueChange={(value: any) => setFormData({ ...formData, output_format: value })}
          >
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="system_prompt">AI Instructions (System Prompt) *</Label>
        <Textarea
          id="system_prompt"
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          placeholder="Instructions for the AI..."
          rows={6}
        />
        <p className="text-xs text-muted-foreground">
          This tells the AI how to behave and what to produce. Edit to fine-tune the output.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Input Fields (what client fills in)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInputField}>
            <Plus className="h-4 w-4 mr-1" /> Add Field
          </Button>
        </div>

        {formData.input_fields.map((field, index) => (
          <Card key={index} className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="field_name"
                value={field.name}
                onChange={(e) => updateInputField(index, {
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
              />
              <Input
                placeholder="Display Label"
                value={field.label}
                onChange={(e) => updateInputField(index, { label: e.target.value })}
              />
              <div className="flex gap-2">
                <Select
                  value={field.type}
                  onValueChange={(value: any) => updateInputField(index, { type: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInputField(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {formData.input_fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            No input fields. Add fields for users to fill in.
          </p>
        )}
      </div>
    </div>
  );

  // Edit form (same as Step 2 but standalone)
  const EditForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="name">Tool Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tool Type</Label>
          <Select
            value={formData.tool_type}
            onValueChange={(value: any) => setFormData({ ...formData, tool_type: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_generator">AI Generator</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="form">Form</SelectItem>
              <SelectItem value="dashboard">Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Output Format</Label>
          <Select
            value={formData.output_format}
            onValueChange={(value: any) => setFormData({ ...formData, output_format: value })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Plain Text</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>AI Instructions *</Label>
        <Textarea
          value={formData.system_prompt}
          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
          rows={6}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Input Fields</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInputField}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {formData.input_fields.map((field, index) => (
          <Card key={index} className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="field_name"
                value={field.name}
                onChange={(e) => updateInputField(index, {
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
              />
              <Input
                placeholder="Label"
                value={field.label}
                onChange={(e) => updateInputField(index, { label: e.target.value })}
              />
              <div className="flex gap-2">
                <Select
                  value={field.type}
                  onValueChange={(value: any) => updateInputField(index, { type: value })}
                >
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeInputField(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          className="gap-2"
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <Sparkles className="h-4 w-4" />
          Create Tool with AI
        </Button>
      </div>

      {/* Create Dialog - Multi-step */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {createStep === 1 ? "Create New Tool" : "Review & Customize"}
            </DialogTitle>
            <DialogDescription>
              {createStep === 1
                ? "Describe what you want to build and AI will create the tool for you."
                : "Review the generated tool and make any adjustments before saving."}
            </DialogDescription>
          </DialogHeader>

          {createStep === 1 ? <Step1Content /> : <Step2Content />}

          <DialogFooter>
            {createStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateTool}
                  disabled={generating || !selectedClientId || !aiDescription}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Tool
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCreateStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={loading} className="gap-2">
                  {loading ? "Saving..." : "Save Tool"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>
              Update this tool's configuration.
            </DialogDescription>
          </DialogHeader>
          <EditForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditOpen(false);
              setEditingTool(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tools Grid */}
      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tools yet</h3>
            <p className="text-muted-foreground text-center mt-1 max-w-md">
              Create your first AI-powered tool. Describe what you need and the system will build it for you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = toolTypeIcons[tool.tool_type] || Wand2;
            return (
              <Card key={tool.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tool.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {tool.client?.company || "No client"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={tool.is_active ? "default" : "secondary"}>
                      {tool.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {tool.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {tool.input_fields?.length || 0} inputs
                    </Badge>
                    <div className="flex gap-1">
                      <Link href={`/portal/tool/${tool.id}`}>
                        <Button variant="ghost" size="icon" title="Preview tool">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tool)}
                        title="Edit tool"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tool.id)}
                        title="Delete tool"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
