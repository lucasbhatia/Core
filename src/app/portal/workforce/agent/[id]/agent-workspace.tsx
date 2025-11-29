"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  User,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AGENT_ROSTER,
  type HiredAgent,
  type AgentDeliverable,
  type WorkforceMessage,
} from "@/lib/ai-workforce";

interface AgentWorkspaceProps {
  agentId: string;
  clientId: string;
}

// Storage keys
const HIRED_AGENTS_KEY = "hired_agents";
const MESSAGES_KEY = (agentId: string) => `agent_messages_${agentId}`;
const DELIVERABLES_KEY = (agentId: string) => `agent_deliverables_${agentId}`;

// Get hired agent from localStorage
function getHiredAgent(agentId: string): HiredAgent | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(HIRED_AGENTS_KEY);
  if (!stored) return null;
  try {
    const agents = JSON.parse(stored);
    const agent = agents.find((a: HiredAgent) => a.id === agentId);
    if (!agent) return null;
    return {
      ...agent,
      roster_agent: AGENT_ROSTER.find((a) => a.id === agent.roster_id) || agent.roster_agent,
    };
  } catch {
    return null;
  }
}

// Get messages from localStorage
function getStoredMessages(agentId: string): WorkforceMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(MESSAGES_KEY(agentId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save messages to localStorage
function saveMessages(agentId: string, messages: WorkforceMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY(agentId), JSON.stringify(messages));
}

// Get deliverables from localStorage
function getStoredDeliverables(agentId: string): AgentDeliverable[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(DELIVERABLES_KEY(agentId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save deliverables to localStorage
function saveDeliverables(agentId: string, deliverables: AgentDeliverable[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELIVERABLES_KEY(agentId), JSON.stringify(deliverables));
}

export default function AgentWorkspace({ agentId, clientId }: AgentWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<HiredAgent | null>(null);
  const [messages, setMessages] = useState<WorkforceMessage[]>([]);
  const [deliverables, setDeliverables] = useState<AgentDeliverable[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeliverables, setShowDeliverables] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load agent data on mount
  useEffect(() => {
    const loadedAgent = getHiredAgent(agentId);
    if (!loadedAgent) {
      router.push("/portal/workforce");
      return;
    }
    setAgent(loadedAgent);

    const storedMessages = getStoredMessages(agentId);
    if (storedMessages.length === 0) {
      // Add initial greeting
      const greeting: WorkforceMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: agentId,
        role: "assistant",
        content: `Hi! I'm ${loadedAgent.roster_agent.name}, your ${loadedAgent.roster_agent.role}. ${loadedAgent.roster_agent.personality.tagline}\n\nWhat would you like me to help you with today?`,
        tokens_used: 0,
        created_at: new Date().toISOString(),
      };
      setMessages([greeting]);
      saveMessages(agentId, [greeting]);
    } else {
      setMessages(storedMessages);
    }

    setDeliverables(getStoredDeliverables(agentId));
  }, [agentId, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputMessage]);

  // Send message with real AI response
  async function handleSendMessage() {
    if (!inputMessage.trim() || !agent) return;

    const userMessage: WorkforceMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: agentId,
      role: "user",
      content: inputMessage,
      tokens_used: Math.ceil(inputMessage.length / 4),
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(agentId, updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the AI API with the agent's system prompt
      const response = await fetch("/api/portal/workforce/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.roster_id,
          systemPrompt: agent.roster_agent.system_prompt,
          agentName: agent.roster_agent.name,
          agentRole: agent.roster_agent.role,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: inputMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const aiMessage: WorkforceMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: agentId,
        role: "assistant",
        content: data.content,
        tokens_used: data.tokens_used || 0,
        created_at: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      saveMessages(agentId, finalMessages);

      // Check if the response contains a deliverable (content creation)
      if (data.deliverable) {
        const newDeliverable: AgentDeliverable = {
          id: `del-${Date.now()}`,
          task_id: `task-${Date.now()}`,
          hired_agent_id: agentId,
          client_id: clientId,
          title: data.deliverable.title,
          type: data.deliverable.type || "document",
          content: data.deliverable.content,
          word_count: data.deliverable.content.split(/\s+/).length,
          character_count: data.deliverable.content.length,
          reading_time_minutes: Math.ceil(data.deliverable.content.split(/\s+/).length / 200),
          status: "ready",
          rating: null,
          feedback: null,
          version: 1,
          previous_version_id: null,
          tokens_used: data.tokens_used || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approved_at: null,
          published_at: null,
        };
        const updatedDeliverables = [...deliverables, newDeliverable];
        setDeliverables(updatedDeliverables);
        saveDeliverables(agentId, updatedDeliverables);
      }
    } catch (error) {
      // Fallback response if API fails
      const fallbackMessage: WorkforceMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: agentId,
        role: "assistant",
        content: `I apologize, but I'm having trouble connecting right now. Please try again in a moment. In the meantime, here's what I can help you with:\n\n${agent.roster_agent.capabilities.map(c => `- ${c}`).join('\n')}`,
        tokens_used: 0,
        created_at: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, fallbackMessage];
      setMessages(finalMessages);
      saveMessages(agentId, finalMessages);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle key press
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // Copy content
  function handleCopyContent(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  }

  // Clear conversation
  function handleClearConversation() {
    if (!agent) return;
    const greeting: WorkforceMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: agentId,
      role: "assistant",
      content: `Hi! I'm ${agent.roster_agent.name}, your ${agent.roster_agent.role}. ${agent.roster_agent.personality.tagline}\n\nWhat would you like me to help you with today?`,
      tokens_used: 0,
      created_at: new Date().toISOString(),
    };
    setMessages([greeting]);
    saveMessages(agentId, [greeting]);
    toast({ title: "Conversation cleared" });
  }

  // Toggle agent status
  function handleToggleStatus() {
    if (!agent) return;
    const stored = localStorage.getItem(HIRED_AGENTS_KEY);
    if (!stored) return;
    const agents = JSON.parse(stored);
    const updatedAgents = agents.map((a: HiredAgent) =>
      a.id === agentId
        ? { ...a, status: a.status === "active" ? "paused" : "active" }
        : a
    );
    localStorage.setItem(HIRED_AGENTS_KEY, JSON.stringify(updatedAgents));
    setAgent({ ...agent, status: agent.status === "active" ? "paused" : "active" });
    toast({
      title: agent.status === "active" ? "Agent paused" : "Agent activated",
    });
  }

  // Rate a message
  function handleRateMessage(messageId: string, rating: "thumbs_up" | "thumbs_down") {
    const updatedMessages = messages.map((m) =>
      m.id === messageId ? { ...m, reaction: rating } : m
    );
    setMessages(updatedMessages);
    saveMessages(agentId, updatedMessages);
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between pb-4 border-b shrink-0">
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
          {deliverables.length > 0 && (
            <Button
              variant={showDeliverables ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeliverables(!showDeliverables)}
              className={showDeliverables ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              <FileText className="w-4 h-4 mr-2" />
              Outputs
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {deliverables.length}
              </Badge>
            </Button>
          )}
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
              <DropdownMenuItem onClick={handleClearConversation}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - Full height chat or split with deliverables */}
      <div className="flex-1 flex gap-4 mt-4 min-h-0">
        {/* Chat Area - Takes full width or splits when deliverables shown */}
        <Card className={`flex flex-col ${showDeliverables ? "flex-1" : "w-full"}`}>
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg shrink-0">
                      {agent.roster_agent.personality.avatar}
                    </div>
                  )}
                  <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${message.role === "user" ? "justify-end" : ""}`}>
                      <span className={`text-xs ${message.role === "user" ? "text-gray-400" : "text-gray-400"}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyContent(message.content)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleRateMessage(message.id, "thumbs_up")}
                            className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                              message.reaction === "thumbs_up" ? "bg-green-100" : ""
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${message.reaction === "thumbs_up" ? "text-green-600" : "text-gray-400"}`} />
                          </button>
                          <button
                            onClick={() => handleRateMessage(message.id, "thumbs_down")}
                            className={`p-1 hover:bg-gray-200 rounded transition-colors ${
                              message.reaction === "thumbs_down" ? "bg-red-100" : ""
                            }`}
                          >
                            <ThumbsDown className={`w-3 h-3 ${message.reaction === "thumbs_down" ? "text-red-600" : "text-gray-400"}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg">
                    {agent.roster_agent.personality.avatar}
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-gray-500">{agent.roster_agent.name} is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50/50 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Tell ${agent.roster_agent.name.split(" ")[0]} what you need...`}
                  disabled={isLoading || agent.status === "paused"}
                  className="min-h-[52px] max-h-[200px] resize-none pr-12 bg-white"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim() || agent.status === "paused"}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 bg-violet-600 hover:bg-violet-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-wrap gap-2">
                  {agent.roster_agent.example_tasks.slice(0, 2).map((task, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(task)}
                      className="text-xs text-violet-600 hover:text-violet-700 hover:underline"
                    >
                      {task.length > 50 ? task.slice(0, 50) + "..." : task}
                    </button>
                  ))}
                </div>
                {agent.status === "paused" && (
                  <Badge variant="secondary" className="text-xs">Agent paused</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Deliverables Panel - Slides in */}
        {showDeliverables && (
          <Card className="w-96 shrink-0 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                Outputs
              </h3>
              <Badge variant="secondary">{deliverables.length}</Badge>
            </div>
            <ScrollArea className="flex-1 p-4">
              {deliverables.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Outputs will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliverables.map((deliverable) => (
                    <div
                      key={deliverable.id}
                      className="p-3 border rounded-lg hover:border-violet-200 hover:bg-violet-50/50 transition-colors cursor-pointer"
                      onClick={() => handleCopyContent(deliverable.content)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{deliverable.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {deliverable.type.replace("_", " ")}
                            </Badge>
                            <span>{deliverable.word_count} words</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyContent(deliverable.content);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded"
                          >
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {deliverable.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400">
                          {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
