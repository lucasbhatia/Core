-- AI Agents Database Schema
-- Run this SQL in your Supabase SQL Editor to add AI Agents support

-- ============================================
-- DEPLOYED AGENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS deployed_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    template_id VARCHAR(100),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Bot',
    category VARCHAR(50) DEFAULT 'custom',
    capabilities JSONB DEFAULT '["chat"]'::jsonb,

    -- AI Configuration
    system_prompt TEXT NOT NULL,
    model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,

    -- Input/Output
    input_fields JSONB DEFAULT '[]'::jsonb,
    output_format VARCHAR(20) DEFAULT 'markdown',

    -- Tools & Integrations
    tools JSONB DEFAULT '[]'::jsonb,
    integrations JSONB DEFAULT '[]'::jsonb,

    -- Access & Permissions
    is_public BOOLEAN DEFAULT false,
    api_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    webhook_secret TEXT,
    allowed_users JSONB DEFAULT '[]'::jsonb,

    -- Status & Metrics
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'draft')),
    total_executions INTEGER DEFAULT 0,
    total_tokens_used BIGINT DEFAULT 0,
    avg_execution_time_ms INTEGER,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployed_agents_client_id ON deployed_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_deployed_agents_status ON deployed_agents(status);
CREATE INDEX IF NOT EXISTS idx_deployed_agents_category ON deployed_agents(category);
CREATE INDEX IF NOT EXISTS idx_deployed_agents_template_id ON deployed_agents(template_id);
CREATE INDEX IF NOT EXISTS idx_deployed_agents_created_at ON deployed_agents(created_at DESC);

-- Enable RLS
ALTER TABLE deployed_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own agents" ON deployed_agents
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can create agents" ON deployed_agents
    FOR INSERT WITH CHECK (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can update their own agents" ON deployed_agents
    FOR UPDATE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can delete their own agents" ON deployed_agents
    FOR DELETE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

-- Service role policy for API access
CREATE POLICY "Service role full access to agents" ON deployed_agents
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AGENT EXECUTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES deployed_agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID,

    -- Execution Details
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'failed', 'cancelled')),
    trigger VARCHAR(20) DEFAULT 'manual' CHECK (trigger IN ('manual', 'api', 'webhook', 'scheduled', 'chat')),

    -- Input/Output
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB,
    output_text TEXT,

    -- Performance
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    -- Token Usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_client_id ON agent_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON agent_executions(created_at DESC);

-- Enable RLS
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own executions" ON agent_executions
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to executions" ON agent_executions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AGENT CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES deployed_agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID,

    -- Conversation State
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    message_count INTEGER DEFAULT 0,

    -- Token Tracking
    total_tokens_used BIGINT DEFAULT 0,

    -- Context
    context JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_id ON agent_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_client_id ON agent_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_updated_at ON agent_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own conversations" ON agent_conversations
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to conversations" ON agent_conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- CONVERSATION MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,

    -- Message Content
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,

    -- Token Usage
    tokens_used INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies via parent conversation
CREATE POLICY "Clients can view their conversation messages" ON conversation_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM agent_conversations
            WHERE client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Service role full access to messages" ON conversation_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AGENT USAGE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format

    -- Agent Metrics
    agents_created INTEGER DEFAULT 0,
    agents_active INTEGER DEFAULT 0,

    -- Execution Metrics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,

    -- Token Metrics
    total_tokens_used BIGINT DEFAULT 0,
    input_tokens_used BIGINT DEFAULT 0,
    output_tokens_used BIGINT DEFAULT 0,

    -- Time Metrics
    total_execution_time_ms BIGINT DEFAULT 0,
    avg_execution_time_ms INTEGER,

    -- Conversation Metrics
    conversations_started INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(client_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_usage_client_id ON agent_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_month ON agent_usage(month);

-- Enable RLS
ALTER TABLE agent_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own usage" ON agent_usage
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to usage" ON agent_usage
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AGENT SCHEDULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES deployed_agents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Schedule Configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Input Data
    input_data JSONB DEFAULT '{}'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,

    -- Notifications
    notify_on_success BOOLEAN DEFAULT false,
    notify_on_failure BOOLEAN DEFAULT true,
    notification_emails JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent_id ON agent_schedules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_client_id ON agent_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_next_run_at ON agent_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_is_active ON agent_schedules(is_active);

-- Enable RLS
ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can manage their own schedules" ON agent_schedules
    FOR ALL USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to schedules" ON agent_schedules
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- AGENT API KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES deployed_agents(id) ON DELETE CASCADE, -- null = access to all

    name VARCHAR(255) NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,

    -- Permissions
    scopes JSONB DEFAULT '["execute", "read"]'::jsonb,
    rate_limit INTEGER DEFAULT 60, -- requests per minute

    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_requests INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_client_id ON agent_api_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_key_prefix ON agent_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_is_active ON agent_api_keys(is_active);

-- Enable RLS
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can manage their own API keys" ON agent_api_keys
    FOR ALL USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to API keys" ON agent_api_keys
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment agent usage (for atomic updates)
CREATE OR REPLACE FUNCTION increment_agent_usage(
    p_client_id UUID,
    p_month VARCHAR(7),
    p_agents_created INTEGER DEFAULT 0,
    p_agents_active INTEGER DEFAULT 0,
    p_total_executions INTEGER DEFAULT 0,
    p_successful_executions INTEGER DEFAULT 0,
    p_failed_executions INTEGER DEFAULT 0,
    p_total_tokens_used BIGINT DEFAULT 0,
    p_input_tokens_used BIGINT DEFAULT 0,
    p_output_tokens_used BIGINT DEFAULT 0,
    p_total_execution_time_ms BIGINT DEFAULT 0,
    p_conversations_started INTEGER DEFAULT 0,
    p_messages_sent INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO agent_usage (
        client_id, month,
        agents_created, agents_active,
        total_executions, successful_executions, failed_executions,
        total_tokens_used, input_tokens_used, output_tokens_used,
        total_execution_time_ms, conversations_started, messages_sent
    ) VALUES (
        p_client_id, p_month,
        p_agents_created, p_agents_active,
        p_total_executions, p_successful_executions, p_failed_executions,
        p_total_tokens_used, p_input_tokens_used, p_output_tokens_used,
        p_total_execution_time_ms, p_conversations_started, p_messages_sent
    )
    ON CONFLICT (client_id, month) DO UPDATE SET
        agents_created = agent_usage.agents_created + p_agents_created,
        agents_active = agent_usage.agents_active + p_agents_active,
        total_executions = agent_usage.total_executions + p_total_executions,
        successful_executions = agent_usage.successful_executions + p_successful_executions,
        failed_executions = agent_usage.failed_executions + p_failed_executions,
        total_tokens_used = agent_usage.total_tokens_used + p_total_tokens_used,
        input_tokens_used = agent_usage.input_tokens_used + p_input_tokens_used,
        output_tokens_used = agent_usage.output_tokens_used + p_output_tokens_used,
        total_execution_time_ms = agent_usage.total_execution_time_ms + p_total_execution_time_ms,
        conversations_started = agent_usage.conversations_started + p_conversations_started,
        messages_sent = agent_usage.messages_sent + p_messages_sent,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_deployed_agents_updated_at
    BEFORE UPDATE ON deployed_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at
    BEFORE UPDATE ON agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_usage_updated_at
    BEFORE UPDATE ON agent_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_schedules_updated_at
    BEFORE UPDATE ON agent_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_api_keys_updated_at
    BEFORE UPDATE ON agent_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
