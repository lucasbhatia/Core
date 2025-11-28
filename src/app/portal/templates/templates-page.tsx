"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  Bell,
  RefreshCw,
  FileText,
  Mail,
  Webhook,
  Sparkles,
  Search,
  ArrowRight,
  Star,
  Users,
  Zap,
  MessageSquare,
  Calendar,
  BarChart,
} from "lucide-react";
import { useState } from "react";

interface TemplatesPageProps {
  clientId: string;
}

const TEMPLATES = [
  {
    id: "lead-capture",
    name: "Lead Capture & CRM Sync",
    description: "Automatically capture leads from forms and sync them to your CRM with AI-powered data enrichment.",
    icon: Database,
    category: "Sales",
    popular: true,
    usageCount: 1250,
    prompt: "Create an automation that captures lead information from form submissions, validates and enriches the data using AI, and adds it to a CRM system with proper categorization.",
  },
  {
    id: "smart-notifications",
    name: "Smart Notifications",
    description: "Send intelligent, context-aware notifications based on events and triggers.",
    icon: Bell,
    category: "Communication",
    popular: true,
    usageCount: 980,
    prompt: "Create an automation that monitors for specific events and sends smart, personalized notifications via email or Slack based on context and priority.",
  },
  {
    id: "data-sync",
    name: "Two-Way Data Sync",
    description: "Keep data synchronized between multiple systems in real-time.",
    icon: RefreshCw,
    category: "Integration",
    popular: false,
    usageCount: 750,
    prompt: "Create an automation that synchronizes data bidirectionally between two systems, handling conflicts intelligently and keeping everything up to date.",
  },
  {
    id: "report-generator",
    name: "Automated Reports",
    description: "Generate and deliver beautiful reports on a schedule.",
    icon: FileText,
    category: "Analytics",
    popular: true,
    usageCount: 890,
    prompt: "Create an automation that generates comprehensive reports from multiple data sources and delivers them via email on a customizable schedule.",
  },
  {
    id: "email-processor",
    name: "Email AI Processor",
    description: "Process incoming emails with AI to extract info and take action.",
    icon: Mail,
    category: "AI",
    popular: false,
    usageCount: 620,
    prompt: "Create an automation that processes incoming emails using AI to extract key information, categorize them, and take appropriate automated actions.",
  },
  {
    id: "webhook-relay",
    name: "Webhook Transformer",
    description: "Receive, transform, and forward webhook data between services.",
    icon: Webhook,
    category: "Integration",
    popular: false,
    usageCount: 430,
    prompt: "Create an automation that receives webhook data, transforms it according to custom rules, and forwards it to one or more destination services.",
  },
  {
    id: "customer-onboarding",
    name: "Customer Onboarding",
    description: "Automate the entire customer onboarding flow with personalized touchpoints.",
    icon: Users,
    category: "Customer Success",
    popular: true,
    usageCount: 560,
    prompt: "Create an automation for customer onboarding that sends personalized welcome emails, creates accounts, schedules calls, and tracks progress.",
  },
  {
    id: "ai-content-generator",
    name: "AI Content Generator",
    description: "Generate marketing content, social posts, and copy using AI.",
    icon: Sparkles,
    category: "AI",
    popular: true,
    usageCount: 1100,
    prompt: "Create an automation that generates marketing content including social media posts, blog outlines, and email copy using AI based on provided topics and brand guidelines.",
  },
  {
    id: "support-ticket-triage",
    name: "Support Ticket Triage",
    description: "Automatically categorize and route support tickets using AI.",
    icon: MessageSquare,
    category: "Support",
    popular: false,
    usageCount: 340,
    prompt: "Create an automation that analyzes incoming support tickets with AI to determine priority, category, and sentiment, then routes them to the appropriate team.",
  },
  {
    id: "meeting-scheduler",
    name: "Smart Meeting Scheduler",
    description: "Automate meeting scheduling with calendar integration.",
    icon: Calendar,
    category: "Productivity",
    popular: false,
    usageCount: 280,
    prompt: "Create an automation that handles meeting scheduling requests, checks calendar availability, sends invites, and follows up with reminders.",
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline Automation",
    description: "Automate deal progression and sales follow-ups.",
    icon: BarChart,
    category: "Sales",
    popular: false,
    usageCount: 410,
    prompt: "Create an automation that monitors your sales pipeline, sends automated follow-ups based on deal stage, and alerts sales reps when action is needed.",
  },
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    description: "Automatically process and organize incoming invoices.",
    icon: FileText,
    category: "Finance",
    popular: false,
    usageCount: 190,
    prompt: "Create an automation that processes incoming invoices, extracts key data using AI, categorizes expenses, and updates your accounting system.",
  },
];

const CATEGORIES = ["All", "Sales", "AI", "Integration", "Communication", "Analytics", "Customer Success", "Support", "Productivity", "Finance"];

export default function TemplatesPage({ clientId }: TemplatesPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTemplates = TEMPLATES.filter((template) => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== "All" && template.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const popularTemplates = TEMPLATES.filter((t) => t.popular).slice(0, 4);

  function handleUseTemplate(template: typeof TEMPLATES[0]) {
    // Navigate to builder with template pre-filled
    const params = new URLSearchParams({
      template: template.id,
      prompt: template.prompt,
      name: template.name,
    });
    router.push(`/portal/builder?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Start with a Template</h2>
        <p className="text-muted-foreground">
          Choose from our pre-built automation templates to get started quickly
        </p>
      </div>

      {/* Popular Templates */}
      <div>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Popular Templates
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {popularTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-violet-200 group"
              onClick={() => handleUseTemplate(template)}
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:from-violet-200 group-hover:to-indigo-200 transition-colors">
                  <template.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h4 className="font-semibold mb-1">{template.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {template.usageCount.toLocaleString()} uses
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-violet-600" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div>
        <h3 className="font-medium mb-4">
          {selectedCategory === "All" ? "All Templates" : `${selectedCategory} Templates`}
          <Badge variant="secondary" className="ml-2">
            {filteredTemplates.length}
          </Badge>
        </h3>
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No templates found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-md transition-all hover:border-violet-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <template.icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {template.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {template.usageCount.toLocaleString()} uses
                    </span>
                    <Button size="sm" onClick={() => handleUseTemplate(template)}>
                      Use Template
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom CTA */}
      <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200">
        <CardContent className="py-8 text-center">
          <Sparkles className="w-12 h-12 text-violet-600 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Need something custom?</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Describe what you want to automate in plain English and our AI will build it for you.
          </p>
          <Button onClick={() => router.push("/portal/builder")} className="bg-gradient-to-r from-violet-600 to-indigo-600">
            Create Custom Automation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
