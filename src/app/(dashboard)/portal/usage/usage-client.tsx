"use client";

import { ToolUsageLog, UserProfile } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UsageStats {
  totalExecutions: number;
  totalTokens: number;
  avgExecutionTime: number;
  executionsByTool: { toolName: string; count: number }[];
  executionsByDay: { date: string; count: number }[];
}

interface UsageClientProps {
  logs: ToolUsageLog[];
  stats: UsageStats;
  profile: UserProfile;
}

export function UsageClient({ logs, stats, profile }: UsageClientProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total tokens consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgExecutionTime > 1000
                ? `${(stats.avgExecutionTime / 1000).toFixed(1)}s`
                : `${stats.avgExecutionTime}ms`}
            </div>
            <p className="text-xs text-muted-foreground">Per execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.executionsByTool.length}
            </div>
            <p className="text-xs text-muted-foreground">Tools with usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Tool Usage Breakdown */}
      {stats.executionsByTool.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Tool</CardTitle>
            <CardDescription>See which tools are being used the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.executionsByTool.map((item) => {
                const percentage = Math.round(
                  (item.count / stats.totalExecutions) * 100
                );
                return (
                  <div key={item.toolName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.toolName}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest tool executions</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs">Start using tools to see your usage history</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {(log.tool as any)?.name || "Unknown Tool"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "success"
                            ? "default"
                            : log.status === "error"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.tokens_used.toLocaleString()}</TableCell>
                    <TableCell>
                      {log.execution_time_ms
                        ? log.execution_time_ms > 1000
                          ? `${(log.execution_time_ms / 1000).toFixed(1)}s`
                          : `${log.execution_time_ms}ms`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
