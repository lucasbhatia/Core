import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

/**
 * GET /api/test/automation - List available test automations
 */
export async function GET() {
  const automations = [
    {
      id: "echo",
      name: "Echo Automation",
      description: "Returns whatever you send it - great for testing",
      example: { message: "Hello World!", timestamp: new Date().toISOString() },
    },
    {
      id: "summarize",
      name: "AI Summarizer",
      description: "Summarizes text using AI",
      example: { text: "Your long text to summarize goes here..." },
    },
    {
      id: "notify",
      name: "Notification Test",
      description: "Simulates sending a notification",
      example: { channel: "email", recipient: "test@example.com", message: "Test notification" },
    },
    {
      id: "data-transform",
      name: "Data Transformer",
      description: "Transforms input data through a pipeline",
      example: { data: { items: [1, 2, 3] }, operations: ["double", "sum"] },
    },
  ];

  return NextResponse.json({
    success: true,
    message: "Available test automations",
    automations,
    usage: "POST /api/test/automation with { type: 'echo|summarize|notify|data-transform', input: {...} }",
  });
}

/**
 * POST /api/test/automation - Run a test automation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { type, input } = body;

    if (!type) {
      return NextResponse.json({
        success: false,
        error: "Missing 'type' field. Use: echo, summarize, notify, or data-transform",
      }, { status: 400 });
    }

    const supabase = getSupabase();
    let result: Record<string, unknown>;
    let logs: string[] = [];

    // Create a run record
    const runId = crypto.randomUUID();
    logs.push(`[${new Date().toISOString()}] Starting automation: ${type}`);
    logs.push(`[${new Date().toISOString()}] Run ID: ${runId}`);
    logs.push(`[${new Date().toISOString()}] Input: ${JSON.stringify(input || {})}`);

    switch (type) {
      case "echo":
        // Simple echo - returns input with metadata
        logs.push(`[${new Date().toISOString()}] Executing echo automation...`);
        result = {
          type: "echo",
          received: input || {},
          echoed_at: new Date().toISOString(),
          metadata: {
            input_keys: Object.keys(input || {}),
            input_size: JSON.stringify(input || {}).length,
          },
        };
        logs.push(`[${new Date().toISOString()}] Echo complete`);
        break;

      case "summarize":
        // AI summarization simulation
        logs.push(`[${new Date().toISOString()}] Processing text for summarization...`);
        const text = input?.text || "No text provided";
        const wordCount = text.split(/\s+/).length;

        // Simulate AI processing
        logs.push(`[${new Date().toISOString()}] Analyzing ${wordCount} words...`);
        await new Promise(r => setTimeout(r, 500)); // Simulate processing time

        result = {
          type: "summarize",
          original_length: text.length,
          word_count: wordCount,
          summary: wordCount > 10
            ? `Summary: ${text.split(/\s+/).slice(0, 10).join(" ")}...`
            : `Summary: ${text}`,
          key_points: [
            "Point 1: Main topic identified",
            "Point 2: Key themes extracted",
            "Point 3: Conclusion synthesized",
          ],
          sentiment: "neutral",
          processed_at: new Date().toISOString(),
        };
        logs.push(`[${new Date().toISOString()}] Summarization complete`);
        break;

      case "notify":
        // Notification simulation
        logs.push(`[${new Date().toISOString()}] Preparing notification...`);
        const channel = input?.channel || "log";
        const recipient = input?.recipient || "system";
        const message = input?.message || "Test notification";

        logs.push(`[${new Date().toISOString()}] Channel: ${channel}`);
        logs.push(`[${new Date().toISOString()}] Recipient: ${recipient}`);
        logs.push(`[${new Date().toISOString()}] Message: ${message}`);

        // Simulate sending
        await new Promise(r => setTimeout(r, 300));

        result = {
          type: "notify",
          status: "sent",
          notification: {
            channel,
            recipient,
            message,
            sent_at: new Date().toISOString(),
          },
          delivery_id: crypto.randomUUID(),
        };
        logs.push(`[${new Date().toISOString()}] Notification sent successfully`);
        break;

      case "data-transform":
        // Data transformation pipeline
        logs.push(`[${new Date().toISOString()}] Starting data transformation pipeline...`);
        const data = input?.data || { items: [] };
        const operations = input?.operations || ["identity"];

        let transformed = data;
        const transformationSteps: Array<{ operation: string; result: unknown }> = [];

        for (const op of operations) {
          logs.push(`[${new Date().toISOString()}] Applying operation: ${op}`);

          switch (op) {
            case "double":
              if (Array.isArray(transformed.items)) {
                transformed = { ...transformed, items: transformed.items.map((x: number) => x * 2) };
              }
              break;
            case "sum":
              if (Array.isArray(transformed.items)) {
                transformed = { ...transformed, total: transformed.items.reduce((a: number, b: number) => a + b, 0) };
              }
              break;
            case "reverse":
              if (Array.isArray(transformed.items)) {
                transformed = { ...transformed, items: [...transformed.items].reverse() };
              }
              break;
            case "sort":
              if (Array.isArray(transformed.items)) {
                transformed = { ...transformed, items: [...transformed.items].sort((a: number, b: number) => a - b) };
              }
              break;
            case "count":
              if (Array.isArray(transformed.items)) {
                transformed = { ...transformed, count: transformed.items.length };
              }
              break;
            default:
              // Identity operation
              break;
          }

          transformationSteps.push({ operation: op, result: JSON.parse(JSON.stringify(transformed)) });
        }

        result = {
          type: "data-transform",
          original: data,
          transformed,
          pipeline: transformationSteps,
          operations_applied: operations.length,
        };
        logs.push(`[${new Date().toISOString()}] Transformation complete`);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown automation type: ${type}`,
          available: ["echo", "summarize", "notify", "data-transform"],
        }, { status: 400 });
    }

    const duration = Date.now() - startTime;
    logs.push(`[${new Date().toISOString()}] Automation completed in ${duration}ms`);

    // Try to log to database (optional - won't fail if table doesn't exist)
    try {
      await supabase.from("automation_runs").insert({
        id: runId,
        status: "success",
        trigger_type: "api",
        input_data: { type, input },
        output_data: result,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      });
    } catch {
      // Table might not exist - that's fine
    }

    return NextResponse.json({
      success: true,
      run_id: runId,
      automation_type: type,
      result,
      execution: {
        duration_ms: duration,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
      },
      logs,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      execution: {
        duration_ms: duration,
        status: "failed",
      },
    }, { status: 500 });
  }
}
