"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FolderKanban,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  Bot,
  Zap,
  BarChart3,
  Edit,
  Trash2,
  Archive,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on_hold" | "archived";
  priority: "high" | "medium" | "low";
  progress: number;
  tasks_total: number;
  tasks_completed: number;
  automations_count: number;
  due_date?: string;
  color: string;
  created_at: string;
}

interface ProjectsPageProps {
  clientId: string;
}

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700", dotColor: "bg-amber-500" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-700", dotColor: "bg-gray-500" },
};

const projectColors = [
  { name: "Violet", value: "violet", bg: "bg-violet-500", light: "bg-violet-100" },
  { name: "Blue", value: "blue", bg: "bg-blue-500", light: "bg-blue-100" },
  { name: "Green", value: "green", bg: "bg-green-500", light: "bg-green-100" },
  { name: "Amber", value: "amber", bg: "bg-amber-500", light: "bg-amber-100" },
  { name: "Rose", value: "rose", bg: "bg-rose-500", light: "bg-rose-100" },
  { name: "Teal", value: "teal", bg: "bg-teal-500", light: "bg-teal-100" },
];

export default function ProjectsPage({ clientId }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    priority: "high" | "medium" | "low";
    color: string;
    due_date: string;
  }>({
    name: "",
    description: "",
    priority: "medium",
    color: "violet",
    due_date: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/portal/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        setProjects(getDemoProjects());
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects(getDemoProjects());
    } finally {
      setLoading(false);
    }
  };

  const getDemoProjects = (): Project[] => [
    {
      id: "1",
      name: "Marketing Automation Suite",
      description: "Complete overhaul of marketing automation workflows including email campaigns, lead scoring, and analytics",
      status: "active",
      priority: "high",
      progress: 65,
      tasks_total: 12,
      tasks_completed: 8,
      automations_count: 5,
      due_date: new Date(Date.now() + 1209600000).toISOString(),
      color: "violet",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Sales Pipeline Optimization",
      description: "AI-powered lead qualification and pipeline management",
      status: "active",
      priority: "high",
      progress: 40,
      tasks_total: 8,
      tasks_completed: 3,
      automations_count: 3,
      due_date: new Date(Date.now() + 2419200000).toISOString(),
      color: "blue",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Customer Onboarding Flow",
      description: "Streamlined onboarding process with automated touchpoints",
      status: "completed",
      priority: "medium",
      progress: 100,
      tasks_total: 6,
      tasks_completed: 6,
      automations_count: 4,
      color: "green",
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Weekly Report Automation",
      description: "Automated weekly performance reports sent to stakeholders",
      status: "active",
      priority: "low",
      progress: 85,
      tasks_total: 4,
      tasks_completed: 3,
      automations_count: 2,
      color: "amber",
      created_at: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Data Integration Hub",
      description: "Central data pipeline connecting all business tools",
      status: "on_hold",
      priority: "medium",
      progress: 20,
      tasks_total: 10,
      tasks_completed: 2,
      automations_count: 1,
      color: "teal",
      created_at: new Date().toISOString(),
    },
  ];

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: "active",
      priority: newProject.priority,
      progress: 0,
      tasks_total: 0,
      tasks_completed: 0,
      automations_count: 0,
      due_date: newProject.due_date || undefined,
      color: newProject.color,
      created_at: new Date().toISOString(),
    };

    setProjects([project, ...projects]);
    setNewProject({ name: "", description: "", priority: "medium", color: "violet", due_date: "" });
    setNewProjectOpen(false);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    automations: projects.reduce((sum, p) => sum + p.automations_count, 0),
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
                <p className="text-sm text-violet-600 font-medium">Total Projects</p>
                <p className="text-2xl font-bold text-violet-900">{stats.total}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Automations</p>
                <p className="text-2xl font-bold text-amber-900">{stats.automations}</p>
              </div>
              <Zap className="h-8 w-8 text-amber-400" />
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
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Organize your work with AI-powered project management.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="e.g., Marketing Automation Suite"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description (optional)</Label>
                  <Textarea
                    id="project-description"
                    placeholder="What's this project about?"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newProject.priority}
                      onValueChange={(v: "high" | "medium" | "low") =>
                        setNewProject({ ...newProject, priority: v })
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
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newProject.due_date}
                      onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {projectColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewProject({ ...newProject, color: color.value })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          color.bg,
                          newProject.color === color.value && "ring-2 ring-offset-2 ring-gray-400"
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewProjectOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProject.name.trim()}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create your first project to organize tasks, automations, and workflows in one place.
            </p>
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map(project => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const colorClass = projectColors.find(c => c.value === project.color)?.bg || "bg-violet-500";
  const lightColorClass = projectColors.find(c => c.value === project.color)?.light || "bg-violet-100";

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", colorClass)}>
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{project.name}</CardTitle>
              <Badge variant="secondary" className={statusConfig[project.status].color}>
                <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusConfig[project.status].dotColor)} />
                {statusConfig[project.status].label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              {project.tasks_completed}/{project.tasks_total}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="h-4 w-4" />
              {project.automations_count}
            </span>
          </div>
          {project.due_date && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        <Button variant="ghost" className="w-full justify-between group-hover:bg-gray-50">
          View Project
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectListItem({ project }: { project: Project }) {
  const colorClass = projectColors.find(c => c.value === project.color)?.bg || "bg-violet-500";

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0", colorClass)}>
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-medium truncate">{project.name}</h3>
              <Badge variant="secondary" className={cn("flex-shrink-0", statusConfig[project.status].color)}>
                {statusConfig[project.status].label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground truncate">{project.description}</p>
            )}
          </div>
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm font-medium">{project.progress}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{project.tasks_completed}/{project.tasks_total}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{project.automations_count}</p>
              <p className="text-xs text-muted-foreground">Automations</p>
            </div>
            {project.due_date && (
              <div className="text-center">
                <p className="text-sm font-medium">
                  {new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">Due</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
