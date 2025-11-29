"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  Zap,
  FileText,
  FolderKanban,
  CheckSquare,
  Bot,
  ArrowRight,
  Clock,
  User,
  Trash2,
  Plus,
  Lightbulb,
  Workflow,
  Database,
  Mail,
  RefreshCw,
  BarChart,
  Copy,
  Check,
  History,
  MoreHorizontal,
  Pencil,
  Search,
  X,
  Wand2,
  Brain,
  Target,
  Settings,
  Calendar,
  FileSearch,
  ArrowUpRight,
  ChevronRight,
  Star,
  MessageCircle,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { UniversalAIActionsBar, EntityContext } from "@/components/universal-ai-actions";

interface AIInboxPageProps {
  clientId: string;
  clientName: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "automation_proposal" | "workflow_sequence" | "project_plan" | "suggestion";
  metadata?: {
    title?: string;
    steps?: Array<{ id: number; name: string; description: string }>;
    automationId?: string;
    projectId?: string;
  };
}

interface ConversationHistory {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
  pinned?: boolean;
  tags?: string[];
}

// Quick prompt categories with enhanced styling
const QUICK_PROMPT_CATEGORIES = [
  {
    id: "automation",
    label: "Automations",
    icon: Zap,
    color: "violet",
    bgColor: "bg-violet-50",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200",
    hoverColor: "hover:bg-violet-100",
  },
  {
    id: "data",
    label: "Data & Analytics",
    icon: Database,
    color: "blue",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    hoverColor: "hover:bg-blue-100",
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    color: "green",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    borderColor: "border-green-200",
    hoverColor: "hover:bg-green-100",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Target,
    color: "amber",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    hoverColor: "hover:bg-amber-100",
  },
];

const QUICK_PROMPTS = [
  {
    id: "order-automation",
    label: "New Order Automation",
    prompt: "Create an automation that triggers when a new order is placed, sends a confirmation email to the customer, updates the inventory, and notifies the shipping team.",
    icon: Zap,
    category: "automation",
    description: "Automate your order processing workflow",
  },
  {
    id: "lead-nurture",
    label: "Lead Nurture Sequence",
    prompt: "Design a lead nurturing email sequence that automatically follows up with new leads over 14 days with personalized content based on their interests.",
    icon: Mail,
    category: "marketing",
    description: "Convert leads with automated follow-ups",
  },
  {
    id: "file-summary",
    label: "Summarize Files",
    prompt: "I need help summarizing and organizing the files in my project. Can you help me create a system for this?",
    icon: FileText,
    category: "content",
    description: "Organize and summarize your documents",
  },
  {
    id: "crm-cleanup",
    label: "Clean CRM Data",
    prompt: "Help me create an automation to clean up my CRM data - remove duplicates, standardize formats, and flag incomplete records.",
    icon: Database,
    category: "data",
    description: "Keep your CRM data clean and organized",
  },
  {
    id: "weekly-reports",
    label: "Weekly Reports",
    prompt: "Create an automated weekly report that summarizes sales performance, customer activity, and key metrics, delivered every Monday morning.",
    icon: BarChart,
    category: "data",
    description: "Automated performance reports",
  },
  {
    id: "social-scheduler",
    label: "Social Media Scheduler",
    prompt: "Set up an automation to schedule and publish social media posts across multiple platforms with optimal timing.",
    icon: Calendar,
    category: "marketing",
    description: "Schedule posts automatically",
  },
  {
    id: "project-workflow",
    label: "Project Workflow",
    prompt: "Create a project workflow that automatically assigns tasks, sends reminders, and tracks progress across team members.",
    icon: FolderKanban,
    category: "automation",
    description: "Streamline project management",
  },
  {
    id: "content-pipeline",
    label: "Content Pipeline",
    prompt: "Build a content pipeline automation that manages ideation, creation, review, and publishing stages with notifications at each step.",
    icon: Workflow,
    category: "content",
    description: "Manage content creation end-to-end",
  },
];

