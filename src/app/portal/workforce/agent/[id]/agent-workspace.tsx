"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
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
  Star,
  CheckCircle,
  Loader2,
  MoreVertical,
  Copy,
  Download,
  Zap,
  Plus,
  User,
  Clock,
  Settings,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  BarChart3,
  Calendar,
  MessageSquare,
  ListTodo,
  Briefcase,
  Award,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import {
  AGENT_ROSTER,
  DEPARTMENT_INFO,
  type HiredAgent,
  type AgentDeliverable,
  type WorkforceMessage,
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

Working from home can be challenging, but with the right strategies, you can be just as productive (if not more) than in an office.

## 1. Create a Dedicated Workspace
Having a specific area for work helps your brain switch into "work mode."

## 2. Stick to a Routine
Wake up at the same time, get dressed, and start work at consistent hours.

## 3. Use the Right Tools
Invest in good communication and project management tools.

## 4. Take Regular Breaks
The Pomodoro Technique can help maintain focus and prevent burnout.

## 5. Communicate Proactively
Over-communicate your progress and availability to your team.`,
    word_count: 280,
    character_count: 1650,
    reading_time_minutes: 2,
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
    title: "Why AI is Transforming Content Marketing",
    type: "blog_post",
    content: `# Why AI is Transforming Content Marketing

The content marketing landscape is evolving rapidly...`,
    word_count: 420,
    character_count: 2100,
    reading_time_minutes: 3,
    status: "ready",
    rating: 4,
    feedback: null,
    version: 1,
    previous_version_id: null,
    tokens_used: 920,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    approved_at: null,
    published_at: null,
  },
];

const mockMessages: WorkforceMessage[] = [
  {
    id: "msg-1",
    conversation_id: "conv-1",
    role: "assistant",
    content: "Hi! I'm Sarah, your content writer. I can help you create blog posts, articles, and long-form content. What would you like me to work on today?",
    tokens_used: 35,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

// Mock work log
const mockWorkLog = [
  { id: 1, action: "Created blog post", target: "10 Tips for Productive Remote Work", time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 2, action: "Created blog post", target: "Why AI is Transforming Content Marketing", time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, action: "Revised content", target: "Q4 Marketing Strategy", time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 4, action: "Created outline", target: "Product Launch Announcement", time: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
];

// Skills data based on agent capabilities
const getSkillsMatrix = (agent: HiredAgent) => {
  return [
    { name: "Writing", level: 95, color: "bg-violet-500" },
    { name: "Research", level: 85, color: "bg-blue-500" },
    { name: "SEO", level: 90, color: "bg-green-500" },
    { name: "Storytelling", level: 88, color: "bg-amber-500" },
    { name: "Analysis", level: 75, color: "bg-pink-500" },
  ];
};

export default function AgentWorkspace({ agentId, clientId }: AgentWorkspaceProps) {
  const { toast } = useToast();
  const [agent, setAgent] = useState<HiredAgent>(mockAgent);
  const [messages, setMessages] = useState<WorkforceMessage[]>(mockMessages);
  const [deliverables, setDeliverables] = useState<AgentDeliverable[]>(mockDeliverables);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedDeliverable, setSelectedDeliverable] = useState<AgentDeliverable | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const skills = getSkillsMatrix(agent);

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
        "I'd be happy to help with that! Let me get started. What specific angle or tone would you prefer?",
        "Great idea! I'll work on this right away. Any particular keywords or points you'd like me to include?",
        "Perfect, I understand. I'll draft something up for you. Check the deliverables when I'm done!",
        "On it! This sounds like an interesting project. Any deadline or length requirements?",
      ];

      const aiMessage: WorkforceMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: "conv-1",
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        tokens_used: 50,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  }

  // Copy content
  function handleCopyContent(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  }

  // Rate deliverable
  function handleRateDeliverable(id: string, rating: number) {
    setDeliverables(
      deliverables.map((d) => (d.id === id ? { ...d, rating } : d))
    );
    toast({ title: `Rated ${rating} stars` });
  }

  // Toggle agent status
  function handleToggleStatus() {
    setAgent({
      ...agent,
      status: agent.status === "active" ? "paused" : "active",
    });
    toast({
      title: agent.status === "active" ? "Agent paused" : "Agent activated",
    });
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Compact Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/portal/workforce">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl shadow-sm">
                {agent.roster_agent.personality.avatar}
              </div>
              {agent.status === "active" && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{agent.roster_agent.name}</h1>
                <Badge variant="secondary" className="text-xs capitalize">
                  {agent.roster_agent.personality.communication_style}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{agent.roster_agent.role}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portal/workforce/agent/${agentId}/automations`}>
              <Zap className="w-4 h-4 mr-2" />
              Automations
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                {agent.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Agent
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Activate Agent
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-2">
                <FileText className="w-4 h-4" />
                Deliverables
                {deliverables.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{deliverables.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <ListTodo className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-0">
              <Card className="h-[500px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm shrink-0">
                            {agent.roster_agent.personality.avatar}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-violet-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.role === "user" ? "text-violet-200" : "text-gray-400"}`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm">
                          {agent.roster_agent.personality.avatar}
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-gray-50/50">
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
                      placeholder={`Ask ${agent.roster_agent.name.split(" ")[0]} to create something...`}
                      disabled={isLoading || agent.status === "paused"}
                      className="flex-1 bg-white"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !inputMessage.trim() || agent.status === "paused"}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Try: "Write a blog post about..." or "Create an outline for..."
                    </p>
                    {agent.status === "paused" && (
                      <Badge variant="secondary" className="text-xs">Agent paused</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Deliverables Tab */}
            <TabsContent value="deliverables" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  {deliverables.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium">No deliverables yet</p>
                      <p className="text-sm text-muted-foreground">
                        Ask {agent.roster_agent.name.split(" ")[0]} to create something!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="p-4 border rounded-lg cursor-pointer hover:border-violet-200 hover:bg-violet-50/50 transition-colors"
                          onClick={() => setSelectedDeliverable(deliverable)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{deliverable.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {deliverable.type.replace("_", " ")}
                                </Badge>
                                <span>{deliverable.word_count} words</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRateDeliverable(deliverable.id, star);
                                  }}
                                  className="p-0.5 hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      deliverable.rating && star <= deliverable.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {deliverable.content.substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {mockWorkLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{log.action}</span>
                            <span className="text-muted-foreground"> - </span>
                            <span className="text-muted-foreground">{log.target}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(log.time), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-violet-50 rounded-lg">
                  <p className="text-2xl font-bold text-violet-600">{agent.tasks_completed}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{agent.deliverables_created}</p>
                  <p className="text-xs text-muted-foreground">Deliverables</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <p className="text-2xl font-bold text-amber-600">{agent.avg_task_rating?.toFixed(1) || "-"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">7</p>
                  <p className="text-xs text-muted-foreground">Days Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Matrix */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Skills
              </h3>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Capabilities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {agent.roster_agent.capabilities.slice(0, 6).map((cap, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    {cap}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                About
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {agent.roster_agent.description}
              </p>
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <Badge variant="outline" className="capitalize">
                    {DEPARTMENT_INFO[agent.roster_agent.department].icon} {agent.roster_agent.department}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hired</span>
                  <span>{format(new Date(agent.hired_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={agent.status === "active" ? "default" : "secondary"} className="capitalize">
                    {agent.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Single Deliverable */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedDeliverable && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeliverable.title}</DialogTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedDeliverable.type.replace("_", " ")}</Badge>
                  <span>{selectedDeliverable.word_count} words</span>
                  <span>{selectedDeliverable.reading_time_minutes} min read</span>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6">
                  <div className="whitespace-pre-wrap font-sans">{selectedDeliverable.content}</div>
                </div>
              </ScrollArea>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedDeliverable(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => handleCopyContent(selectedDeliverable.content)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{agent.roster_agent.personality.avatar}</span>
              Agent Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Custom Instructions</label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add specific instructions for this agent..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These will be added to every task.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Get notified when tasks complete</p>
              </div>
              <Switch defaultChecked={agent.notification_enabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-save Deliverables</p>
                <p className="text-xs text-muted-foreground">Automatically save all outputs</p>
              </div>
              <Switch defaultChecked={agent.auto_save_deliverables} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowSettingsDialog(false);
              toast({ title: "Settings saved" });
            }} className="bg-violet-600 hover:bg-violet-700">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
