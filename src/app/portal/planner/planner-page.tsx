"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Loader2,
  Trash2,
  FolderKanban,
  Link as LinkIcon,
  Check,
  User,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UniversalAIActionsBar, EntityContext } from "@/components/universal-ai-actions";

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  project_id?: string;
  assignee_id?: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface CalendarConnection {
  id: string;
  provider: "google" | "outlook" | "apple";
  email: string;
  connected: boolean;
}

interface PlannerPageProps {
  clientId: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PROJECT_COLORS = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", light: "bg-green-100", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700" },
];

// Demo data
const DEMO_TEAM: TeamMember[] = [
  { id: "1", name: "You", email: "you@company.com" },
  { id: "2", name: "John Doe", email: "john@company.com" },
  { id: "3", name: "Jane Smith", email: "jane@company.com" },
];

const DEMO_PROJECTS: Project[] = [
  { id: "1", name: "Marketing", color: "blue", created_at: new Date().toISOString() },
  { id: "2", name: "Sales", color: "green", created_at: new Date().toISOString() },
];

const getDemoTasks = (): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 5);

  return [
    { id: "1", title: "Review Q4 results", completed: false, due_date: today.toISOString().split("T")[0], project_id: "1", assignee_id: "1", created_at: new Date().toISOString() },
    { id: "2", title: "Update sales deck", completed: false, due_date: tomorrow.toISOString().split("T")[0], project_id: "2", assignee_id: "2", created_at: new Date().toISOString() },
    { id: "3", title: "Send weekly report", completed: true, due_date: today.toISOString().split("T")[0], assignee_id: "1", created_at: new Date().toISOString() },
    { id: "4", title: "Team sync meeting", completed: false, due_date: nextWeek.toISOString().split("T")[0], created_at: new Date().toISOString() },
  ];
};

