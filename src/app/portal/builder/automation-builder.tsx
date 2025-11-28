"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Wand2,
  FileText,
  Mail,
  Database,
  Bell,
  RefreshCw,
  Code,
  LayoutTemplate,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AutomationBuilderProps {
  clientId: string;
  templateId?: string;
  templatePrompt?: string;
  templateName?: string;
}

type Step = "describe" | "configure" | "generating" | "review" | "complete";

// Quick-start options shown when user doesn't come from templates
const QUICK_START_OPTIONS = [
  {
    id: "lead-capture",
    name: "Lead Capture",
    description: "Capture leads from forms and sync to your CRM",
    icon: Database,
    prompt: "Create an automation that captures lead information from form submissions, validates the data, and adds it to a CRM system",
  },
  {
    id: "smart-notifications",
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
    description: "Describe exactly what you need",
    icon: Code,
    prompt: "",
  },
];

export default function AutomationBuilder({
  clientId,
  templateId,
  templatePrompt,
  templateName,
}: AutomationBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Determine initial state based on whether we have template data
  const hasTemplate = !!(templateId && templatePrompt && templateName);

  const [step, setStep] = useState<Step>(hasTemplate ? "configure" : "describe");
  const [prompt, setPrompt] = useState(templatePrompt ? decodeURIComponent(templatePrompt) : "");
  const [automationName, setAutomationName] = useState(templateName ? decodeURIComponent(templateName) : "");
  const [triggerType, setTriggerType] = useState<string>("manual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<Record<string, unknown> | null>(null);
  const [createdAutomationId, setCreatedAutomationId] = useState<string | null>(null);
  const [selectedQuickStart, setSelectedQuickStart] = useState<string | null>(null);

  // If coming from template, show a message
  const fromTemplate = hasTemplate;

  function handleQuickStartSelect(optionId: string) {
    setSelectedQuickStart(optionId);
    const option = QUICK_START_OPTIONS.find((o) => o.id === optionId);
    if (option && option.prompt) {
      setPrompt(option.prompt);
      setAutomationName(option.name);
    } else {
      setPrompt("");
      setAutomationName("");
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || !automationName.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "Give your automation a name and description",
        variant: "destructive",
      });
      return;
    }

    setStep("generating");
    setIsGenerating(true);

    try {
      // Create the automation in workflows table
      const createResponse = await fetch("/api/portal/automation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: automationName,
          description: prompt,
          trigger: triggerType,
          templateId: templateId || selectedQuickStart || "custom",
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create automation");
      }

      const createData = await createResponse.json();
      const automationId = createData.automation.id;
      setCreatedAutomationId(automationId);

      // Generate the automation design with AI
      const generateResponse = await fetch("/api/system-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          buildId: automationId,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate automation design");
      }

      const generateData = await generateResponse.json();
      setGeneratedResult(generateData.result);
      setStep("review");

      toast({
        title: "Automation designed!",
        description: "Review your automation before activating",
      });
    } catch (error) {
      console.error("Generation error:", error);
      setStep("configure");
      toast({
        title: "Failed to generate",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleActivate() {
    if (!createdAutomationId) return;

    try {
      const response = await fetch("/api/portal/automation/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automationId: createdAutomationId,
        }),
      });

      if (response.ok) {
        setStep("complete");
        toast({
          title: "Automation activated!",
          description: "Your automation is now live",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to activate");
      }
    } catch (error) {
      toast({
        title: "Failed to activate",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  }

  function handleReset() {
    setStep("describe");
    setSelectedQuickStart(null);
    setPrompt("");
    setAutomationName("");
    setTriggerType("manual");
    setGeneratedResult(null);
    setCreatedAutomationId(null);
    router.push("/portal/builder");
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {["describe", "configure", "review", "complete"].map((s, index) => {
            const stepOrder = ["describe", "configure", "review", "complete"];
            const currentIndex = stepOrder.indexOf(step === "generating" ? "review" : step);
            const isActive = step === s || (s === "review" && step === "generating");
            const isComplete = currentIndex > index;

            return (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 mx-2 transition-colors ${
                      isComplete ? "bg-green-500" : "bg-gray-200"
                    }`}
                    style={{ width: "80px" }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Describe</span>
          <span>Configure</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step: Describe (only shown when NOT from template) */}
      {step === "describe" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold">What would you like to automate?</h2>
            <p className="text-muted-foreground mt-2">
              Choose a quick-start option or describe your automation
            </p>
          </div>

          {/* Browse Templates CTA */}
          <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Looking for something specific?</p>
                    <p className="text-sm text-muted-foreground">Browse 60+ pre-built automation templates</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/portal/templates")}
                  className="border-violet-300 hover:bg-violet-100"
                >
                  Browse Templates
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Options */}
          <div>
            <h3 className="font-semibold mb-4">Quick Start</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {QUICK_START_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedQuickStart === option.id
                      ? "border-violet-500 bg-violet-50"
                      : "hover:border-violet-200"
                  }`}
                  onClick={() => handleQuickStartSelect(option.id)}
                >
                  <CardContent className="pt-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        selectedQuickStart === option.id
                          ? "bg-violet-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <option.icon
                        className={`w-6 h-6 ${
                          selectedQuickStart === option.id
                            ? "text-violet-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold mb-1">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Description */}
          {selectedQuickStart === "custom" && (
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
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep("configure")}
              disabled={!selectedQuickStart || (selectedQuickStart === "custom" && !prompt.trim())}
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
              {fromTemplate
                ? "Customize this template to fit your needs"
                : "Set up how and when your automation should run"}
            </p>
          </div>

          {/* Template indicator */}
          {fromTemplate && (
            <Card className="bg-violet-50 border-violet-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Using template: {automationName}</p>
                    <p className="text-sm text-muted-foreground">Customize the settings below</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">What should it do?</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you want to automate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              {/* Trigger Type */}
              <div className="space-y-2">
                <Label>How should it start?</Label>
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
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (fromTemplate) {
                  router.push("/portal/templates");
                } else {
                  setStep("describe");
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!automationName.trim() || !prompt.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Creating your automation...</h2>
          <p className="text-muted-foreground mb-4">
            Our AI is designing your automation workflow
          </p>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-600" />
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
              Review the details and activate when ready
            </p>
          </div>

          {/* Automation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                {automationName}
              </CardTitle>
              <CardDescription>
                {(generatedResult as { systemOverview?: string }).systemOverview || prompt}
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
                  {(generatedResult as { automationWorkflow: { steps: Array<{ id: number; name: string; action: string }> } }).automationWorkflow.steps.slice(0, 5).map((wfStep, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-violet-700">
                        {wfStep.id || index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{wfStep.name}</p>
                        <p className="text-xs text-muted-foreground">{wfStep.action}</p>
                      </div>
                    </div>
                  ))}
                  {(generatedResult as { automationWorkflow: { steps: Array<unknown> } }).automationWorkflow.steps.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      + {(generatedResult as { automationWorkflow: { steps: Array<unknown> } }).automationWorkflow.steps.length - 5} more steps
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What you can do */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Activate to start using your automation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    {triggerType === "manual" && "Run it anytime from your Automations page"}
                    {triggerType === "webhook" && "Get a webhook URL to trigger it from other apps"}
                    {triggerType === "scheduled" && "It will run automatically on your set schedule"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Track runs and results from your dashboard</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("configure")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Edit
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
            <Button
              variant="outline"
              onClick={() => router.push("/portal/automations")}
            >
              View My Automations
            </Button>
            <Button onClick={handleReset}>
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
