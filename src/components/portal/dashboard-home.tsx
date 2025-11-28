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

  // Fetch today's tasks and events on mount
  useEffect(() => {
    fetchTodayData();
    generateAISuggestions();
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

  const generateAISuggestions = () => {
    setAiSuggestions([
      {
        id: "1",
        title: "Optimize Lead Response Time",
        description: "Create an automation to respond to new leads within 5 minutes",
        action: "Create Automation",
        actionUrl: "/portal/builder?prompt=Create%20an%20automation%20to%20auto-respond%20to%20new%20leads",
        icon: "automation",
      },
      {
        id: "2",
        title: "Schedule Weekly Reports",
        description: "Set up automated weekly performance reports sent every Monday",
        action: "Set Up",
        actionUrl: "/portal/builder?prompt=Create%20weekly%20performance%20report%20automation",
        icon: "task",
      },
      {
        id: "3",
        title: "Connect Your CRM",
        description: "Sync your CRM data to enable more powerful automations",
        action: "Connect",
        actionUrl: "/portal/integrations",
        icon: "optimization",
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50/50 to-indigo-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-xl bg-white border border-violet-100 hover:border-violet-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                        {getSuggestionIcon(suggestion.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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

          {/* Quick Create Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/portal/tasks">
                    <PlusCircle className="w-5 h-5 text-violet-600" />
                    <span className="text-sm">New Task</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/portal/builder">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Automation</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/portal/projects">
                    <FolderKanban className="w-5 h-5 text-amber-600" />
                    <span className="text-sm">Project</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/portal/ai-inbox">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Ask AI</span>
                  </Link>
                </Button>
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
