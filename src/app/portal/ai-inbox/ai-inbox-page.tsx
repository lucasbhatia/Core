"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Settings,
  ChevronDown,
  Copy,
  Check,
  History,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
}

const QUICK_PROMPTS = [
  {
    id: "order-automation",
    label: "New Order Automation",
    prompt: "Create an automation that triggers when a new order is placed, sends a confirmation email to the customer, updates the inventory, and notifies the shipping team.",
    icon: Zap,
    category: "Automation",
  },
  {
    id: "file-summary",
    label: "Summarize Files",
    prompt: "I need help summarizing and organizing the files in my project. Can you help me create a system for this?",
    icon: FileText,
    category: "Organization",
  },
  {
    id: "crm-cleanup",
    label: "Clean CRM Data",
    prompt: "Help me create an automation to clean up my CRM data - remove duplicates, standardize formats, and flag incomplete records.",
    icon: Database,
    category: "Data",
  },
  {
    id: "email-workflow",
    label: "Email Workflow",
    prompt: "Design an email workflow that nurtures leads from initial contact to conversion with personalized follow-ups.",
    icon: Mail,
    category: "Marketing",
  },
  {
    id: "report-automation",
    label: "Automated Reports",
    prompt: "Create a weekly automated report that summarizes sales, customer activity, and key metrics, sent every Monday morning.",
    icon: BarChart,
    category: "Reporting",
  },
  {
    id: "sync-data",
    label: "Data Sync",
    prompt: "Set up an automation to keep data synchronized between my CRM and email marketing platform in real-time.",
    icon: RefreshCw,
    category: "Integration",
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

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `Hello ${clientName.split(" ")[0]}! I'm your AI assistant. I can help you with:\n\n• **Creating automations** - Describe what you want to automate\n• **Designing workflows** - Plan multi-step processes\n• **Building project plans** - Organize complex initiatives\n• **Analyzing data** - Get insights from your information\n\nWhat would you like to work on today?`,
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

  const saveConversation = (msgs: Message[]) => {
    if (msgs.length <= 1) return;

    const userMessages = msgs.filter((m) => m.role === "user");
    if (userMessages.length === 0) return;

    const title = userMessages[0].content.slice(0, 50) + (userMessages[0].content.length > 50 ? "..." : "");
    const preview = msgs[msgs.length - 1].content.slice(0, 100);

    const newHistory: ConversationHistory = {
      id: currentConversationId || `conv-${Date.now()}`,
      title,
      preview,
      timestamp: new Date(),
      messages: msgs,
    };

    const updated = [newHistory, ...conversationHistory.filter((c) => c.id !== newHistory.id)].slice(0, 20);
    setConversationHistory(updated);
    setCurrentConversationId(newHistory.id);

    localStorage.setItem(`ai-inbox-history-${clientId}`, JSON.stringify(updated));
  };

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
      lowerInput.includes("when")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed your request and designed an automation proposal:\n\n**Proposed Automation**\n\nThis automation will help streamline your workflow by automating repetitive tasks.\n\n**How it works:**`,
        timestamp: new Date(),
        type: "automation_proposal",
        metadata: {
          title: "Custom Automation",
          steps: [
            { id: 1, name: "Trigger", description: "Automation starts when the specified event occurs" },
            { id: 2, name: "Process Data", description: "Extract and validate relevant information" },
            { id: 3, name: "Take Action", description: "Execute the configured actions" },
            { id: 4, name: "Notify", description: "Send notifications to relevant parties" },
          ],
        },
      };
    }

    // Detect workflow requests
    if (
      lowerInput.includes("workflow") ||
      lowerInput.includes("process") ||
      lowerInput.includes("steps") ||
      lowerInput.includes("sequence")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Here's a workflow sequence based on your requirements:\n\n**Workflow Design**\n\nThis workflow organizes your process into clear, actionable steps.`,
        timestamp: new Date(),
        type: "workflow_sequence",
        metadata: {
          title: "Custom Workflow",
          steps: [
            { id: 1, name: "Initiation", description: "Start the workflow with initial data" },
            { id: 2, name: "Review", description: "Review and validate inputs" },
            { id: 3, name: "Processing", description: "Execute main workflow logic" },
            { id: 4, name: "Approval", description: "Get necessary approvals" },
            { id: 5, name: "Completion", description: "Finalize and close the workflow" },
          ],
        },
      };
    }

    // Detect project requests
    if (
      lowerInput.includes("project") ||
      lowerInput.includes("plan") ||
      lowerInput.includes("organize") ||
      lowerInput.includes("initiative")
    ) {
      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I've created a project plan for you:\n\n**Project Structure**\n\nThis plan breaks down your initiative into manageable phases.`,
        timestamp: new Date(),
        type: "project_plan",
        metadata: {
          title: "Project Plan",
          steps: [
            { id: 1, name: "Discovery", description: "Gather requirements and define scope" },
            { id: 2, name: "Planning", description: "Create detailed timeline and resources" },
            { id: 3, name: "Implementation", description: "Execute the project tasks" },
            { id: 4, name: "Testing", description: "Validate deliverables" },
            { id: 5, name: "Launch", description: "Deploy and go live" },
          ],
        },
      };
    }

    // Default helpful response
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: `I understand you're looking for help with "${userInput.slice(0, 50)}${userInput.length > 50 ? "..." : ""}"\n\nTo better assist you, could you tell me more about:\n\n1. **What outcome** you're trying to achieve?\n2. **What systems or tools** are involved?\n3. **What triggers** should start this process?\n\nWith more details, I can create a tailored automation, workflow, or project plan for you.`,
      timestamp: new Date(),
      type: "text",
    };
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const startNewConversation = () => {
    saveConversation(messages);
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
  };

  const loadConversation = (conversation: ConversationHistory) => {
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
                  return <span key={j} className="block pl-2">{part}</span>;
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
      return (
        <div className="space-y-4">
          {content}
          <div className="space-y-2 mt-4">
            {message.metadata.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                    {step.id}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{step.name}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons based on message type */}
          <div className="flex gap-2 mt-4">
            {message.type === "automation_proposal" && (
              <Button size="sm" asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
                <Link href={`/portal/builder?prompt=${encodeURIComponent(messages.find((m) => m.role === "user" && m.timestamp < message.timestamp)?.content || "")}`}>
                  <Zap className="w-4 h-4 mr-2" />
                  Create This Automation
                </Link>
              </Button>
            )}
            {message.type === "workflow_sequence" && (
              <Button size="sm" asChild className="bg-gradient-to-r from-blue-600 to-cyan-600">
                <Link href="/portal/projects">
                  <Workflow className="w-4 h-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            )}
            {message.type === "project_plan" && (
              <Button size="sm" asChild className="bg-gradient-to-r from-amber-600 to-orange-600">
                <Link href="/portal/projects">
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Start Project
                </Link>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return content;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Create automations, workflows, and more with natural language
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={startNewConversation}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  {renderMessageContent(message)}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/20">
                    <span className="text-xs opacity-60">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts (shown when conversation is new) */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t bg-gray-50/80">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                >
                  <prompt.icon className="w-3 h-3 mr-1.5" />
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to automate, create, or accomplish..."
                className="min-h-[60px] max-h-[200px] pr-24 resize-none rounded-xl"
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>

      {/* Sidebar with Quick Actions */}
      <div className="w-80 border-l bg-gray-50/50 hidden lg:block">
        <div className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Example Requests
          </h3>
          <div className="space-y-3">
            {QUICK_PROMPTS.map((prompt) => (
              <Card
                key={prompt.id}
                className="cursor-pointer hover:border-violet-200 transition-colors"
                onClick={() => handleQuickPrompt(prompt.prompt)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <prompt.icon className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{prompt.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {prompt.prompt}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {prompt.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Conversation History
            </DialogTitle>
            <DialogDescription>
              View and continue previous conversations
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] -mx-6 px-6">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No conversation history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationHistory.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={cn(
                      "cursor-pointer hover:border-violet-200 transition-colors",
                      currentConversationId === conversation.id && "border-violet-400"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0" onClick={() => loadConversation(conversation)}>
                          <p className="font-medium text-sm truncate">{conversation.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {conversation.preview}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(conversation.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
