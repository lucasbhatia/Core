"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, Bot, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EntityContext,
  UniversalAIActionsBarProps,
  AskAIRequest,
  AskAIResponse,
  AssignToAgentRequest,
  AgentAssignment,
  AutomateRequest,
  CreatedAutomation,
} from "./types";
import { AskAIModal } from "./ask-ai-modal";
import { AssignToAgentModal } from "./assign-to-agent-modal";
import { AutomateModal } from "./automate-modal";

// Default handlers that simulate API calls (replace with real implementations)
const defaultAskAIHandler = async (request: AskAIRequest): Promise<AskAIResponse> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const actionResponses: Record<string, string> = {
    explain: `Here's an explanation of "${request.entity.title}":\n\nThis ${request.entity.type} involves ${request.entity.description || 'the specified content'}. The key aspects are:\n\n1. Purpose and scope\n2. Implementation details\n3. Expected outcomes\n\nLet me know if you need more specific details on any aspect.`,
    summarize: `Summary of "${request.entity.title}":\n\n${request.entity.description || request.entity.title} - A concise overview focusing on the essential points and key takeaways.`,
    rewrite: `Rewritten version of "${request.entity.title}":\n\n${request.entity.description || request.entity.title} (rewritten in a ${request.options?.tone || 'professional'} tone)`,
    expand: `Expanded content for "${request.entity.title}":\n\n${request.entity.description || request.entity.title}\n\nAdditional context and details:\n- Background information\n- Related considerations\n- Implementation notes\n- Best practices`,
    analyze: `Analysis of "${request.entity.title}":\n\n**Strengths:**\n- Clear objective\n- Well-defined scope\n\n**Areas for improvement:**\n- Consider adding more context\n- Review dependencies\n\n**Recommendations:**\n1. Proceed with implementation\n2. Monitor progress regularly`,
    improve: `Improved version of "${request.entity.title}":\n\n${request.entity.description || request.entity.title}\n\n[Enhanced with better clarity, structure, and actionable elements]`,
    translate: `Translation of "${request.entity.title}":\n\n[Translated to ${request.options?.language || 'target language'}]\n\n${request.entity.description || request.entity.title}`,
    extract: `Key information extracted from "${request.entity.title}":\n\n• Main topic: ${request.entity.type}\n• Key points: ${request.entity.description || 'See details'}\n• Action items: Review and proceed`,
    custom: `Response to your custom request for "${request.entity.title}":\n\n${request.custom_prompt ? `Based on your instructions: "${request.custom_prompt}"` : 'Custom analysis complete.'}`,
  };

  return {
    id: `ai-response-${Date.now()}`,
    entity_id: request.entity.id,
    action: request.action,
    original_content: request.entity.content || request.entity.description || request.entity.title,
    result: actionResponses[request.action] || `AI response for ${request.action} action`,
    tokens_used: Math.floor(Math.random() * 500) + 100,
    created_at: new Date().toISOString(),
    review_status: "pending",
  };
};

const defaultAssignToAgentHandler = async (request: AssignToAgentRequest): Promise<AgentAssignment> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: `assignment-${Date.now()}`,
    entity: request.entity,
    agent_id: request.agent_id,
    agent_name: "AI Agent",
    agent_avatar: "🤖",
    instructions: request.instructions,
    status: "queued",
    priority: request.priority || "normal",
    created_at: new Date().toISOString(),
  };
};

const defaultAutomateHandler = async (request: AutomateRequest): Promise<CreatedAutomation> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const nextRun = new Date();
  if (request.trigger_type === "schedule") {
    nextRun.setHours(nextRun.getHours() + 1);
  }

  return {
    id: `automation-${Date.now()}`,
    name: request.name,
    entity: request.entity,
    trigger_type: request.trigger_type,
    is_active: true,
    run_count: 0,
    next_run_at: request.trigger_type === "schedule" ? nextRun.toISOString() : undefined,
    created_at: new Date().toISOString(),
  };
};

