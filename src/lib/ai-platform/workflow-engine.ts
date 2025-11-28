import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";
import { executeAgentTask, getAgentByType } from "./agent-executor";
import { classifyRequest, WorkflowStep } from "./router";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  status: string;
  completedSteps: number;
  totalSteps: number;
  outputs: Record<string, unknown>;
  deliverables: unknown[];
  error?: string;
}

/**
 * Create a new request and start processing
 */
export async function createAndProcessRequest(
  content: string,
  options: {
    clientId?: string;
    source?: string;
    subject?: string;
    attachments?: unknown[];
  }
): Promise<{ requestId: string; workflowId: string }> {
  const supabase = getSupabase();

  // Create the request
  const { data: request, error: requestError } = await supabase
    .from("requests")
    .insert({
      client_id: options.clientId,
      source: options.source || "dashboard",
      subject: options.subject,
      content,
      attachments: options.attachments || [],
      status: "classifying",
    })
    .select()
    .single();

  if (requestError || !request) {
    throw new Error("Failed to create request");
  }

  // Get client info for context
  let clientContext = {};
  if (options.clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("name, email, company, industry")
      .eq("id", options.clientId)
      .single();
    if (client) {
      clientContext = {
        clientName: client.name,
        clientCompany: client.company,
        clientIndustry: client.industry,
      };
    }
  }

  // Classify the request with AI
  const classification = await classifyRequest(content, options.subject, clientContext);

  // Update request with classification
  await supabase
    .from("requests")
    .update({
      request_type: classification.requestType,
      priority: classification.priority,
      complexity: classification.complexity,
      ai_summary: classification.summary,
      ai_classification: classification,
      required_agents: classification.requiredAgents,
      estimated_duration_minutes: classification.estimatedMinutes,
      status: "planning",
    })
    .eq("id", request.id);

  // Create the workflow
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .insert({
      request_id: request.id,
      client_id: options.clientId,
      name: classification.summary,
      description: `Automated workflow for: ${classification.summary}`,
      status: "draft",
      steps: classification.suggestedWorkflow,
      total_steps: classification.suggestedWorkflow.length,
    })
    .select()
    .single();

  if (workflowError || !workflow) {
    throw new Error("Failed to create workflow");
  }

  // Create agent tasks for each step
  for (const step of classification.suggestedWorkflow) {
    const agent = await getAgentByType(step.agentType);

    await supabase.from("agent_tasks").insert({
      workflow_id: workflow.id,
      agent_id: agent?.id,
      step_index: step.stepIndex,
      name: step.taskName,
      description: step.description,
      instructions: step.instructions,
      depends_on: step.dependsOn,
      status: "pending",
    });
  }

  // Update request with workflow ID
  await supabase
    .from("requests")
    .update({
      assigned_workflow_id: workflow.id,
      status: "in_progress",
    })
    .eq("id", request.id);

  // Trigger workflow execution via Inngest
  await inngest.send({
    name: "workflow/execute",
    data: {
      workflowId: workflow.id,
      requestId: request.id,
      clientId: options.clientId,
    },
  });

  return {
    requestId: request.id,
    workflowId: workflow.id,
  };
}

/**
 * Execute a workflow step by step
 */
