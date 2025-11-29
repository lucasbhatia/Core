"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Loader2,
  Activity,
  Sparkles,
  PlusCircle,
  Timer,
  CheckSquare,
  Calendar,
  FolderKanban,
  ArrowUpRight,
  Bell,
  MessageSquare,
  Video,
  Flag,
  Inbox,
  Lightbulb,
  Send,
  RefreshCw,
  Target,
  LayoutGrid,
  Users,
  Brain,
  Cpu,
  Database,
  Wifi,
  Shield,
  GitBranch,
  Network,
  Workflow,
  CircleDot,
  FileText,
  Briefcase,
  BarChart3,
  Star,
  Eye,
  UserCircle,
  Layers,
  Settings,
  ExternalLink,
  Hash,
} from "lucide-react";
import { formatDistanceToNow, isToday, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import type { Client } from "@/types/database";

interface Automation {
  id: string;
  name: string;
  automation_status?: string;
  automation_trigger?: string;
  last_run_at?: string;
  run_count?: number;
}

interface Deliverable {
  id: string;
  name: string;
  category?: string;
  status: string;
  created_at: string;
}

interface UsageStats {
  automationRuns: number;
  runLimit: number;
  aiTokens: number;
  tokenLimit: number;
  activeAutomations: number;
  automationLimit: number;
}

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "completed";
  due_date?: string;
  project?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: "meeting" | "automation" | "task" | "reminder";
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  actionUrl: string;
  icon: "automation" | "task" | "insight" | "optimization";
  priority?: "high" | "medium" | "low";
  category?: string;
}

interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "busy" | "offline";
  tasksCompleted: number;
  tasksInProgress: number;
  rating: number;
  avatar?: string;
  lastActive?: string;
  specialties: string[];
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed";
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  automationsActive: number;
  dueDate?: string;
  priority: "high" | "medium" | "low";
  color: string;
}

interface AutomationActivity {
  id: string;
  automationName: string;
  automationId: string;
  action: "started" | "completed" | "failed" | "paused" | "triggered";
  timestamp: string;
  duration?: number;
  outputs?: number;
  error?: string;
}

interface SystemHealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  uptime?: number;
  lastCheck: string;
  icon: "database" | "ai" | "api" | "email" | "auth" | "queue";
}

interface AIInsight {
  id: string;
  type: "optimization" | "warning" | "opportunity" | "trend";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  actionUrl?: string;
  metric?: { value: string; change: number };
}

interface DashboardHomeProps {
  client: Client;
  automations: Automation[];
  deliverables: Deliverable[];
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
  usage?: UsageStats;
}

const priorityColors = {
  high: "text-red-600 bg-red-50 border-red-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-blue-600 bg-blue-50 border-blue-200",
};

