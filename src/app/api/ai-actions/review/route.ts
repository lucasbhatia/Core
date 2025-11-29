import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  );
}

// GET endpoint to fetch review queue items
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const itemType = searchParams.get("itemType"); // 'ai_action', 'agent_task', 'automation', or 'all'
    const reviewStatus = searchParams.get("reviewStatus") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = getSupabase();
    const items: Array<Record<string, unknown>> = [];

    // Fetch AI Action Logs
    if (!itemType || itemType === "all" || itemType === "ai_action") {
      const { data: aiActions, error: aiError } = await supabase
        .from("ai_action_logs")
        .select("*")
        .eq("client_id", clientId)
        .eq("review_status", reviewStatus)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (aiError) {
        console.error("Error fetching AI actions:", aiError);
      } else if (aiActions) {
        items.push(
          ...aiActions.map((item) => ({
            ...item,
            item_type: "ai_action",
            sub_type: item.action_type,
          }))
        );
      }
    }

    // Fetch Agent Tasks
    if (!itemType || itemType === "all" || itemType === "agent_task") {
      const { data: agentTasks, error: taskError } = await supabase
        .from("agent_tasks")
        .select("*")
        .eq("client_id", clientId)
        .eq("review_status", reviewStatus)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (taskError) {
        console.error("Error fetching agent tasks:", taskError);
      } else if (agentTasks) {
        items.push(
          ...agentTasks.map((item) => ({
            ...item,
            item_type: "agent_task",
            sub_type: item.agent_department,
            title: item.entity_title,
            content: item.output_content,
          }))
        );
      }
    }

    // Fetch Automations pending review
    if (!itemType || itemType === "all" || itemType === "automation") {
      const { data: automations, error: autoError } = await supabase
        .from("universal_automations")
        .select("*")
        .eq("client_id", clientId)
        .eq("review_status", reviewStatus)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (autoError) {
        console.error("Error fetching automations:", autoError);
      } else if (automations) {
        items.push(
          ...automations.map((item) => ({
            ...item,
            item_type: "automation",
            sub_type: item.trigger_type,
            title: item.name,
            content: item.description,
          }))
        );
      }
    }

    // Sort by created_at descending
    items.sort((a, b) => {
      const dateA = new Date(a.created_at as string).getTime();
      const dateB = new Date(b.created_at as string).getTime();
      return dateB - dateA;
    });

    // Get stats
    const stats = {
      pending_ai_actions: 0,
      pending_agent_tasks: 0,
      pending_automations: 0,
      total_pending: 0,
    };

    const { data: aiCount } = await supabase
      .from("ai_action_logs")
      .select("id", { count: "exact" })
      .eq("client_id", clientId)
      .eq("review_status", "pending")
      .eq("status", "completed");

    const { data: taskCount } = await supabase
      .from("agent_tasks")
      .select("id", { count: "exact" })
      .eq("client_id", clientId)
      .eq("review_status", "pending")
      .eq("status", "completed");

    const { data: autoCount } = await supabase
      .from("universal_automations")
      .select("id", { count: "exact" })
      .eq("client_id", clientId)
      .eq("review_status", "pending");

    stats.pending_ai_actions = aiCount?.length || 0;
    stats.pending_agent_tasks = taskCount?.length || 0;
    stats.pending_automations = autoCount?.length || 0;
    stats.total_pending = stats.pending_ai_actions + stats.pending_agent_tasks + stats.pending_automations;

    return NextResponse.json({
      items: items.slice(0, limit),
      stats,
    });

  } catch (error) {
    console.error("Get review queue error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch review queue" },
      { status: 500 }
    );
  }
}

// POST endpoint to perform review actions (approve, reject, edit)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      itemId,
      itemType,
      action, // 'approve', 'reject', 'edit'
      editedContent,
      rejectionReason,
      reviewedBy,
      publishTo, // For approved items: where to publish
    } = body;

    if (!itemId || !itemType || !action) {
      return NextResponse.json(
        { error: "itemId, itemType, and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "edit"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve', 'reject', or 'edit'" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    };

    if (reviewedBy) updateData.reviewed_by = reviewedBy;

    // Set review status based on action
    switch (action) {
      case "approve":
        updateData.review_status = "approved";
        break;
      case "reject":
        updateData.review_status = "rejected";
        if (rejectionReason) updateData.rejection_reason = rejectionReason;
        break;
      case "edit":
        updateData.review_status = "edited";
        if (editedContent) updateData.edited_content = editedContent;
        break;
    }

    // Determine table based on item type
    let tableName: string;
    switch (itemType) {
      case "ai_action":
        tableName = "ai_action_logs";
        break;
      case "agent_task":
        tableName = "agent_tasks";
        break;
      case "automation":
        tableName = "universal_automations";
        break;
      default:
        return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    // Update the item
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Handle post-approval actions
    if (action === "approve" && publishTo) {
      // TODO: Implement publishing logic based on publishTo destination
      // For now, just mark as published
      await supabase
        .from(tableName)
        .update({
          destination_type: publishTo.type,
          destination_id: publishTo.id,
          published_at: new Date().toISOString(),
        })
        .eq("id", itemId);
    }

    // Create notification for the action
    try {
      const { data: item } = await supabase
        .from(tableName)
        .select("client_id, entity_title")
        .eq("id", itemId)
        .single();

      if (item) {
        await supabase.from("notifications").insert({
          client_id: item.client_id,
          type: `review_${action}`,
          title: `Item ${action}ed`,
          message: `"${item.entity_title || "Item"}" has been ${action}ed.`,
          data: {
            item_id: itemId,
            item_type: itemType,
            action,
          },
          read: false,
        });
      }
    } catch (notifyError) {
      console.error("Failed to create notification:", notifyError);
    }

    return NextResponse.json({
      success: true,
      item: data,
      action,
    });

  } catch (error) {
    console.error("Review action error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process review action" },
      { status: 500 }
    );
  }
}

// Bulk review endpoint
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      items, // Array of { itemId, itemType }
      action, // 'approve', 'reject'
      reviewedBy,
      rejectionReason,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const supabase = getSupabase();
    const results: Array<{ itemId: string; success: boolean; error?: string }> = [];

    for (const item of items) {
      try {
        let tableName: string;
        switch (item.itemType) {
          case "ai_action":
            tableName = "ai_action_logs";
            break;
          case "agent_task":
            tableName = "agent_tasks";
            break;
          case "automation":
            tableName = "universal_automations";
            break;
          default:
            results.push({ itemId: item.itemId, success: false, error: "Invalid itemType" });
            continue;
        }

        const updateData: Record<string, unknown> = {
          review_status: action === "approve" ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (reviewedBy) updateData.reviewed_by = reviewedBy;
        if (action === "reject" && rejectionReason) {
          updateData.rejection_reason = rejectionReason;
        }

        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq("id", item.itemId);

        if (error) {
          results.push({ itemId: item.itemId, success: false, error: error.message });
        } else {
          results.push({ itemId: item.itemId, success: true });
        }
      } catch (err) {
        results.push({
          itemId: item.itemId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      results,
      summary: {
        total: items.length,
        successful: successCount,
        failed: failCount,
      },
    });

  } catch (error) {
    console.error("Bulk review error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process bulk review" },
      { status: 500 }
    );
  }
}
