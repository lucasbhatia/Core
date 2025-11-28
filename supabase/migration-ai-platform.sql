-- Migration: AI Agency Platform
-- Transforms CoreOS Hub into a full AI automation agency platform

-- ============================================
-- REQUESTS TABLE - All incoming requests
-- ============================================
CREATE TABLE IF NOT EXISTS requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Source information
    source VARCHAR(50) NOT NULL DEFAULT 'dashboard'
        CHECK (source IN ('email', 'form', 'dashboard', 'api', 'slack', 'webhook')),
    source_id VARCHAR(255), -- External ID from source (email ID, form submission ID, etc.)

    -- Request content
    subject VARCHAR(500),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',

    -- AI Classification
    request_type VARCHAR(100), -- marketing, sales, support, operations, development, research, etc.
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    complexity VARCHAR(20) DEFAULT 'simple'
        CHECK (complexity IN ('simple', 'moderate', 'complex', 'enterprise')),

    -- Processing
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'classifying', 'planning', 'in_progress', 'review', 'completed', 'delivered', 'failed')),
    assigned_workflow_id UUID,

    -- AI Analysis
    ai_summary TEXT,
    ai_classification JSONB DEFAULT '{}',
    required_agents JSONB DEFAULT '[]', -- List of agent types needed
    estimated_duration_minutes INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- ============================================
-- WORKFLOWS TABLE - AI-generated execution plans
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Workflow info
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'running', 'paused', 'completed', 'failed', 'cancelled')),

    -- AI-generated plan
    steps JSONB NOT NULL DEFAULT '[]', -- Array of workflow steps
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,

    -- Execution
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Results
    outputs JSONB DEFAULT '{}',
    deliverables JSONB DEFAULT '[]', -- Files, reports, etc.

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_request_id ON workflows(request_id);
CREATE INDEX IF NOT EXISTS idx_workflows_client_id ON workflows(client_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

-- ============================================
-- AGENTS TABLE - Specialized AI agents
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Agent identity
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),

    -- Capabilities
    agent_type VARCHAR(50) NOT NULL
        CHECK (agent_type IN ('writer', 'researcher', 'analyst', 'developer', 'designer', 'strategist', 'support', 'manager', 'qc', 'delivery')),
    capabilities JSONB DEFAULT '[]', -- List of things this agent can do

    -- Configuration
    system_prompt TEXT NOT NULL, -- The AI personality/instructions
    model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    temperature DECIMAL(2,1) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,

    -- Tools this agent can use
    tools JSONB DEFAULT '[]', -- Available tools/integrations

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AGENT_TASKS TABLE - Individual tasks assigned to agents
-- ============================================
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Task info
    step_index INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,

    -- Dependencies
    depends_on JSONB DEFAULT '[]', -- Array of task IDs this depends on

    -- Status
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'skipped')),

    -- Input/Output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',

    -- Execution
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    -- AI Processing
    ai_response TEXT,
    tokens_used INTEGER,

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_workflow_id ON agent_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);

-- ============================================
-- DELIVERABLES TABLE - Output files and assets
-- ============================================
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- File info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(50) NOT NULL, -- document, spreadsheet, image, pdf, code, report, etc.
    mime_type VARCHAR(100),

    -- Content
    content TEXT, -- For text-based deliverables
    file_url VARCHAR(500), -- For file uploads
    file_size INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft', 'review', 'approved', 'delivered', 'rejected')),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_deliverables_workflow_id ON deliverables(workflow_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);

-- ============================================
-- CONVERSATIONS TABLE - Chat history with clients
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,

    -- Message
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- AI info
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_request_id ON conversations(request_id);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can manage workflows" ON workflows;
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can manage agent_tasks" ON agent_tasks;
DROP POLICY IF EXISTS "Authenticated users can manage deliverables" ON deliverables;
DROP POLICY IF EXISTS "Authenticated users can manage conversations" ON conversations;
DROP POLICY IF EXISTS "Service role full access to requests" ON requests;
DROP POLICY IF EXISTS "Service role full access to workflows" ON workflows;
DROP POLICY IF EXISTS "Service role full access to agents" ON agents;
DROP POLICY IF EXISTS "Service role full access to agent_tasks" ON agent_tasks;
DROP POLICY IF EXISTS "Service role full access to deliverables" ON deliverables;
DROP POLICY IF EXISTS "Service role full access to conversations" ON conversations;

