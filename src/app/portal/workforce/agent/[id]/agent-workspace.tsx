"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sparkles,
  Plus,
  PenLine,
  Bot,
  User,
  Clock,
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
];

const mockMessages: WorkforceMessage[] = [
  {
    id: "msg-1",
    conversation_id: "conv-1",
    role: "assistant",
    content: "Hi! I'm Sarah, your content writer. I can help you create blog posts, articles, and long-form content. What would you like me to work on?",
    tokens_used: 35,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export default function AgentWorkspace({ agentId, clientId }: AgentWorkspaceProps) {
  const { toast } = useToast();
  const [agent] = useState<HiredAgent>(mockAgent);
  const [messages, setMessages] = useState<WorkforceMessage[]>(mockMessages);
  const [deliverables, setDeliverables] = useState<AgentDeliverable[]>(mockDeliverables);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeliverables, setShowDeliverables] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<AgentDeliverable | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/portal/workforce">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl">
            {agent.roster_agent.personality.avatar}
          </div>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              {agent.roster_agent.name}
              <Badge variant="secondary" className="text-xs font-normal">
                {agent.status === "active" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />}
                {agent.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{agent.roster_agent.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeliverables(true)}
            className="relative"
          >
            <FileText className="w-4 h-4 mr-2" />
            Deliverables
            {deliverables.length > 0 && (
              <Badge className="ml-2 h-5 px-1.5 bg-violet-600">{deliverables.length}</Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/portal/workforce/agent/${agentId}/automations`}>
              <Zap className="w-4 h-4 mr-2" />
              Automations
            </Link>
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4 px-1">
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
                    <span className="text-sm text-gray-500">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="pt-4 border-t">
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
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()} className="bg-violet-600 hover:bg-violet-700">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Try: "Write a blog post about..." or "Create social media content for..."
          </p>
        </div>
      </div>

      {/* Deliverables Panel */}
      <Dialog open={showDeliverables} onOpenChange={setShowDeliverables}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Deliverables
            </DialogTitle>
            <DialogDescription>
              Content created by {agent.roster_agent.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
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
                  <Card
                    key={deliverable.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedDeliverable(deliverable)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{deliverable.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {deliverable.type.replace("_", " ")}
                            </Badge>
                            <span>{deliverable.word_count} words</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(deliverable.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Single Deliverable */}
      <Dialog open={!!selectedDeliverable} onOpenChange={() => setSelectedDeliverable(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedDeliverable && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeliverable.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3">
                  <Badge variant="outline">{selectedDeliverable.type.replace("_", " ")}</Badge>
                  <span>{selectedDeliverable.word_count} words</span>
                  <span>{selectedDeliverable.reading_time_minutes} min read</span>
                </DialogDescription>
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
    </div>
  );
}
