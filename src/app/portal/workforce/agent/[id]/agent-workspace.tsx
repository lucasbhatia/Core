"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Send,
  FileText,
  Clock,
  Star,
  CheckCircle,
  Loader2,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  Zap,
  Settings,
  MessageSquare,
  ListTodo,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Plus,
  ChevronRight,
  Play,
  Calendar,
  PenLine,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import {
  AGENT_ROSTER,
  type HiredAgent,
  type AgentTask,
  type AgentDeliverable,
  type WorkforceMessage,
  type TaskOptions,
} from "@/lib/ai-workforce";

interface AgentWorkspaceProps {
  agentId: string;
  clientId: string;
}

// Mock data for demo
const mockAgent: HiredAgent = {
  id: "hired-1",
  client_id: "demo",
  roster_id: "content-writer-sarah",
  roster_agent: AGENT_ROSTER.find((a) => a.id === "content-writer-sarah")!,
  status: "active",
  hired_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  tasks_completed: 12,
  deliverables_created: 15,
  total_tokens_used: 45000,
  avg_task_rating: 4.8,
  notification_enabled: true,
  auto_save_deliverables: true,
};

const mockDeliverables: AgentDeliverable[] = [
  {
    id: "del-1",
    task_id: "task-1",
    hired_agent_id: "hired-1",
    client_id: "demo",
    title: "10 Tips for Productive Remote Work",
    type: "blog_post",
    content: `# 10 Tips for Productive Remote Work

Working from home can be challenging, but with the right strategies, you can be just as productive (if not more) than in an office. Here are 10 proven tips to boost your remote work productivity.

## 1. Create a Dedicated Workspace

Having a specific area for work helps your brain switch into "work mode." This doesn't have to be a home office – even a specific corner of your living room can work.

## 2. Stick to a Routine

Wake up at the same time, get dressed, and start work at consistent hours. This creates structure and helps maintain work-life boundaries.

## 3. Use the Right Tools

Invest in good communication and project management tools. Slack, Zoom, Asana, and Notion can help you stay connected and organized.

## 4. Take Regular Breaks

The Pomodoro Technique (25 minutes work, 5 minutes break) can help maintain focus and prevent burnout.

## 5. Communicate Proactively

Since you're not physically present, over-communicate your progress, blockers, and availability to your team.

## 6. Set Boundaries

Let family members know your work hours. Use a "do not disturb" sign when you need to focus.

## 7. Prioritize Your Tasks

Start each day by identifying your top 3 priorities. Focus on these before getting pulled into emails and meetings.

## 8. Stay Connected Socially

Schedule virtual coffee chats with colleagues. Combat isolation by staying connected with your team.

## 9. Optimize Your Environment

Good lighting, comfortable seating, and a clean desk can significantly impact your productivity and well-being.

## 10. Know When to Stop

It's easy to overwork when your home is your office. Set a hard stop time and stick to it.

---

*Ready to transform your remote work experience? Start implementing these tips today and watch your productivity soar!*`,
    word_count: 280,
    character_count: 1650,
    reading_time_minutes: 2,
    seo_data: {
      title: "10 Tips for Productive Remote Work | Your Complete Guide",
      meta_description: "Discover 10 proven tips to boost your remote work productivity. From creating a dedicated workspace to setting boundaries, learn how to thrive while working from home.",
      keywords: ["remote work", "productivity tips", "work from home", "remote productivity"],
      slug: "10-tips-productive-remote-work",
    },
    status: "ready",
    rating: 5,
    feedback: null,
    version: 1,
    previous_version_id: null,
    tokens_used: 850,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    approved_at: null,
    published_at: null,
  },
  {
    id: "del-2",
    task_id: "task-2",
    hired_agent_id: "hired-1",
    client_id: "demo",
    title: "The Complete Guide to Team Building in 2024",
    type: "blog_post",
    content: "# The Complete Guide to Team Building in 2024\n\nTeam building is evolving...",
    word_count: 2500,
    character_count: 15000,
    reading_time_minutes: 10,
    status: "approved",
    rating: 4,
    feedback: "Great content, minor edits needed",
    version: 1,
    previous_version_id: null,
    tokens_used: 3200,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    approved_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    published_at: null,
  },
];

