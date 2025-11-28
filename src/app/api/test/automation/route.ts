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
 * GET /api/test/automation - List available test automations and existing test data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listDb = searchParams.get("list") === "db";

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
    {
      id: "create-db",
      name: "Create Test Automation in DB",
      description: "Creates a test automation record in the database for testing archive/delete",
      example: { name: "My Test Automation" },
    },
  ];

  // If listing from DB, fetch existing test automations
  if (listDb) {
    try {
      const supabase = getSupabase();
      const { data: dbAutomations, error } = await supabase
        .from("workflows")
        .select("id, name, automation_status, automation_trigger, is_automation, created_at")
        .eq("is_automation", true)
        .order("created_at", { ascending: false })
        .limit(20);

      return NextResponse.json({
        success: true,
        message: "Automations from database",
        automations: dbAutomations || [],
        error: error?.message,
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch automations",
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "Available test automations",
    automations,
    usage: {
      run: "POST /api/test/automation with { type: 'echo|summarize|notify|data-transform|create-db', input: {...} }",
      list_db: "GET /api/test/automation?list=db",
      archive: "DELETE /api/test/automation?id=<automation-id>",
      archive_permanent: "DELETE /api/test/automation?id=<automation-id>&permanent=true",
    },
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

      case "create-db":
        // Create a test automation in the database
        logs.push(`[${new Date().toISOString()}] Creating test automation in database...`);
        const automationName = input?.name || `Test Automation ${Date.now()}`;

        const { data: newAutomation, error: createError } = await supabase
          .from("workflows")
          .insert({
            name: automationName,
            description: "Test automation created via API for testing archive/delete",
            status: "completed",
            workflow_type: "test",
            is_automation: true,
            automation_status: "active",
            automation_trigger: "manual",
            run_count: 0,
          })
          .select()
          .single();

        if (createError) {
          logs.push(`[${new Date().toISOString()}] Error: ${createError.message}`);
          return NextResponse.json({
            success: false,
            error: createError.message,
            logs,
          }, { status: 500 });
        }

        logs.push(`[${new Date().toISOString()}] Created automation: ${newAutomation.id}`);
        result = {
          type: "create-db",
          automation: newAutomation,
          message: "Test automation created! You can now test archive/delete.",
          test_commands: {
            archive: `curl -X DELETE "http://localhost:3000/api/test/automation?id=${newAutomation.id}"`,
            delete_permanent: `curl -X DELETE "http://localhost:3000/api/test/automation?id=${newAutomation.id}&permanent=true"`,
            view_in_ui: "/workspace (Automations tab)",
          },
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown automation type: ${type}`,
          available: ["echo", "summarize", "notify", "data-transform", "create-db"],
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

/**
 * DELETE /api/test/automation - Archive or delete a test automation
 *
 * Query params:
 * - id: The automation ID to archive/delete
 * - permanent: If "true", permanently delete. Otherwise archive.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Missing 'id' query parameter",
        usage: "DELETE /api/test/automation?id=<automation-id>&permanent=true|false",
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // First, check if the automation exists
    const { data: existing, error: fetchError } = await supabase
      .from("workflows")
      .select("id, name, automation_status, is_automation")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({
        success: false,
        error: "Automation not found",
        id,
      }, { status: 404 });
    }

    if (permanent) {
      // Permanently delete the automation
      const { error: deleteError } = await supabase
        .from("workflows")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: deleteError.message,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Automation permanently deleted",
        deleted: existing,
      });
    } else {
      // Archive the automation (set automation_status to inactive)
      const { data: updated, error: updateError } = await supabase
        .from("workflows")
        .update({
          is_automation: false,
          automation_status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: updateError.message,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Automation archived (set to inactive)",
        automation: updated,
        restore_hint: "To restore, update is_automation=true and automation_status='active'",
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
