"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface AutomationUpdate {
  run_id: string;
  system_id: string;
  title: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
}

interface ReviewQueueUpdate {
  id: string;
  item_type: "ai_action" | "agent_task" | "automation";
  review_status: string;
  entity_title?: string;
}

interface AgentTaskUpdate {
  id: string;
  agent_name: string;
  entity_title: string;
  status: string;
  review_status: string;
}

interface UseRealtimeOptions {
  clientId?: string;
  onNotification?: (notification: Notification) => void;
  onAutomationUpdate?: (update: AutomationUpdate) => void;
  onReviewQueueUpdate?: (update: ReviewQueueUpdate) => void;
  onAgentTaskComplete?: (task: AgentTaskUpdate) => void;
  onUnreadCount?: (count: number) => void;
  enabled?: boolean;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  unreadCount: number;
  recentNotifications: Notification[];
  runningAutomations: AutomationUpdate[];
  pendingReviewCount: number;
  reconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    clientId,
    onNotification,
    onAutomationUpdate,
    onReviewQueueUpdate,
    onAgentTaskComplete,
    onUnreadCount,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [runningAutomations, setRunningAutomations] = useState<AutomationUpdate[]>([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Connect to Supabase Realtime for database changes
  const connectSupabase = useCallback(() => {
    if (!enabled || !clientId) return;

    const supabase = createClient();

    // Clean up existing channel
    if (supabaseChannelRef.current) {
      supabase.removeChannel(supabaseChannelRef.current);
    }

    // Create a channel for this client's updates
    const channel = supabase
      .channel(`client-${clientId}`)
      // Listen for new agent tasks completing
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agent_tasks",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const task = payload.new as AgentTaskUpdate;
          if (task.status === "completed") {
            onAgentTaskComplete?.(task);
            // Increment pending review count if task needs review
            if (task.review_status === "pending") {
              setPendingReviewCount((prev) => prev + 1);
              onReviewQueueUpdate?.({
                id: task.id,
                item_type: "agent_task",
                review_status: "pending",
                entity_title: task.entity_title,
              });
            }
          }
        }
      )
      // Listen for review queue changes
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_action_logs",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const item = payload.new as ReviewQueueUpdate & { client_id: string };
          if (payload.old && (payload.old as { review_status?: string }).review_status !== item.review_status) {
            onReviewQueueUpdate?.({
              id: item.id,
              item_type: "ai_action",
              review_status: item.review_status,
              entity_title: item.entity_title,
            });
            // Update pending count
            if (item.review_status === "pending") {
              setPendingReviewCount((prev) => prev + 1);
            } else if ((payload.old as { review_status?: string }).review_status === "pending") {
              setPendingReviewCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      // Listen for automation run updates
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_runs",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const run = payload.new as {
            id: string;
            automation_id: string;
            status: string;
            started_at: string;
            completed_at?: string;
            duration_ms?: number;
            error_message?: string;
          };

          if (run) {
            const update: AutomationUpdate = {
              run_id: run.id,
              system_id: run.automation_id,
              title: "Automation",
              status: run.status,
              started_at: run.started_at,
              completed_at: run.completed_at,
              duration_ms: run.duration_ms,
              error_message: run.error_message,
            };

            setRunningAutomations((prev) => {
              const existing = prev.findIndex((r) => r.run_id === update.run_id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = update;
                if (update.status !== "running") {
                  setTimeout(() => {
                    setRunningAutomations((current) =>
                      current.filter((r) => r.run_id !== update.run_id)
                    );
                  }, 5000);
                }
                return updated;
              }
              if (update.status === "running") {
                return [update, ...prev];
              }
              return prev;
            });

            onAutomationUpdate?.(update);
          }
        }
      )
      // Listen for new notifications
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          setRecentNotifications((prev) => [notification, ...prev.slice(0, 9)]);
          setUnreadCount((prev) => prev + 1);
          onNotification?.(notification);
          onUnreadCount?.(unreadCount + 1);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    supabaseChannelRef.current = channel;
  }, [enabled, clientId, onNotification, onAutomationUpdate, onReviewQueueUpdate, onAgentTaskComplete, onUnreadCount, unreadCount]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/portal/events");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    eventSource.addEventListener("connected", () => {
      // SSE connection established
    });

    eventSource.addEventListener("notification", (event) => {
      const notification = JSON.parse(event.data) as Notification;
      setRecentNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      onNotification?.(notification);
    });

    eventSource.addEventListener("automation_update", (event) => {
      const update = JSON.parse(event.data) as AutomationUpdate;

      setRunningAutomations((prev) => {
        // Update existing or add new
        const existing = prev.findIndex((r) => r.run_id === update.run_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = update;
          // Remove completed runs after a delay
          if (update.status !== "running") {
            setTimeout(() => {
              setRunningAutomations((current) =>
                current.filter((r) => r.run_id !== update.run_id)
              );
            }, 5000);
          }
          return updated;
        }
        if (update.status === "running") {
          return [update, ...prev];
        }
        return prev;
      });

      onAutomationUpdate?.(update);
    });

    eventSource.addEventListener("unread_count", (event) => {
      const { count } = JSON.parse(event.data);
      setUnreadCount(count);
      onUnreadCount?.(count);
    });

    eventSource.addEventListener("keepalive", () => {
      // Connection is alive
    });
  }, [enabled, onNotification, onAutomationUpdate, onUnreadCount]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
    connectSupabase();
  }, [connect, connectSupabase]);

  // Connect to SSE
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  // Connect to Supabase Realtime
  useEffect(() => {
    if (enabled && clientId) {
      connectSupabase();
    }

    return () => {
      if (supabaseChannelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(supabaseChannelRef.current);
      }
    };
  }, [enabled, clientId, connectSupabase]);

  return {
    isConnected,
    unreadCount,
    recentNotifications,
    runningAutomations,
    pendingReviewCount,
    reconnect,
  };
}