const mockMessages: WorkforceMessage[] = [
  {
    id: "msg-1",
    conversation_id: "conv-1",
    role: "assistant",
    content: "Hi! I'm Sarah, your content writer. I'm here to help you create engaging blog posts, articles, and long-form content. What would you like me to work on today?",
    tokens_used: 45,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    conversation_id: "conv-1",
    role: "user",
    content: "I need a blog post about remote work productivity tips",
    tokens_used: 12,
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    conversation_id: "conv-1",
    role: "assistant",
    content: "Great topic! I'd love to help with that. Before I start, let me ask a few questions:\n\n1. **Target audience**: Who are you writing this for? (e.g., new remote workers, managers, freelancers)\n2. **Length**: How long should the post be? (e.g., 500 words, 1000 words, 2000+ words)\n3. **Tone**: Should it be professional, casual, or conversational?\n4. **Key points**: Are there any specific tips or angles you'd like me to cover?\n\nOnce I understand your needs, I'll create a fantastic piece for you!",
    tokens_used: 120,
    created_at: new Date(Date.now() - 54 * 60 * 1000).toISOString(),
  },
];

export default function AgentWorkspace({ agentId, clientId }: AgentWorkspaceProps) {
  const { toast } = useToast();
  const [agent] = useState<HiredAgent>(mockAgent);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<WorkforceMessage[]>(mockMessages);
  const [deliverables, setDeliverables] = useState<AgentDeliverable[]>(mockDeliverables);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<AgentDeliverable | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskTone, setTaskTone] = useState<TaskOptions["tone"]>("professional");
  const [taskLength, setTaskLength] = useState<TaskOptions["length"]>("medium");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  async function handleSendMessage() {
    if (!inputMessage.trim()) return;

    const userMessage: WorkforceMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: "conv-1",
      role: "user",
      content: inputMessage,
      tokens_used: Math.ceil(inputMessage.length / 4),
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I'd be happy to help with that! Let me work on it right away. I'll create something engaging and well-structured for you.",
        "Great idea! I'll get started on this immediately. Would you like me to include any specific keywords for SEO?",
        "Perfect, I understand what you need. I'll have a draft ready for you shortly. Is there a particular angle or perspective you'd like me to take?",
        "Absolutely! This sounds like an interesting piece. Let me draft something up and you can review it in the Deliverables tab once it's ready.",
      ];

      const aiMessage: WorkforceMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: "conv-1",
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        tokens_used: 85,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  }

  // Create task
  async function handleCreateTask() {
    if (!taskTitle.trim()) return;

    setIsLoading(true);
    // Simulate task creation and execution
    setTimeout(() => {
      const newDeliverable: AgentDeliverable = {
        id: `del-${Date.now()}`,
        task_id: `task-${Date.now()}`,
        hired_agent_id: agent.id,
        client_id: clientId,
        title: taskTitle,
        type: "blog_post",
        content: `# ${taskTitle}\n\n[Content would be generated here based on your instructions...]`,
        word_count: 1200,
        character_count: 7200,
        reading_time_minutes: 5,
        status: "ready",
        rating: null,
        feedback: null,
        version: 1,
        previous_version_id: null,
        tokens_used: 1500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approved_at: null,
        published_at: null,
      };

      setDeliverables([newDeliverable, ...deliverables]);
      setShowNewTaskDialog(false);
      setTaskTitle("");
      setTaskDescription("");
      setIsLoading(false);

      toast({
        title: "Task completed!",
        description: "Your new deliverable is ready for review.",
      });

      // Switch to deliverables tab
      setActiveTab("deliverables");
    }, 2000);
  }

  // Copy deliverable content
  function handleCopyContent(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  }

  // Rate deliverable
  function handleRateDeliverable(id: string, rating: number) {
    setDeliverables(
      deliverables.map((d) =>
        d.id === id ? { ...d, rating } : d
      )
    );
    toast({ title: `Rated ${rating} stars` });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal/workforce">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-3xl">
            {agent.roster_agent.personality.avatar}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{agent.roster_agent.name}</h1>
              <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                {agent.status === "active" && (
                  <span className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse" />
                )}
                {agent.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{agent.roster_agent.role}</p>
            <p className="text-sm text-muted-foreground mt-1">
              "{agent.roster_agent.personality.tagline}"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portal/workforce/agent/${agentId}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-indigo-600"
            onClick={() => setShowNewTaskDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.tasks_completed}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.deliverables_created}</p>
                <p className="text-xs text-muted-foreground">Deliverables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agent.avg_task_rating?.toFixed(1) || "-"}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(agent.total_tokens_used / 1000)}k</p>
                <p className="text-xs text-muted-foreground">Tokens Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-2">
            <FileText className="w-4 h-4" />
            Deliverables
            {deliverables.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {deliverables.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="w-4 h-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent.roster_agent.personality.avatar}</span>
                  <div>
                    <CardTitle className="text-base">Chat with {agent.roster_agent.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Ask questions, give instructions, or have a conversation
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {agent.roster_agent.personality.communication_style} style
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === "user" ? "text-violet-200" : "text-gray-400"
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                          <span className="text-sm text-gray-500">
                            {agent.roster_agent.name} is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Message ${agent.roster_agent.name}...`}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowNewTaskDialog(true)}
                  >
                    <ListTodo className="w-3 h-3 mr-1" />
                    Create structured task
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliverables Tab */}
        <TabsContent value="deliverables" className="mt-0">
          <div className="space-y-4">
            {deliverables.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No deliverables yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Assign a task to {agent.roster_agent.name} to create your first deliverable.
                  </p>
                  <Button onClick={() => setShowNewTaskDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              deliverables.map((deliverable) => (
                <Card key={deliverable.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{deliverable.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {deliverable.type.replace("_", " ")}
                            </Badge>
                            <span className="text-xs">
                              {deliverable.word_count} words • {deliverable.reading_time_minutes} min read
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            deliverable.status === "approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : deliverable.status === "ready"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {deliverable.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedDeliverable(deliverable)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Full Content
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyContent(deliverable.content)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Content
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground line-clamp-3">
                      {deliverable.content.substring(0, 300)}...
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground mr-2">Rate this:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRateDeliverable(deliverable.id, star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                deliverable.rating && star <= deliverable.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedDeliverable(deliverable)}
                      >
                        View Full Content
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleCopyContent(deliverable.content)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                Agent Automations
              </CardTitle>
              <CardDescription>
                Connect {agent.roster_agent.name}'s outputs to automations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Example automations */}
              <div className="space-y-3">
                <div className="p-4 border rounded-lg hover:border-violet-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Play className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Blog to Social Posts</h4>
                        <p className="text-sm text-muted-foreground">
                          When {agent.roster_agent.name} creates a blog post, send it to your Social Media Manager
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:border-violet-200 transition-colors border-dashed">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Weekly Content Schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          Every Monday: Generate a week's worth of blog post ideas
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/portal/workforce/agent/${agentId}/automations`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Automation
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5 text-violet-600" />
              Assign Task to {agent.roster_agent.name}
            </DialogTitle>
            <DialogDescription>
              Describe what you need and {agent.roster_agent.name} will get to work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task Title</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Write a blog post about..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description & Instructions</label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Provide details about what you need, target audience, key points to cover, etc."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tone</label>
                <Select value={taskTone} onValueChange={(v) => setTaskTone(v as TaskOptions["tone"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Length</label>
                <Select value={taskLength} onValueChange={(v) => setTaskLength(v as TaskOptions["length"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (~500 words)</SelectItem>
                    <SelectItem value="medium">Medium (~1000 words)</SelectItem>
                    <SelectItem value="long">Long (~2000+ words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isLoading || !taskTitle.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Deliverable Dialog */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedDeliverable && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeliverable.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedDeliverable.type.replace("_", " ")}
                  </Badge>
                  <span>{selectedDeliverable.word_count} words</span>
                  <span>•</span>
                  <span>{selectedDeliverable.reading_time_minutes} min read</span>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 max-h-[60vh]">
                <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {selectedDeliverable.content}
                  </pre>
                </div>
              </ScrollArea>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedDeliverable(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopyContent(selectedDeliverable.content)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
