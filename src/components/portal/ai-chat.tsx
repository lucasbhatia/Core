"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  context?: {
    type?: string;
    data?: Record<string, unknown>;
  };
}

const QUICK_ACTIONS = [
  { label: "Summary of my automations", icon: Sparkles },
  { label: "How is my performance?", icon: Sparkles },
  { label: "What can I automate next?", icon: Sparkles },
  { label: "Show me recent activity", icon: Sparkles },
];

export default function AIChat({ context }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/portal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content.trim(),
          conversationHistory,
          context,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I apologize, but I couldn't connect. Please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl border-0 flex flex-col transition-all duration-300 ease-in-out",
        isExpanded
          ? "bottom-0 right-0 w-full h-full sm:bottom-6 sm:right-6 sm:w-[600px] sm:h-[700px] sm:rounded-xl"
          : "bottom-6 right-6 w-[400px] h-[550px] rounded-xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-white/70">Ask me anything about your automations</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-violet-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">How can I help you today?</h4>
            <p className="text-sm text-muted-foreground mb-6">
              I can help you understand your automations, analyze performance, and suggest improvements.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {QUICK_ACTIONS.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(action.label)}
                  className="text-xs h-auto py-2 px-3 justify-start text-left"
                >
                  <action.icon className="w-3 h-3 mr-2 flex-shrink-0 text-violet-500" />
                  <span className="truncate">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-gray-200"
                      : "bg-gradient-to-r from-violet-100 to-indigo-100"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-violet-600" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 max-w-[80%]",
                    message.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-xl">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 bg-white"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI-powered assistant for your automation portal
        </p>
      </div>
    </Card>
  );
}
