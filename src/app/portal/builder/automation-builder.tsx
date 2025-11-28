"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Webhook,
  Calendar,
  MousePointer,
  CheckCircle,
  Bot,
  Wand2,
  FileText,
  Mail,
  Database,
  Bell,
  RefreshCw,
  Code,
  AlertCircle,
  TrendingUp,
  Headphones,
  Megaphone,
  Users,
  DollarSign,
  Settings,
  MessageSquare,
  Brain,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AutomationBuilderProps {
  clientId: string;
}

type Step = "describe" | "select-agent" | "configure" | "review" | "complete";
type BuilderMode = "automation" | "agent";

// Icon mapping for agent categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Headphones,
  Megaphone,
  Settings,
  Code,
  Users,
  DollarSign,
  Sparkles,
  Bot,
};

const TEMPLATES = [
  {
    id: "lead-capture",
    name: "Lead Capture",
    description: "Capture leads from forms and sync to your CRM",
    icon: Database,
    prompt: "Create an automation that captures lead information from form submissions, validates the data, and adds it to a CRM system",
  },
  {
    id: "email-notifications",
    name: "Smart Notifications",
    description: "Send intelligent notifications based on events",
    icon: Bell,
    prompt: "Create an automation that monitors for specific events and sends smart, personalized notifications via email or Slack",
  },
  {
    id: "data-sync",
    name: "Data Sync",
    description: "Keep data synchronized between systems",
    icon: RefreshCw,
    prompt: "Create an automation that synchronizes data between two systems, handling conflicts and keeping everything up to date",
  },
  {
    id: "report-generator",
    name: "Report Generator",
    description: "Generate and deliver reports automatically",
    icon: FileText,
    prompt: "Create an automation that generates reports from data sources and delivers them on a schedule",
  },
  {
    id: "email-processor",
    name: "Email Processor",
    description: "Process incoming emails and take action",
    icon: Mail,
    prompt: "Create an automation that processes incoming emails, extracts key information, and takes appropriate actions",
  },
  {
    id: "custom",
    name: "Custom Automation",
    description: "Describe what you want to automate",
    icon: Code,
    prompt: "",
  },
];

// AI Agent categories for the builder
const AGENT_CATEGORIES = [
  { id: "sales", name: "Sales", description: "Lead qualification, proposals, objection handling", icon: "TrendingUp" },
  { id: "support", name: "Customer Support", description: "Help desk, ticket routing, FAQ assistance", icon: "Headphones" },
  { id: "marketing", name: "Marketing", description: "Content creation, social media, campaigns", icon: "Megaphone" },
  { id: "operations", name: "Operations", description: "Task management, process monitoring, scheduling", icon: "Settings" },
  { id: "development", name: "Development", description: "Code review, bug analysis, documentation", icon: "Code" },
  { id: "hr", name: "HR & Recruiting", description: "Recruiting, onboarding, policy assistance", icon: "Users" },
  { id: "finance", name: "Finance", description: "Invoice processing, expense analysis, reporting", icon: "DollarSign" },
  { id: "custom", name: "Custom Agent", description: "Build your own AI agent from scratch", icon: "Sparkles" },
];

