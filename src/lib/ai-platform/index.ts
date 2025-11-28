// AI Platform exports

// Router - classifies requests and generates workflows
export {
  classifyRequest,
  generateWorkflow,
  type RequestClassification,
  type WorkflowStep,
} from "./router";

// Agent Executor - runs AI agents
export {
  executeAgentTask,
  getAgentByType,
  getAllAgents,
  runWriterAgent,
  runResearcherAgent,
  runAnalystAgent,
  runQCAgent,
  runDeliveryAgent,
  type Agent,
  type TaskResult,
} from "./agent-executor";

// Workflow Engine - orchestrates execution
export {
  createAndProcessRequest,
  executeWorkflow,
  getWorkflowStatus,
  cancelWorkflow,
  type WorkflowExecutionResult,
} from "./workflow-engine";
