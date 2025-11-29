// Universal AI Actions Module
// The connective layer that ties AI, Agents, and Automations together

// Types
export * from "./types";

// Main component
export { UniversalAIActionsBar } from "./universal-ai-actions-bar";

// Individual buttons for flexible usage
export {
  AskAIButton,
  AssignToAgentButton,
  AutomateButton,
} from "./universal-ai-actions-bar";

// Modals (for advanced usage)
export { AskAIModal } from "./ask-ai-modal";
export { AssignToAgentModal } from "./assign-to-agent-modal";
export { AutomateModal } from "./automate-modal";

// Hook for direct API access
export { useAIActions } from "./use-ai-actions";