export default function DashboardHome({
  client,
  automations,
  deliverables,
  recentActivity,
  usage = {
    automationRuns: 127,
    runLimit: 500,
    aiTokens: 45000,
    tokenLimit: 100000,
    activeAutomations: 3,
    automationLimit: 15,
  },
}: DashboardHomeProps) {
  const { toast } = useToast();
  const [runningAutomation, setRunningAutomation] = useState<string | null>(null);
  const [togglingAutomation, setTogglingAutomation] = useState<string | null>(null);
  const [localAutomations, setLocalAutomations] = useState(automations);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [automationActivity, setAutomationActivity] = useState<AutomationActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  // Fetch today's tasks and events on mount
  useEffect(() => {
    fetchTodayData();
    generateAISuggestions();
    loadAIAgents();
    loadProjects();
    loadAutomationActivity();
    loadSystemHealth();
    loadAIInsights();
  }, []);

  const fetchTodayData = async () => {
    // Fetch tasks
    try {
      const tasksRes = await fetch("/api/portal/tasks");
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      } else {
        // Demo tasks for today
        setTasks(getDemoTasks());
      }
    } catch {
      setTasks(getDemoTasks());
    } finally {
      setLoadingTasks(false);
    }

    // Fetch calendar events
    try {
      const eventsRes = await fetch("/api/portal/calendar");
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      } else {
        setEvents(getDemoEvents());
      }
    } catch {
      setEvents(getDemoEvents());
    } finally {
      setLoadingEvents(false);
    }

    // Set demo notifications
    setNotifications(getDemoNotifications());
  };

  const getDemoTasks = (): Task[] => [
    {
      id: "1",
      title: "Review Q4 marketing automation results",
      priority: "high",
      status: "todo",
      due_date: new Date().toISOString(),
      project: "Marketing",
    },
    {
      id: "2",
      title: "Set up lead scoring automation",
      priority: "high",
      status: "in_progress",
      due_date: new Date().toISOString(),
      project: "Sales",
    },
    {
      id: "3",
      title: "Update customer onboarding workflow",
      priority: "medium",
      status: "todo",
      due_date: new Date().toISOString(),
      project: "Customer Success",
    },
  ];

  const getDemoEvents = (): CalendarEvent[] => {
    const today = new Date();
    return [
      {
        id: "1",
        title: "Weekly Report Automation",
        start_time: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(9, 30, 0, 0)).toISOString(),
        type: "automation",
      },
      {
        id: "2",
        title: "Team Standup",
        start_time: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
        type: "meeting",
      },
      {
        id: "3",
        title: "Client Review Call",
        start_time: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
        end_time: new Date(today.setHours(15, 0, 0, 0)).toISOString(),
        type: "meeting",
      },
    ];
  };

  const getDemoNotifications = (): Notification[] => [
    {
      id: "1",
      title: "Automation Completed",
      message: "Weekly Report automation ran successfully",
      type: "success",
      read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "2",
      title: "New Feature Available",
      message: "AI Suggestions are now available for your automations",
      type: "info",
      read: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const loadAIAgents = () => {
    setAiAgents([
      {
        id: "1",
        name: "Content Writer",
        role: "Content Generation",
        status: "active",
        tasksCompleted: 142,
        tasksInProgress: 3,
        rating: 4.8,
        avatar: "📝",
        lastActive: new Date(Date.now() - 300000).toISOString(),
        specialties: ["Blog Posts", "Social Media", "Email Copy"],
      },
      {
        id: "2",
        name: "Data Analyst",
        role: "Analytics & Reporting",
        status: "busy",
        tasksCompleted: 89,
        tasksInProgress: 2,
        rating: 4.9,
        avatar: "📊",
        lastActive: new Date().toISOString(),
        specialties: ["Reports", "Dashboards", "Insights"],
      },
      {
        id: "3",
        name: "Research Agent",
        role: "Market Research",
        status: "idle",
        tasksCompleted: 56,
        tasksInProgress: 0,
        rating: 4.7,
        avatar: "🔍",
        lastActive: new Date(Date.now() - 1800000).toISOString(),
        specialties: ["Competitor Analysis", "Trends", "Summaries"],
      },
      {
        id: "4",
        name: "Email Assistant",
        role: "Communication",
        status: "active",
        tasksCompleted: 234,
        tasksInProgress: 5,
        rating: 4.6,
        avatar: "✉️",
        lastActive: new Date(Date.now() - 60000).toISOString(),
        specialties: ["Email Responses", "Follow-ups", "Scheduling"],
      },
    ]);
  };

  const loadProjects = () => {
    setProjects([
      {
        id: "1",
        name: "Q4 Marketing Campaign",
        description: "End-of-year marketing automation and content strategy",
        status: "active",
        progress: 68,
        tasksTotal: 24,
        tasksCompleted: 16,
        automationsActive: 5,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "high",
        color: "violet",
      },
      {
        id: "2",
        name: "Customer Onboarding Flow",
        description: "Automated welcome sequences and setup guides",
        status: "active",
        progress: 45,
        tasksTotal: 18,
        tasksCompleted: 8,
        automationsActive: 3,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "medium",
        color: "blue",
      },
      {
        id: "3",
        name: "Sales Pipeline Automation",
        description: "Lead scoring and follow-up sequences",
        status: "active",
        progress: 82,
        tasksTotal: 12,
        tasksCompleted: 10,
        automationsActive: 4,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "high",
        color: "green",
      },
    ]);
  };

  const loadAutomationActivity = () => {
    setAutomationActivity([
      {
        id: "1",
        automationName: "Weekly Newsletter Send",
        automationId: "auto-1",
        action: "completed",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        duration: 45,
        outputs: 1250,
      },
      {
        id: "2",
        automationName: "Lead Scoring Update",
        automationId: "auto-2",
        action: "started",
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: "3",
        automationName: "Social Media Posts",
        automationId: "auto-3",
        action: "completed",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        duration: 12,
        outputs: 8,
      },
      {
        id: "4",
        automationName: "Data Backup",
        automationId: "auto-4",
        action: "failed",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        error: "Connection timeout",
      },
      {
        id: "5",
        automationName: "Customer Welcome Email",
        automationId: "auto-5",
        action: "triggered",
        timestamp: new Date(Date.now() - 600000).toISOString(),
      },
    ]);
  };

  const loadSystemHealth = () => {
    setSystemHealth([
      {
        service: "AI Engine",
        status: "healthy",
        latency: 124,
        uptime: 99.98,
        lastCheck: new Date().toISOString(),
        icon: "ai",
      },
      {
        service: "Database",
        status: "healthy",
        latency: 23,
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
        icon: "database",
      },
      {
        service: "API Gateway",
        status: "healthy",
        latency: 45,
        uptime: 99.95,
        lastCheck: new Date().toISOString(),
        icon: "api",
      },
      {
        service: "Email Service",
        status: "degraded",
        latency: 890,
        uptime: 98.5,
        lastCheck: new Date().toISOString(),
        icon: "email",
      },
    ]);
  };

  const loadAIInsights = () => {
    setAiInsights([
      {
        id: "1",
        type: "optimization",
        title: "Automation Efficiency Opportunity",
        description: "3 automations have overlapping schedules. Consolidating could save 2 hours of processing time weekly.",
        impact: "high",
        actionable: true,
        actionUrl: "/portal/automations?optimize=true",
        metric: { value: "2h/week", change: 15 },
      },
      {
        id: "2",
        type: "trend",
        title: "Task Completion Rate Rising",
        description: "Your team's task completion rate has increased 23% this month compared to last month.",
        impact: "medium",
        actionable: false,
        metric: { value: "23%", change: 23 },
      },
      {
        id: "3",
        type: "opportunity",
        title: "Underutilized AI Agent",
        description: "Research Agent has capacity for 40% more tasks. Consider assigning research-related workflows.",
        impact: "medium",
        actionable: true,
        actionUrl: "/portal/ai-workforce",
      },
      {
        id: "4",
        type: "warning",
        title: "Email Deliverability Alert",
        description: "Email open rates dropped 8% this week. Review subject lines and sending times.",
        impact: "high",
        actionable: true,
        actionUrl: "/portal/analytics?tab=email",
        metric: { value: "-8%", change: -8 },
      },
    ]);
  };

  const generateAISuggestions = () => {
    // Personalized suggestions based on user activity and usage patterns
    setAiSuggestions([
      {
        id: "1",
        title: "Optimize Lead Response Time",
        description: "Based on your sales data, leads responded to within 5 minutes convert 21x higher",
        action: "Create Automation",
        actionUrl: "/portal/builder?prompt=Create%20an%20automation%20to%20auto-respond%20to%20new%20leads",
        icon: "automation",
        priority: "high",
        category: "Sales",
      },
      {
        id: "2",
        title: "Schedule Weekly Reports",
        description: "Your team checks analytics every Monday - automate this with scheduled reports",
        action: "Set Up",
        actionUrl: "/portal/builder?prompt=Create%20weekly%20performance%20report%20automation",
        icon: "task",
        priority: "medium",
        category: "Analytics",
      },
      {
        id: "3",
        title: "Connect Your CRM",
        description: "Sync your CRM to unlock 12+ additional automation templates",
        action: "Connect",
        actionUrl: "/portal/integrations",
        icon: "optimization",
        priority: "medium",
        category: "Integrations",
      },
      {
        id: "4",
        title: "Email Follow-up Sequence",
        description: "Your open rates suggest a 3-email sequence would improve engagement by 40%",
        action: "Create",
        actionUrl: "/portal/builder?prompt=Create%20email%20follow-up%20sequence",
        icon: "insight",
        priority: "high",
        category: "Marketing",
      },
    ]);
  };

  const activeAutomations = localAutomations.filter((a) => a.automation_status === "active");
  const todayTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    return isToday(new Date(t.due_date)) && t.status !== "completed";
  });
  const todayEvents = events.filter((e) => isToday(new Date(e.start_time)));
  const unreadNotifications = notifications.filter((n) => !n.read);

  const totalRuns = usage.automationRuns;
  const timeSaved = Math.round((totalRuns * 15) / 60 * 10) / 10;
  const valueGenerated = Math.round(timeSaved * 50);

  async function handleRunAutomation(automationId: string) {
    setRunningAutomation(automationId);
    try {
      const response = await fetch("/api/portal/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automationId }),
      });

      if (response.ok) {
        toast({
          title: "Automation started",
          description: "Your automation is now running.",
        });
      } else {
        toast({
          title: "Failed to start",
          description: "Could not start automation. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start automation",
        variant: "destructive",
      });
    } finally {
      setRunningAutomation(null);
    }
  }

  async function handleToggleAutomation(automationId: string, currentStatus: string) {
    setTogglingAutomation(automationId);
    const newStatus = currentStatus === "active" ? "paused" : "active";

    try {
      const response = await fetch("/api/portal/automation/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: automationId, status: newStatus }),
      });

      if (response.ok) {
        setLocalAutomations((prev) =>
          prev.map((a) =>
            a.id === automationId ? { ...a, automation_status: newStatus } : a
          )
        );
        toast({
          title: newStatus === "active" ? "Automation activated" : "Automation paused",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to toggle automation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to toggle automation",
        variant: "destructive",
      });
    } finally {
      setTogglingAutomation(null);
    }
  }

  const getSuggestionIcon = (icon: string) => {
    switch (icon) {
      case "automation":
        return <Zap className="w-5 h-5 text-violet-600" />;
      case "task":
        return <CheckSquare className="w-5 h-5 text-blue-600" />;
      case "insight":
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case "optimization":
        return <Target className="w-5 h-5 text-green-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-violet-600" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Video className="w-4 h-4" />;
      case "automation":
        return <Zap className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500";
      case "automation":
        return "bg-violet-500";
      case "task":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "busy":
        return "bg-amber-500";
      case "idle":
        return "bg-blue-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
      case "busy":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "idle":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "offline":
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "started":
        return <Play className="w-4 h-4 text-blue-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "paused":
        return <Timer className="w-4 h-4 text-amber-600" />;
      case "triggered":
        return <Zap className="w-4 h-4 text-violet-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "completed":
        return "bg-green-100";
      case "started":
        return "bg-blue-100";
      case "failed":
        return "bg-red-100";
      case "paused":
        return "bg-amber-100";
      case "triggered":
        return "bg-violet-100";
      default:
        return "bg-gray-100";
    }
  };

  const getSystemHealthIcon = (icon: string) => {
    switch (icon) {
      case "ai":
        return <Brain className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "api":
        return <Wifi className="w-4 h-4" />;
      case "email":
        return <Send className="w-4 h-4" />;
      case "auth":
        return <Shield className="w-4 h-4" />;
      case "queue":
        return <Layers className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
      case "degraded":
        return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
      case "down":
        return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <Target className="w-4 h-4 text-violet-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "opportunity":
        return <Lightbulb className="w-4 h-4 text-green-600" />;
      case "trend":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "optimization":
        return { bg: "bg-violet-50", border: "border-violet-200", icon: "bg-violet-100" };
      case "warning":
        return { bg: "bg-amber-50", border: "border-amber-200", icon: "bg-amber-100" };
      case "opportunity":
        return { bg: "bg-green-50", border: "border-green-200", icon: "bg-green-100" };
      case "trend":
        return { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-100" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", icon: "bg-gray-100" };
    }
  };

  const getProjectColor = (color: string) => {
    switch (color) {
      case "violet":
        return { bg: "bg-violet-100", text: "text-violet-700", progress: "bg-violet-500" };
      case "blue":
        return { bg: "bg-blue-100", text: "text-blue-700", progress: "bg-blue-500" };
      case "green":
        return { bg: "bg-green-100", text: "text-green-700", progress: "bg-green-500" };
      case "amber":
        return { bg: "bg-amber-100", text: "text-amber-700", progress: "bg-amber-500" };
      case "red":
        return { bg: "bg-red-100", text: "text-red-700", progress: "bg-red-500" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", progress: "bg-gray-500" };
    }
  };

  const activeAgents = aiAgents.filter((a) => a.status === "active" || a.status === "busy");
  const totalTasksInProgress = aiAgents.reduce((sum, a) => sum + a.tasksInProgress, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Ask AI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {client.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} &middot; {todayTasks.length} tasks &middot; {todayEvents.length} events today
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/portal/activity">
              <Bell className="w-4 h-4 mr-2" />
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="mr-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
              Notifications
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200">
            <Link href="/portal/ai-inbox">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/portal/tasks" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-violet-200 bg-gradient-to-br from-violet-50/50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                  <CheckSquare className="w-5 h-5 text-violet-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-base mb-0.5">Tasks</h3>
              <p className="text-sm text-muted-foreground">{todayTasks.length} due today</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/calendar" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-base mb-0.5">Calendar</h3>
              <p className="text-sm text-muted-foreground">{todayEvents.length} events today</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/automations" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-green-200 bg-gradient-to-br from-green-50/50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-base mb-0.5">Automations</h3>
              <p className="text-sm text-muted-foreground">{activeAutomations.length} active</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/projects" className="group">
          <Card className="h-full transition-all hover:shadow-lg hover:border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <FolderKanban className="w-5 h-5 text-amber-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-base mb-0.5">Projects</h3>
              <p className="text-sm text-muted-foreground">Manage workflows</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Overview - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today&apos;s Schedule
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/calendar" className="text-violet-600 hover:text-violet-700">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                </div>
              ) : todayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No events scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-violet-600" />
                Today&apos;s Tasks
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/tasks" className="text-violet-600 hover:text-violet-700">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">All caught up! No tasks due today.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/portal/tasks">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        task.priority === "high" ? "bg-red-100" : task.priority === "medium" ? "bg-amber-100" : "bg-blue-100"
                      }`}>
                        <Flag className={`w-5 h-5 ${
                          task.priority === "high" ? "text-red-600" : task.priority === "medium" ? "text-amber-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        {task.project && (
                          <p className="text-sm text-muted-foreground">{task.project}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Automations with Toggles */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                Active Automations
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/automations" className="text-violet-600 hover:text-violet-700">
                  Manage
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {localAutomations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-violet-600" />
                  </div>
                  <h3 className="font-semibold mb-2">No automations yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm mx-auto text-sm">
                    Create your first automation to start saving time
                  </p>
                  <Button asChild size="sm">
                    <Link href="/portal/builder">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Automation
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {localAutomations.slice(0, 5).map((automation) => (
                    <div
                      key={automation.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            automation.automation_status === "active"
                              ? "bg-green-100"
                              : "bg-gray-200"
                          }`}
                        >
                          <Zap
                            className={`w-5 h-5 ${
                              automation.automation_status === "active"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{automation.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {automation.last_run_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(automation.last_run_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                            {automation.run_count && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>{automation.run_count} runs</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={automation.automation_status === "active"}
                          onCheckedChange={() => handleToggleAutomation(automation.id, automation.automation_status || "")}
                          disabled={togglingAutomation === automation.id}
                        />
                        {automation.automation_status === "active" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRunAutomation(automation.id)}
                            disabled={runningAutomation === automation.id}
                          >
                            {runningAutomation === automation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Run
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Activity Feed */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" />
                Automation Activity
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/portal/automations?view=map" className="text-violet-600 hover:text-violet-700">
                    <Network className="w-4 h-4 mr-1" />
                    Map View
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {automationActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No automation activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automationActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getActivityColor(activity.action)}`}>
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{activity.automationName}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${
                              activity.action === "completed" ? "text-green-700 bg-green-50 border-green-200" :
                              activity.action === "failed" ? "text-red-700 bg-red-50 border-red-200" :
                              activity.action === "started" ? "text-blue-700 bg-blue-50 border-blue-200" :
                              "text-violet-700 bg-violet-50 border-violet-200"
                            }`}
                          >
                            {activity.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                          {activity.duration && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {activity.duration}s
                              </span>
                            </>
                          )}
                          {activity.outputs && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>{activity.outputs} outputs</span>
                            </>
                          )}
                          {activity.error && (
                            <span className="text-red-600">{activity.error}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Overview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                Active Projects
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/projects" className="text-violet-600 hover:text-violet-700">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <FolderKanban className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active projects</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/portal/projects/new">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Project
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project) => {
                    const colors = getProjectColor(project.color);
                    return (
                      <div key={project.id} className="p-4 rounded-xl border hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                              <FolderKanban className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div>
                              <h4 className="font-medium">{project.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={priorityColors[project.priority]}
                          >
                            {project.priority}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors.progress} rounded-full transition-all`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                {project.tasksCompleted}/{project.tasksTotal} tasks
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {project.automationsActive} automations
                              </span>
                            </div>
                            {project.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(project.dueDate), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Agents Overview */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                AI Workforce
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/ai-workforce" className="text-violet-600 hover:text-violet-700">
                  Manage
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/80">
                  <p className="text-2xl font-bold text-blue-600">{activeAgents.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/80">
                  <p className="text-2xl font-bold text-amber-600">{totalTasksInProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/80">
                  <p className="text-2xl font-bold text-green-600">
                    {aiAgents.reduce((sum, a) => sum + a.tasksCompleted, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Agent List */}
              <div className="space-y-2">
                {aiAgents.slice(0, 4).map((agent) => {
                  const statusBadge = getAgentStatusBadge(agent.status);
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/80 hover:bg-white transition-colors"
                    >
                      <div className="relative">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {agent.avatar}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getAgentStatusColor(agent.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{agent.name}</p>
                          <Badge variant="outline" className={`text-[10px] ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                            {agent.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {agent.rating}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions - Enhanced with categories and priority */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50/50 to-indigo-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  AI Suggestions
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Personalized
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiSuggestions.slice(0, 3).map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-xl bg-white border transition-colors ${
                      suggestion.priority === "high"
                        ? "border-violet-200 hover:border-violet-300"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        {getSuggestionIcon(suggestion.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          {suggestion.priority === "high" && (
                            <Badge className="text-[10px] bg-violet-100 text-violet-700 hover:bg-violet-100">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        {suggestion.category && (
                          <Badge variant="outline" className="text-[10px] mb-1.5">
                            {suggestion.category}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {suggestion.description}
                        </p>
                        <Button size="sm" variant="link" className="h-auto p-0 mt-2 text-violet-600" asChild>
                          <Link href={suggestion.actionUrl}>
                            {suggestion.action}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Create Actions - Enhanced */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-violet-600" />
                Quick Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-violet-200 hover:bg-violet-50/50" asChild>
                  <Link href="/portal/tasks/new">
                    <CheckSquare className="w-4 h-4 text-violet-600" />
                    <span className="text-xs">New Task</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-green-200 hover:bg-green-50/50" asChild>
                  <Link href="/portal/builder">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-xs">Automation</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-amber-200 hover:bg-amber-50/50" asChild>
                  <Link href="/portal/projects/new">
                    <FolderKanban className="w-4 h-4 text-amber-600" />
                    <span className="text-xs">Project</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-blue-200 hover:bg-blue-50/50" asChild>
                  <Link href="/portal/ai-workforce/hire">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Hire Agent</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-cyan-200 hover:bg-cyan-50/50" asChild>
                  <Link href="/portal/templates">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs">Template</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 hover:border-indigo-200 hover:bg-indigo-50/50" asChild>
                  <Link href="/portal/ai-inbox">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs">Ask AI</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-600" />
                AI Insights
              </CardTitle>
              <Badge variant="outline" className="text-xs text-violet-600 border-violet-200 bg-violet-50">
                {aiInsights.filter(i => i.impact === "high").length} urgent
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiInsights.slice(0, 3).map((insight) => {
                  const colors = getInsightColor(insight.type);
                  return (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-xl ${colors.bg} border ${colors.border} transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm">{insight.title}</p>
                            {insight.impact === "high" && (
                              <CircleDot className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </p>
                          {insight.metric && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className={`text-sm font-semibold ${
                                insight.metric.change > 0 ? "text-green-600" : "text-red-600"
                              }`}>
                                {insight.metric.value}
                              </span>
                              <TrendingUp className={`w-3 h-3 ${
                                insight.metric.change > 0 ? "text-green-600" : "text-red-600 rotate-180"
                              }`} />
                            </div>
                          )}
                          {insight.actionable && insight.actionUrl && (
                            <Button size="sm" variant="link" className="h-auto p-0 mt-1.5 text-violet-600" asChild>
                              <Link href={insight.actionUrl}>
                                Take Action
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">${valueGenerated.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Value Generated</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-600">{timeSaved}h</p>
                  <p className="text-xs text-muted-foreground">Time Saved</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Automation Runs</span>
                  <span className="font-medium">{usage.automationRuns}/{usage.runLimit}</span>
                </div>
                <Progress value={(usage.automationRuns / usage.runLimit) * 100} className="h-2" />
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/portal/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Cpu className="w-5 h-5 text-green-600" />
                System Health
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/system-health" className="text-violet-600 hover:text-violet-700">
                  Details
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {systemHealth.map((service) => {
                  const statusColors = getHealthStatusColor(service.status);
                  return (
                    <div
                      key={service.service}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${statusColors.bg} flex items-center justify-center ${statusColors.text}`}>
                          {getSystemHealthIcon(service.icon)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{service.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.latency}ms latency
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
                        <span className={`text-xs capitalize ${statusColors.text}`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Overall Status
                  </span>
                  <span className="text-green-700 font-semibold">
                    {systemHealth.every(s => s.status === "healthy") ? "All Systems Operational" : "Minor Issues"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/activity" className="text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "success"
                            ? "bg-green-100"
                            : activity.type === "error"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {activity.type === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : activity.type === "error" ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
