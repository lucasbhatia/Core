"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Sparkles,
  Clock,
  Calendar,
  Flag,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Inbox,
  CalendarDays,
  Star,
  FolderOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "completed";
  due_date?: string;
  project?: string;
  created_at: string;
  ai_generated?: boolean;
}

interface TasksPageProps {
  clientId: string;
}

const priorityConfig = {
  high: { label: "High", color: "text-red-600 bg-red-50", icon: ArrowUp },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-50", icon: ArrowRight },
  low: { label: "Low", color: "text-blue-600 bg-blue-50", icon: ArrowDown },
};

const statusConfig = {
  todo: { label: "To Do", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-violet-100 text-violet-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
};

export default function TasksPage({ clientId }: TasksPageProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    due_date: string;
    project: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    project: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/portal/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        // If no tasks API yet, use demo data
        setTasks(getDemoTasks());
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks(getDemoTasks());
    } finally {
      setLoading(false);
    }
  };

  const getDemoTasks = (): Task[] => [
    {
      id: "1",
      title: "Review Q4 marketing automation results",
      description: "Analyze the performance metrics from last quarter's campaigns",
      priority: "high",
      status: "todo",
      due_date: new Date(Date.now() + 86400000).toISOString(),
      project: "Marketing",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Set up lead scoring automation",
      description: "Configure AI-powered lead scoring based on engagement data",
      priority: "high",
      status: "in_progress",
      due_date: new Date(Date.now() + 172800000).toISOString(),
      project: "Sales",
      created_at: new Date().toISOString(),
      ai_generated: true,
    },
    {
      id: "3",
      title: "Update customer onboarding workflow",
      priority: "medium",
      status: "todo",
      due_date: new Date(Date.now() + 604800000).toISOString(),
      project: "Customer Success",
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Create weekly report template",
      priority: "low",
      status: "completed",
      project: "Operations",
      created_at: new Date().toISOString(),
    },
    {
      id: "5",
      title: "Integrate CRM with email automation",
      description: "Connect Salesforce data to email triggers",
      priority: "medium",
      status: "todo",
      due_date: new Date(Date.now() + 432000000).toISOString(),
      project: "Sales",
      created_at: new Date().toISOString(),
      ai_generated: true,
    },
  ];

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      ...newTask,
      status: "todo",
      created_at: new Date().toISOString(),
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: "", description: "", priority: "medium", due_date: "", project: "" });
    setNewTaskOpen(false);

    // Save to API
    try {
      await fetch("/api/portal/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === "completed" ? "todo" : "completed";
        return { ...task, status: newStatus };
      }
      return task;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAiSuggestions = async () => {
    setAiSuggestionsLoading(true);
    // Simulate AI suggestions
    setTimeout(() => {
      const suggestions: Task[] = [
        {
          id: `ai-${Date.now()}-1`,
          title: "Review automation performance metrics",
          description: "Based on your recent activity, reviewing metrics could help optimize workflows",
          priority: "medium",
          status: "todo",
          due_date: new Date(Date.now() + 259200000).toISOString(),
          created_at: new Date().toISOString(),
          ai_generated: true,
        },
        {
          id: `ai-${Date.now()}-2`,
          title: "Schedule team sync on automation goals",
          priority: "low",
          status: "todo",
          due_date: new Date(Date.now() + 432000000).toISOString(),
          created_at: new Date().toISOString(),
          ai_generated: true,
        },
      ];
      setTasks([...suggestions, ...tasks]);
      setAiSuggestionsLoading(false);
    }, 1500);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const todoTasks = filteredTasks.filter(t => t.status === "todo");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    dueToday: tasks.filter(t => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      const today = new Date();
      return due.toDateString() === today.toDateString();
    }).length,
    highPriority: tasks.filter(t => t.priority === "high" && t.status !== "completed").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-violet-900">{stats.total}</p>
              </div>
              <Inbox className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Due Today</p>
                <p className="text-2xl font-bold text-amber-900">{stats.dueToday}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">High Priority</p>
                <p className="text-2xl font-bold text-red-900">{stats.highPriority}</p>
              </div>
              <Flag className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAiSuggestions}
            disabled={aiSuggestionsLoading}
          >
            {aiSuggestionsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI Suggest
          </Button>
          <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your list. AI will help prioritize it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="What needs to be done?"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add more details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v: "high" | "medium" | "low") =>
                        setNewTask({ ...newTask, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project (optional)</Label>
                  <Input
                    id="project"
                    placeholder="e.g., Marketing, Sales"
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Create your first task or let AI suggest tasks based on your automations
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAiSuggestions}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions
                </Button>
                <Button onClick={() => setNewTaskOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* High Priority Section */}
            {todoTasks.filter(t => t.priority === "high").length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  High Priority
                </h3>
                {todoTasks.filter(t => t.priority === "high").map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}

            {/* In Progress Section */}
            {inProgressTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-violet-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  In Progress
                </h3>
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}

            {/* To Do Section */}
            {todoTasks.filter(t => t.priority !== "high").length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  To Do
                </h3>
                {todoTasks.filter(t => t.priority !== "high").map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed ({completedTasks.length})
                </h3>
                {completedTasks.slice(0, 3).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                  />
                ))}
                {completedTasks.length > 3 && (
                  <p className="text-sm text-muted-foreground pl-6">
                    +{completedTasks.length - 3} more completed tasks
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const PriorityIcon = priorityConfig[task.priority].icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      task.status === "completed" && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => onToggle(task.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                  {task.ai_generated && (
                    <Sparkles className="inline h-3 w-3 ml-2 text-violet-500" />
                  )}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className={priorityConfig[task.priority].color}>
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {priorityConfig[task.priority].label}
                  </Badge>
                  {task.project && (
                    <Badge variant="secondary">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {task.project}
                    </Badge>
                  )}
                  {task.due_date && (
                    <Badge
                      variant="outline"
                      className={cn(
                        isOverdue && "text-red-600 border-red-200 bg-red-50"
                      )}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(task.due_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
