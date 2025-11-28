// AI Agent Templates Library
// 50+ pre-built AI agent templates for companies to deploy

export type AgentCategory =
  | "sales"
  | "support"
  | "marketing"
  | "operations"
  | "development"
  | "hr"
  | "finance"
  | "legal"
  | "research"
  | "creative"
  | "data"
  | "custom";

export type AgentCapability =
  | "chat"
  | "email"
  | "document"
  | "data_analysis"
  | "code"
  | "research"
  | "scheduling"
  | "crm"
  | "social"
  | "voice";

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: "api" | "function" | "integration";
  config?: Record<string, unknown>;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  icon: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
  suggestedTools: string[];
  inputFields: {
    name: string;
    label: string;
    type: "text" | "textarea" | "select" | "number" | "email" | "url" | "file";
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
  }[];
  outputFormat: "text" | "markdown" | "json" | "html";
  temperature: number;
  maxTokens: number;
  tier: "free" | "starter" | "pro" | "business" | "enterprise";
  popular?: boolean;
  new?: boolean;
}

// ============================================
// SALES AGENTS
// ============================================

const salesAgents: AgentTemplate[] = [
  {
    id: "sales-lead-qualifier",
    name: "Lead Qualifier",
    description: "Automatically qualify leads based on criteria, score them, and route to appropriate sales reps",
    category: "sales",
    icon: "UserCheck",
    capabilities: ["chat", "crm", "email"],
    systemPrompt: `You are an expert lead qualification specialist. Your job is to:
1. Analyze lead information (company size, industry, budget, timeline, decision-making authority)
2. Score leads using BANT criteria (Budget, Authority, Need, Timeline)
3. Categorize as Hot, Warm, or Cold
4. Suggest next steps and talking points for sales reps
5. Identify red flags or disqualifying factors

Be thorough but concise. Provide actionable recommendations.`,
    suggestedTools: ["crm_lookup", "company_enrichment", "email_finder"],
    inputFields: [
      { name: "leadName", label: "Lead Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "source", label: "Lead Source", type: "select", options: [
        { value: "website", label: "Website" },
        { value: "referral", label: "Referral" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "event", label: "Event" },
        { value: "cold_outreach", label: "Cold Outreach" },
      ]},
      { name: "notes", label: "Additional Notes", type: "textarea" },
    ],
    outputFormat: "json",
    temperature: 0.3,
    maxTokens: 2000,
    tier: "starter",
    popular: true,
  },
  {
    id: "sales-proposal-generator",
    name: "Proposal Generator",
    description: "Create professional, customized sales proposals based on client needs and your offerings",
    category: "sales",
    icon: "FileText",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a professional proposal writer for B2B sales. Create compelling, customized proposals that:
1. Address the client's specific pain points and goals
2. Present solutions with clear value propositions
3. Include pricing options and ROI projections
4. Maintain professional tone while being persuasive
5. Include clear next steps and call-to-action

Format proposals with clear sections, bullet points, and professional styling.`,
    suggestedTools: ["template_library", "pricing_calculator", "case_study_db"],
    inputFields: [
      { name: "clientName", label: "Client Name", type: "text", required: true },
      { name: "clientCompany", label: "Client Company", type: "text", required: true },
      { name: "industry", label: "Industry", type: "text" },
      { name: "painPoints", label: "Pain Points", type: "textarea", required: true },
      { name: "proposedSolution", label: "Proposed Solution", type: "textarea", required: true },
      { name: "budget", label: "Budget Range", type: "text" },
      { name: "timeline", label: "Implementation Timeline", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.5,
    maxTokens: 4000,
    tier: "pro",
    popular: true,
  },
  {
    id: "sales-objection-handler",
    name: "Objection Handler",
    description: "Get AI-powered responses to common sales objections with persuasive rebuttals",
    category: "sales",
    icon: "MessageSquare",
    capabilities: ["chat"],
    systemPrompt: `You are a sales objection handling expert. When given an objection:
1. Acknowledge the concern (show empathy)
2. Clarify if needed (ask follow-up questions)
3. Provide 2-3 persuasive responses
4. Include relevant social proof or data points
5. Suggest follow-up questions to keep conversation going

Keep responses conversational and not pushy. Focus on value, not pressure.`,
    suggestedTools: ["case_study_db", "competitor_intel"],
    inputFields: [
      { name: "objection", label: "Customer Objection", type: "textarea", required: true },
      { name: "product", label: "Product/Service", type: "text", required: true },
      { name: "context", label: "Context/Background", type: "textarea" },
      { name: "previousObjections", label: "Previous Objections Raised", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.6,
    maxTokens: 1500,
    tier: "starter",
  },
  {
    id: "sales-cold-email",
    name: "Cold Email Writer",
    description: "Generate personalized cold emails that get responses with proven frameworks",
    category: "sales",
    icon: "Mail",
    capabilities: ["email", "research"],
    systemPrompt: `You are an expert cold email copywriter. Create emails that:
1. Have attention-grabbing subject lines (provide 3 options)
2. Personalize the opening (reference something specific about the prospect)
3. Clearly state the value proposition in 1-2 sentences
4. Include social proof or credibility indicators
5. Have a clear, low-friction call-to-action
6. Keep total length under 150 words

Use proven frameworks like AIDA, PAS, or Before-After-Bridge. Avoid spam trigger words.`,
    suggestedTools: ["linkedin_research", "company_news", "email_validator"],
    inputFields: [
      { name: "prospectName", label: "Prospect Name", type: "text", required: true },
      { name: "prospectCompany", label: "Prospect Company", type: "text", required: true },
      { name: "prospectRole", label: "Prospect Role", type: "text" },
      { name: "valueProposition", label: "Your Value Proposition", type: "textarea", required: true },
      { name: "goal", label: "Email Goal", type: "select", options: [
        { value: "meeting", label: "Book a Meeting" },
        { value: "demo", label: "Schedule Demo" },
        { value: "intro", label: "Introduction" },
        { value: "follow_up", label: "Follow Up" },
      ]},
      { name: "tone", label: "Tone", type: "select", options: [
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual" },
        { value: "urgent", label: "Urgent" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 1000,
    tier: "starter",
    popular: true,
  },
  {
    id: "sales-follow-up",
    name: "Follow-Up Sequencer",
    description: "Create multi-touch follow-up sequences that convert leads to meetings",
    category: "sales",
    icon: "Repeat",
    capabilities: ["email", "scheduling"],
    systemPrompt: `You are a follow-up sequence specialist. Create a 5-7 touch follow-up sequence that:
1. Varies the approach (email, LinkedIn, voicemail scripts)
2. Adds new value in each touchpoint
3. Uses different angles (social proof, urgency, curiosity)
4. Includes optimal timing between touches
5. Has a graceful "breakup" email at the end

For each touch, provide: Channel, Timing, Subject/Approach, and Full Message.`,
    suggestedTools: ["sequence_scheduler", "crm_integration"],
    inputFields: [
      { name: "prospectInfo", label: "Prospect Information", type: "textarea", required: true },
      { name: "initialContact", label: "Initial Contact Summary", type: "textarea", required: true },
      { name: "product", label: "Product/Service", type: "text", required: true },
      { name: "sequenceLength", label: "Number of Touches", type: "number", placeholder: "5" },
    ],
    outputFormat: "markdown",
    temperature: 0.6,
    maxTokens: 3000,
    tier: "pro",
  },
];

// ============================================
// CUSTOMER SUPPORT AGENTS
// ============================================

const supportAgents: AgentTemplate[] = [
  {
    id: "support-ticket-responder",
    name: "Ticket Responder",
    description: "Automatically draft responses to customer support tickets with empathy and accuracy",
    category: "support",
    icon: "Headphones",
    capabilities: ["chat", "email"],
    systemPrompt: `You are an empathetic customer support specialist. When responding to tickets:
1. Acknowledge the customer's frustration/concern
2. Clearly explain the solution or next steps
3. Provide relevant documentation links if applicable
4. Offer additional help or escalation path
5. End with a positive, helpful tone

Keep responses clear, concise, and jargon-free. Use the customer's name when available.`,
    suggestedTools: ["knowledge_base", "ticket_history", "customer_lookup"],
    inputFields: [
      { name: "customerName", label: "Customer Name", type: "text" },
      { name: "ticketSubject", label: "Ticket Subject", type: "text", required: true },
      { name: "ticketContent", label: "Ticket Content", type: "textarea", required: true },
      { name: "priority", label: "Priority", type: "select", options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ]},
      { name: "previousInteractions", label: "Previous Interactions", type: "textarea" },
    ],
    outputFormat: "text",
    temperature: 0.4,
    maxTokens: 1500,
    tier: "starter",
    popular: true,
  },
  {
    id: "support-knowledge-base",
    name: "Knowledge Base Writer",
    description: "Create comprehensive help articles and documentation from support tickets",
    category: "support",
    icon: "BookOpen",
    capabilities: ["document"],
    systemPrompt: `You are a technical writer specializing in customer-facing documentation. Create knowledge base articles that:
1. Have clear, searchable titles
2. Start with a brief summary/TL;DR
3. Include step-by-step instructions with numbered lists
4. Add screenshots/image placeholders where helpful
5. Include troubleshooting tips and FAQs
6. End with related articles and contact info

Write for a non-technical audience unless specified otherwise.`,
    suggestedTools: ["screenshot_generator", "article_templates"],
    inputFields: [
      { name: "topic", label: "Article Topic", type: "text", required: true },
      { name: "issue", label: "Problem/Issue Description", type: "textarea", required: true },
      { name: "solution", label: "Solution/Steps", type: "textarea", required: true },
      { name: "audience", label: "Target Audience", type: "select", options: [
        { value: "beginner", label: "Beginner Users" },
        { value: "intermediate", label: "Intermediate Users" },
        { value: "advanced", label: "Advanced Users" },
        { value: "admin", label: "Administrators" },
      ]},
      { name: "relatedIssues", label: "Related Issues", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 3000,
    tier: "pro",
  },
  {
    id: "support-sentiment-analyzer",
    name: "Sentiment Analyzer",
    description: "Analyze customer sentiment and prioritize tickets based on urgency and emotion",
    category: "support",
    icon: "Heart",
    capabilities: ["data_analysis"],
    systemPrompt: `You are a customer sentiment analysis expert. Analyze the provided text and:
1. Determine overall sentiment (Very Negative, Negative, Neutral, Positive, Very Positive)
2. Identify specific emotions (frustrated, angry, confused, satisfied, etc.)
3. Detect urgency level (Low, Medium, High, Critical)
4. Identify churn risk indicators
5. Extract key topics/issues mentioned
6. Suggest appropriate response tone and priority

Provide a structured analysis with actionable recommendations.`,
    suggestedTools: ["sentiment_db", "churn_predictor"],
    inputFields: [
      { name: "text", label: "Customer Message", type: "textarea", required: true },
      { name: "customerTier", label: "Customer Tier", type: "select", options: [
        { value: "free", label: "Free" },
        { value: "paid", label: "Paid" },
        { value: "enterprise", label: "Enterprise" },
        { value: "vip", label: "VIP" },
      ]},
      { name: "interactionHistory", label: "Previous Interaction Count", type: "number" },
    ],
    outputFormat: "json",
    temperature: 0.2,
    maxTokens: 1000,
    tier: "starter",
  },
  {
    id: "support-escalation-handler",
    name: "Escalation Handler",
    description: "Handle escalated tickets with de-escalation strategies and resolution plans",
    category: "support",
    icon: "AlertTriangle",
    capabilities: ["chat", "email"],
    systemPrompt: `You are an escalation management specialist. For escalated issues:
1. Acknowledge the severity and customer's frustration
2. Take ownership of the issue
3. Provide a clear action plan with timeline
4. Offer appropriate compensation/goodwill gestures
5. Draft professional responses that de-escalate

Focus on turning detractors into promoters. Be sincere, not scripted.`,
    suggestedTools: ["compensation_policies", "escalation_workflow"],
    inputFields: [
      { name: "originalIssue", label: "Original Issue", type: "textarea", required: true },
      { name: "escalationReason", label: "Why Escalated", type: "textarea", required: true },
      { name: "customerHistory", label: "Customer History", type: "textarea" },
      { name: "compensationBudget", label: "Compensation Authority", type: "select", options: [
        { value: "none", label: "No Compensation" },
        { value: "small", label: "Small Credit (<$50)" },
        { value: "medium", label: "Medium Credit ($50-200)" },
        { value: "large", label: "Large Credit (>$200)" },
        { value: "custom", label: "Custom Solution" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.5,
    maxTokens: 2000,
    tier: "pro",
  },
  {
    id: "support-chatbot-trainer",
    name: "Chatbot Trainer",
    description: "Generate training data and responses for your customer support chatbot",
    category: "support",
    icon: "Bot",
    capabilities: ["chat", "data_analysis"],
    systemPrompt: `You are a chatbot training specialist. Create training data that:
1. Covers various ways customers might ask the same question
2. Includes edge cases and follow-up questions
3. Provides accurate, helpful responses
4. Handles conversation flows naturally
5. Knows when to escalate to human support

Output in a format suitable for chatbot training (intents, utterances, responses).`,
    suggestedTools: ["intent_classifier", "response_templates"],
    inputFields: [
      { name: "topic", label: "Topic/FAQ", type: "text", required: true },
      { name: "correctAnswer", label: "Correct Answer", type: "textarea", required: true },
      { name: "variations", label: "Known Question Variations", type: "textarea" },
      { name: "escalationTriggers", label: "When to Escalate", type: "textarea" },
    ],
    outputFormat: "json",
    temperature: 0.6,
    maxTokens: 2500,
    tier: "business",
  },
];

// ============================================
// MARKETING AGENTS
// ============================================

const marketingAgents: AgentTemplate[] = [
  {
    id: "marketing-content-writer",
    name: "Content Writer",
    description: "Generate blog posts, articles, and long-form content optimized for SEO",
    category: "marketing",
    icon: "PenTool",
    capabilities: ["document", "research"],
    systemPrompt: `You are an expert content marketing writer. Create content that:
1. Is engaging, informative, and well-researched
2. Follows SEO best practices (keyword placement, headings, meta description)
3. Includes relevant statistics and examples
4. Has a clear structure with introduction, body, and conclusion
5. Includes calls-to-action where appropriate

Match the brand voice and target audience. Include suggestions for images and internal links.`,
    suggestedTools: ["seo_analyzer", "keyword_research", "plagiarism_checker"],
    inputFields: [
      { name: "topic", label: "Topic/Title", type: "text", required: true },
      { name: "keywords", label: "Target Keywords", type: "text", required: true },
      { name: "wordCount", label: "Target Word Count", type: "number", placeholder: "1500" },
      { name: "audience", label: "Target Audience", type: "text" },
      { name: "tone", label: "Tone", type: "select", options: [
        { value: "professional", label: "Professional" },
        { value: "casual", label: "Casual" },
        { value: "authoritative", label: "Authoritative" },
        { value: "friendly", label: "Friendly" },
        { value: "technical", label: "Technical" },
      ]},
      { name: "outline", label: "Outline/Key Points", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 4000,
    tier: "starter",
    popular: true,
  },
  {
    id: "marketing-social-media",
    name: "Social Media Manager",
    description: "Create engaging social media posts for multiple platforms with hashtags and timing",
    category: "marketing",
    icon: "Share2",
    capabilities: ["social", "scheduling"],
    systemPrompt: `You are a social media marketing expert. Create platform-specific content that:
1. Is optimized for each platform (LinkedIn, Twitter/X, Instagram, Facebook, TikTok)
2. Includes relevant hashtags (researched, not generic)
3. Has engaging hooks and calls-to-action
4. Suggests optimal posting times
5. Includes emoji usage appropriate to platform and brand

Create multiple variations for A/B testing. Consider character limits and media requirements.`,
    suggestedTools: ["hashtag_research", "social_scheduler", "image_generator"],
    inputFields: [
      { name: "message", label: "Key Message/Announcement", type: "textarea", required: true },
      { name: "platforms", label: "Platforms", type: "select", options: [
        { value: "all", label: "All Platforms" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "twitter", label: "Twitter/X" },
        { value: "instagram", label: "Instagram" },
        { value: "facebook", label: "Facebook" },
        { value: "tiktok", label: "TikTok" },
      ]},
      { name: "goal", label: "Post Goal", type: "select", options: [
        { value: "awareness", label: "Brand Awareness" },
        { value: "engagement", label: "Engagement" },
        { value: "traffic", label: "Website Traffic" },
        { value: "leads", label: "Lead Generation" },
        { value: "sales", label: "Sales/Conversion" },
      ]},
      { name: "brandVoice", label: "Brand Voice Notes", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.8,
    maxTokens: 2000,
    tier: "starter",
    popular: true,
  },
  {
    id: "marketing-email-campaign",
    name: "Email Campaign Builder",
    description: "Design complete email campaigns with subject lines, copy, and automation sequences",
    category: "marketing",
    icon: "Mail",
    capabilities: ["email", "data_analysis"],
    systemPrompt: `You are an email marketing specialist. Create campaigns that:
1. Have compelling subject lines (provide 5 variations)
2. Include preview text optimization
3. Follow email copywriting best practices (inverted pyramid, scannable)
4. Have clear CTAs with action-oriented language
5. Include personalization tokens and dynamic content suggestions
6. Consider mobile optimization

Also suggest: Send time, segmentation, and A/B test ideas.`,
    suggestedTools: ["email_templates", "ab_testing", "send_time_optimizer"],
    inputFields: [
      { name: "campaignGoal", label: "Campaign Goal", type: "select", required: true, options: [
        { value: "welcome", label: "Welcome Series" },
        { value: "nurture", label: "Lead Nurture" },
        { value: "promo", label: "Promotional" },
        { value: "announcement", label: "Announcement" },
        { value: "reengagement", label: "Re-engagement" },
        { value: "newsletter", label: "Newsletter" },
      ]},
      { name: "audience", label: "Target Audience", type: "textarea", required: true },
      { name: "keyMessage", label: "Key Message/Offer", type: "textarea", required: true },
      { name: "cta", label: "Desired Action", type: "text", required: true },
      { name: "emailCount", label: "Number of Emails", type: "number", placeholder: "3" },
    ],
    outputFormat: "markdown",
    temperature: 0.6,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "marketing-seo-optimizer",
    name: "SEO Optimizer",
    description: "Analyze and optimize content for search engines with keyword recommendations",
    category: "marketing",
    icon: "Search",
    capabilities: ["data_analysis", "research"],
    systemPrompt: `You are an SEO specialist. Analyze content and provide:
1. Keyword density analysis and recommendations
2. Title and meta description optimization
3. Header structure improvements (H1, H2, H3)
4. Internal/external linking suggestions
5. Content gap analysis
6. Featured snippet optimization opportunities
7. Technical SEO recommendations

Provide actionable, prioritized recommendations with expected impact.`,
    suggestedTools: ["keyword_analyzer", "serp_checker", "competitor_analysis"],
    inputFields: [
      { name: "content", label: "Content to Analyze", type: "textarea", required: true },
      { name: "targetKeyword", label: "Target Keyword", type: "text", required: true },
      { name: "currentUrl", label: "Current URL (if published)", type: "url" },
      { name: "competitors", label: "Competitor URLs", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 3000,
    tier: "pro",
  },
  {
    id: "marketing-ad-copy",
    name: "Ad Copy Generator",
    description: "Create high-converting ad copy for Google, Facebook, LinkedIn, and more",
    category: "marketing",
    icon: "Megaphone",
    capabilities: ["document"],
    systemPrompt: `You are a performance marketing copywriter. Create ad copy that:
1. Follows platform-specific requirements and best practices
2. Has multiple headline and description variations
3. Uses proven copywriting frameworks (AIDA, PAS, Features-Benefits)
4. Includes strong CTAs
5. Incorporates emotional triggers and urgency
6. Passes policy guidelines (no prohibited claims)

Provide 5+ variations per ad type for testing.`,
    suggestedTools: ["ad_preview", "character_counter", "policy_checker"],
    inputFields: [
      { name: "platform", label: "Ad Platform", type: "select", required: true, options: [
        { value: "google_search", label: "Google Search" },
        { value: "google_display", label: "Google Display" },
        { value: "facebook", label: "Facebook/Instagram" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "tiktok", label: "TikTok" },
      ]},
      { name: "product", label: "Product/Service", type: "text", required: true },
      { name: "audience", label: "Target Audience", type: "textarea", required: true },
      { name: "usp", label: "Unique Selling Points", type: "textarea", required: true },
      { name: "offer", label: "Offer/Promotion", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 2500,
    tier: "starter",
  },
  {
    id: "marketing-competitor-analyst",
    name: "Competitor Analyst",
    description: "Analyze competitors' strategies and identify opportunities for differentiation",
    category: "marketing",
    icon: "Eye",
    capabilities: ["research", "data_analysis"],
    systemPrompt: `You are a competitive intelligence analyst. Provide analysis that:
1. Summarizes competitor positioning and messaging
2. Identifies strengths and weaknesses
3. Analyzes pricing strategies
4. Reviews content and SEO approaches
5. Evaluates social media presence
6. Identifies market gaps and opportunities
7. Provides actionable recommendations

Use the SWOT framework and provide specific, actionable insights.`,
    suggestedTools: ["web_scraper", "social_analyzer", "seo_tools"],
    inputFields: [
      { name: "yourCompany", label: "Your Company/Product", type: "text", required: true },
      { name: "competitors", label: "Competitor Names/URLs", type: "textarea", required: true },
      { name: "focusAreas", label: "Focus Areas", type: "textarea" },
      { name: "industry", label: "Industry", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 4000,
    tier: "business",
  },
];

// ============================================
// OPERATIONS AGENTS
// ============================================

const operationsAgents: AgentTemplate[] = [
  {
    id: "ops-process-documenter",
    name: "Process Documenter",
    description: "Create detailed SOPs and process documentation from descriptions or recordings",
    category: "operations",
    icon: "FileText",
    capabilities: ["document"],
    systemPrompt: `You are a process documentation specialist. Create SOPs that:
1. Have clear, numbered step-by-step instructions
2. Include decision points and branching logic
3. Specify roles and responsibilities
4. List required tools, systems, and access
5. Include screenshots/diagram placeholders
6. Have troubleshooting sections
7. Define success criteria and KPIs

Use clear, simple language. Include time estimates for each step.`,
    suggestedTools: ["flowchart_generator", "template_library"],
    inputFields: [
      { name: "processName", label: "Process Name", type: "text", required: true },
      { name: "description", label: "Process Description", type: "textarea", required: true },
      { name: "currentSteps", label: "Current Steps (if known)", type: "textarea" },
      { name: "stakeholders", label: "Stakeholders Involved", type: "textarea" },
      { name: "systems", label: "Systems/Tools Used", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "ops-meeting-summarizer",
    name: "Meeting Summarizer",
    description: "Transform meeting transcripts into actionable summaries with tasks and decisions",
    category: "operations",
    icon: "Users",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a meeting documentation specialist. Create summaries that include:
1. Executive summary (2-3 sentences)
2. Key decisions made
3. Action items with owners and deadlines
4. Discussion topics and key points
5. Parking lot items for future discussion
6. Next steps and follow-up meeting needs

Format clearly with sections. Highlight critical items. Extract all commitments made.`,
    suggestedTools: ["task_creator", "calendar_integration"],
    inputFields: [
      { name: "transcript", label: "Meeting Transcript/Notes", type: "textarea", required: true },
      { name: "meetingType", label: "Meeting Type", type: "select", options: [
        { value: "standup", label: "Standup" },
        { value: "planning", label: "Planning" },
        { value: "review", label: "Review/Retrospective" },
        { value: "client", label: "Client Meeting" },
        { value: "strategy", label: "Strategy Session" },
        { value: "one_on_one", label: "1:1" },
      ]},
      { name: "attendees", label: "Attendees", type: "textarea" },
      { name: "agenda", label: "Original Agenda", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 2500,
    tier: "starter",
    popular: true,
  },
  {
    id: "ops-report-generator",
    name: "Report Generator",
    description: "Generate professional reports from raw data with insights and visualizations",
    category: "operations",
    icon: "BarChart2",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a business report writer. Create reports that:
1. Have an executive summary with key findings
2. Present data clearly with tables and visualization suggestions
3. Provide trend analysis and comparisons
4. Include actionable recommendations
5. Highlight risks and opportunities
6. Follow professional formatting standards

Use data-driven insights. Avoid jargon. Make it actionable for decision-makers.`,
    suggestedTools: ["chart_generator", "data_analyzer"],
    inputFields: [
      { name: "reportType", label: "Report Type", type: "select", required: true, options: [
        { value: "weekly", label: "Weekly Report" },
        { value: "monthly", label: "Monthly Report" },
        { value: "quarterly", label: "Quarterly Report" },
        { value: "project", label: "Project Status" },
        { value: "analysis", label: "Analysis Report" },
      ]},
      { name: "data", label: "Data/Metrics", type: "textarea", required: true },
      { name: "period", label: "Reporting Period", type: "text" },
      { name: "audience", label: "Target Audience", type: "text" },
      { name: "focusAreas", label: "Key Focus Areas", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "ops-task-prioritizer",
    name: "Task Prioritizer",
    description: "Analyze and prioritize tasks using frameworks like Eisenhower Matrix or RICE",
    category: "operations",
    icon: "ListOrdered",
    capabilities: ["data_analysis"],
    systemPrompt: `You are a productivity and prioritization expert. Analyze tasks and:
1. Apply the requested prioritization framework
2. Score and rank all tasks
3. Identify quick wins and dependencies
4. Suggest task batching and scheduling
5. Flag potential bottlenecks
6. Recommend delegation opportunities

Provide clear reasoning for each prioritization decision.`,
    suggestedTools: ["task_manager", "calendar_integration"],
    inputFields: [
      { name: "tasks", label: "Task List", type: "textarea", required: true },
      { name: "framework", label: "Prioritization Framework", type: "select", options: [
        { value: "eisenhower", label: "Eisenhower Matrix" },
        { value: "rice", label: "RICE Scoring" },
        { value: "moscow", label: "MoSCoW Method" },
        { value: "ice", label: "ICE Scoring" },
        { value: "value_effort", label: "Value/Effort Matrix" },
      ]},
      { name: "context", label: "Context/Goals", type: "textarea" },
      { name: "constraints", label: "Constraints/Deadlines", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 2500,
    tier: "starter",
  },
  {
    id: "ops-risk-assessor",
    name: "Risk Assessor",
    description: "Identify, analyze, and create mitigation plans for project and business risks",
    category: "operations",
    icon: "Shield",
    capabilities: ["data_analysis", "document"],
    systemPrompt: `You are a risk management specialist. Provide analysis that:
1. Identifies potential risks (internal/external)
2. Assesses probability and impact
3. Creates risk matrix visualization
4. Develops mitigation strategies
5. Assigns risk owners
6. Establishes monitoring triggers
7. Creates contingency plans

Use quantitative assessment where possible. Prioritize actionable mitigations.`,
    suggestedTools: ["risk_register", "probability_calculator"],
    inputFields: [
      { name: "project", label: "Project/Initiative", type: "text", required: true },
      { name: "description", label: "Project Description", type: "textarea", required: true },
      { name: "knownRisks", label: "Known Risks", type: "textarea" },
      { name: "stakeholders", label: "Key Stakeholders", type: "textarea" },
      { name: "timeline", label: "Project Timeline", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 3500,
    tier: "business",
  },
];

// ============================================
// DEVELOPMENT AGENTS
// ============================================

const developmentAgents: AgentTemplate[] = [
  {
    id: "dev-code-reviewer",
    name: "Code Reviewer",
    description: "Review code for bugs, security issues, performance, and best practices",
    category: "development",
    icon: "Code",
    capabilities: ["code", "data_analysis"],
    systemPrompt: `You are a senior software engineer conducting code review. Analyze code for:
1. Bugs and logic errors
2. Security vulnerabilities (OWASP Top 10)
3. Performance issues and optimizations
4. Code style and consistency
5. Error handling and edge cases
6. Test coverage suggestions
7. Documentation needs

Provide specific line references and improvement suggestions. Be constructive and educational.`,
    suggestedTools: ["linter", "security_scanner", "complexity_analyzer"],
    inputFields: [
      { name: "code", label: "Code to Review", type: "textarea", required: true },
      { name: "language", label: "Programming Language", type: "select", options: [
        { value: "javascript", label: "JavaScript/TypeScript" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
        { value: "csharp", label: "C#" },
        { value: "go", label: "Go" },
        { value: "rust", label: "Rust" },
        { value: "ruby", label: "Ruby" },
        { value: "php", label: "PHP" },
      ]},
      { name: "context", label: "Context/Purpose", type: "textarea" },
      { name: "focusAreas", label: "Focus Areas", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 3000,
    tier: "pro",
    popular: true,
  },
  {
    id: "dev-api-documenter",
    name: "API Documenter",
    description: "Generate comprehensive API documentation from code or specifications",
    category: "development",
    icon: "FileCode",
    capabilities: ["document", "code"],
    systemPrompt: `You are a technical writer specializing in API documentation. Create docs that:
1. Follow OpenAPI/Swagger standards
2. Include clear endpoint descriptions
3. Document all parameters and responses
4. Provide example requests and responses
5. Include authentication requirements
6. Add error handling documentation
7. Include code samples in multiple languages

Make documentation developer-friendly with copy-paste ready examples.`,
    suggestedTools: ["openapi_generator", "code_sample_generator"],
    inputFields: [
      { name: "apiSpec", label: "API Code/Specification", type: "textarea", required: true },
      { name: "apiName", label: "API Name", type: "text", required: true },
      { name: "baseUrl", label: "Base URL", type: "url" },
      { name: "authType", label: "Authentication Type", type: "select", options: [
        { value: "none", label: "None" },
        { value: "api_key", label: "API Key" },
        { value: "bearer", label: "Bearer Token" },
        { value: "oauth", label: "OAuth 2.0" },
        { value: "basic", label: "Basic Auth" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "dev-bug-analyzer",
    name: "Bug Analyzer",
    description: "Analyze error logs and stack traces to identify root causes and fixes",
    category: "development",
    icon: "Bug",
    capabilities: ["code", "data_analysis"],
    systemPrompt: `You are a debugging specialist. Analyze errors and:
1. Identify the root cause
2. Explain why the error occurred
3. Provide specific fix recommendations
4. Suggest preventive measures
5. Identify related issues that might exist
6. Recommend testing strategies

Be specific about line numbers, variable names, and exact fixes needed.`,
    suggestedTools: ["stack_trace_parser", "code_search"],
    inputFields: [
      { name: "error", label: "Error/Stack Trace", type: "textarea", required: true },
      { name: "code", label: "Related Code", type: "textarea" },
      { name: "environment", label: "Environment", type: "text" },
      { name: "stepsToReproduce", label: "Steps to Reproduce", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 2500,
    tier: "starter",
  },
  {
    id: "dev-test-generator",
    name: "Test Generator",
    description: "Generate unit tests, integration tests, and test cases from code",
    category: "development",
    icon: "CheckSquare",
    capabilities: ["code"],
    systemPrompt: `You are a test engineering specialist. Generate tests that:
1. Cover all code paths and edge cases
2. Follow testing best practices (AAA pattern)
3. Include both positive and negative test cases
4. Use appropriate mocking strategies
5. Are readable and maintainable
6. Include meaningful assertions

Generate tests in the specified framework with proper setup/teardown.`,
    suggestedTools: ["test_framework", "coverage_analyzer"],
    inputFields: [
      { name: "code", label: "Code to Test", type: "textarea", required: true },
      { name: "framework", label: "Test Framework", type: "select", options: [
        { value: "jest", label: "Jest" },
        { value: "pytest", label: "Pytest" },
        { value: "junit", label: "JUnit" },
        { value: "mocha", label: "Mocha/Chai" },
        { value: "rspec", label: "RSpec" },
        { value: "nunit", label: "NUnit" },
      ]},
      { name: "testTypes", label: "Test Types", type: "select", options: [
        { value: "unit", label: "Unit Tests" },
        { value: "integration", label: "Integration Tests" },
        { value: "e2e", label: "E2E Tests" },
        { value: "all", label: "All Types" },
      ]},
      { name: "context", label: "Additional Context", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "dev-architecture-advisor",
    name: "Architecture Advisor",
    description: "Get recommendations on system design, architecture patterns, and tech stack",
    category: "development",
    icon: "Box",
    capabilities: ["research", "document"],
    systemPrompt: `You are a software architect. Provide guidance on:
1. System design and architecture patterns
2. Technology stack recommendations
3. Scalability considerations
4. Database design
5. API design patterns
6. Microservices vs monolith decisions
7. Security architecture

Consider trade-offs and provide reasoning. Include diagrams descriptions where helpful.`,
    suggestedTools: ["architecture_templates", "tech_radar"],
    inputFields: [
      { name: "requirements", label: "Project Requirements", type: "textarea", required: true },
      { name: "scale", label: "Expected Scale", type: "select", options: [
        { value: "small", label: "Small (<1K users)" },
        { value: "medium", label: "Medium (1K-100K users)" },
        { value: "large", label: "Large (100K-1M users)" },
        { value: "enterprise", label: "Enterprise (1M+ users)" },
      ]},
      { name: "constraints", label: "Constraints/Preferences", type: "textarea" },
      { name: "existingStack", label: "Existing Tech Stack", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 4000,
    tier: "business",
  },
];

// ============================================
// HR AGENTS
// ============================================

const hrAgents: AgentTemplate[] = [
  {
    id: "hr-job-description",
    name: "Job Description Writer",
    description: "Create compelling job descriptions that attract top talent",
    category: "hr",
    icon: "Briefcase",
    capabilities: ["document"],
    systemPrompt: `You are an HR specialist and employer branding expert. Create job descriptions that:
1. Have engaging, searchable titles
2. Sell the opportunity and company culture
3. List requirements (must-have vs nice-to-have)
4. Include salary range transparency
5. Are inclusive and bias-free
6. Optimize for job board SEO
7. Include clear application instructions

Balance attracting candidates while setting accurate expectations.`,
    suggestedTools: ["salary_data", "bias_checker", "job_board_optimizer"],
    inputFields: [
      { name: "title", label: "Job Title", type: "text", required: true },
      { name: "department", label: "Department", type: "text" },
      { name: "responsibilities", label: "Key Responsibilities", type: "textarea", required: true },
      { name: "requirements", label: "Requirements", type: "textarea", required: true },
      { name: "salary", label: "Salary Range", type: "text" },
      { name: "companyInfo", label: "Company Info/Culture", type: "textarea" },
      { name: "location", label: "Location/Remote Policy", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.6,
    maxTokens: 2500,
    tier: "starter",
  },
  {
    id: "hr-resume-screener",
    name: "Resume Screener",
    description: "Screen resumes against job requirements and rank candidates objectively",
    category: "hr",
    icon: "FileSearch",
    capabilities: ["data_analysis", "document"],
    systemPrompt: `You are an unbiased resume screening specialist. Evaluate resumes by:
1. Matching skills to job requirements
2. Assessing experience relevance
3. Identifying red flags (gaps, inconsistencies)
4. Highlighting standout qualifications
5. Scoring candidates objectively
6. Avoiding bias in assessment

Provide a structured evaluation with clear reasoning for each decision.`,
    suggestedTools: ["ats_integration", "skill_matcher"],
    inputFields: [
      { name: "jobRequirements", label: "Job Requirements", type: "textarea", required: true },
      { name: "resume", label: "Resume/CV Text", type: "textarea", required: true },
      { name: "mustHaves", label: "Must-Have Qualifications", type: "textarea" },
      { name: "niceToHaves", label: "Nice-to-Have Qualifications", type: "textarea" },
    ],
    outputFormat: "json",
    temperature: 0.2,
    maxTokens: 2000,
    tier: "pro",
  },
  {
    id: "hr-interview-questions",
    name: "Interview Question Generator",
    description: "Generate tailored interview questions based on role and competencies",
    category: "hr",
    icon: "HelpCircle",
    capabilities: ["document"],
    systemPrompt: `You are an interview design specialist. Create questions that:
1. Assess specific competencies and skills
2. Include behavioral (STAR format) questions
3. Have technical/role-specific questions
4. Include culture fit questions
5. Provide scoring rubrics
6. Avoid illegal/discriminatory questions

Categorize questions by type and difficulty. Include follow-up prompts.`,
    suggestedTools: ["competency_library", "interview_templates"],
    inputFields: [
      { name: "role", label: "Role/Position", type: "text", required: true },
      { name: "level", label: "Seniority Level", type: "select", options: [
        { value: "entry", label: "Entry Level" },
        { value: "mid", label: "Mid Level" },
        { value: "senior", label: "Senior" },
        { value: "lead", label: "Lead/Manager" },
        { value: "executive", label: "Executive" },
      ]},
      { name: "competencies", label: "Key Competencies", type: "textarea", required: true },
      { name: "interviewType", label: "Interview Type", type: "select", options: [
        { value: "phone_screen", label: "Phone Screen" },
        { value: "technical", label: "Technical" },
        { value: "behavioral", label: "Behavioral" },
        { value: "culture", label: "Culture Fit" },
        { value: "final", label: "Final Round" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.5,
    maxTokens: 3000,
    tier: "starter",
  },
  {
    id: "hr-onboarding-planner",
    name: "Onboarding Planner",
    description: "Create comprehensive onboarding plans for new hires",
    category: "hr",
    icon: "UserPlus",
    capabilities: ["document", "scheduling"],
    systemPrompt: `You are an employee onboarding specialist. Create plans that:
1. Cover first day, week, month, and 90 days
2. Include all necessary training and meetings
3. Assign mentors and check-in points
4. List required access and equipment
5. Set clear milestones and expectations
6. Include social/cultural integration activities

Make the experience welcoming while being comprehensive.`,
    suggestedTools: ["onboarding_checklist", "calendar_scheduler"],
    inputFields: [
      { name: "role", label: "Role/Position", type: "text", required: true },
      { name: "department", label: "Department", type: "text", required: true },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "manager", label: "Manager Name", type: "text" },
      { name: "teamSize", label: "Team Size", type: "number" },
      { name: "remote", label: "Work Arrangement", type: "select", options: [
        { value: "onsite", label: "Onsite" },
        { value: "remote", label: "Remote" },
        { value: "hybrid", label: "Hybrid" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.5,
    maxTokens: 3500,
    tier: "pro",
  },
  {
    id: "hr-policy-writer",
    name: "Policy Writer",
    description: "Draft HR policies and employee handbook sections",
    category: "hr",
    icon: "FileText",
    capabilities: ["document", "research"],
    systemPrompt: `You are an HR policy specialist. Create policies that:
1. Are clear and unambiguous
2. Comply with legal requirements
3. Are fair and consistently applicable
4. Include all necessary definitions
5. Specify procedures and exceptions
6. Have appropriate escalation paths

Include implementation guidance and communication recommendations.`,
    suggestedTools: ["legal_compliance", "policy_templates"],
    inputFields: [
      { name: "policyType", label: "Policy Type", type: "select", required: true, options: [
        { value: "pto", label: "PTO/Leave" },
        { value: "remote", label: "Remote Work" },
        { value: "code_of_conduct", label: "Code of Conduct" },
        { value: "expense", label: "Expense Reimbursement" },
        { value: "harassment", label: "Anti-Harassment" },
        { value: "security", label: "Information Security" },
        { value: "custom", label: "Custom Policy" },
      ]},
      { name: "companySize", label: "Company Size", type: "select", options: [
        { value: "startup", label: "Startup (<50)" },
        { value: "smb", label: "SMB (50-500)" },
        { value: "enterprise", label: "Enterprise (500+)" },
      ]},
      { name: "requirements", label: "Specific Requirements", type: "textarea" },
      { name: "jurisdiction", label: "Primary Jurisdiction", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "business",
  },
];

// ============================================
// FINANCE AGENTS
// ============================================

const financeAgents: AgentTemplate[] = [
  {
    id: "finance-invoice-processor",
    name: "Invoice Processor",
    description: "Extract and validate data from invoices for accounting systems",
    category: "finance",
    icon: "Receipt",
    capabilities: ["data_analysis", "document"],
    systemPrompt: `You are an accounts payable specialist. Process invoices by:
1. Extracting all relevant fields (vendor, amount, date, items, tax)
2. Validating data consistency
3. Checking for duplicates or anomalies
4. Categorizing expenses
5. Flagging items requiring approval
6. Preparing data for accounting system import

Format output for easy integration with accounting software.`,
    suggestedTools: ["ocr_processor", "accounting_integration"],
    inputFields: [
      { name: "invoiceText", label: "Invoice Text/Data", type: "textarea", required: true },
      { name: "vendor", label: "Vendor Name (if known)", type: "text" },
      { name: "expectedAmount", label: "Expected Amount", type: "number" },
      { name: "poNumber", label: "PO Number", type: "text" },
    ],
    outputFormat: "json",
    temperature: 0.1,
    maxTokens: 1500,
    tier: "pro",
  },
  {
    id: "finance-expense-analyzer",
    name: "Expense Analyzer",
    description: "Analyze expense reports and identify savings opportunities",
    category: "finance",
    icon: "DollarSign",
    capabilities: ["data_analysis"],
    systemPrompt: `You are a financial analyst specializing in expense management. Analyze data to:
1. Categorize and summarize expenses
2. Identify trends and patterns
3. Flag policy violations or anomalies
4. Compare against budgets and benchmarks
5. Recommend cost-saving opportunities
6. Provide executive summary

Use clear visualizations and actionable recommendations.`,
    suggestedTools: ["expense_db", "budget_tracker"],
    inputFields: [
      { name: "expenseData", label: "Expense Data", type: "textarea", required: true },
      { name: "period", label: "Time Period", type: "text" },
      { name: "budget", label: "Budget Limits", type: "textarea" },
      { name: "policies", label: "Expense Policies", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 3000,
    tier: "pro",
  },
  {
    id: "finance-financial-reporter",
    name: "Financial Reporter",
    description: "Generate financial reports and analysis from raw data",
    category: "finance",
    icon: "TrendingUp",
    capabilities: ["data_analysis", "document"],
    systemPrompt: `You are a financial reporting analyst. Create reports that:
1. Present financial data clearly
2. Calculate key metrics and ratios
3. Provide trend analysis
4. Compare to prior periods and benchmarks
5. Include variance analysis
6. Offer strategic recommendations

Follow standard financial reporting formats. Be precise with numbers.`,
    suggestedTools: ["financial_calculator", "chart_generator"],
    inputFields: [
      { name: "financialData", label: "Financial Data", type: "textarea", required: true },
      { name: "reportType", label: "Report Type", type: "select", options: [
        { value: "income", label: "Income Statement" },
        { value: "balance", label: "Balance Sheet" },
        { value: "cashflow", label: "Cash Flow" },
        { value: "budget_variance", label: "Budget Variance" },
        { value: "kpi", label: "KPI Dashboard" },
      ]},
      { name: "period", label: "Reporting Period", type: "text", required: true },
      { name: "comparePeriod", label: "Comparison Period", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 4000,
    tier: "business",
  },
  {
    id: "finance-forecast-modeler",
    name: "Forecast Modeler",
    description: "Create financial forecasts and scenario models",
    category: "finance",
    icon: "Activity",
    capabilities: ["data_analysis"],
    systemPrompt: `You are a financial planning and analysis specialist. Create forecasts that:
1. Project revenue and expenses
2. Model multiple scenarios (base, optimistic, pessimistic)
3. Identify key assumptions and sensitivities
4. Calculate break-even points
5. Project cash flow needs
6. Provide confidence intervals

Clearly state assumptions and methodology used.`,
    suggestedTools: ["forecasting_model", "sensitivity_analyzer"],
    inputFields: [
      { name: "historicalData", label: "Historical Financial Data", type: "textarea", required: true },
      { name: "forecastPeriod", label: "Forecast Period", type: "text", required: true },
      { name: "growthAssumptions", label: "Growth Assumptions", type: "textarea" },
      { name: "knownChanges", label: "Known Future Changes", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 3500,
    tier: "business",
  },
];

// ============================================
// LEGAL AGENTS
// ============================================

const legalAgents: AgentTemplate[] = [
  {
    id: "legal-contract-reviewer",
    name: "Contract Reviewer",
    description: "Review contracts for risks, issues, and improvement opportunities",
    category: "legal",
    icon: "FileCheck",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a contract review specialist. Analyze contracts for:
1. Key terms and obligations
2. Risk areas and unfavorable clauses
3. Missing standard protections
4. Ambiguous language
5. Compliance issues
6. Comparison to standard terms

Provide specific recommendations with clause references. Note: This is not legal advice.`,
    suggestedTools: ["contract_templates", "clause_library"],
    inputFields: [
      { name: "contract", label: "Contract Text", type: "textarea", required: true },
      { name: "contractType", label: "Contract Type", type: "select", options: [
        { value: "nda", label: "NDA" },
        { value: "service", label: "Service Agreement" },
        { value: "employment", label: "Employment" },
        { value: "vendor", label: "Vendor/Supplier" },
        { value: "partnership", label: "Partnership" },
        { value: "saas", label: "SaaS/Software" },
        { value: "other", label: "Other" },
      ]},
      { name: "party", label: "Your Role", type: "select", options: [
        { value: "provider", label: "Service Provider" },
        { value: "customer", label: "Customer" },
        { value: "mutual", label: "Mutual Agreement" },
      ]},
      { name: "concerns", label: "Specific Concerns", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 4000,
    tier: "business",
    popular: true,
  },
  {
    id: "legal-terms-generator",
    name: "Terms Generator",
    description: "Generate Terms of Service, Privacy Policies, and legal documents",
    category: "legal",
    icon: "Scale",
    capabilities: ["document"],
    systemPrompt: `You are a legal document specialist. Create documents that:
1. Cover all necessary legal bases
2. Use clear, understandable language
3. Are customized to the business type
4. Include required disclosures
5. Follow jurisdiction requirements
6. Are reasonably protective

Include placeholders for customization. Note: Review by qualified attorney recommended.`,
    suggestedTools: ["legal_templates", "compliance_checker"],
    inputFields: [
      { name: "documentType", label: "Document Type", type: "select", required: true, options: [
        { value: "tos", label: "Terms of Service" },
        { value: "privacy", label: "Privacy Policy" },
        { value: "acceptable_use", label: "Acceptable Use Policy" },
        { value: "refund", label: "Refund Policy" },
        { value: "disclaimer", label: "Disclaimer" },
        { value: "cookie", label: "Cookie Policy" },
      ]},
      { name: "businessType", label: "Business Type", type: "text", required: true },
      { name: "services", label: "Services Offered", type: "textarea", required: true },
      { name: "dataCollection", label: "Data Collected", type: "textarea" },
      { name: "jurisdiction", label: "Primary Jurisdiction", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 5000,
    tier: "pro",
  },
  {
    id: "legal-compliance-checker",
    name: "Compliance Checker",
    description: "Check processes and documents for regulatory compliance",
    category: "legal",
    icon: "Shield",
    capabilities: ["data_analysis", "document"],
    systemPrompt: `You are a compliance analyst. Evaluate for:
1. Relevant regulatory requirements
2. Current compliance status
3. Gap identification
4. Risk assessment
5. Remediation recommendations
6. Documentation needs

Specify applicable regulations and provide actionable steps. Note: Not legal advice.`,
    suggestedTools: ["regulation_db", "compliance_templates"],
    inputFields: [
      { name: "processDocument", label: "Process/Document to Review", type: "textarea", required: true },
      { name: "regulations", label: "Applicable Regulations", type: "select", options: [
        { value: "gdpr", label: "GDPR" },
        { value: "ccpa", label: "CCPA/CPRA" },
        { value: "hipaa", label: "HIPAA" },
        { value: "sox", label: "SOX" },
        { value: "pci", label: "PCI-DSS" },
        { value: "iso27001", label: "ISO 27001" },
        { value: "other", label: "Other" },
      ]},
      { name: "industry", label: "Industry", type: "text" },
      { name: "concerns", label: "Specific Concerns", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 3500,
    tier: "business",
  },
];

// ============================================
// RESEARCH AGENTS
// ============================================

const researchAgents: AgentTemplate[] = [
  {
    id: "research-market-researcher",
    name: "Market Researcher",
    description: "Conduct market research and analysis on industries, trends, and opportunities",
    category: "research",
    icon: "Globe",
    capabilities: ["research", "data_analysis"],
    systemPrompt: `You are a market research analyst. Provide analysis covering:
1. Market size and growth projections
2. Key players and market share
3. Industry trends and drivers
4. Customer segments and needs
5. Competitive landscape
6. Opportunities and threats
7. Entry barriers and success factors

Use credible sources and data. Cite information where possible.`,
    suggestedTools: ["market_data", "company_database", "trend_analyzer"],
    inputFields: [
      { name: "topic", label: "Research Topic/Market", type: "text", required: true },
      { name: "geography", label: "Geographic Focus", type: "text" },
      { name: "timeframe", label: "Time Frame", type: "text" },
      { name: "specificQuestions", label: "Specific Questions", type: "textarea" },
      { name: "depth", label: "Research Depth", type: "select", options: [
        { value: "overview", label: "Overview" },
        { value: "detailed", label: "Detailed Analysis" },
        { value: "comprehensive", label: "Comprehensive Deep Dive" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 5000,
    tier: "business",
    popular: true,
  },
  {
    id: "research-company-profiler",
    name: "Company Profiler",
    description: "Create detailed company profiles for sales, partnerships, or investment",
    category: "research",
    icon: "Building",
    capabilities: ["research", "data_analysis"],
    systemPrompt: `You are a business intelligence analyst. Create profiles covering:
1. Company overview and history
2. Products and services
3. Business model and revenue streams
4. Leadership team
5. Financial health (if public)
6. Recent news and developments
7. Strengths and weaknesses
8. Strategic recommendations

Provide actionable insights based on the profile purpose.`,
    suggestedTools: ["company_database", "news_aggregator", "financial_data"],
    inputFields: [
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "website", label: "Company Website", type: "url" },
      { name: "purpose", label: "Profile Purpose", type: "select", options: [
        { value: "sales", label: "Sales Prospecting" },
        { value: "partnership", label: "Partnership Evaluation" },
        { value: "investment", label: "Investment Analysis" },
        { value: "competitive", label: "Competitive Intelligence" },
        { value: "due_diligence", label: "Due Diligence" },
      ]},
      { name: "focusAreas", label: "Focus Areas", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "research-trend-analyzer",
    name: "Trend Analyzer",
    description: "Identify and analyze emerging trends in any industry or topic",
    category: "research",
    icon: "TrendingUp",
    capabilities: ["research", "data_analysis"],
    systemPrompt: `You are a trend analysis specialist. Analyze and report on:
1. Current state of the trend
2. Historical context and evolution
3. Driving forces and catalysts
4. Key players and innovators
5. Potential impact and implications
6. Timeline projections
7. Opportunities for businesses

Distinguish between hype and substance. Provide balanced analysis.`,
    suggestedTools: ["trend_database", "social_listening", "patent_search"],
    inputFields: [
      { name: "trend", label: "Trend/Topic", type: "text", required: true },
      { name: "industry", label: "Industry Context", type: "text" },
      { name: "timeframe", label: "Analysis Timeframe", type: "select", options: [
        { value: "short", label: "Short-term (0-1 year)" },
        { value: "medium", label: "Medium-term (1-3 years)" },
        { value: "long", label: "Long-term (3-5+ years)" },
      ]},
      { name: "businessContext", label: "Your Business Context", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.5,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "research-literature-reviewer",
    name: "Literature Reviewer",
    description: "Review and synthesize research papers and academic literature",
    category: "research",
    icon: "BookOpen",
    capabilities: ["research", "document"],
    systemPrompt: `You are an academic research specialist. Create reviews that:
1. Summarize key findings from sources
2. Identify themes and patterns
3. Note contradictions and debates
4. Evaluate methodology quality
5. Identify research gaps
6. Synthesize into actionable insights

Maintain academic rigor while being accessible to non-academics.`,
    suggestedTools: ["academic_search", "citation_manager"],
    inputFields: [
      { name: "topic", label: "Research Topic", type: "text", required: true },
      { name: "sources", label: "Sources/Papers", type: "textarea", required: true },
      { name: "focus", label: "Specific Focus Areas", type: "textarea" },
      { name: "purpose", label: "Review Purpose", type: "select", options: [
        { value: "academic", label: "Academic Paper" },
        { value: "business", label: "Business Application" },
        { value: "policy", label: "Policy Brief" },
        { value: "general", label: "General Summary" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 5000,
    tier: "business",
  },
];

// ============================================
// CREATIVE AGENTS
// ============================================

const creativeAgents: AgentTemplate[] = [
  {
    id: "creative-brand-voice",
    name: "Brand Voice Creator",
    description: "Develop brand voice guidelines and tone documentation",
    category: "creative",
    icon: "Mic",
    capabilities: ["document", "creative"],
    systemPrompt: `You are a brand strategist specializing in voice and tone. Create guidelines covering:
1. Brand personality traits
2. Voice characteristics
3. Tone variations by context
4. Do's and don'ts
5. Example phrases and language
6. Word banks (use/avoid)
7. Sample content in brand voice

Make guidelines practical and easy to implement.`,
    suggestedTools: ["brand_templates", "example_library"],
    inputFields: [
      { name: "brandName", label: "Brand Name", type: "text", required: true },
      { name: "industry", label: "Industry", type: "text" },
      { name: "targetAudience", label: "Target Audience", type: "textarea", required: true },
      { name: "brandValues", label: "Brand Values", type: "textarea", required: true },
      { name: "competitors", label: "Competitor Brands (for differentiation)", type: "textarea" },
      { name: "existingMaterials", label: "Existing Brand Materials", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 4000,
    tier: "pro",
  },
  {
    id: "creative-copywriter",
    name: "Copywriter",
    description: "Write persuasive copy for websites, landing pages, and marketing materials",
    category: "creative",
    icon: "Type",
    capabilities: ["document"],
    systemPrompt: `You are a conversion-focused copywriter. Create copy that:
1. Grabs attention with strong headlines
2. Addresses pain points and desires
3. Presents clear value propositions
4. Uses proven copywriting frameworks
5. Includes compelling CTAs
6. Is optimized for scanning
7. Maintains brand voice

Focus on benefits over features. Be persuasive without being pushy.`,
    suggestedTools: ["headline_analyzer", "copy_templates"],
    inputFields: [
      { name: "copyType", label: "Copy Type", type: "select", required: true, options: [
        { value: "homepage", label: "Homepage" },
        { value: "landing", label: "Landing Page" },
        { value: "product", label: "Product Page" },
        { value: "about", label: "About Page" },
        { value: "service", label: "Service Page" },
        { value: "cta", label: "CTA/Button Copy" },
      ]},
      { name: "product", label: "Product/Service", type: "text", required: true },
      { name: "audience", label: "Target Audience", type: "textarea", required: true },
      { name: "goal", label: "Primary Goal", type: "text", required: true },
      { name: "brandVoice", label: "Brand Voice Notes", type: "textarea" },
      { name: "differentiators", label: "Key Differentiators", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 3000,
    tier: "starter",
    popular: true,
  },
  {
    id: "creative-naming",
    name: "Name Generator",
    description: "Generate creative names for products, companies, features, and campaigns",
    category: "creative",
    icon: "Zap",
    capabilities: ["creative"],
    systemPrompt: `You are a naming specialist. Generate names that:
1. Are memorable and easy to pronounce
2. Convey the right meaning/emotion
3. Are available (suggest checking domains/trademarks)
4. Work internationally
5. Stand out from competitors
6. Have potential for brand building

Provide 20+ options with rationale. Include linguistic analysis.`,
    suggestedTools: ["domain_checker", "trademark_search"],
    inputFields: [
      { name: "namingFor", label: "Naming For", type: "select", required: true, options: [
        { value: "company", label: "Company/Startup" },
        { value: "product", label: "Product" },
        { value: "feature", label: "Feature" },
        { value: "campaign", label: "Campaign" },
        { value: "app", label: "App" },
        { value: "service", label: "Service" },
      ]},
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "keywords", label: "Keywords/Themes", type: "text" },
      { name: "style", label: "Naming Style", type: "select", options: [
        { value: "descriptive", label: "Descriptive" },
        { value: "invented", label: "Invented Word" },
        { value: "metaphor", label: "Metaphor/Symbol" },
        { value: "compound", label: "Compound Word" },
        { value: "acronym", label: "Acronym" },
      ]},
      { name: "avoid", label: "Names/Words to Avoid", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.9,
    maxTokens: 2500,
    tier: "starter",
  },
  {
    id: "creative-story-writer",
    name: "Story Writer",
    description: "Create compelling brand stories, case studies, and narrative content",
    category: "creative",
    icon: "Book",
    capabilities: ["document", "creative"],
    systemPrompt: `You are a narrative content specialist. Create stories that:
1. Follow classic story structure (hook, conflict, resolution)
2. Create emotional connection
3. Highlight transformation and results
4. Use vivid, specific details
5. Include quotable moments
6. Drive toward desired action

Make stories authentic and relatable. Show, don't tell.`,
    suggestedTools: ["story_templates", "quote_generator"],
    inputFields: [
      { name: "storyType", label: "Story Type", type: "select", required: true, options: [
        { value: "case_study", label: "Case Study" },
        { value: "brand_story", label: "Brand Story" },
        { value: "customer_story", label: "Customer Story" },
        { value: "founder_story", label: "Founder Story" },
        { value: "product_launch", label: "Product Launch Story" },
      ]},
      { name: "subject", label: "Subject/Topic", type: "text", required: true },
      { name: "details", label: "Key Details/Facts", type: "textarea", required: true },
      { name: "audience", label: "Target Audience", type: "text" },
      { name: "takeaway", label: "Desired Takeaway", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.8,
    maxTokens: 3500,
    tier: "pro",
  },
];

// ============================================
// DATA AGENTS
// ============================================

const dataAgents: AgentTemplate[] = [
  {
    id: "data-sql-generator",
    name: "SQL Generator",
    description: "Generate SQL queries from natural language descriptions",
    category: "data",
    icon: "Database",
    capabilities: ["code", "data_analysis"],
    systemPrompt: `You are a SQL expert. Generate queries that:
1. Are optimized for performance
2. Follow best practices
3. Handle edge cases
4. Include proper indexes hints
5. Are well-commented
6. Work with the specified database

Explain the query logic and any assumptions made.`,
    suggestedTools: ["schema_analyzer", "query_optimizer"],
    inputFields: [
      { name: "description", label: "What do you want to query?", type: "textarea", required: true },
      { name: "schema", label: "Table Schema", type: "textarea", required: true },
      { name: "database", label: "Database Type", type: "select", options: [
        { value: "postgresql", label: "PostgreSQL" },
        { value: "mysql", label: "MySQL" },
        { value: "sqlserver", label: "SQL Server" },
        { value: "sqlite", label: "SQLite" },
        { value: "oracle", label: "Oracle" },
      ]},
      { name: "constraints", label: "Performance Constraints", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.2,
    maxTokens: 2000,
    tier: "starter",
  },
  {
    id: "data-analyzer",
    name: "Data Analyzer",
    description: "Analyze datasets and provide insights, patterns, and recommendations",
    category: "data",
    icon: "PieChart",
    capabilities: ["data_analysis"],
    systemPrompt: `You are a data analyst. Analyze data to provide:
1. Summary statistics
2. Key patterns and trends
3. Anomalies and outliers
4. Correlations and relationships
5. Visualization recommendations
6. Actionable insights
7. Further analysis suggestions

Use statistical rigor while being accessible to non-technical stakeholders.`,
    suggestedTools: ["stat_calculator", "visualization_generator"],
    inputFields: [
      { name: "data", label: "Data (CSV, JSON, or description)", type: "textarea", required: true },
      { name: "question", label: "Analysis Question", type: "textarea", required: true },
      { name: "context", label: "Business Context", type: "textarea" },
      { name: "depth", label: "Analysis Depth", type: "select", options: [
        { value: "quick", label: "Quick Summary" },
        { value: "standard", label: "Standard Analysis" },
        { value: "deep", label: "Deep Dive" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "pro",
    popular: true,
  },
  {
    id: "data-transformer",
    name: "Data Transformer",
    description: "Transform data between formats and clean/normalize datasets",
    category: "data",
    icon: "Repeat",
    capabilities: ["data_analysis", "code"],
    systemPrompt: `You are a data transformation specialist. Handle:
1. Format conversions (JSON, CSV, XML, etc.)
2. Data cleaning and normalization
3. Field mapping and renaming
4. Value transformations
5. Aggregations and pivots
6. Schema changes

Provide both transformed data and reusable transformation code.`,
    suggestedTools: ["format_converter", "schema_mapper"],
    inputFields: [
      { name: "inputData", label: "Input Data", type: "textarea", required: true },
      { name: "inputFormat", label: "Input Format", type: "select", options: [
        { value: "json", label: "JSON" },
        { value: "csv", label: "CSV" },
        { value: "xml", label: "XML" },
        { value: "text", label: "Plain Text" },
      ]},
      { name: "outputFormat", label: "Output Format", type: "select", options: [
        { value: "json", label: "JSON" },
        { value: "csv", label: "CSV" },
        { value: "xml", label: "XML" },
        { value: "sql", label: "SQL INSERT" },
      ]},
      { name: "transformations", label: "Transformations Needed", type: "textarea" },
    ],
    outputFormat: "json",
    temperature: 0.1,
    maxTokens: 3000,
    tier: "starter",
  },
  {
    id: "data-report-builder",
    name: "Report Builder",
    description: "Create automated report templates from data specifications",
    category: "data",
    icon: "FileSpreadsheet",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a business intelligence specialist. Create reports that:
1. Present data clearly and professionally
2. Include relevant metrics and KPIs
3. Provide trend analysis
4. Use appropriate visualizations
5. Include executive summaries
6. Are templated for automation

Design for reusability and automation.`,
    suggestedTools: ["report_generator", "chart_builder"],
    inputFields: [
      { name: "reportPurpose", label: "Report Purpose", type: "text", required: true },
      { name: "dataFields", label: "Available Data Fields", type: "textarea", required: true },
      { name: "audience", label: "Target Audience", type: "text" },
      { name: "frequency", label: "Report Frequency", type: "select", options: [
        { value: "realtime", label: "Real-time" },
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
      ]},
      { name: "kpis", label: "Key Metrics to Track", type: "textarea" },
    ],
    outputFormat: "markdown",
    temperature: 0.4,
    maxTokens: 3500,
    tier: "pro",
  },
];

// ============================================
// CUSTOM/GENERAL AGENTS
// ============================================

const customAgents: AgentTemplate[] = [
  {
    id: "custom-assistant",
    name: "Custom Assistant",
    description: "Create a fully customized AI assistant with your own instructions",
    category: "custom",
    icon: "Settings",
    capabilities: ["chat", "document", "data_analysis"],
    systemPrompt: `You are a helpful AI assistant. Follow the user's custom instructions carefully and provide accurate, helpful responses. Be thorough yet concise. Ask clarifying questions when needed.`,
    suggestedTools: [],
    inputFields: [
      { name: "customInstructions", label: "Custom Instructions", type: "textarea", required: true, placeholder: "Enter your custom system instructions..." },
      { name: "context", label: "Additional Context", type: "textarea" },
      { name: "userInput", label: "Your Request", type: "textarea", required: true },
    ],
    outputFormat: "markdown",
    temperature: 0.7,
    maxTokens: 4000,
    tier: "free",
  },
  {
    id: "custom-translator",
    name: "Universal Translator",
    description: "Translate content between languages while preserving tone and context",
    category: "custom",
    icon: "Globe",
    capabilities: ["document"],
    systemPrompt: `You are an expert translator. Translate content while:
1. Preserving meaning and intent
2. Maintaining tone and style
3. Adapting cultural references appropriately
4. Keeping formatting intact
5. Noting untranslatable terms
6. Providing alternative phrasings when helpful

Optimize for natural, native-sounding output.`,
    suggestedTools: ["language_detector", "glossary"],
    inputFields: [
      { name: "content", label: "Content to Translate", type: "textarea", required: true },
      { name: "sourceLang", label: "Source Language", type: "select", options: [
        { value: "auto", label: "Auto-detect" },
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "zh", label: "Chinese" },
        { value: "ja", label: "Japanese" },
        { value: "ko", label: "Korean" },
        { value: "pt", label: "Portuguese" },
        { value: "it", label: "Italian" },
      ]},
      { name: "targetLang", label: "Target Language", type: "select", required: true, options: [
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "zh", label: "Chinese" },
        { value: "ja", label: "Japanese" },
        { value: "ko", label: "Korean" },
        { value: "pt", label: "Portuguese" },
        { value: "it", label: "Italian" },
      ]},
      { name: "tone", label: "Desired Tone", type: "select", options: [
        { value: "formal", label: "Formal" },
        { value: "casual", label: "Casual" },
        { value: "technical", label: "Technical" },
        { value: "marketing", label: "Marketing" },
      ]},
    ],
    outputFormat: "text",
    temperature: 0.3,
    maxTokens: 4000,
    tier: "starter",
  },
  {
    id: "custom-summarizer",
    name: "Universal Summarizer",
    description: "Summarize any content to your desired length and format",
    category: "custom",
    icon: "FileText",
    capabilities: ["document", "data_analysis"],
    systemPrompt: `You are a summarization specialist. Create summaries that:
1. Capture all key points
2. Maintain accuracy
3. Use clear, concise language
4. Follow the requested format
5. Highlight critical information
6. Preserve essential context

Adapt length and depth to the user's needs.`,
    suggestedTools: [],
    inputFields: [
      { name: "content", label: "Content to Summarize", type: "textarea", required: true },
      { name: "length", label: "Summary Length", type: "select", options: [
        { value: "tldr", label: "TL;DR (1-2 sentences)" },
        { value: "short", label: "Short (1 paragraph)" },
        { value: "medium", label: "Medium (2-3 paragraphs)" },
        { value: "detailed", label: "Detailed (full summary)" },
      ]},
      { name: "format", label: "Format", type: "select", options: [
        { value: "prose", label: "Prose" },
        { value: "bullets", label: "Bullet Points" },
        { value: "numbered", label: "Numbered List" },
        { value: "structured", label: "Structured Sections" },
      ]},
      { name: "focus", label: "Focus Area (optional)", type: "text" },
    ],
    outputFormat: "markdown",
    temperature: 0.3,
    maxTokens: 2000,
    tier: "free",
  },
  {
    id: "custom-brainstormer",
    name: "Brainstorm Partner",
    description: "Generate creative ideas and explore possibilities with AI brainstorming",
    category: "custom",
    icon: "Lightbulb",
    capabilities: ["creative"],
    systemPrompt: `You are a creative brainstorming partner. Help generate ideas by:
1. Building on the user's initial thoughts
2. Offering diverse perspectives
3. Combining unlikely concepts
4. Asking provocative questions
5. Providing wild and practical ideas
6. Organizing ideas by theme

Be creative and uninhibited. Quantity over quality initially.`,
    suggestedTools: ["idea_organizer"],
    inputFields: [
      { name: "topic", label: "Brainstorm Topic", type: "text", required: true },
      { name: "context", label: "Context/Background", type: "textarea" },
      { name: "constraints", label: "Constraints/Requirements", type: "textarea" },
      { name: "ideaCount", label: "Number of Ideas", type: "select", options: [
        { value: "10", label: "10 ideas" },
        { value: "25", label: "25 ideas" },
        { value: "50", label: "50 ideas" },
      ]},
      { name: "style", label: "Thinking Style", type: "select", options: [
        { value: "divergent", label: "Wild & Creative" },
        { value: "practical", label: "Practical & Feasible" },
        { value: "mixed", label: "Mix of Both" },
      ]},
    ],
    outputFormat: "markdown",
    temperature: 0.9,
    maxTokens: 3000,
    tier: "free",
  },
];

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const agentTemplates: AgentTemplate[] = [
  ...salesAgents,
  ...supportAgents,
  ...marketingAgents,
  ...operationsAgents,
  ...developmentAgents,
  ...hrAgents,
  ...financeAgents,
  ...legalAgents,
  ...researchAgents,
  ...creativeAgents,
  ...dataAgents,
  ...customAgents,
];

export const agentCategories: { id: AgentCategory; name: string; icon: string; description: string }[] = [
  { id: "sales", name: "Sales", icon: "TrendingUp", description: "Close more deals with AI-powered sales tools" },
  { id: "support", name: "Customer Support", icon: "Headphones", description: "Deliver exceptional support at scale" },
  { id: "marketing", name: "Marketing", icon: "Megaphone", description: "Create compelling content and campaigns" },
  { id: "operations", name: "Operations", icon: "Settings", description: "Streamline processes and boost efficiency" },
  { id: "development", name: "Development", icon: "Code", description: "Ship better code faster" },
  { id: "hr", name: "HR & People", icon: "Users", description: "Build and manage great teams" },
  { id: "finance", name: "Finance", icon: "DollarSign", description: "Make smarter financial decisions" },
  { id: "legal", name: "Legal", icon: "Scale", description: "Navigate legal complexities with confidence" },
  { id: "research", name: "Research", icon: "Search", description: "Gain insights from deep research" },
  { id: "creative", name: "Creative", icon: "Palette", description: "Unleash creativity with AI assistance" },
  { id: "data", name: "Data & Analytics", icon: "BarChart2", description: "Turn data into actionable insights" },
  { id: "custom", name: "Custom", icon: "Wand2", description: "Build your own custom AI agents" },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return agentTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: AgentCategory): AgentTemplate[] {
  return agentTemplates.filter((t) => t.category === category);
}

export function getTemplatesByTier(tier: AgentTemplate["tier"]): AgentTemplate[] {
  const tierOrder = ["free", "starter", "pro", "business", "enterprise"];
  const tierIndex = tierOrder.indexOf(tier);
  return agentTemplates.filter((t) => tierOrder.indexOf(t.tier) <= tierIndex);
}

export function getPopularTemplates(): AgentTemplate[] {
  return agentTemplates.filter((t) => t.popular);
}

export function getNewTemplates(): AgentTemplate[] {
  return agentTemplates.filter((t) => t.new);
}

export function searchTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return agentTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
  );
}
