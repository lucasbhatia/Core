"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Users,
  Bot,
  Sparkles,
  CheckCircle,
  FileText,
  Clock,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Target,
  Activity,
  MessageSquare,
  Coins,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AIAnalyticsDashboardProps {
  clientId: string;
  clientPlan: string;
  compact?: boolean;
}

// Mock analytics data
const analyticsData = {
  overview: {
    totalAgents: 3,
    activeAgents: 3,
    totalTasks: 45,
    completedTasks: 42,
    totalDeliverables: 58,
    totalTokensUsed: 85000,
    avgRating: 4.7,
    creditsUsed: 1850,
    creditsRemaining: 650,
  },
  weeklyTrend: {
    tasks: { current: 45, previous: 38, change: 18.4 },
    deliverables: { current: 58, previous: 52, change: 11.5 },
    tokens: { current: 85000, previous: 72000, change: 18.1 },
  },
  topAgents: [
    { id: "1", name: "Sarah", role: "Content Writer", avatar: "👩‍💻", tasks: 18, rating: 4.8 },
    { id: "2", name: "Kai", role: "Meeting Summarizer", avatar: "📝", tasks: 15, rating: 4.9 },
    { id: "3", name: "Alex", role: "Social Media Manager", avatar: "🧑‍🎨", tasks: 12, rating: 4.6 },
  ],
  recentActivity: [
    { agent: "Sarah", action: "completed", item: "Blog post about AI trends", time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { agent: "Alex", action: "created", item: "5 Twitter posts", time: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { agent: "Kai", action: "summarized", item: "Q4 Planning Meeting", time: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  ],
  tasksByType: [
    { type: "Blog Posts", count: 15, percentage: 33 },
    { type: "Social Media", count: 12, percentage: 27 },
    { type: "Meeting Notes", count: 10, percentage: 22 },
    { type: "Other", count: 8, percentage: 18 },
  ],
};

export function AIAnalyticsOverview({ compact = false }: { compact?: boolean }) {
  const { overview, weeklyTrend } = analyticsData;

  if (compact) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Agents</p>
                <p className="text-2xl font-bold">{overview.activeAgents}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-2xl font-bold">{overview.completedTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <p className="text-2xl font-bold">{overview.totalDeliverables}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Credits Left</p>
                <p className="text-2xl font-bold">{overview.creditsRemaining}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Bot className="w-6 h-6 text-violet-600" />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                All Active
              </Badge>
            </div>
            <p className="text-3xl font-bold text-violet-900">{overview.activeAgents}</p>
            <p className="text-sm text-violet-700">AI Agents Hired</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                {weeklyTrend.tasks.change}%
              </div>
            </div>
            <p className="text-3xl font-bold">{overview.completedTasks}</p>
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                {weeklyTrend.deliverables.change}%
              </div>
            </div>
            <p className="text-3xl font-bold">{overview.totalDeliverables}</p>
            <p className="text-sm text-muted-foreground">Deliverables Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Excellent
              </Badge>
            </div>
            <p className="text-3xl font-bold flex items-center gap-1">
              {overview.avgRating}
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </p>
            <p className="text-sm text-muted-foreground">Avg Team Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-600" />
                Credit Usage This Period
              </CardTitle>
              <CardDescription>AI credits used for agent tasks</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/billing">
                Manage Credits
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{overview.creditsUsed.toLocaleString()} used</span>
                <span className="text-sm text-muted-foreground">{overview.creditsRemaining.toLocaleString()} remaining</span>
              </div>
              <Progress value={(overview.creditsUsed / (overview.creditsUsed + overview.creditsRemaining)) * 100} className="h-3" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-600">{Math.round((overview.creditsUsed / (overview.creditsUsed + overview.creditsRemaining)) * 100)}%</p>
              <p className="text-xs text-muted-foreground">used</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Agents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-600" />
                Top Performing Agents
              </CardTitle>
              <CardDescription>Based on tasks completed and ratings</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/workforce/team">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topAgents.map((agent, index) => (
              <div key={agent.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center font-bold text-sm text-violet-600">
                  #{index + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg">
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{agent.tasks} tasks</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                    {agent.rating}
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Tasks by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.tasksByType.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-muted-foreground">{item.count} tasks ({item.percentage}%)</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-violet-600">{activity.agent}</span>
                      {" "}{activity.action}{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(activity.time, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AIAnalyticsDashboard({ clientId, clientPlan, compact = false }: AIAnalyticsDashboardProps) {
  return <AIAnalyticsOverview compact={compact} />;
}