export function UniversalAIActionsBar({
  entity,
  callbacks,
  variant = "default",
  className,
  disabled = false,
  showLabels = true,
}: UniversalAIActionsBarProps) {
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [assignAgentOpen, setAssignAgentOpen] = useState(false);
  const [automateOpen, setAutomateOpen] = useState(false);

  const handleAskAI = async (request: AskAIRequest): Promise<AskAIResponse> => {
    try {
      const result = callbacks?.onAskAI
        ? await callbacks.onAskAI(request)
        : await defaultAskAIHandler(request);
      callbacks?.onSuccess?.("ask_ai", result);
      return result;
    } catch (error) {
      callbacks?.onError?.("ask_ai", error as Error);
      throw error;
    }
  };

  const handleAssignToAgent = async (request: AssignToAgentRequest): Promise<AgentAssignment> => {
    try {
      const result = callbacks?.onAssignToAgent
        ? await callbacks.onAssignToAgent(request)
        : await defaultAssignToAgentHandler(request);
      callbacks?.onSuccess?.("assign_agent", result);
      return result;
    } catch (error) {
      callbacks?.onError?.("assign_agent", error as Error);
      throw error;
    }
  };

  const handleAutomate = async (request: AutomateRequest): Promise<CreatedAutomation> => {
    try {
      const result = callbacks?.onAutomate
        ? await callbacks.onAutomate(request)
        : await defaultAutomateHandler(request);
      callbacks?.onSuccess?.("automate", result);
      return result;
    } catch (error) {
      callbacks?.onError?.("automate", error as Error);
      throw error;
    }
  };

  const buttonSize = variant === "compact" ? "sm" : "default";
  const iconSize = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (variant === "icon-only") {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-1", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-violet-100 hover:text-violet-700"
                onClick={() => setAskAIOpen(true)}
                disabled={disabled}
              >
                <Sparkles className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ask AI</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                onClick={() => setAssignAgentOpen(true)}
                disabled={disabled}
              >
                <Bot className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Assign to Agent</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-amber-100 hover:text-amber-700"
                onClick={() => setAutomateOpen(true)}
                disabled={disabled}
              >
                <Zap className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Automate</TooltipContent>
          </Tooltip>

          {/* Modals */}
          <AskAIModal
            open={askAIOpen}
            onOpenChange={setAskAIOpen}
            entity={entity}
            onSubmit={handleAskAI}
          />
          <AssignToAgentModal
            open={assignAgentOpen}
            onOpenChange={setAssignAgentOpen}
            entity={entity}
            onSubmit={handleAssignToAgent}
          />
          <AutomateModal
            open={automateOpen}
            onOpenChange={setAutomateOpen}
            entity={entity}
            onSubmit={handleAutomate}
          />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 p-1 rounded-lg bg-muted/50 border",
          variant === "compact" && "p-0.5",
          className
        )}
      >
        {/* Ask AI Button */}
        <Button
          variant="ghost"
          size={buttonSize}
          className={cn(
            "gap-1.5 hover:bg-violet-100 hover:text-violet-700 transition-colors",
            variant === "compact" && "h-7 px-2 text-xs"
          )}
          onClick={() => setAskAIOpen(true)}
          disabled={disabled}
        >
          <Sparkles className={iconSize} />
          {showLabels && "Ask AI"}
        </Button>

        {/* Divider */}
        <div className="w-px h-4 bg-border" />

        {/* Assign to Agent Button */}
        <Button
          variant="ghost"
          size={buttonSize}
          className={cn(
            "gap-1.5 hover:bg-blue-100 hover:text-blue-700 transition-colors",
            variant === "compact" && "h-7 px-2 text-xs"
          )}
          onClick={() => setAssignAgentOpen(true)}
          disabled={disabled}
        >
          <Bot className={iconSize} />
          {showLabels && "Assign to Agent"}
        </Button>

        {/* Divider */}
        <div className="w-px h-4 bg-border" />

        {/* Automate Button */}
        <Button
          variant="ghost"
          size={buttonSize}
          className={cn(
            "gap-1.5 hover:bg-amber-100 hover:text-amber-700 transition-colors",
            variant === "compact" && "h-7 px-2 text-xs"
          )}
          onClick={() => setAutomateOpen(true)}
          disabled={disabled}
        >
          <Zap className={iconSize} />
          {showLabels && "Automate"}
        </Button>
      </div>

      {/* Modals */}
      <AskAIModal
        open={askAIOpen}
        onOpenChange={setAskAIOpen}
        entity={entity}
        onSubmit={handleAskAI}
      />
      <AssignToAgentModal
        open={assignAgentOpen}
        onOpenChange={setAssignAgentOpen}
        entity={entity}
        onSubmit={handleAssignToAgent}
      />
      <AutomateModal
        open={automateOpen}
        onOpenChange={setAutomateOpen}
        entity={entity}
        onSubmit={handleAutomate}
      />
    </>
  );
}

// Convenience exports for individual buttons if needed
export function AskAIButton({
  entity,
  onSubmit,
  variant = "default",
  className,
  disabled = false,
}: {
  entity: EntityContext;
  onSubmit?: (request: AskAIRequest) => Promise<AskAIResponse>;
  variant?: "default" | "compact" | "icon";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleSubmit = onSubmit || defaultAskAIHandler;

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 hover:bg-violet-100 hover:text-violet-700", className)}
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ask AI</TooltipContent>
        </Tooltip>
        <AskAIModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size={variant === "compact" ? "sm" : "default"}
        className={cn(
          "gap-1.5 hover:bg-violet-100 hover:text-violet-700",
          variant === "compact" && "h-7 px-2 text-xs",
          className
        )}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Sparkles className={variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Ask AI
      </Button>
      <AskAIModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
    </>
  );
}

export function AssignToAgentButton({
  entity,
  onSubmit,
  variant = "default",
  className,
  disabled = false,
}: {
  entity: EntityContext;
  onSubmit?: (request: AssignToAgentRequest) => Promise<AgentAssignment>;
  variant?: "default" | "compact" | "icon";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleSubmit = onSubmit || defaultAssignToAgentHandler;

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 hover:bg-blue-100 hover:text-blue-700", className)}
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Assign to Agent</TooltipContent>
        </Tooltip>
        <AssignToAgentModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size={variant === "compact" ? "sm" : "default"}
        className={cn(
          "gap-1.5 hover:bg-blue-100 hover:text-blue-700",
          variant === "compact" && "h-7 px-2 text-xs",
          className
        )}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Bot className={variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Assign to Agent
      </Button>
      <AssignToAgentModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
    </>
  );
}

export function AutomateButton({
  entity,
  onSubmit,
  variant = "default",
  className,
  disabled = false,
}: {
  entity: EntityContext;
  onSubmit?: (request: AutomateRequest) => Promise<CreatedAutomation>;
  variant?: "default" | "compact" | "icon";
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleSubmit = onSubmit || defaultAutomateHandler;

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 hover:bg-amber-100 hover:text-amber-700", className)}
              onClick={() => setOpen(true)}
              disabled={disabled}
            >
              <Zap className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Automate</TooltipContent>
        </Tooltip>
        <AutomateModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size={variant === "compact" ? "sm" : "default"}
        className={cn(
          "gap-1.5 hover:bg-amber-100 hover:text-amber-700",
          variant === "compact" && "h-7 px-2 text-xs",
          className
        )}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Zap className={variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Automate
      </Button>
      <AutomateModal open={open} onOpenChange={setOpen} entity={entity} onSubmit={handleSubmit} />
    </>
  );
}