-- RLS Policies
CREATE POLICY "Authenticated users can manage requests" ON requests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage workflows" ON workflows
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage agents" ON agents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage agent_tasks" ON agent_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage deliverables" ON deliverables
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage conversations" ON conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role policies
CREATE POLICY "Service role full access to requests" ON requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to workflows" ON workflows
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to agents" ON agents
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to agent_tasks" ON agent_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to deliverables" ON deliverables
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to conversations" ON conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- INSERT DEFAULT AGENTS
-- ============================================
INSERT INTO agents (name, display_name, description, agent_type, capabilities, system_prompt, tools) VALUES

('writer', 'Content Writer', 'Creates high-quality written content including blogs, emails, social posts, and marketing copy.', 'writer',
 '["blog_posts", "email_copy", "social_media", "marketing_copy", "product_descriptions", "press_releases", "newsletters"]',
 'You are an expert content writer. You create engaging, clear, and professional written content. Always match the brand voice and target audience. Structure content for readability with headers, bullet points, and clear calls-to-action.',
 '["web_search", "document_generation"]'),

('researcher', 'Research Analyst', 'Conducts thorough research on topics, competitors, markets, and trends.', 'researcher',
 '["market_research", "competitor_analysis", "trend_analysis", "data_gathering", "fact_checking", "industry_reports"]',
 'You are a meticulous research analyst. You gather comprehensive information from multiple sources, verify facts, and present findings in clear, organized reports. Always cite sources and distinguish between facts and analysis.',
 '["web_search", "data_analysis"]'),

('analyst', 'Data Analyst', 'Analyzes data, creates reports, and generates actionable insights.', 'analyst',
 '["data_analysis", "report_generation", "metrics_tracking", "dashboard_creation", "trend_identification", "forecasting"]',
 'You are a skilled data analyst. You analyze datasets to find patterns, trends, and actionable insights. Present findings with clear visualizations and recommendations. Always explain your methodology.',
 '["data_analysis", "report_generation"]'),

('developer', 'Software Developer', 'Writes code, creates automations, and builds technical solutions.', 'developer',
 '["code_writing", "automation_scripts", "api_integration", "bug_fixing", "code_review", "technical_documentation"]',
 'You are an expert software developer. You write clean, efficient, and well-documented code. Follow best practices, consider edge cases, and prioritize maintainability. Explain your technical decisions clearly.',
 '["code_execution", "api_calls"]'),

('strategist', 'Business Strategist', 'Develops strategies for marketing, growth, operations, and business development.', 'strategist',
 '["marketing_strategy", "growth_planning", "competitive_positioning", "business_planning", "go_to_market", "pricing_strategy"]',
 'You are a seasoned business strategist. You analyze situations holistically and develop comprehensive, actionable strategies. Consider market dynamics, competitive landscape, and resource constraints. Provide clear recommendations with rationale.',
 '["web_search", "data_analysis"]'),

('support', 'Customer Support', 'Handles customer inquiries, resolves issues, and maintains client relationships.', 'support',
 '["customer_inquiries", "issue_resolution", "faq_responses", "ticket_management", "escalation_handling", "follow_ups"]',
 'You are a friendly and helpful customer support specialist. You resolve issues efficiently while maintaining a positive, professional tone. Empathize with customers, provide clear solutions, and follow up to ensure satisfaction.',
 '["email_send", "ticket_create"]'),

('manager', 'Project Manager', 'Coordinates projects, manages timelines, and ensures deliverables are met.', 'manager',
 '["project_planning", "task_coordination", "timeline_management", "resource_allocation", "progress_tracking", "client_updates"]',
 'You are an organized project manager. You break down complex projects into manageable tasks, set realistic timelines, and ensure nothing falls through the cracks. Communicate proactively and keep all stakeholders informed.',
 '["task_create", "notification_send"]'),

('qc', 'Quality Control', 'Reviews all outputs for quality, accuracy, and brand consistency.', 'qc',
 '["content_review", "quality_assurance", "brand_compliance", "error_checking", "style_consistency", "final_approval"]',
 'You are a detail-oriented quality control specialist. You review all outputs for accuracy, clarity, brand consistency, and professional quality. Catch errors, suggest improvements, and ensure everything meets high standards before delivery.',
 '[]'),

('delivery', 'Delivery Coordinator', 'Handles final delivery of work to clients via appropriate channels.', 'delivery',
 '["email_delivery", "file_sharing", "client_presentation", "summary_generation", "feedback_collection"]',
 'You are a professional delivery coordinator. You package deliverables attractively, write clear summaries, and ensure clients receive their work through the right channels. Follow up to confirm receipt and gather feedback.',
 '["email_send", "file_upload"]')

ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    system_prompt = EXCLUDED.system_prompt,
    tools = EXCLUDED.tools,
    updated_at = NOW();
