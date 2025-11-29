-- Universal AI Actions Database Schema
-- Run this SQL in your Supabase SQL Editor to add Universal AI Actions support

-- ============================================
-- AI ACTION LOGS TABLE
-- Stores all Ask AI interactions for history, auditing, and review
-- ============================================

CREATE TABLE IF NOT EXISTS ai_action_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID,

    -- Source Entity Reference
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('task', 'project', 'calendar_event', 'deliverable', 'file', 'chat_message', 'automation', 'notification', 'agent', 'workflow_node')),
    entity_id VARCHAR(255) NOT NULL,
    entity_title VARCHAR(500),
    entity_content TEXT,

    -- Action Details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('explain', 'rewrite', 'summarize', 'expand', 'analyze', 'improve', 'translate', 'extract', 'format', 'custom')),
    custom_prompt TEXT,

    -- AI Configuration
    model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1800,
    tone VARCHAR(50) DEFAULT 'professional',
    output_length VARCHAR(20) DEFAULT 'medium',
    target_language VARCHAR(50),

    -- AI Output
    output_content TEXT,
    output_format VARCHAR(20) DEFAULT 'text',

    -- Token Usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Performance
    processing_time_ms INTEGER,

    -- Review Status (Human-in-the-loop)
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'edited')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    edited_content TEXT,
    rejection_reason TEXT,

    -- Destination (where approved content goes)
    destination_type VARCHAR(50), -- 'deliverable', 'task_update', 'project_update', etc.
    destination_id UUID,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Error Handling
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_client_id ON ai_action_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_entity ON ai_action_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_action_type ON ai_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_review_status ON ai_action_logs(review_status);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_status ON ai_action_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_created_at ON ai_action_logs(created_at DESC);

-- Enable RLS
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own AI action logs" ON ai_action_logs
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can create AI action logs" ON ai_action_logs
    FOR INSERT WITH CHECK (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can update their own AI action logs" ON ai_action_logs
    FOR UPDATE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to AI action logs" ON ai_action_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================
-- AGENT TASKS TABLE
-- Stores tasks assigned to AI Workforce agents
-- ============================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_by_user_id UUID,

    -- Agent Reference
    agent_roster_id VARCHAR(100) NOT NULL, -- References the agent from AGENT_ROSTER
    agent_name VARCHAR(255) NOT NULL,
    agent_department VARCHAR(50),

    -- Source Entity Reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_title VARCHAR(500),

    -- Task Details
    instructions TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,

    -- Task Status
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- AI Configuration
    model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 3800,

    -- Output
    output_content TEXT,
    output_type VARCHAR(50) DEFAULT 'text', -- 'text', 'markdown', 'json', 'html'
    deliverable_id UUID, -- If output becomes a deliverable

    -- Token Usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Performance
    processing_time_ms INTEGER,

    -- Review Status (Human-in-the-loop)
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'edited')),
    auto_approve BOOLEAN DEFAULT false,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    edited_content TEXT,
    rejection_reason TEXT,

    -- Notifications
    notify_on_complete BOOLEAN DEFAULT true,
    notified_at TIMESTAMP WITH TIME ZONE,

    -- Chaining
    chain_to_automation_id UUID,

    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Rating & Feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_tasks_client_id ON agent_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_roster_id ON agent_tasks(agent_roster_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_entity ON agent_tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_review_status ON agent_tasks(review_status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority ON agent_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_due_date ON agent_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own agent tasks" ON agent_tasks
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can create agent tasks" ON agent_tasks
    FOR INSERT WITH CHECK (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can update their own agent tasks" ON agent_tasks
    FOR UPDATE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to agent tasks" ON agent_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================
-- UNIVERSAL AUTOMATIONS TABLE
-- Stores automations created through Universal AI Actions
-- ============================================

CREATE TABLE IF NOT EXISTS universal_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_by_user_id UUID,

    -- Automation Identity
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Source Entity Reference
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_title VARCHAR(500),

    -- Trigger Configuration
    trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('schedule', 'condition', 'event', 'webhook', 'manual')),

    -- Schedule Config (if trigger_type = 'schedule')
    schedule_type VARCHAR(20) CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
    schedule_time TIME,
    schedule_days INTEGER[], -- 0-6 for Sunday-Saturday
    schedule_cron VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    next_run_at TIMESTAMP WITH TIME ZONE,

    -- Condition Config (if trigger_type = 'condition')
    condition_field VARCHAR(100),
    condition_operator VARCHAR(20) CHECK (condition_operator IN ('equals', 'not_equals', 'contains', 'greater', 'less', 'changed')),
    condition_value TEXT,

    -- Event Config (if trigger_type = 'event')
    event_source VARCHAR(50),
    event_action VARCHAR(50),

    -- Webhook Config (if trigger_type = 'webhook')
    webhook_url TEXT,
    webhook_secret TEXT,

    -- Actions (JSON array of action configurations)
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Inngest Integration
    inngest_function_id VARCHAR(255),
    inngest_event_name VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'error', 'archived')),
    last_error TEXT,

    -- Execution Stats
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_success_at TIMESTAMP WITH TIME ZONE,

    -- Review Status (Human-in-the-loop for automation approval)
    review_status VARCHAR(20) DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_universal_automations_client_id ON universal_automations(client_id);