export async function executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
  const supabase = getSupabase();

  // Get workflow
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("*, requests(*)")
    .eq("id", workflowId)
    .single();

  if (workflowError || !workflow) {
    return {
      success: false,
      workflowId,
      status: "failed",
      completedSteps: 0,
      totalSteps: 0,
      outputs: {},
      deliverables: [],
      error: "Workflow not found",
    };
  }

  // Update workflow status
  await supabase
    .from("workflows")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", workflowId);

  // Get all tasks in order
  const { data: tasks } = await supabase
    .from("agent_tasks")
    .select("*, agents(*)")
    .eq("workflow_id", workflowId)
    .order("step_index");

  if (!tasks || tasks.length === 0) {
    return {
      success: false,
      workflowId,
      status: "failed",
      completedSteps: 0,
      totalSteps: 0,
      outputs: {},
      deliverables: [],
      error: "No tasks found",
    };
  }

  const outputs: Record<string, unknown> = {};
  const deliverables: unknown[] = [];
  let completedSteps = 0;

  // Execute tasks in order (respecting dependencies)
  for (const task of tasks) {
    // Check if dependencies are met
    const dependsOn = (task.depends_on || []) as number[];
    const dependencyOutputs = dependsOn.map(depIndex => {
      const depTask = tasks.find(t => t.step_index === depIndex);
      return depTask?.output_data;
    }).filter(Boolean);

    // Get the agent
    const agent = task.agents || await getAgentByType(task.agents?.name || "writer");
    if (!agent) {
      continue;
    }

    // Update task status
    await supabase
      .from("agent_tasks")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", task.id);

    // Execute the task
    const startTime = Date.now();
    const result = await executeAgentTask(
      agent,
      task.instructions,
      {
        taskName: task.name,
        taskDescription: task.description,
        requestContent: workflow.requests?.content,
        requestSummary: workflow.requests?.ai_summary,
      },
      {
        previousOutputs: dependencyOutputs,
        workflowContext: workflow.name,
      }
    );
    const duration = Date.now() - startTime;

    // Update task with results
    await supabase
      .from("agent_tasks")
      .update({
        status: result.success ? "completed" : "failed",
        output_data: {
          text: result.output,
          structured: result.structuredOutput,
        },
        ai_response: result.output,
        tokens_used: result.tokensUsed,
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        error_message: result.error,
      })
      .eq("id", task.id);

    if (result.success) {
      outputs[task.name] = result.output;
      completedSteps++;

      // Create deliverable if this is a content-producing step
      if (["writer", "researcher", "analyst", "developer", "strategist"].includes(agent.agent_type)) {
        const { data: deliverable } = await supabase
          .from("deliverables")
          .insert({
            workflow_id: workflowId,
            task_id: task.id,
            client_id: workflow.client_id,
            name: task.name,
            description: task.description,
            file_type: "document",
            content: result.output,
            status: "draft",
          })
          .select()
          .single();

        if (deliverable) {
          deliverables.push(deliverable);
        }
      }

      // Update workflow progress
      await supabase
        .from("workflows")
        .update({ current_step: task.step_index + 1 })
        .eq("id", workflowId);
    } else {
      // Task failed - decide whether to continue or abort
      if (task.retry_count < task.max_retries) {
        await supabase
          .from("agent_tasks")
          .update({ retry_count: task.retry_count + 1, status: "pending" })
          .eq("id", task.id);
      }
    }
  }

  // Finalize workflow
  const allCompleted = completedSteps === tasks.length;
  await supabase
    .from("workflows")
    .update({
      status: allCompleted ? "completed" : "failed",
      completed_at: new Date().toISOString(),
      outputs,
      deliverables,
    })
    .eq("id", workflowId);

  // Update request status
  if (workflow.request_id) {
    await supabase
      .from("requests")
      .update({
        status: allCompleted ? "completed" : "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", workflow.request_id);
  }

  return {
    success: allCompleted,
    workflowId,
    status: allCompleted ? "completed" : "failed",
    completedSteps,
    totalSteps: tasks.length,
    outputs,
    deliverables,
  };
}

/**
 * Get workflow status and progress
 */
export async function getWorkflowStatus(workflowId: string) {
  const supabase = getSupabase();

  const { data: workflow } = await supabase
    .from("workflows")
    .select(`
      *,
      requests(*),
      agent_tasks(*, agents(*)),
      deliverables(*)
    `)
    .eq("id", workflowId)
    .single();

  return workflow;
}

/**
 * Cancel a running workflow
 */
export async function cancelWorkflow(workflowId: string) {
  const supabase = getSupabase();

  await supabase
    .from("workflows")
    .update({ status: "cancelled" })
    .eq("id", workflowId);

  await supabase
    .from("agent_tasks")
    .update({ status: "skipped" })
    .eq("workflow_id", workflowId)
    .in("status", ["pending", "queued"]);
}
