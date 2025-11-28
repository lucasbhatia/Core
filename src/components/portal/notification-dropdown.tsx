"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Zap,
  CreditCard,
  Users,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";
import type { Notification, NotificationType } from "@/types/database";

const notificationIcons: Record<NotificationType, React.ElementType> = {
  automation_success: Zap,
  automation_failed: AlertTriangle,
  usage_warning: AlertTriangle,
  billing: CreditCard,
  team: Users,
  system: Info,
};

const notificationColors: Record<NotificationType, string> = {
  automation_success: "text-green-500",
  automation_failed: "text-red-500",
  usage_warning: "text-yellow-500",
  billing: "text-blue-500",
  team: "text-violet-500",
  system: "text-gray-500",
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { unreadCount, recentNotifications, isConnected } = useRealtime({
    onNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    },
  });

  // Fetch initial notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/portal/notifications?limit=10");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // Merge realtime notifications
  useEffect(() => {
    if (recentNotifications.length > 0) {
      setNotifications((prev) => {
        const newNotifs = recentNotifications.filter(
          (n) => !prev.some((p) => p.id === n.id)
        );
        return [...newNotifs, ...prev];
      });
    }
  }, [recentNotifications]);

  async function markAsRead(notificationId: string) {
    try {
      await fetch("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Live
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => {
              const Icon = notificationIcons[notification.type] || Info;
              const iconColor = notificationColors[notification.type] || "text-gray-500";

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${
                    !notification.is_read ? "bg-violet-50" : ""
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center text-sm text-violet-600"
          onClick={() => (window.location.href = "/portal/activity")}
        >
          View all activity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
