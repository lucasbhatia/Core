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
  ShoppingCart,
  CreditCard,
  Globe,
  Shield,
  Clock,
  Truck,
  Heart,
  Building2,
  GraduationCap,
  Briefcase,
  Target,
  TrendingUp,
  Megaphone,
  BookOpen,
  Smartphone,
  Server,
  Bot,
  Brain,
  Palette,
  Video,
  Headphones,
  Package,
  Receipt,
  DollarSign,
  PieChart,
  LineChart,
  Share2,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
} from "lucide-react";
import { useState } from "react";

interface TemplatesPageProps {
  clientId: string;
}

const TEMPLATES = [
  // SALES & CRM (Popular)
  {
    id: "lead-capture",
    name: "Lead Capture & CRM Sync",
    description: "Automatically capture leads from forms and sync them to your CRM with AI-powered data enrichment.",
    icon: Database,
    category: "Sales",
    popular: true,
    usageCount: 2850,
    prompt: "Create an automation that captures lead information from form submissions, validates and enriches the data using AI, and adds it to a CRM system with proper categorization and lead scoring.",
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline Automation",
    description: "Automate deal progression, follow-ups, and sales team notifications.",
    icon: TrendingUp,
    category: "Sales",
    popular: true,
    usageCount: 2410,
    prompt: "Create an automation that monitors your sales pipeline, sends automated follow-ups based on deal stage, updates deal scores, and alerts sales reps when action is needed.",
  },
  {
    id: "lead-scoring",
    name: "AI Lead Scoring",
    description: "Automatically score and prioritize leads using AI analysis.",
    icon: Target,
    category: "Sales",
    popular: true,
    usageCount: 1890,
    prompt: "Create an automation that analyzes incoming leads using AI to score them based on fit, behavior, and engagement, then prioritizes them in your CRM.",
  },
  {
    id: "sales-forecasting",
    name: "Sales Forecasting",
    description: "Generate accurate sales forecasts and pipeline reports automatically.",
    icon: LineChart,
    category: "Sales",
    popular: false,
    usageCount: 1240,
    prompt: "Create an automation that analyzes historical sales data and current pipeline to generate accurate forecasts and weekly reports for leadership.",
  },
  {
    id: "quote-generator",
    name: "Automated Quote Generator",
    description: "Generate professional quotes and proposals in seconds.",
    icon: FileText,
    category: "Sales",
    popular: false,
    usageCount: 980,
    prompt: "Create an automation that generates professional, branded quotes and proposals based on product selections, customer data, and pricing rules.",
  },

  // MARKETING & CONTENT
  {
    id: "ai-content-generator",
    name: "AI Content Generator",
    description: "Generate marketing content, social posts, and copy using AI.",
    icon: Sparkles,
    category: "Marketing",
    popular: true,
    usageCount: 3100,
    prompt: "Create an automation that generates marketing content including social media posts, blog outlines, email copy, and ad variations using AI based on topics and brand guidelines.",
  },
  {
    id: "social-media-scheduler",
    name: "Social Media Scheduler",
    description: "Schedule and publish content across all social platforms.",
    icon: Share2,
    category: "Marketing",
    popular: true,
    usageCount: 2650,
    prompt: "Create an automation that takes content and schedules it optimally across multiple social media platforms, with platform-specific formatting and hashtag optimization.",
  },
  {
    id: "email-campaign-manager",
    name: "Email Campaign Manager",
    description: "Automate email campaigns with personalization and A/B testing.",
    icon: Mail,
    category: "Marketing",
    popular: true,
    usageCount: 2340,
    prompt: "Create an automation for email marketing campaigns that segments audiences, personalizes content, performs A/B testing, and tracks engagement metrics.",
  },
  {
    id: "seo-content-optimizer",
    name: "SEO Content Optimizer",
    description: "Optimize content for search engines automatically using AI.",
    icon: Globe,
    category: "Marketing",
    popular: false,
    usageCount: 1560,
    prompt: "Create an automation that analyzes content for SEO, suggests improvements, optimizes meta tags, and tracks keyword rankings automatically.",
  },
  {
    id: "influencer-outreach",
    name: "Influencer Outreach",
    description: "Automate influencer discovery and outreach campaigns.",
    icon: Megaphone,
    category: "Marketing",
    popular: false,
    usageCount: 890,
    prompt: "Create an automation that identifies relevant influencers, personalizes outreach messages, tracks responses, and manages collaboration workflows.",
  },
  {
    id: "brand-monitoring",
    name: "Brand Monitoring & Alerts",
    description: "Monitor brand mentions and sentiment across the web.",
    icon: Bell,
    category: "Marketing",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that monitors brand mentions across social media and the web, analyzes sentiment, and alerts your team to important mentions.",
  },

  // CUSTOMER SUCCESS
  {
    id: "customer-onboarding",
    name: "Customer Onboarding",
    description: "Automate the entire customer onboarding flow with personalized touchpoints.",
    icon: Users,
    category: "Customer Success",
    popular: true,
    usageCount: 2560,
    prompt: "Create an automation for customer onboarding that sends personalized welcome emails, creates accounts, schedules calls, provides training resources, and tracks progress.",
  },
  {
    id: "nps-survey",
    name: "NPS Survey Automation",
    description: "Send NPS surveys and automatically act on feedback.",
    icon: Heart,
    category: "Customer Success",
    popular: true,
    usageCount: 1890,
    prompt: "Create an automation that sends NPS surveys at optimal times, collects responses, alerts teams to detractors, and creates follow-up tasks for improvement.",
  },
  {
    id: "churn-prevention",
    name: "Churn Prevention System",
    description: "Identify at-risk customers and trigger retention workflows.",
    icon: Shield,
    category: "Customer Success",
    popular: true,
    usageCount: 1670,
    prompt: "Create an automation that monitors customer health scores, identifies churn risk signals, and triggers personalized retention campaigns and CSM alerts.",
  },
  {
    id: "customer-health-scoring",
    name: "Customer Health Scoring",
    description: "Automatically calculate and track customer health scores.",
    icon: PieChart,
    category: "Customer Success",
    popular: false,
    usageCount: 1340,
    prompt: "Create an automation that calculates customer health scores based on usage, engagement, support tickets, and payment history, updating dashboards in real-time.",
  },
  {
    id: "renewal-management",
    name: "Renewal Management",
    description: "Automate contract renewals and expansion opportunities.",
    icon: RefreshCw,
    category: "Customer Success",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that tracks contract renewal dates, sends timely reminders, identifies expansion opportunities, and generates renewal quotes.",
  },

  // SUPPORT & SERVICE
  {
    id: "support-ticket-triage",
    name: "Support Ticket Triage",
    description: "Automatically categorize, prioritize, and route support tickets using AI.",
    icon: MessageSquare,
    category: "Support",
    popular: true,
    usageCount: 2340,
    prompt: "Create an automation that analyzes incoming support tickets with AI to determine priority, category, and sentiment, then routes them to the appropriate team member.",
  },
  {
    id: "ai-support-assistant",
    name: "AI Support Assistant",
    description: "Provide instant AI-powered responses to common support questions.",
    icon: Bot,
    category: "Support",
    popular: true,
    usageCount: 2890,
    prompt: "Create an AI assistant automation that answers common customer questions, suggests relevant help articles, and escalates complex issues to human agents.",
  },
  {
    id: "escalation-management",
    name: "Escalation Management",
    description: "Automatically escalate tickets based on SLA and priority rules.",
    icon: Clock,
    category: "Support",
    popular: false,
    usageCount: 1450,
    prompt: "Create an automation that monitors ticket age and SLA compliance, escalates tickets appropriately, and notifies managers of overdue issues.",
  },
  {
    id: "feedback-collector",
    name: "Customer Feedback Collector",
    description: "Collect and analyze customer feedback after interactions.",
    icon: Headphones,
    category: "Support",
    popular: false,
    usageCount: 980,
    prompt: "Create an automation that sends feedback surveys after support interactions, analyzes responses with AI, and creates improvement tickets for common issues.",
  },
  {
    id: "knowledge-base-updater",
    name: "Knowledge Base Updater",
    description: "Automatically update knowledge base from resolved tickets.",
    icon: BookOpen,
    category: "Support",
    popular: false,
    usageCount: 760,
    prompt: "Create an automation that identifies common support questions, generates knowledge base articles from resolutions, and suggests updates to existing documentation.",
  },

  // E-COMMERCE
  {
    id: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "Automatically recover abandoned carts with personalized follow-ups.",
    icon: ShoppingCart,
    category: "E-commerce",
    popular: true,
    usageCount: 3450,
    prompt: "Create an automation that detects abandoned carts, sends personalized recovery emails with incentives, and tracks conversion rates for optimization.",
  },
  {
    id: "order-fulfillment",
    name: "Order Fulfillment Automation",
    description: "Streamline order processing from purchase to delivery.",
    icon: Package,
    category: "E-commerce",
    popular: true,
    usageCount: 2780,
    prompt: "Create an automation that processes orders, updates inventory, generates shipping labels, sends tracking updates, and handles delivery confirmations.",
  },
  {
    id: "inventory-alerts",
    name: "Inventory Management Alerts",
    description: "Monitor stock levels and automate reorder notifications.",
    icon: Truck,
    category: "E-commerce",
    popular: false,
    usageCount: 1890,
    prompt: "Create an automation that monitors inventory levels, predicts stockouts, sends reorder alerts, and generates purchase orders when thresholds are reached.",
  },
  {
    id: "review-management",
    name: "Review Management System",
    description: "Collect, respond to, and analyze product reviews automatically.",
    icon: Star,
    category: "E-commerce",
    popular: false,
    usageCount: 1560,
    prompt: "Create an automation that requests product reviews, responds to feedback using AI, aggregates review sentiment, and alerts teams to negative reviews.",
  },
  {
    id: "dynamic-pricing",
    name: "Dynamic Pricing Engine",
    description: "Automatically adjust prices based on demand and competition.",
    icon: DollarSign,
    category: "E-commerce",
    popular: false,
    usageCount: 890,
    prompt: "Create an automation that monitors competitor prices, analyzes demand patterns, and adjusts product pricing dynamically while maintaining profit margins.",
  },

  // FINANCE & ACCOUNTING
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    description: "Automatically process, categorize, and organize incoming invoices.",
    icon: Receipt,
    category: "Finance",
    popular: true,
    usageCount: 2190,
    prompt: "Create an automation that processes incoming invoices, extracts key data using AI, categorizes expenses, matches to POs, and updates your accounting system.",
  },
  {
    id: "expense-management",
    name: "Expense Management",
    description: "Automate expense report processing and approvals.",
    icon: CreditCard,
    category: "Finance",
    popular: true,
    usageCount: 1890,
    prompt: "Create an automation that collects expense receipts, extracts data, validates against policy, routes for approval, and syncs to accounting software.",
  },
  {
    id: "financial-reporting",
    name: "Financial Reporting",
    description: "Generate financial reports and dashboards automatically.",
    icon: BarChart,
    category: "Finance",
    popular: false,
    usageCount: 1340,
    prompt: "Create an automation that aggregates financial data, generates P&L statements, cash flow reports, and executive dashboards on a scheduled basis.",
  },
  {
    id: "payment-reminders",
    name: "Payment Reminder System",
    description: "Automate payment reminders and collections.",
    icon: Bell,
    category: "Finance",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that tracks outstanding invoices, sends payment reminders at intervals, escalates overdue accounts, and logs collection activities.",
  },
  {
    id: "budget-tracking",
    name: "Budget Tracking Alerts",
    description: "Monitor budgets and alert on overspending.",
    icon: PieChart,
    category: "Finance",
    popular: false,
    usageCount: 890,
    prompt: "Create an automation that tracks spending against budgets, sends alerts when thresholds are reached, and generates variance reports for stakeholders.",
  },

  // HR & RECRUITING
  {
    id: "candidate-screening",
    name: "AI Candidate Screening",
    description: "Screen resumes and rank candidates using AI.",
    icon: Users,
    category: "HR",
    popular: true,
    usageCount: 2340,
    prompt: "Create an automation that receives applications, screens resumes using AI against job requirements, ranks candidates, and schedules initial interviews.",
  },
  {
    id: "employee-onboarding",
    name: "Employee Onboarding",
    description: "Streamline new hire onboarding with automated workflows.",
    icon: Briefcase,
    category: "HR",
    popular: true,
    usageCount: 2120,
    prompt: "Create an automation for employee onboarding that provisions accounts, assigns training, schedules orientation, and tracks completion of first-day/week tasks.",
  },
  {
    id: "interview-scheduler",
    name: "Interview Scheduler",
    description: "Automate interview scheduling across hiring teams.",
    icon: Calendar,
    category: "HR",
    popular: false,
    usageCount: 1560,
    prompt: "Create an automation that coordinates interview schedules between candidates and multiple interviewers, sends reminders, and collects feedback.",
  },
  {
    id: "performance-reviews",
    name: "Performance Review Manager",
    description: "Automate performance review cycles and feedback collection.",
    icon: Target,
    category: "HR",
    popular: false,
    usageCount: 980,
    prompt: "Create an automation that initiates performance review cycles, collects 360 feedback, aggregates results, and generates performance reports.",
  },
  {
    id: "pto-management",
    name: "PTO & Leave Management",
    description: "Automate time-off requests and approvals.",
    icon: Calendar,
    category: "HR",
    popular: false,
    usageCount: 1230,
    prompt: "Create an automation that handles PTO requests, checks balances, routes for approval, updates calendars, and notifies affected team members.",
  },

  // OPERATIONS & IT
  {
    id: "data-sync",
    name: "Two-Way Data Sync",
    description: "Keep data synchronized between multiple systems in real-time.",
    icon: RefreshCw,
    category: "Operations",
    popular: true,
    usageCount: 2750,
    prompt: "Create an automation that synchronizes data bidirectionally between systems, handles conflicts intelligently, logs all changes, and alerts on sync failures.",
  },
  {
    id: "webhook-relay",
    name: "Webhook Transformer",
    description: "Receive, transform, and forward webhook data between services.",
    icon: Webhook,
    category: "Operations",
    popular: false,
    usageCount: 1430,
    prompt: "Create an automation that receives webhook data, transforms it according to custom rules, validates the payload, and forwards it to destination services.",
  },
  {
    id: "system-monitoring",
    name: "System Monitoring & Alerts",
    description: "Monitor systems and send intelligent alerts.",
    icon: Server,
    category: "Operations",
    popular: false,
    usageCount: 1890,
    prompt: "Create an automation that monitors system health, API uptime, and performance metrics, sending intelligent alerts when issues are detected.",
  },
  {
    id: "backup-automation",
    name: "Automated Backup System",
    description: "Automate data backups and verification.",
    icon: Shield,
    category: "Operations",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that performs scheduled backups, verifies backup integrity, manages retention policies, and alerts on backup failures.",
  },
  {
    id: "incident-response",
    name: "Incident Response Automation",
    description: "Automate incident detection and response workflows.",
    icon: Bell,
    category: "Operations",
    popular: false,
    usageCount: 1340,
    prompt: "Create an automation that detects incidents from monitoring data, creates tickets, pages on-call responders, and tracks resolution through to post-mortem.",
  },

  // AI & INTELLIGENCE
  {
    id: "email-processor",
    name: "Email AI Processor",
    description: "Process incoming emails with AI to extract info and take action.",
    icon: Mail,
    category: "AI",
    popular: true,
    usageCount: 2620,
    prompt: "Create an automation that processes incoming emails using AI to extract key information, categorize them, draft responses, and take appropriate actions.",
  },
  {
    id: "document-analyzer",
    name: "AI Document Analyzer",
    description: "Extract insights and data from documents using AI.",
    icon: FileText,
    category: "AI",
    popular: true,
    usageCount: 2180,
    prompt: "Create an automation that processes uploaded documents, extracts key data points using AI, summarizes content, and stores structured data in your systems.",
  },
  {
    id: "sentiment-analysis",
    name: "Sentiment Analysis Engine",
    description: "Analyze sentiment across customer communications.",
    icon: Brain,
    category: "AI",
    popular: false,
    usageCount: 1560,
    prompt: "Create an automation that analyzes sentiment in customer emails, support tickets, reviews, and social mentions, tracking trends and alerting on negative sentiment.",
  },
  {
    id: "ai-meeting-notes",
    name: "AI Meeting Notes",
    description: "Generate meeting summaries and action items automatically.",
    icon: Video,
    category: "AI",
    popular: true,
    usageCount: 1890,
    prompt: "Create an automation that processes meeting recordings, generates summaries, extracts action items, and distributes notes to attendees with task assignments.",
  },
  {
    id: "competitive-intelligence",
    name: "Competitive Intelligence",
    description: "Monitor competitors and generate intelligence reports.",
    icon: Target,
    category: "AI",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that monitors competitor websites, social media, and news, using AI to generate competitive intelligence summaries and alerts.",
  },

  // PRODUCTIVITY & COLLABORATION
  {
    id: "smart-notifications",
    name: "Smart Notifications Hub",
    description: "Consolidate and prioritize notifications intelligently.",
    icon: Bell,
    category: "Productivity",
    popular: true,
    usageCount: 2980,
    prompt: "Create an automation that consolidates notifications from multiple sources, uses AI to prioritize them, and delivers through preferred channels at optimal times.",
  },
  {
    id: "meeting-scheduler",
    name: "Smart Meeting Scheduler",
    description: "Automate meeting scheduling with calendar integration.",
    icon: Calendar,
    category: "Productivity",
    popular: true,
    usageCount: 2280,
    prompt: "Create an automation that handles meeting scheduling requests, finds optimal times across participants, sends invites, and follows up with reminders and agendas.",
  },
  {
    id: "report-generator",
    name: "Automated Reports",
    description: "Generate and deliver beautiful reports on a schedule.",
    icon: FileText,
    category: "Productivity",
    popular: true,
    usageCount: 1890,
    prompt: "Create an automation that generates comprehensive reports from multiple data sources, formats them professionally, and delivers them via email on a schedule.",
  },
  {
    id: "task-automation",
    name: "Task Assignment Bot",
    description: "Automatically create and assign tasks from various inputs.",
    icon: Zap,
    category: "Productivity",
    popular: false,
    usageCount: 1340,
    prompt: "Create an automation that monitors emails, Slack messages, and other inputs for task requests, creates tasks in your project management tool, and assigns them appropriately.",
  },
  {
    id: "standup-automator",
    name: "Standup Automator",
    description: "Collect and compile team standup updates.",
    icon: Users,
    category: "Productivity",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that collects daily standup updates from team members via Slack or email, compiles them, and shares the summary with stakeholders.",
  },

  // REAL ESTATE
  {
    id: "listing-syndication",
    name: "Listing Syndication",
    description: "Automatically publish listings across multiple platforms.",
    icon: Building2,
    category: "Real Estate",
    popular: true,
    usageCount: 1670,
    prompt: "Create an automation that takes property listings and publishes them across multiple real estate platforms, maintaining consistent formatting and updating changes.",
  },
  {
    id: "lead-nurture-realestate",
    name: "Real Estate Lead Nurture",
    description: "Nurture real estate leads with automated follow-ups.",
    icon: Heart,
    category: "Real Estate",
    popular: false,
    usageCount: 1230,
    prompt: "Create an automation that nurtures real estate leads with personalized property recommendations, market updates, and scheduled follow-ups based on their preferences.",
  },
  {
    id: "showing-scheduler",
    name: "Showing Scheduler",
    description: "Automate property showing requests and confirmations.",
    icon: Calendar,
    category: "Real Estate",
    popular: false,
    usageCount: 980,
    prompt: "Create an automation that handles showing requests, coordinates schedules between agents and clients, sends reminders, and collects feedback after showings.",
  },

  // EDUCATION
  {
    id: "student-onboarding",
    name: "Student Onboarding",
    description: "Automate new student enrollment and onboarding.",
    icon: GraduationCap,
    category: "Education",
    popular: true,
    usageCount: 1450,
    prompt: "Create an automation for student onboarding that processes enrollments, creates accounts, assigns courses, sends welcome materials, and tracks completion.",
  },
  {
    id: "course-notifications",
    name: "Course Notification System",
    description: "Send automated course reminders and updates.",
    icon: Bell,
    category: "Education",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that sends course reminders, assignment due dates, new content alerts, and progress reports to students based on their enrolled courses.",
  },
  {
    id: "certification-manager",
    name: "Certification Manager",
    description: "Automate certification issuance and renewal tracking.",
    icon: FileText,
    category: "Education",
    popular: false,
    usageCount: 890,
    prompt: "Create an automation that tracks course completions, issues certificates, monitors expiration dates, and sends renewal reminders to certificate holders.",
  },

  // HEALTHCARE
  {
    id: "appointment-reminders",
    name: "Appointment Reminders",
    description: "Send automated appointment reminders via SMS and email.",
    icon: Calendar,
    category: "Healthcare",
    popular: true,
    usageCount: 2340,
    prompt: "Create an automation that sends appointment reminders via SMS and email at configurable intervals, with easy rescheduling links and confirmation tracking.",
  },
  {
    id: "patient-intake",
    name: "Patient Intake Automation",
    description: "Streamline patient intake with digital forms and processing.",
    icon: FileText,
    category: "Healthcare",
    popular: false,
    usageCount: 1560,
    prompt: "Create an automation that sends pre-visit intake forms, processes responses, validates insurance, and prepares patient records before appointments.",
  },
  {
    id: "follow-up-care",
    name: "Follow-up Care Coordinator",
    description: "Automate post-visit follow-ups and care instructions.",
    icon: Heart,
    category: "Healthcare",
    popular: false,
    usageCount: 1120,
    prompt: "Create an automation that sends post-visit care instructions, medication reminders, follow-up scheduling prompts, and collects patient feedback.",
  },

  // LEGAL
  {
    id: "contract-analyzer",
    name: "AI Contract Analyzer",
    description: "Analyze contracts for risks and key terms using AI.",
    icon: FileText,
    category: "Legal",
    popular: true,
    usageCount: 1670,
    prompt: "Create an automation that analyzes contracts using AI to identify key terms, potential risks, missing clauses, and generates summary reports for review.",
  },
  {
    id: "deadline-tracker",
    name: "Legal Deadline Tracker",
    description: "Track and alert on legal deadlines and filing dates.",
    icon: Clock,
    category: "Legal",
    popular: false,
    usageCount: 1230,
    prompt: "Create an automation that tracks court deadlines, statute of limitations, filing dates, and sends escalating reminders to responsible attorneys and staff.",
  },
  {
    id: "client-billing-legal",
    name: "Legal Time & Billing",
    description: "Automate legal time tracking and invoice generation.",
    icon: DollarSign,
    category: "Legal",
    popular: false,
    usageCount: 980,
    prompt: "Create an automation that tracks billable time, generates detailed invoices, tracks payments, and sends statements to clients at regular intervals.",
  },
];

