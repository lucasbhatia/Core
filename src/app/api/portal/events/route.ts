import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Get client session from portal cookie
async function getClientSession() {
  const cookieStore = await cookies();
  const sessionData = cookieStore.get("portal_session");
  if (!sessionData?.value) return null;

  try {
    return JSON.parse(sessionData.value);
  } catch {
    return null;
  }
}

// SSE endpoint for real-time updates
export async function GET(request: NextRequest) {
  const session = await getClientSession();
  if (!session?.clientId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = session.clientId;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      function sendEvent(event: string, data: unknown) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      }

      // Send initial connection message
      sendEvent("connected", { clientId, timestamp: new Date().toISOString() });

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        sendEvent("keepalive", { timestamp: new Date().toISOString() });
      }, 30000);

      // Poll for new events (in production, use Supabase Realtime or Redis pub/sub)
      let lastNotificationCheck = new Date();
      let lastRunCheck = new Date();

      const pollInterval = setInterval(async () => {
        try {
          const supabase = await createClient();

          // Check for new notifications
          const { data: newNotifications } = await supabase
            .from("notifications")
            .select("*")
            .eq("client_id", clientId)
            .gt("created_at", lastNotificationCheck.toISOString())
            .order("created_at", { ascending: false });

          if (newNotifications && newNotifications.length > 0) {
            for (const notification of newNotifications) {
              sendEvent("notification", notification);
            }
            lastNotificationCheck = new Date();
          }

          // Check for automation run updates
          const { data: runUpdates } = await supabase
            .from("automation_runs")
            .select(`
              *,
              system:system_builds(id, title)
            `)
            .eq("client_id", clientId)
            .or(`status.eq.running,updated_at.gt.${lastRunCheck.toISOString()}`)
            .order("updated_at", { ascending: false })
            .limit(10);

          if (runUpdates && runUpdates.length > 0) {
            for (const run of runUpdates) {
              sendEvent("automation_update", {
                run_id: run.id,
                system_id: run.system_id,
                title: run.system?.title,
                status: run.status,
                started_at: run.started_at,
                completed_at: run.completed_at,
                duration_ms: run.duration_ms,
                error_message: run.error_message,
              });
            }
            lastRunCheck = new Date();
          }

          // Get unread notification count
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("is_read", false);

          sendEvent("unread_count", { count: count || 0 });
        } catch (error) {
          console.error("SSE poll error:", error);
        }
      }, 5000); // Poll every 5 seconds

      // Handle connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
