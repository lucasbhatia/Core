// AI Agents Module
// Main export file for the AI Agents system

// Templates
export {
  agentTemplates,
  agentCategories,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByTier,
  getPopularTemplates,
  getNewTemplates,
  searchTemplates,
  type AgentTemplate,
  type AgentCategory,
  type AgentCapability,
  type AgentTool,
} from "./templates";

// Types
export {
  type DeployedAgent,
  type AgentInputField,
  type AgentIntegration,
  type AgentExecution,
  type AgentConversation,
  type ConversationMessage,
  type AgentSchedule,
  type AgentUsage,
  type AgentApiKey,
  type AgentWebhook,
  type CreateAgentRequest,
  type UpdateAgentRequest,
  type ExecuteAgentRequest,
  type ChatWithAgentRequest,
  type AgentExecutionResult,
  type AgentChatResponse,
  type AgentListResponse,
  type AgentPlanLimits,
  type AgentStatus,
  type ExecutionStatus,
  type ExecutionTrigger,
  AGENT_PLAN_LIMITS,
  getAgentLimitsForPlan,
  checkAgentLimit,
} from "./types";

// Engine
export {
  getAgentById,
  getClientAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  executeAgent,
  chatWithAgent,
  getConversations,
  getConversationMessages,
  getAgentExecutions,
  getExecutionById,
  getAgentUsage,
  getClientPlan,
} from "./engine";
