"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Notification } from "@/types/database";

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

interface UseRealtimeOptions {
  onNotification?: (notification: Notification) => void;
  onAutomationUpdate?: (update: AutomationUpdate) => void;
  onUnreadCount?: (count: number) => void;
  enabled?: boolean;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  unreadCount: number;
  recentNotifications: Notification[];
  runningAutomations: AutomationUpdate[];
  reconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    onNotification,
    onAutomationUpdate,
    onUnreadCount,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [runningAutomations, setRunningAutomations] = useState<AutomationUpdate[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

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

    eventSource.addEventListener("connected", (event) => {
      console.log("SSE connected:", JSON.parse(event.data));
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
  }, [connect]);

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

  return {
    isConnected,
    unreadCount,
    recentNotifications,
    runningAutomations,
    reconnect,
  };
}
