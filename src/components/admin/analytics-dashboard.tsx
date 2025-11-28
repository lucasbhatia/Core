"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  FolderKanban,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  Target,
  Webhook,
  Calendar,
  Play,
  Code,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalClients: number;
    newClients: number;
    clientGrowth: string;
    totalProjects: number;
    totalAutomations: number;
    activeAutomations: number;
    mrr: number;
    mrrFormatted: string;
  };
  clients: {
    total: number;
    new: number;
    timeSeries: { date: string; count: number }[];
  };
  projects: {
    total: number;
    byStatus: { active: number; paused: number; completed: number };
    newProjects: number;
  };
  automations: {
    total: number;
    byStatus: { active: number; pending: number; paused: number; error: number };
    totalRuns: number;
    totalErrors: number;
    errorRate: string;
  };
  runs: {
    total: number;
    byStatus: { success: number; failed: number; running: number };
    byTrigger: { webhook: number; scheduled: number; manual: number; api: number };
    avgDuration: number;
    successRate: string;
    timeSeries: { date: string; count: number }[];
  };
  usage: {
    automationRuns: number;
    aiTokens: number;
    apiCalls: number;
  };
  audits: {
    total: number;
    byStatus: { new: number; inProgress: number; completed: number };
    pending: number;
  };
  period: string;
  generatedAt: string;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    iconColor,
    subtitle,
  }: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: React.ElementType;
    iconColor: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {changeType === "positive" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : changeType === "negative" ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                ) : null}
                <span
                  className={`text-xs ${
                    changeType === "positive"
                      ? "text-green-500"
                      : changeType === "negative"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconColor}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your automation business
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={data.overview.totalClients}
          change={`+${data.overview.newClients} new`}
          changeType="positive"
          icon={Users}
          iconColor="bg-blue-500"
          subtitle={`${data.overview.clientGrowth}% growth`}
        />
        <StatCard
          title="Active Automations"
          value={data.overview.activeAutomations}
          change={`${data.overview.totalAutomations} total`}
          changeType="neutral"
          icon={Zap}
          iconColor="bg-purple-500"
        />
        <StatCard
          title="Monthly Revenue"
          value={data.overview.mrrFormatted}
          change="MRR"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-green-500"
        />
        <StatCard
          title="Success Rate"
          value={`${data.runs.successRate}%`}
          change={`${data.runs.total} runs`}
          changeType={parseFloat(data.runs.successRate) >= 95 ? "positive" : "negative"}
          icon={Target}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Automation Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Automation Performance
            </CardTitle>
            <CardDescription>Run status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{data.runs.byStatus.success}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                  <p className="text-2xl font-bold text-red-600">{data.runs.byStatus.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <Activity className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{data.runs.byStatus.running}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">By Trigger Type</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Webhook className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">{data.runs.byTrigger.webhook}</p>
                      <p className="text-xs text-muted-foreground">Webhook</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{data.runs.byTrigger.scheduled}</p>
                      <p className="text-xs text-muted-foreground">Scheduled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Play className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{data.runs.byTrigger.manual}</p>
                      <p className="text-xs text-muted-foreground">Manual</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <Code className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">{data.runs.byTrigger.api}</p>
                      <p className="text-xs text-muted-foreground">API</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-lg font-semibold">{data.runs.avgDuration}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-lg font-semibold text-red-500">{data.automations.errorRate}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Projects Overview
            </CardTitle>
            <CardDescription>Status breakdown and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-600">{data.projects.byStatus.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-2xl font-bold text-yellow-600">{data.projects.byStatus.paused}</p>
                  <p className="text-xs text-muted-foreground">Paused</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-600">{data.projects.byStatus.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Total Projects</span>
                  <span className="font-medium">{data.projects.total}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">New This Period</span>
                  <Badge variant="success">+{data.projects.newProjects}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Automation Status
            </CardTitle>
            <CardDescription>System automation health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{data.automations.byStatus.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                  <div className="p-2 rounded-full bg-yellow-500/20">
                    <Clock className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{data.automations.byStatus.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-500/10">
                  <div className="p-2 rounded-full bg-gray-500/20">
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{data.automations.byStatus.paused}</p>
                    <p className="text-xs text-muted-foreground">Paused</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
                  <div className="p-2 rounded-full bg-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{data.automations.byStatus.error}</p>
                    <p className="text-xs text-muted-foreground">Error</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Usage Statistics
            </CardTitle>
            <CardDescription>Resource consumption this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <span className="text-sm">Automation Runs</span>
                </div>
                <span className="font-semibold">{data.usage.automationRuns.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">AI Tokens</span>
                </div>
                <span className="font-semibold">{data.usage.aiTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-green-500" />
                  <span className="text-sm">API Calls</span>
                </div>
                <span className="font-semibold">{data.usage.apiCalls.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Audit Requests
          </CardTitle>
          <CardDescription>Incoming business audit requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg border">
              <p className="text-3xl font-bold">{data.audits.total}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-500/10">
              <p className="text-3xl font-bold text-yellow-600">{data.audits.byStatus.new}</p>
              <p className="text-sm text-muted-foreground">New</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10">
              <p className="text-3xl font-bold text-blue-600">{data.audits.byStatus.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-3xl font-bold text-green-600">{data.audits.byStatus.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
