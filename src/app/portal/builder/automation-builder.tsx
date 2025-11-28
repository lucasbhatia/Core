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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AutomationBuilderProps {
  clientId: string;
}

type Step = "describe" | "configure" | "review" | "complete";

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

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template && template.prompt) {
      setPrompt(template.prompt);
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
                  selectedTemplate === template.id
                    ? "border-violet-500 bg-violet-50"
                    : "hover:border-violet-200"
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="pt-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      selectedTemplate === template.id
                        ? "bg-violet-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <template.icon
                      className={`w-6 h-6 ${
                        selectedTemplate === template.id
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
              onClick={() => setStep("configure")}
              disabled={!prompt.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
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
            <h2 className="text-2xl font-bold">Your automation is ready!</h2>
            <p className="text-muted-foreground mt-2">
              Review the generated automation before activating
            </p>
          </div>

          {/* Overview Card */}
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
                  {(generatedResult as { automationWorkflow: { steps: Array<{ id: number; name: string; action: string }> } }).automationWorkflow.steps.map((step: { id: number; name: string; action: string }, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-violet-700">
                        {step.id}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.action}</p>
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

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("configure")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleActivate}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Activate Automation
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
          <h2 className="text-2xl font-bold mb-2">Automation Activated!</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your automation &quot;{automationName}&quot; is now live and ready to run.
            {triggerType === "manual" && " You can run it from your automations page."}
            {triggerType === "webhook" && " It will trigger when it receives webhook events."}
            {triggerType === "scheduled" && " It will run according to its schedule."}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/portal/automations")}>
              View Automations
            </Button>
            <Button
              onClick={() => {
                setStep("describe");
                setSelectedTemplate(null);
                setPrompt("");
                setAutomationName("");
                setGeneratedResult(null);
                setCreatedAutomationId(null);
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