CREATE INDEX IF NOT EXISTS idx_universal_automations_entity ON universal_automations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_universal_automations_trigger_type ON universal_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_universal_automations_status ON universal_automations(status);
CREATE INDEX IF NOT EXISTS idx_universal_automations_is_active ON universal_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_universal_automations_next_run_at ON universal_automations(next_run_at);
CREATE INDEX IF NOT EXISTS idx_universal_automations_created_at ON universal_automations(created_at DESC);

-- Enable RLS
ALTER TABLE universal_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own automations" ON universal_automations
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can create automations" ON universal_automations
    FOR INSERT WITH CHECK (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can update their own automations" ON universal_automations
    FOR UPDATE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can delete their own automations" ON universal_automations
    FOR DELETE USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to automations" ON universal_automations
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================
-- AUTOMATION RUNS TABLE
-- Logs each run of a universal automation
-- ============================================

CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES universal_automations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Trigger Info
    triggered_by VARCHAR(50) DEFAULT 'schedule' CHECK (triggered_by IN ('schedule', 'condition', 'event', 'webhook', 'manual')),
    trigger_data JSONB,

    -- Execution Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('queued', 'running', 'success', 'failed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    -- Action Results (array of results for each action)
    action_results JSONB DEFAULT '[]'::jsonb,

    -- Output
    output_summary TEXT,

    -- Error Handling
    error_message TEXT,
    error_details JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_client_id ON automation_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON automation_runs(created_at DESC);

-- Enable RLS
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own automation runs" ON automation_runs
    FOR SELECT USING (client_id = (SELECT client_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Service role full access to automation runs" ON automation_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ============================================
-- REVIEW QUEUE VIEW
-- Consolidated view for the Review Queue page
-- ============================================

CREATE OR REPLACE VIEW review_queue AS
SELECT
    id,
    client_id,
    'ai_action' as item_type,
    action_type as sub_type,
    entity_type,
    entity_id,
    entity_title as title,
    output_content as content,
    review_status,
    created_at,
    updated_at,
    NULL::uuid as agent_roster_id,
    NULL::varchar as agent_name
FROM ai_action_logs
WHERE review_status = 'pending'

UNION ALL

SELECT
    id,
    client_id,
    'agent_task' as item_type,
    agent_department as sub_type,
    entity_type,
    entity_id,
    entity_title as title,
    output_content as content,
    review_status,
    created_at,
    updated_at,
    agent_roster_id::uuid,
    agent_name
FROM agent_tasks
WHERE review_status = 'pending' AND status = 'completed'

UNION ALL

SELECT
    id,
    client_id,
    'automation' as item_type,
    trigger_type as sub_type,
    entity_type,
    entity_id,
    entity_title as title,
    description as content,
    review_status,
    created_at,
    updated_at,
    NULL::uuid as agent_roster_id,
    NULL::varchar as agent_name
FROM universal_automations
WHERE review_status = 'pending';


-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_ai_action_logs_updated_at
    BEFORE UPDATE ON ai_action_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at
    BEFORE UPDATE ON agent_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_universal_automations_updated_at
    BEFORE UPDATE ON universal_automations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get review queue stats
CREATE OR REPLACE FUNCTION get_review_queue_stats(p_client_id UUID)
RETURNS TABLE (
    pending_ai_actions BIGINT,
    pending_agent_tasks BIGINT,
    pending_automations BIGINT,
    total_pending BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM ai_action_logs WHERE client_id = p_client_id AND review_status = 'pending'),
        (SELECT COUNT(*) FROM agent_tasks WHERE client_id = p_client_id AND review_status = 'pending' AND status = 'completed'),
        (SELECT COUNT(*) FROM universal_automations WHERE client_id = p_client_id AND review_status = 'pending'),
        (SELECT COUNT(*) FROM ai_action_logs WHERE client_id = p_client_id AND review_status = 'pending') +
        (SELECT COUNT(*) FROM agent_tasks WHERE client_id = p_client_id AND review_status = 'pending' AND status = 'completed') +
        (SELECT COUNT(*) FROM universal_automations WHERE client_id = p_client_id AND review_status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