export default function PlannerPage({ clientId }: PlannerPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [team] = useState<TeamMember[]>(DEMO_TEAM);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [connectCalendarOpen, setConnectCalendarOpen] = useState(false);

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    due_date: "",
    project_id: "",
    assignee_id: "",
  });

  // New project form
  const [newProject, setNewProject] = useState({
    name: "",
    color: "blue",
  });

  // Calendar connections
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([]);

  useEffect(() => {
    // Load data
    setTimeout(() => {
      setTasks(getDemoTasks());
      setLoading(false);
    }, 500);
  }, []);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return tasks.filter(task => task.due_date === dateKey);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const isSelected = (date: Date) => {
    return selectedDate === formatDateKey(date);
  };

  // Task handlers
  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      completed: false,
      due_date: newTask.due_date || undefined,
      project_id: newTask.project_id || undefined,
      assignee_id: newTask.assignee_id || undefined,
      created_at: new Date().toISOString(),
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: "", due_date: "", project_id: "", assignee_id: "" });
    setAddTaskOpen(false);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Project handlers
  const handleAddProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      color: newProject.color,
      created_at: new Date().toISOString(),
    };

    setProjects([...projects, project]);
    setNewProject({ name: "", color: "blue" });
    setAddProjectOpen(false);
  };

  // Calendar connection handlers
  const handleConnectCalendar = (provider: "google" | "outlook" | "apple") => {
    // In production, this would initiate OAuth flow
    const connection: CalendarConnection = {
      id: `conn-${Date.now()}`,
      provider,
      email: provider === "google" ? "you@gmail.com" : provider === "outlook" ? "you@outlook.com" : "you@icloud.com",
      connected: true,
    };
    setCalendarConnections([...calendarConnections, connection]);
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return PROJECT_COLORS.find(c => c.value === project?.color) || PROJECT_COLORS[0];
  };

  const getAssignee = (assigneeId: string) => {
    return team.find(m => m.id === assigneeId);
  };

  // Filter tasks
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel - Tasks & Projects */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
        {/* Quick Add */}
        <Card>
          <CardContent className="p-3">
            <Button
              className="w-full justify-start gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              onClick={() => setAddTaskOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {incompleteTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            {incompleteTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks yet
              </p>
            ) : (
              <div className="space-y-1">
                {incompleteTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    project={task.project_id ? projects.find(p => p.id === task.project_id) : undefined}
                    assignee={task.assignee_id ? getAssignee(task.assignee_id) : undefined}
                    onToggle={() => handleToggleTask(task.id)}
                    onDelete={() => handleDeleteTask(task.id)}
                    clientId={clientId}
                  />
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2 px-2">
                  Completed ({completedTasks.length})
                </p>
                <div className="space-y-1">
                  {completedTasks.slice(0, 3).map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      project={task.project_id ? projects.find(p => p.id === task.project_id) : undefined}
                      assignee={task.assignee_id ? getAssignee(task.assignee_id) : undefined}
                      onToggle={() => handleToggleTask(task.id)}
                      onDelete={() => handleDeleteTask(task.id)}
                      clientId={clientId}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="flex-shrink-0">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setAddProjectOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {projects.map(project => {
                const color = PROJECT_COLORS.find(c => c.value === project.color) || PROJECT_COLORS[0];
                const taskCount = tasks.filter(t => t.project_id === project.id && !t.completed).length;
                return (
                  <div
                    key={project.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className={cn("w-3 h-3 rounded-full", color.bg)} />
                    <span className="text-sm flex-1 truncate">{project.name}</span>
                    {taskCount > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {taskCount}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Calendar */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(formatDateKey(new Date()));
                }}
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setConnectCalendarOpen(true)}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[80px]" />;
              }

              const dayTasks = getTasksForDate(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(formatDateKey(date))}
                  className={cn(
                    "min-h-[80px] p-1 text-left rounded-lg transition-colors border",
                    isToday(date) && "border-violet-300 bg-violet-50/50",
                    isSelected(date) && "border-violet-500 bg-violet-50",
                    !isToday(date) && !isSelected(date) && "border-transparent hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(date) && "text-violet-600"
                  )}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 2).map(task => {
                      const projectColor = task.project_id ? getProjectColor(task.project_id) : null;
                      const bgClass = projectColor && "light" in projectColor ? projectColor.light : "bg-gray-100";
                      const textClass = projectColor ? projectColor.text : "text-gray-700";
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate",
                            task.completed ? "bg-gray-100 text-gray-400 line-through" : cn(bgClass, textClass)
                          )}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Connected Calendars */}
          {calendarConnections.length > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Connected:</span>
              {calendarConnections.map(conn => (
                <Badge key={conn.id} variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  {conn.provider}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a new task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">What needs to be done?</Label>
              <Input
                id="title"
                placeholder="Task name"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={newTask.assignee_id}
                  onValueChange={(v) => setNewTask({ ...newTask, assignee_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {team.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={newTask.project_id}
                onValueChange={(v) => setNewTask({ ...newTask, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          PROJECT_COLORS.find(c => c.value === project.color)?.bg
                        )} />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Group your tasks into projects</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Marketing, Website Redesign"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewProject({ ...newProject, color: color.value })}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color.bg,
                      newProject.color === color.value && "ring-2 ring-offset-2 ring-gray-400"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProject} disabled={!newProject.name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Calendar Dialog */}
      <Dialog open={connectCalendarOpen} onOpenChange={setConnectCalendarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Calendar</DialogTitle>
            <DialogDescription>Sync your existing calendar to see all events</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {[
              { id: "google", name: "Google Calendar", icon: "G", color: "bg-red-500" },
              { id: "outlook", name: "Outlook", icon: "O", color: "bg-blue-600" },
              { id: "apple", name: "Apple Calendar", icon: "A", color: "bg-gray-800" },
            ].map(provider => {
              const isConnected = calendarConnections.some(c => c.provider === provider.id);
              return (
                <button
                  key={provider.id}
                  onClick={() => !isConnected && handleConnectCalendar(provider.id as "google" | "outlook" | "apple")}
                  disabled={isConnected}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isConnected ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm", provider.color)}>
                    {provider.icon}
                  </div>
                  <span className="flex-1 text-left font-medium">{provider.name}</span>
                  {isConnected ? (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Connect</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  project,
  assignee,
  onToggle,
  onDelete,
  clientId,
}: {
  task: Task;
  project?: Project;
  assignee?: TeamMember;
  onToggle: () => void;
  onDelete: () => void;
  clientId: string;
}) {
  const color = project
    ? PROJECT_COLORS.find(c => c.value === project.color)
    : null;

  // Create entity context for AI actions
  const taskEntity: EntityContext = {
    type: "task",
    id: task.id,
    title: task.title,
    description: task.title,
    project_id: task.project_id,
    project_name: project?.name,
    assignee_id: task.assignee_id,
    assignee_name: assignee?.name,
    due_date: task.due_date,
    status: task.completed ? "completed" : "pending",
  };

  return (
    <div className={cn(
      "group flex flex-col gap-1 px-2 py-2 rounded-md hover:bg-gray-50",
      task.completed && "opacity-60"
    )}>
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-tight",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {project && color && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded", color.light, color.text)}>
                {project.name}
              </span>
            )}
            {task.due_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {assignee && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {assignee.name}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Universal AI Actions Bar */}
      <div className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <UniversalAIActionsBar
          entity={taskEntity}
          clientId={clientId}
          variant="compact"
          showLabels={false}
        />
      </div>
    </div>
  );
}