const EXAMPLE_REQUESTS = [
  {
    id: "1",
    title: "Create a customer onboarding flow",
    description: "Multi-step automation with welcome emails and tutorials",
    category: "Automation",
    icon: Wand2,
  },
  {
    id: "2",
    title: "Analyze sales data and create report",
    description: "Weekly summary with charts and insights",
    category: "Analytics",
    icon: BarChart,
  },
  {
    id: "3",
    title: "Build a task management workflow",
    description: "Automated assignments and deadline reminders",
    category: "Workflow",
    icon: CheckSquare,
  },
  {
    id: "4",
    title: "Set up email campaign triggers",
    description: "Behavior-based email sequences",
    category: "Marketing",
    icon: Mail,
  },
];

export default function AIInboxPage({ clientId, clientName }: AIInboxPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = getTimeBasedGreeting();
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `${greeting}, ${clientName.split(" ")[0]}! I'm your AI assistant, ready to help you work smarter.\n\nI can help you with:\n\n• **Create automations** — Design workflows that run automatically\n• **Build projects** — Plan and organize complex initiatives\n• **Analyze data** — Get insights from your information\n• **Generate content** — Create reports, emails, and documents\n\nTell me what you'd like to accomplish, and I'll help make it happen.`,
          timestamp: new Date(),
          type: "text",
        },
      ]);
    }
  }, [clientName, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`ai-inbox-history-${clientId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversationHistory(
          parsed.map((c: ConversationHistory) => ({
            ...c,
            timestamp: new Date(c.timestamp),
            messages: c.messages.map((m: Message) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }))
        );
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
  }, [clientId]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const saveConversation = useCallback((msgs: Message[], conversationId?: string) => {
    if (msgs.length <= 1) return;

    const userMessages = msgs.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;

    const title = userMessages[0].content.slice(0, 50) + (userMessages[0].content.length > 50 ? "..." : "");
    const preview = msgs[msgs.length - 1].content.slice(0, 100);
    const id = conversationId || currentConversationId || `conv-${Date.now()}`;

    const existingConv = conversationHistory.find((c) => c.id === id);

    const newHistory: ConversationHistory = {
      id,
      title: existingConv?.title || title,
      preview,
      timestamp: new Date(),
      messages: msgs,
      pinned: existingConv?.pinned || false,
      tags: existingConv?.tags || [],
    };

    const updated = [newHistory, ...conversationHistory.filter((c) => c.id !== newHistory.id)].slice(0, 50);
    setConversationHistory(updated);
    setCurrentConversationId(id);

    localStorage.setItem(`ai-inbox-history-${clientId}`, JSON.stringify(updated));
  }, [clientId, conversationHistory, currentConversationId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      type: "text",
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Auto-resize textarea back to minimum
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Call AI to process the request
      const response = await fetch("/api/portal/ai-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      let aiResponse: Message;

      if (response.ok) {
        const data = await response.json();
        aiResponse = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          type: data.type || "text",
          metadata: data.metadata,
        };
      } else {
        // Fallback to simulated response
        aiResponse = generateSimulatedResponse(userMessage.content);
      }

      const finalMessages = [...newMessages, aiResponse];
      setMessages(finalMessages);
      saveConversation(finalMessages);
    } catch (error) {
      console.error("AI request failed:", error);
      // Use simulated response as fallback
      const aiResponse = generateSimulatedResponse(userMessage.content);
      const finalMessages = [...newMessages, aiResponse];
      setMessages(finalMessages);
      saveConversation(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimulatedResponse = (userInput: string): Message => {
    const lowerInput = userInput.toLowerCase();

    // Detect automation requests
    if (
      lowerInput.includes("automation") ||
      lowerInput.includes("automate") ||
      lowerInput.includes("trigger") ||
      lowerInput.includes("when") ||
      lowerInput.includes("workflow")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed your request and designed an automation proposal for you.\n\n**Proposed Automation**\n\nThis automation will streamline your workflow by handling repetitive tasks automatically, saving you time and reducing errors.\n\n**How it works:**`,
        timestamp: new Date(),
        type: "automation_proposal",
        metadata: {
          title: "Custom Automation",
          steps: [
            { id: 1, name: "Trigger Event", description: "Automation starts when your specified condition is met" },
            { id: 2, name: "Data Processing", description: "Extract, validate, and transform relevant information" },
            { id: 3, name: "Execute Actions", description: "Perform the configured actions in sequence" },
            { id: 4, name: "Notify & Log", description: "Send notifications and record the results" },
          ],
        },
      };
    }

    // Detect project requests
    if (
      lowerInput.includes("project") ||
      lowerInput.includes("plan") ||
      lowerInput.includes("organize") ||
      lowerInput.includes("initiative") ||
      lowerInput.includes("campaign")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I've created a comprehensive project plan based on your requirements.\n\n**Project Structure**\n\nThis plan organizes your initiative into clear phases with actionable milestones.`,
        timestamp: new Date(),
        type: "project_plan",
        metadata: {
          title: "Project Plan",
          steps: [
            { id: 1, name: "Discovery & Scoping", description: "Define goals, gather requirements, and set success metrics" },
            { id: 2, name: "Planning & Design", description: "Create timeline, allocate resources, and design solutions" },
            { id: 3, name: "Implementation", description: "Execute tasks with milestone checkpoints" },
            { id: 4, name: "Testing & Review", description: "Validate deliverables and gather feedback" },
            { id: 5, name: "Launch & Monitor", description: "Deploy and track performance metrics" },
          ],
        },
      };
    }

    // Detect data/report requests
    if (
      lowerInput.includes("report") ||
      lowerInput.includes("analyze") ||
      lowerInput.includes("data") ||
      lowerInput.includes("metrics") ||
      lowerInput.includes("summary")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I can help you set up automated reporting and data analysis.\n\n**Proposed Analytics Workflow**\n\nThis system will automatically collect, process, and present your data in actionable insights.`,
        timestamp: new Date(),
        type: "workflow_sequence",
        metadata: {
          title: "Analytics Workflow",
          steps: [
            { id: 1, name: "Data Collection", description: "Gather data from connected sources automatically" },
            { id: 2, name: "Processing", description: "Clean, transform, and aggregate the data" },
            { id: 3, name: "Analysis", description: "Apply calculations and identify patterns" },
            { id: 4, name: "Visualization", description: "Generate charts, graphs, and summaries" },
            { id: 5, name: "Distribution", description: "Send reports to stakeholders on schedule" },
          ],
        },
      };
    }

    // Default helpful response
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: `Thanks for sharing that with me! I'd love to help you with "${userInput.slice(0, 60)}${userInput.length > 60 ? "..." : ""}"\n\nTo create the best solution for you, could you tell me:\n\n1. **What's the main goal** you're trying to achieve?\n2. **What tools or systems** should this connect with?\n3. **Who needs to be involved** or notified?\n4. **How often** should this run?\n\nWith these details, I can design a tailored automation, workflow, or project plan for you.`,
      timestamp: new Date(),
      type: "text",
    };
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const startNewConversation = () => {
    if (messages.length > 1) {
      saveConversation(messages);
    }
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    setShowHistory(false);
  };

  const loadConversation = (conversation: ConversationHistory) => {
    if (messages.length > 1 && currentConversationId !== conversation.id) {
      saveConversation(messages);
    }
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setShowHistory(false);
  };

  const deleteConversation = (conversationId: string) => {
    const updated = conversationHistory.filter((c) => c.id !== conversationId);
    setConversationHistory(updated);
    localStorage.setItem(`ai-inbox-history-${clientId}`, JSON.stringify(updated));

    if (currentConversationId === conversationId) {
      setMessages([]);
      setCurrentConversationId(null);
    }

    toast({ title: "Conversation deleted" });
    setDeleteConfirmId(null);
  };

  const updateConversationTitle = (conversationId: string, newTitle: string) => {
    const updated = conversationHistory.map((c) =>
      c.id === conversationId ? { ...c, title: newTitle } : c
    );
    setConversationHistory(updated);
    localStorage.setItem(`ai-inbox-history-${clientId}`, JSON.stringify(updated));
    setEditingConversation(null);
    toast({ title: "Conversation renamed" });
  };

  const togglePinConversation = (conversationId: string) => {
    const updated = conversationHistory.map((c) =>
      c.id === conversationId ? { ...c, pinned: !c.pinned } : c
    );
    // Sort: pinned first, then by timestamp
    updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setConversationHistory(updated);
    localStorage.setItem(`ai-inbox-history-${clientId}`, JSON.stringify(updated));
  };

  const clearAllConversations = () => {
    setConversationHistory([]);
    localStorage.removeItem(`ai-inbox-history-${clientId}`);
    setMessages([]);
    setCurrentConversationId(null);
    toast({ title: "All conversations cleared" });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const filteredPrompts = selectedCategory
    ? QUICK_PROMPTS.filter((p) => p.category === selectedCategory)
    : QUICK_PROMPTS;

  const filteredHistory = conversationHistory.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedHistory = {
    pinned: filteredHistory.filter((c) => c.pinned),
    today: filteredHistory.filter((c) => !c.pinned && isToday(new Date(c.timestamp))),
    yesterday: filteredHistory.filter((c) => !c.pinned && isYesterday(new Date(c.timestamp))),
    older: filteredHistory.filter(
      (c) => !c.pinned && !isToday(new Date(c.timestamp)) && !isYesterday(new Date(c.timestamp))
    ),
  };

  const renderMessageContent = (message: Message) => {
    const content = (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {message.content.split("\n").map((line, i) => {
          // Handle bold text
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className={line === "" ? "h-2" : "mb-1"}>
              {parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                // Handle bullet points
                if (part.startsWith("• ")) {
                  return (
                    <span key={j} className="flex items-start gap-2">
                      <span className="text-violet-500 mt-1">•</span>
                      <span>{part.slice(2)}</span>
                    </span>
                  );
                }
                // Handle numbered lists
                const numberedMatch = part.match(/^(\d+)\.\s(.+)/);
                if (numberedMatch) {
                  return (
                    <span key={j} className="flex items-start gap-2">
                      <span className="text-violet-500 font-semibold min-w-[20px]">{numberedMatch[1]}.</span>
                      <span>{numberedMatch[2]}</span>
                    </span>
                  );
                }
                return <span key={j}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>
    );

    // Render special message types with steps
    if (message.metadata?.steps && message.type !== "text") {
      const typeStyles = {
        automation_proposal: {
          gradient: "from-violet-500 to-indigo-600",
          stepBg: "bg-violet-50 dark:bg-violet-900/20",
          stepNumber: "bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-300",
          icon: Zap,
          label: "Automation",
        },
        workflow_sequence: {
          gradient: "from-blue-500 to-cyan-600",
          stepBg: "bg-blue-50 dark:bg-blue-900/20",
          stepNumber: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300",
          icon: Workflow,
          label: "Workflow",
        },
        project_plan: {
          gradient: "from-amber-500 to-orange-600",
          stepBg: "bg-amber-50 dark:bg-amber-900/20",
          stepNumber: "bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300",
          icon: FolderKanban,
          label: "Project",
        },
      };

      const style = typeStyles[message.type as keyof typeof typeStyles] || typeStyles.automation_proposal;
      const Icon = style.icon;

      return (
        <div className="space-y-4">
          {content}

          {/* Steps visualization */}
          <div className="mt-4 space-y-2">
            {message.metadata.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-all",
                  style.stepBg
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm",
                  style.stepNumber
                )}>
                  {step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {index < (message.metadata?.steps?.length || 0) - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {message.type === "automation_proposal" && (
              <Button size="sm" asChild className={`bg-gradient-to-r ${style.gradient} hover:opacity-90 text-white shadow-lg`}>
                <Link href={`/portal/builder?prompt=${encodeURIComponent(messages.find((m) => m.role === "user" && m.timestamp < message.timestamp)?.content || "")}`}>
                  <Icon className="w-4 h-4 mr-2" />
                  Create Automation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
            {message.type === "workflow_sequence" && (
              <Button size="sm" asChild className={`bg-gradient-to-r ${style.gradient} hover:opacity-90 text-white shadow-lg`}>
                <Link href="/portal/editor">
                  <Icon className="w-4 h-4 mr-2" />
                  Open Visual Editor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
            {message.type === "project_plan" && (
              <Button size="sm" asChild className={`bg-gradient-to-r ${style.gradient} hover:opacity-90 text-white shadow-lg`}>
                <Link href="/portal/projects">
                  <Icon className="w-4 h-4 mr-2" />
                  Start Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(message.content, message.id)}>
              {copiedId === message.id ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy
            </Button>
          </div>
        </div>
      );
    }

    return content;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-gray-50/30">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-l-2xl shadow-sm">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white/95 backdrop-blur-sm rounded-tl-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">Ask AI</h2>
              <p className="text-sm text-muted-foreground">
                Your intelligent automation assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              History
              {conversationHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] flex items-center justify-center">
                  {conversationHistory.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={startNewConversation}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-5 py-4 shadow-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "bg-white border border-gray-100"
                    )}
                  >
                    {renderMessageContent(message)}
                    {/* Universal AI Actions Bar for assistant messages */}
                    {message.role === "assistant" && message.id !== "greeting" && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <UniversalAIActionsBar
                          entity={{
                            type: "chat_message",
                            id: message.id,
                            title: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
                            description: message.type === "automation_proposal" ? "AI Automation Proposal" :
                                        message.type === "workflow_sequence" ? "AI Workflow Sequence" :
                                        message.type === "project_plan" ? "AI Project Plan" : "AI Response",
                            content: message.content,
                            metadata: message.metadata,
                          }}
                          variant="compact"
                        />
                      </div>
                    )}
                    <div className={cn(
                      "flex items-center justify-between mt-3 pt-2",
                      message.role === "user" ? "border-t border-white/20" : "border-t border-gray-100"
                    )}>
                      <span className={cn(
                        "text-xs",
                        message.role === "user" ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </span>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2">
                          {message.type === "text" && (
                            <button
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="text-muted-foreground hover:text-gray-900 transition-colors flex items-center gap-1 text-xs"
                            >
                              {copiedId === message.id ? (
                                <><Check className="w-3.5 h-3.5" /> Copied</>
                              ) : (
                                <><Copy className="w-3.5 h-3.5" /> Copy</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>

        {/* Quick Prompts (shown when conversation is new) */}
        {messages.length <= 1 && (
          <div className="px-6 py-4 border-t bg-gradient-to-b from-gray-50/80 to-white">
            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Quick start:</span>
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 text-xs whitespace-nowrap",
                  selectedCategory === null && "bg-violet-600 hover:bg-violet-700"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {QUICK_PROMPT_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 text-xs whitespace-nowrap gap-1.5",
                    selectedCategory === cat.id && `bg-${cat.color}-600 hover:bg-${cat.color}-700`
                  )}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Prompts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filteredPrompts.slice(0, 4).map((prompt) => {
                const category = QUICK_PROMPT_CATEGORIES.find((c) => c.id === prompt.category);
                return (
                  <button
                    key={prompt.id}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all hover:shadow-md group",
                      category?.bgColor,
                      category?.borderColor,
                      category?.hoverColor
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
                      category?.iconColor,
                      "bg-white/80"
                    )}>
                      <prompt.icon className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-sm text-gray-900 mb-1">{prompt.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white rounded-bl-2xl">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create, automate, or accomplish..."
                className="min-h-[60px] max-h-[200px] pr-28 resize-none rounded-2xl border-0 bg-transparent focus-visible:ring-0 text-base"
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl h-10 px-5 shadow-lg shadow-violet-200 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium">Shift + Enter</kbd> for new line
            </p>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Example Requests */}
      {showSidebar && (
        <div className="w-80 border-l bg-white hidden lg:flex flex-col rounded-r-2xl shadow-sm">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Example Requests
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSidebar(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Click any example to get started</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {EXAMPLE_REQUESTS.map((example) => (
                <button
                  key={example.id}
                  onClick={() => handleQuickPrompt(example.title)}
                  className="w-full p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:from-violet-100 group-hover:to-indigo-100 transition-colors">
                      <example.icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 group-hover:text-violet-700 transition-colors">{example.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {example.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {example.category}
                      </Badge>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-600 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Quick Links */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">Quick Links</p>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href="/portal/builder">
                  <Zap className="w-4 h-4 text-violet-600" />
                  Automation Builder
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href="/portal/templates">
                  <FileSearch className="w-4 h-4 text-blue-600" />
                  Browse Templates
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                <Link href="/portal/workforce">
                  <Bot className="w-4 h-4 text-green-600" />
                  AI Workforce
                </Link>
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Show sidebar toggle when hidden */}
      {!showSidebar && (
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg z-10 hidden lg:flex"
          onClick={() => setShowSidebar(true)}
        >
          <Lightbulb className="w-4 h-4" />
        </Button>
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <History className="w-5 h-5 text-violet-600" />
                  Conversation History
                </DialogTitle>
                <DialogDescription>
                  View, search, and manage your previous conversations
                </DialogDescription>
              </div>
              {conversationHistory.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={clearAllConversations}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Search */}
            {conversationHistory.length > 0 && (
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                  Start a new conversation with the AI assistant to see your history here.
                </p>
                <Button onClick={() => setShowHistory(false)} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Pinned Conversations */}
                {groupedHistory.pinned.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Pinned
                    </h4>
                    <div className="space-y-2">
                      {groupedHistory.pinned.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          isActive={currentConversationId === conversation.id}
                          isEditing={editingConversation === conversation.id}
                          editTitle={editTitle}
                          onLoad={loadConversation}
                          onEdit={(id, title) => {
                            setEditingConversation(id);
                            setEditTitle(title);
                          }}
                          onSaveEdit={(id) => updateConversationTitle(id, editTitle)}
                          onCancelEdit={() => setEditingConversation(null)}
                          onEditTitleChange={setEditTitle}
                          onDelete={(id) => setDeleteConfirmId(id)}
                          onTogglePin={togglePinConversation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Today */}
                {groupedHistory.today.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today</h4>
                    <div className="space-y-2">
                      {groupedHistory.today.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          isActive={currentConversationId === conversation.id}
                          isEditing={editingConversation === conversation.id}
                          editTitle={editTitle}
                          onLoad={loadConversation}
                          onEdit={(id, title) => {
                            setEditingConversation(id);
                            setEditTitle(title);
                          }}
                          onSaveEdit={(id) => updateConversationTitle(id, editTitle)}
                          onCancelEdit={() => setEditingConversation(null)}
                          onEditTitleChange={setEditTitle}
                          onDelete={(id) => setDeleteConfirmId(id)}
                          onTogglePin={togglePinConversation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Yesterday */}
                {groupedHistory.yesterday.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Yesterday</h4>
                    <div className="space-y-2">
                      {groupedHistory.yesterday.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          isActive={currentConversationId === conversation.id}
                          isEditing={editingConversation === conversation.id}
                          editTitle={editTitle}
                          onLoad={loadConversation}
                          onEdit={(id, title) => {
                            setEditingConversation(id);
                            setEditTitle(title);
                          }}
                          onSaveEdit={(id) => updateConversationTitle(id, editTitle)}
                          onCancelEdit={() => setEditingConversation(null)}
                          onEditTitleChange={setEditTitle}
                          onDelete={(id) => setDeleteConfirmId(id)}
                          onTogglePin={togglePinConversation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Older */}
                {groupedHistory.older.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Older</h4>
                    <div className="space-y-2">
                      {groupedHistory.older.map((conversation) => (
                        <ConversationCard
                          key={conversation.id}
                          conversation={conversation}
                          isActive={currentConversationId === conversation.id}
                          isEditing={editingConversation === conversation.id}
                          editTitle={editTitle}
                          onLoad={loadConversation}
                          onEdit={(id, title) => {
                            setEditingConversation(id);
                            setEditTitle(title);
                          }}
                          onSaveEdit={(id) => updateConversationTitle(id, editTitle)}
                          onCancelEdit={() => setEditingConversation(null)}
                          onEditTitleChange={setEditTitle}
                          onDelete={(id) => setDeleteConfirmId(id)}
                          onTogglePin={togglePinConversation}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredHistory.length === 0 && searchQuery && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No conversations match "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                startNewConversation();
              }}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteConversation(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Conversation Card Component
interface ConversationCardProps {
  conversation: ConversationHistory;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onLoad: (conversation: ConversationHistory) => void;
  onEdit: (id: string, title: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function ConversationCard({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onLoad,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onDelete,
  onTogglePin,
}: ConversationCardProps) {
  return (
    <div
      className={cn(
        "group p-4 rounded-xl border transition-all",
        isActive
          ? "border-violet-300 bg-violet-50"
          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onLoad(conversation)}>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit(conversation.id);
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onSaveEdit(conversation.id)}>
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {conversation.pinned && (
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
                <p className="font-medium text-sm truncate">{conversation.title}</p>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                {conversation.preview}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation.timestamp, { addSuffix: true })}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {conversation.messages.length} messages
                </span>
              </div>
            </>
          )}
        </div>
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(conversation.id, conversation.title)}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePin(conversation.id)}>
                <Star className={cn("w-4 h-4 mr-2", conversation.pinned && "fill-amber-500 text-amber-500")} />
                {conversation.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
