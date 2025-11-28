"use client";

import { useRealtime } from "@/hooks/use-realtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Activity, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RunningAutomations() {
  const { runningAutomations, isConnected } = useRealtime();

  if (runningAutomations.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          <span className="hidden sm:inline">
            {runningAutomations.length} Running
          </span>
          <Badge variant="secondary" className="sm:hidden">
            {runningAutomations.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Running Automations</h4>
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <div className="space-y-3">
          {runningAutomations.map((automation) => (
            <div
              key={automation.run_id}
              className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"
            >
              <div className="mt-0.5">
                {automation.status === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                ) : automation.status === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {automation.title || "Automation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started{" "}
                  {formatDistanceToNow(new Date(automation.started_at), {
                    addSuffix: true,
                  })}
                </p>
                {automation.error_message && (
                  <p className="text-xs text-red-600 mt-1 truncate">
                    {automation.error_message}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  automation.status === "running"
                    ? "default"
                    : automation.status === "success"
                    ? "secondary"
                    : "destructive"
                }
                className="capitalize text-xs"
              >
                {automation.status}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-violet-600"
            onClick={() => (window.location.href = "/portal/automations")}
          >
            <Activity className="h-4 w-4 mr-2" />
            View all automations
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