const CATEGORIES = [
  "All",
  "Sales",
  "Marketing",
  "Customer Success",
  "Support",
  "E-commerce",
  "Finance",
  "HR",
  "Operations",
  "AI",
  "Productivity",
  "Real Estate",
  "Education",
  "Healthcare",
  "Legal",
];

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

  const popularTemplates = TEMPLATES.filter((t) => t.popular).sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);

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
        <h2 className="text-2xl font-bold mb-2">Automation Templates</h2>
        <p className="text-muted-foreground">
          Choose from {TEMPLATES.length}+ pre-built templates to get started in seconds
        </p>
      </div>

      {/* Popular Templates */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Most Popular
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularTemplates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-violet-300 group relative overflow-hidden"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full" />
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:from-violet-200 group-hover:to-indigo-200 transition-colors">
                  <template.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h4 className="font-semibold mb-1">{template.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    {template.usageCount.toLocaleString()} uses
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
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
              className={selectedCategory === category ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Template Count */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {selectedCategory === "All" ? "All Templates" : `${selectedCategory} Templates`}
        </h3>
        <Badge variant="outline" className="text-violet-600 border-violet-200">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* All Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No templates found matching your criteria</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-all hover:border-violet-200 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:from-violet-200 group-hover:to-indigo-200 transition-colors">
                    <template.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  {template.popular && (
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  )}
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

      {/* Custom CTA */}
      <Card className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border-violet-200">
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Need something custom?</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Describe what you want to automate in plain English and our AI will build it for you in seconds.
          </p>
          <Button onClick={() => router.push("/portal/builder")} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            Create Custom Automation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
