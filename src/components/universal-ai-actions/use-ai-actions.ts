"use client";

import { useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  AskAIRequest,
  AskAIResponse,
  AssignToAgentRequest,
  AgentAssignment,
  AutomateRequest,
  CreatedAutomation,
} from "./types";

interface UseAIActionsOptions {
  clientId: string;
  onSuccess?: (action: "ask_ai" | "assign_agent" | "automate", result: unknown) => void;
  onError?: (action: "ask_ai" | "assign_agent" | "automate", error: Error) => void;
}

export function useAIActions({ clientId, onSuccess, onError }: UseAIActionsOptions) {
  const askAI = useCallback(
    async (request: AskAIRequest): Promise<AskAIResponse> => {
      if (!clientId) {
        throw new Error("No client ID available. Please log in.");
      }

      try {
        const response = await fetch("/api/ai-actions/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            entity: request.entity,
            action: request.action,
            customPrompt: request.custom_prompt,
            options: request.options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process AI request");
        }

        const result = await response.json();
        onSuccess?.("ask_ai", result);
        toast({
          title: "AI response generated",
          description: "Your request has been processed and is ready for review.",
        });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.("ask_ai", err);
        toast({
          title: "AI request failed",
          description: err.message,
          variant: "destructive",
        });
        throw err;
      }
    },
    [clientId, onSuccess, onError]
  );

  const assignToAgent = useCallback(
    async (request: AssignToAgentRequest): Promise<AgentAssignment> => {
      if (!clientId) {
        throw new Error("No client ID available. Please log in.");
      }

      try {
        const response = await fetch("/api/ai-actions/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            entity: request.entity,
            agentId: request.agent_id,
            agentName: request.agent_name || "AI Agent",
            agentRole: request.agent_role,
            agentDepartment: request.agent_department,
            agentSystemPrompt: request.agent_system_prompt,
            instructions: request.instructions,
            priority: request.priority,
            dueDate: request.due_date,
            options: {
              notifyOnComplete: request.options?.notify_on_complete,
              autoApprove: request.options?.auto_approve,
              chainToAutomation: request.options?.chain_to_automation,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to assign to agent");
        }

        const result = await response.json();
        onSuccess?.("assign_agent", result);
        toast({
          title: "Task assigned to agent",
          description: `${result.agent_name} is working on your task.`,
        });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.("assign_agent", err);
        toast({
          title: "Assignment failed",
          description: err.message,
          variant: "destructive",
        });
        throw err;
      }
    },
    [clientId, onSuccess, onError]
  );

  const automate = useCallback(
    async (request: AutomateRequest): Promise<CreatedAutomation> => {
      if (!clientId) {
        throw new Error("No client ID available. Please log in.");
      }

      try {
        const response = await fetch("/api/ai-actions/automate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            entity: request.entity,
            name: request.name,
            description: request.description,
            triggerType: request.trigger_type,
            schedule: request.schedule,
            condition: request.condition,
            event: request.event,
            actions: request.actions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create automation");
        }

        const result = await response.json();
        onSuccess?.("automate", result);
        toast({
          title: "Automation created",
          description: `Your automation "${request.name}" is now active.`,
        });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        onError?.("automate", err);
        toast({
          title: "Automation failed",
          description: err.message,
          variant: "destructive",
        });
        throw err;
      }
    },
    [clientId, onSuccess, onError]
  );

  return {
    askAI,
    assignToAgent,
    automate,
  };
}
