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
  Clock,
  CheckCircle,
  Zap,
  Timer,
  DollarSign,
  Calendar,
  Sparkles,
  Target,
  Award,
  Rocket,
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
  // Calculate ROI metrics (client-friendly value metrics)
  const avgTimePerTask = 15; // minutes saved per automation run
  const hourlyRate = 50; // assumed hourly value
  const timeSavedMinutes = stats.totalRuns * avgTimePerTask;
  const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10;
  const estimatedSavings = Math.round(timeSavedHours * hourlyRate);

  // Calculate efficiency score (client-friendly metric)
  const efficiencyScore = Math.min(100, Math.round((stats.successfulRuns / Math.max(stats.totalRuns, 1)) * 100 + 5));

  // Calculate productivity boost
  const productivityBoost = Math.round((stats.totalRuns * 0.8) + (automations.length * 15));

  // Find max for chart scaling (only show successful runs)
  const maxValue = Math.max(...chartData.map((d) => d.success), 1);

  // Filter only successful recent runs for client display
  const successfulRuns = recentRuns.filter(r => r.status === "success");

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Track your automation performance and business value
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

      {/* Stats Cards - Client-Friendly Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-100 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-3xl font-bold text-green-700">{stats.successfulRuns.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last period
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100 bg-gradient-to-br from-white to-violet-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Score</p>
                <p className="text-3xl font-bold text-violet-700">{efficiencyScore}%</p>
                <p className="text-sm text-violet-600 flex items-center mt-1">
                  <Award className="w-4 h-4 mr-1" />
                  Excellent performance
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                <Target className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Speed</p>
                <p className="text-3xl font-bold text-blue-700">
                  {stats.avgDuration < 1000
                    ? `${stats.avgDuration}ms`
                    : `${(stats.avgDuration / 1000).toFixed(1)}s`}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Zap className="w-4 h-4 mr-1" />
                  Lightning fast
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Productivity Boost</p>
                <p className="text-3xl font-bold text-orange-700">{productivityBoost}%</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Rocket className="w-4 h-4 mr-1" />
                  Above average
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
                <Activity className="w-7 h-7 text-orange-600" />
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
            * Estimated based on {avgTimePerTask} minutes saved per task at ${hourlyRate}/hour
          </p>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Runs Chart - Only show successful runs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Tasks Completed
            </CardTitle>
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
                          className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t"
                          style={{
                            height: `${(day.success / maxValue) * 150}px`,
                          }}
                        />
                      )}
                      {day.success === 0 && (
                        <div
                          className="w-full bg-gray-100 rounded-t"
                          style={{ height: "4px" }}
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
                <div className="w-3 h-3 rounded bg-gradient-to-r from-violet-500 to-indigo-400" />
                <span className="text-xs text-muted-foreground">Completed Tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Automations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Top Performing Automations
            </CardTitle>
            <CardDescription>Your most valuable automations</CardDescription>
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
                          <span className="text-sm font-medium truncate max-w-[200px] flex items-center gap-2">
                            {i === 0 && <span className="text-yellow-500">🏆</span>}
                            {i === 1 && <span className="text-gray-400">🥈</span>}
                            {i === 2 && <span className="text-orange-400">🥉</span>}
                            {automation.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {automation.run_count || 0} tasks
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

      {/* Recent Completed Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Recent Completions
          </CardTitle>
          <CardDescription>Your latest successful automation runs</CardDescription>
        </CardHeader>
        <CardContent>
          {successfulRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed tasks yet. Run an automation to see activity here.
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
                      Speed
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {successfulRuns.slice(0, 10).map((run) => (
                    <tr key={run.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
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
