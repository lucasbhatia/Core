"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import PortalShell from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  ArrowLeft,
  Send,
  Loader2,
  User,
  Plus,
  MessageSquare,
  Clock,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type DeployedAgent } from "@/lib/ai-agents/types";
import type { Client } from "@/types/database";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  tokens_used: number;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<DeployedAgent | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClient();
    fetchAgent();
    fetchConversations();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch("/api/portal/client");
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAgent = async () => {
    try {
      const res = await fetch(`/api/portal/agents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data.agent);
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/portal/agents/${id}/chat`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/portal/agents/${id}/chat?conversation_id=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
      tokens_used: 0,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/portal/agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: currentConversation,
          message: userMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Update conversation ID if new
        if (!currentConversation) {
          setCurrentConversation(data.conversation_id);
          fetchConversations();
        }

        // Add assistant message
        const assistantMsg: Message = {
          id: data.message_id,
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString(),
          tokens_used: data.tokens_used,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const error = await res.json();
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        alert(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <PortalShell client={client} pageTitle="Agent Not Found">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Agent not found</h3>
            <Link href="/portal/agents">
              <Button>Back to Agents</Button>
            </Link>
          </CardContent>
        </Card>
      </PortalShell>
    );
  }

  return (
    <PortalShell client={client} pageTitle={`Chat with ${agent.name}`}>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href={`/portal/agents/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{agent.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentConversation ? "Active conversation" : "New conversation"}
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={startNewConversation}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="flex flex-1 gap-4 min-h-0">
          {/* Conversation List */}
          <Card className="w-64 flex-shrink-0 hidden lg:flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No conversations yet</p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`w-full text-left p-2 rounded-lg text-sm hover:bg-muted transition-colors ${
                          currentConversation === conv.id ? "bg-muted" : ""
                        }`}
                      >
                        <p className="font-medium truncate">
                          {conv.title || "New conversation"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conv.message_count} messages
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 p-4 flex flex-col min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">Start a conversation</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {agent.description || `Send a message to start chatting with ${agent.name}`}
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          {message.tokens_used > 0 && (
                            <p className="text-xs opacity-60 mt-1">
                              {message.tokens_used} tokens
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