export default function AutomationBuilder({ clientId }: AutomationBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("describe");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [automationName, setAutomationName] = useState("");
  const [triggerType, setTriggerType] = useState<string>("manual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<Record<string, unknown> | null>(null);
  const [createdAutomationId, setCreatedAutomationId] = useState<string | null>(null);

  // Agent-specific state
  const [builderMode, setBuilderMode] = useState<BuilderMode>("automation");
  const [selectedAgentCategory, setSelectedAgentCategory] = useState<string | null>(null);
  const [agentSystemPrompt, setAgentSystemPrompt] = useState("");
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  function handleTemplateSelect(templateId: string) {
    if (templateId === "ai-agent") {
      setBuilderMode("agent");
      setSelectedTemplate(templateId);
      setPrompt("");
      return;
    }
    setBuilderMode("automation");
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template && template.prompt) {
      setPrompt(template.prompt);
    }
  }

  function handleAgentCategorySelect(categoryId: string) {
    setSelectedAgentCategory(categoryId);
    const category = AGENT_CATEGORIES.find((c) => c.id === categoryId);
    if (category && categoryId !== "custom") {
      setPrompt(`Create an AI agent for ${category.name.toLowerCase()} tasks: ${category.description}`);
    } else {
      setPrompt("");
    }
  }

  async function handleCreateAgent() {
    if (!prompt.trim() || !automationName.trim()) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate a system prompt based on user's description
      const systemPrompt = agentSystemPrompt || `You are an AI assistant specialized in ${selectedAgentCategory || "general"} tasks.
Your role is to help with: ${prompt}

Guidelines:
- Be helpful, accurate, and professional
- Ask clarifying questions when needed
- Provide actionable recommendations
- Stay focused on the task at hand`;

      // Create the agent - client isolation is enforced by the API
      // The API uses the portal_client_id cookie to ensure agents
      // are only created for and accessible by the authenticated client
      const response = await fetch("/api/portal/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: automationName,
          description: prompt,
          category: selectedAgentCategory || "custom",
          system_prompt: systemPrompt,
          model: "claude-sonnet-4-20250514",
          temperature: 0.7,
          max_tokens: 4096,
          capabilities: ["chat"],
          is_public: false, // Agents are private to the company by default
          api_enabled: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create agent");
      }

      const data = await response.json();
      setCreatedAgentId(data.agent?.id || data.id);
      setGeneratedResult({
        agentName: automationName,
        category: selectedAgentCategory,
        description: prompt,
        systemPrompt: systemPrompt,
      });
      setStep("review");

      toast({
        title: "Agent created!",
        description: "Review your AI agent before activating",
      });
    } catch (error) {
      console.error("Agent creation error:", error);
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleActivateAgent() {
    if (!createdAgentId) return;

    try {
      const response = await fetch(`/api/portal/agents/${createdAgentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
        }),
      });

      if (response.ok) {
        setStep("complete");
        toast({
          title: "Agent activated!",
          description: "Your AI agent is now ready to use",
        });
      }
    } catch {
      toast({
        title: "Failed to activate agent",
        variant: "destructive",
      });
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast({
        title: "Please describe your automation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // First create a system build record
      const createResponse = await fetch("/api/workspace/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: automationName || "New Automation",
          prompt: prompt,
          clientId: clientId,
          automationType: triggerType,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create automation");
      }

      const createData = await createResponse.json();
      const buildId = createData.id;

      // Now generate the automation design
      const generateResponse = await fetch("/api/system-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          buildId: buildId,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate automation");
      }

      const generateData = await generateResponse.json();
      setGeneratedResult(generateData.result);
      setCreatedAutomationId(buildId);
      setStep("review");

      toast({
        title: "Automation designed!",
        description: "Review your automation before activating",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Failed to generate",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleActivate() {
    if (!createdAutomationId) return;

    try {
      const response = await fetch("/api/workspace/automation/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdAutomationId,
          status: "active",
        }),
      });

      if (response.ok) {
        setStep("complete");
        toast({
          title: "Automation activated!",
          description: "Your automation is now live",
        });
      }
    } catch {
      toast({
        title: "Failed to activate",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {["describe", "configure", "review", "complete"].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === s
                    ? "bg-violet-600 text-white"
                    : ["describe", "configure", "review", "complete"].indexOf(step) > index
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {["describe", "configure", "review", "complete"].indexOf(step) > index ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 3 && (
                <div
                  className={`w-full h-1 mx-2 ${
                    ["describe", "configure", "review", "complete"].indexOf(step) > index
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                  style={{ width: "80px" }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span>Describe</span>
          <span>Configure</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step: Describe */}
      {step === "describe" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold">What would you like to automate?</h2>
            <p className="text-muted-foreground mt-2">
              Choose a template or describe your automation in plain English
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id && builderMode === "automation"
                    ? "border-violet-500 bg-violet-50"
                    : "hover:border-violet-200"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      selectedTemplate === template.id && builderMode === "automation"
                        ? "bg-violet-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <template.icon
                      className={`w-6 h-6 ${
                        selectedTemplate === template.id && builderMode === "automation"
                          ? "text-violet-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}

            {/* AI Agent Option */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${
                selectedTemplate === "ai-agent"
                  ? "border-violet-500 bg-gradient-to-br from-violet-50 to-indigo-50"
                  : "hover:border-violet-200 bg-gradient-to-br from-violet-50/50 to-indigo-50/50"
              }`}
              onClick={() => handleTemplateSelect("ai-agent")}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs">
                  AI Powered
                </Badge>
              </div>
              <CardContent className="pt-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    selectedTemplate === "ai-agent"
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                      : "bg-gradient-to-r from-violet-100 to-indigo-100"
                  }`}
                >
                  <Brain
                    className={`w-6 h-6 ${
                      selectedTemplate === "ai-agent"
                        ? "text-white"
                        : "text-violet-600"
                    }`}
                  />
                </div>
                <h3 className="font-semibold mb-1">AI Agent</h3>
                <p className="text-sm text-muted-foreground">Deploy an intelligent AI assistant for your team</p>
              </CardContent>
            </Card>
          </div>

          {/* Custom Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Describe your automation
              </CardTitle>
              <CardDescription>
                Explain what you want to automate in plain English. Our AI will design it for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: I want to automatically capture leads from my website contact form, send them a welcome email, and add their information to my CRM..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (builderMode === "agent") {
                  setStep("select-agent");
                } else {
                  setStep("configure");
                }
              }}
              disabled={builderMode === "automation" && !prompt.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Select Agent Category */}
      {step === "select-agent" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold">What type of AI Agent do you need?</h2>
            <p className="text-muted-foreground mt-2">
              Select a category or create a custom agent
            </p>
          </div>

          {/* Agent Categories Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AGENT_CATEGORIES.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.icon] || Bot;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAgentCategory === category.id
                      ? "border-violet-500 bg-violet-50"
                      : "hover:border-violet-200"
                  }`}
                  onClick={() => handleAgentCategorySelect(category.id)}
                >
                  <CardContent className="pt-6 text-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto ${
                        selectedAgentCategory === category.id
                          ? "bg-violet-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${
                          selectedAgentCategory === category.id
                            ? "text-violet-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Agent Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-600" />
                Configure your AI Agent
              </CardTitle>
              <CardDescription>
                Give your agent a name and describe what it should do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Sales Assistant, Support Bot"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentDescription">What should this agent do?</Label>
                <Textarea
                  id="agentDescription"
                  placeholder="Describe what you want your AI agent to help with. Be specific about the tasks, context, and goals..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">
                  Custom Instructions (Optional)
                  <span className="text-muted-foreground font-normal ml-2">Advanced</span>
                </Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Add specific instructions for how your agent should behave, respond, or handle certain situations..."
                  value={agentSystemPrompt}
                  onChange={(e) => setAgentSystemPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Isolation Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Your data stays private</p>
              <p className="text-xs text-blue-700 mt-1">
                This AI agent is exclusive to your company. All conversations and data are isolated and never shared with other organizations.
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("describe")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleCreateAgent}
              disabled={isGenerating || !automationName.trim() || !prompt.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create AI Agent
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Configure */}
      {step === "configure" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Configure your automation</h2>
            <p className="text-muted-foreground mt-2">
              Set up how and when your automation should run
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Automation Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lead Capture Automation"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                />
              </div>

              {/* Trigger Type */}
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      triggerType === "manual"
                        ? "border-violet-500 bg-violet-50"
                        : "hover:border-violet-200"
                    }`}
                    onClick={() => setTriggerType("manual")}
                  >
                    <CardContent className="pt-4 text-center">
                      <MousePointer
                        className={`w-8 h-8 mx-auto mb-2 ${
                          triggerType === "manual" ? "text-violet-600" : "text-gray-400"
                        }`}
                      />
                      <p className="font-medium text-sm">Manual</p>
                      <p className="text-xs text-muted-foreground">Run on demand</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      triggerType === "scheduled"
                        ? "border-violet-500 bg-violet-50"
                        : "hover:border-violet-200"
                    }`}
                    onClick={() => setTriggerType("scheduled")}
                  >
                    <CardContent className="pt-4 text-center">
                      <Calendar
                        className={`w-8 h-8 mx-auto mb-2 ${
                          triggerType === "scheduled" ? "text-violet-600" : "text-gray-400"
                        }`}
                      />
                      <p className="font-medium text-sm">Scheduled</p>
                      <p className="text-xs text-muted-foreground">Run on schedule</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      triggerType === "webhook"
                        ? "border-violet-500 bg-violet-50"
                        : "hover:border-violet-200"
                    }`}
                    onClick={() => setTriggerType("webhook")}
                  >
                    <CardContent className="pt-4 text-center">
                      <Webhook
                        className={`w-8 h-8 mx-auto mb-2 ${
                          triggerType === "webhook" ? "text-violet-600" : "text-gray-400"
                        }`}
                      />
                      <p className="font-medium text-sm">Webhook</p>
                      <p className="text-xs text-muted-foreground">Trigger by events</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Description Preview */}
              <div className="space-y-2">
                <Label>What it will do</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{prompt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("describe")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !automationName.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Automation
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && generatedResult && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">
              {builderMode === "agent" ? "Your AI Agent is ready!" : "Your automation is ready!"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {builderMode === "agent"
                ? "Review your AI agent before activating"
                : "Review the generated automation before activating"}
            </p>
          </div>

          {/* Agent Review Card */}
          {builderMode === "agent" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-600" />
                    {automationName}
                  </CardTitle>
                  <CardDescription>
                    {prompt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">
                      {selectedAgentCategory || "custom"} agent
                    </Badge>
                    <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600">AI Powered</Badge>
                  </div>

                  {/* Agent Capabilities */}
                  <div className="space-y-3">
                    <p className="font-medium text-sm">Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat Interface
                      </Badge>
                      <Badge variant="secondary">
                        <Bot className="w-3 h-3 mr-1" />
                        Task Execution
                      </Badge>
                    </div>
                  </div>

                  {/* System Prompt Preview */}
                  {(generatedResult as { systemPrompt?: string }).systemPrompt && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">System Instructions:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {(generatedResult as { systemPrompt: string }).systemPrompt}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Privacy Card */}
              <Card className="border-green-100 bg-green-50/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">Data Isolation Guaranteed</p>
                      <p className="text-sm text-green-700 mt-1">
                        This agent is private to your organization. All conversations, data, and outputs remain
                        completely isolated and will never be shared with other companies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Automation Review Card */}
          {builderMode === "automation" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    {automationName}
                  </CardTitle>
                  <CardDescription>
                    {(generatedResult as { systemOverview?: string }).systemOverview || "Automation designed by AI"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="capitalize">
                      {triggerType} trigger
                    </Badge>
                    <Badge variant="secondary">AI Generated</Badge>
                  </div>

                  {/* Workflow Steps */}
                  {(generatedResult as { automationWorkflow?: { steps?: Array<{ id: number; name: string; action: string }> } }).automationWorkflow?.steps && (
                    <div className="space-y-3">
                      <p className="font-medium text-sm">Workflow Steps:</p>
                      {(generatedResult as { automationWorkflow: { steps: Array<{ id: number; name: string; action: string }> } }).automationWorkflow.steps.map((wfStep: { id: number; name: string; action: string }, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-violet-700">
                            {wfStep.id}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{wfStep.name}</p>
                            <p className="text-xs text-muted-foreground">{wfStep.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Portal Actions</CardTitle>
                  <CardDescription>
                    These actions will be available in your portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(generatedResult as { portalActions?: Array<{ id: string; label: string }> })?.portalActions?.map((action: { id: string; label: string }) => (
                      <Badge key={action.id} variant="secondary">
                        {action.label}
                      </Badge>
                    )) || (
                      <p className="text-sm text-muted-foreground">
                        Standard automation actions will be available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(builderMode === "agent" ? "select-agent" : "configure")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={builderMode === "agent" ? handleActivateAgent : handleActivate}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              {builderMode === "agent" ? "Activate Agent" : "Activate Automation"}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Complete */}
      {step === "complete" && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {builderMode === "agent" ? "AI Agent Activated!" : "Automation Activated!"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {builderMode === "agent" ? (
              <>
                Your AI agent &quot;{automationName}&quot; is now live and ready to assist your team.
                You can start chatting with it or run tasks from the Agents page.
              </>
            ) : (
              <>
                Your automation &quot;{automationName}&quot; is now live and ready to run.
                {triggerType === "manual" && " You can run it from your automations page."}
                {triggerType === "webhook" && " It will trigger when it receives webhook events."}
                {triggerType === "scheduled" && " It will run according to its schedule."}
              </>
            )}
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(builderMode === "agent" ? "/portal/agents" : "/portal/automations")}
            >
              {builderMode === "agent" ? "View Agents" : "View Automations"}
            </Button>
            {builderMode === "agent" && createdAgentId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/portal/agents/${createdAgentId}/chat`)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chatting
              </Button>
            )}
            <Button
              onClick={() => {
                setStep("describe");
                setSelectedTemplate(null);
                setPrompt("");
                setAutomationName("");
                setGeneratedResult(null);
                setCreatedAutomationId(null);
                setBuilderMode("automation");
                setSelectedAgentCategory(null);
                setAgentSystemPrompt("");
                setCreatedAgentId(null);
              }}
            >
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
