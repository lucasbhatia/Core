"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  FileText,
  Minimize2,
  Maximize2,
  Languages,
  Search,
  Wand2,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  Edit3,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EntityContext, AskAIAction, AskAIRequest, AskAIResponse } from "./types";

interface AskAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: EntityContext;
  onSubmit: (request: AskAIRequest) => Promise<AskAIResponse>;
}

const AI_ACTIONS: {
  id: AskAIAction;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "explain",
    label: "Explain",
    description: "Break down and clarify this content",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Rewrite with a different tone or style",
    icon: <Edit3 className="h-4 w-4" />,
  },
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a concise summary",
    icon: <Minimize2 className="h-4 w-4" />,
  },
  {
    id: "expand",
    label: "Expand",
    description: "Add more detail and depth",
    icon: <Maximize2 className="h-4 w-4" />,
  },
  {
    id: "analyze",
    label: "Analyze",
    description: "Provide insights and analysis",
    icon: <Search className="h-4 w-4" />,
  },
  {
    id: "improve",
    label: "Improve",
    description: "Enhance quality and clarity",
    icon: <Wand2 className="h-4 w-4" />,
  },
  {
    id: "translate",
    label: "Translate",
    description: "Convert to another language",
    icon: <Languages className="h-4 w-4" />,
  },
  {
    id: "extract",
    label: "Extract",
    description: "Pull out key information",
    icon: <FileText className="h-4 w-4" />,
  },
];

export function AskAIModal({ open, onOpenChange, entity, onSubmit }: AskAIModalProps) {
  const [selectedAction, setSelectedAction] = useState<AskAIAction | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "friendly" | "formal" | "creative">("professional");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [language, setLanguage] = useState("english");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AskAIResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"select" | "configure" | "result">("select");

  const handleSelectAction = (action: AskAIAction) => {
    setSelectedAction(action);
    if (action === "custom") {
      setStep("configure");
    } else {
      setStep("configure");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    try {
      const request: AskAIRequest = {
        entity,
        action: selectedAction,
        custom_prompt: selectedAction === "custom" ? customPrompt : undefined,
        options: {
          tone,
          length,
          language: selectedAction === "translate" ? language : undefined,
        },
      };

      const response = await onSubmit(request);
      setResult(response);
      setStep("result");
    } catch (error) {
      console.error("Ask AI error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result?.result) {
      await navigator.clipboard.writeText(result.result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedAction(null);
    setCustomPrompt("");
    setResult(null);
    setStep("select");
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Ask AI
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "What would you like AI to do with this content?"}
            {step === "configure" && "Configure your request"}
            {step === "result" && "Review the AI response"}
          </DialogDescription>
        </DialogHeader>

        {/* Entity Context Preview */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs shrink-0">
              {entity.type.replace("_", " ")}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{entity.title}</p>
              {entity.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {entity.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step: Select Action */}
        {step === "select" && (
          <div className="grid grid-cols-2 gap-2">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => handleSelectAction(action.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                  "hover:border-violet-300 hover:bg-violet-50/50",
                  selectedAction === action.id && "border-violet-500 bg-violet-50"
                )}
              >
                <div className="p-2 rounded-md bg-violet-100 text-violet-600 shrink-0">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
            {/* Custom Action */}
            <button
              onClick={() => handleSelectAction("custom")}
              className={cn(
                "col-span-2 flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                "hover:border-violet-300 hover:bg-violet-50/50",
                selectedAction === "custom" && "border-violet-500 bg-violet-50"
              )}
            >
              <div className="p-2 rounded-md bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Custom Prompt</p>
                <p className="text-xs text-muted-foreground">
                  Write your own instructions for AI
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && selectedAction && (
          <div className="space-y-4">
            {selectedAction === "custom" && (
              <div className="space-y-2">
                <Label>Your Instructions</Label>
                <Textarea
                  placeholder="Tell AI exactly what you want to do with this content..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedAction !== "translate" && (
                <>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedAction === "translate" && (
                <div className="col-span-2 space-y-2">
                  <Label>Target Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="portuguese">Portuguese</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="dutch">Dutch</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="korean">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && result && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border max-h-[300px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans">{result.result}</pre>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{result.tokens_used} tokens used</span>
              <Badge
                variant={result.review_status === "pending" ? "secondary" : "default"}
                className="text-xs"
              >
                {result.review_status === "pending" ? "Pending Review" : result.review_status}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "select" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (selectedAction === "custom" && !customPrompt.trim())}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run AI
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
