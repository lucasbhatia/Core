"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Timer,
  DollarSign,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Automation {
  id: string;
  name: string;
  run_count?: number;
  error_count?: number;
}

interface ChartData {
  date: string;
  success: number;
  failed: number;
}

interface RecentRun {
  id: string;
  status: string;
  trigger_type: string;
  duration_ms: number | null;
  created_at: string;
  system_id: string;
}

interface AnalyticsDashboardProps {
  automations: Automation[];
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    avgDuration: number;
    successRate: number;
  };
  chartData: ChartData[];
  recentRuns: RecentRun[];
}

export default function AnalyticsDashboard({
  automations,
  stats,
  chartData,
  recentRuns,
}: AnalyticsDashboardProps) {
  // Calculate ROI metrics (example calculations)
  const avgTimePerTask = 15; // minutes saved per automation run
  const hourlyRate = 50; // assumed hourly value
  const timeSavedMinutes = stats.totalRuns * avgTimePerTask;
  const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10;
  const estimatedSavings = Math.round(timeSavedHours * hourlyRate);

  // Find max for chart scaling
  const maxValue = Math.max(...chartData.map((d) => d.success + d.failed), 1);

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Track your automation performance and ROI
          </p>
        </div>
        <Select defaultValue="14d">
          <SelectTrigger className="w-[150px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-3xl font-bold">{stats.totalRuns.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last period
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                <Activity className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">{stats.successRate}%</p>
                <p
                  className={`text-sm flex items-center mt-1 ${
                    stats.successRate >= 90 ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {stats.successRate >= 90 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {stats.successRate >= 90 ? "Excellent" : "Needs attention"}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-3xl font-bold">
                  {stats.avgDuration < 1000
                    ? `${stats.avgDuration}ms`
                    : `${(stats.avgDuration / 1000).toFixed(1)}s`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Per automation run</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Runs</p>
                <p className="text-3xl font-bold text-red-600">{stats.failedRuns}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalRuns > 0
                    ? `${Math.round((stats.failedRuns / stats.totalRuns) * 100)}% of total`
                    : "No runs yet"}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-red-100 to-rose-100 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Section */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-violet-600" />
            Return on Investment
          </CardTitle>
          <CardDescription>
            Estimated value generated by your automations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <Timer className="w-8 h-8 text-violet-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-violet-700">{timeSavedHours}h</p>
              <p className="text-sm text-muted-foreground">Time Saved</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-700">${estimatedSavings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Estimated Savings</p>
            </div>
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-orange-700">{automations.length}</p>
              <p className="text-sm text-muted-foreground">Active Automations</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            * Estimated based on {avgTimePerTask} minutes saved per run at ${hourlyRate}/hour
          </p>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Runs Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automation Runs</CardTitle>
            <CardDescription>Daily automation activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            ) : (
              <div className="h-[200px] flex items-end gap-1">
                {chartData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col-reverse gap-0.5">
                      {day.success > 0 && (
                        <div
                          className="w-full bg-green-500 rounded-t"
                          style={{
                            height: `${(day.success / maxValue) * 150}px`,
                          }}
                        />
                      )}
                      {day.failed > 0 && (
                        <div
                          className="w-full bg-red-500 rounded-t"
                          style={{
                            height: `${(day.failed / maxValue) * 150}px`,
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(day.date), "d")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-xs text-muted-foreground">Successful</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Automations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Automations</CardTitle>
            <CardDescription>Most used automations by run count</CardDescription>
          </CardHeader>
          <CardContent>
            {automations.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No automations yet
              </div>
            ) : (
              <div className="space-y-4">
                {automations
                  .sort((a, b) => (b.run_count || 0) - (a.run_count || 0))
                  .slice(0, 5)
                  .map((automation, i) => {
                    const maxRuns = automations[0]?.run_count || 1;
                    const percentage = ((automation.run_count || 0) / maxRuns) * 100;
                    return (
                      <div key={automation.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {automation.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {automation.run_count || 0} runs
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Runs</CardTitle>
          <CardDescription>Latest automation executions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No runs yet. Run an automation to see activity here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Trigger
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Duration
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={
                            run.status === "success"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : run.status === "failed"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {run.status === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {run.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm capitalize">{run.trigger_type}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-muted-foreground">
                          {run.duration_ms
                            ? run.duration_ms < 1000
                              ? `${run.duration_ms}ms`
                              : `${(run.duration_ms / 1000).toFixed(1)}s`
                            : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(run.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
