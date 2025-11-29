-- Migration: Enhanced Plans, Model Access, and Daily Usage Tracking
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- ALTER SUBSCRIPTION_PLANS TABLE
-- Add new fields for enhanced plan features
-- ============================================

-- Add new columns if they don't exist
DO $$
BEGIN
    -- AI actions daily limit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'ai_actions_daily') THEN
        ALTER TABLE subscription_plans ADD COLUMN ai_actions_daily INTEGER NOT NULL DEFAULT 10;
    END IF;

    -- Agent tasks daily limit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'agent_tasks_daily') THEN
        ALTER TABLE subscription_plans ADD COLUMN agent_tasks_daily INTEGER NOT NULL DEFAULT 5;
    END IF;

    -- Automations limit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'automations_limit') THEN
        ALTER TABLE subscription_plans ADD COLUMN automations_limit INTEGER NOT NULL DEFAULT 3;
    END IF;

    -- Model access (array of allowed models)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'model_access') THEN
        ALTER TABLE subscription_plans ADD COLUMN model_access TEXT[] DEFAULT ARRAY['haiku'];
    END IF;

    -- Features enabled (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'features_enabled') THEN
        ALTER TABLE subscription_plans ADD COLUMN features_enabled JSONB DEFAULT '{
            "review_queue": true,
            "custom_agents": false,
            "webhook_triggers": false,
            "team_collaboration": false,
            "api_access": false,
            "priority_support": false,
            "custom_integrations": false,
            "white_label": false
        }'::jsonb;
    END IF;

    -- Display order
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'display_order') THEN
        ALTER TABLE subscription_plans ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing plans with new values
UPDATE subscription_plans SET
    ai_actions_daily = 10,
    agent_tasks_daily = 5,
    automations_limit = 3,
    model_access = ARRAY['haiku'],
    features_enabled = '{
        "review_queue": true,
        "custom_agents": false,
        "webhook_triggers": false,
        "team_collaboration": false,
        "api_access": false,
        "priority_support": false,
        "custom_integrations": false,
        "white_label": false
    }'::jsonb,
    display_order = 1
WHERE id = 'free';

UPDATE subscription_plans SET
    ai_actions_daily = 50,
    agent_tasks_daily = 25,
    automations_limit = 15,
    model_access = ARRAY['haiku', 'sonnet'],
    features_enabled = '{
        "review_queue": true,
        "custom_agents": false,
        "webhook_triggers": true,
        "team_collaboration": false,
        "api_access": false,
        "priority_support": false,
        "custom_integrations": false,
        "white_label": false
    }'::jsonb,
    display_order = 2
WHERE id = 'starter';

UPDATE subscription_plans SET
    ai_actions_daily = 200,
    agent_tasks_daily = 100,
    automations_limit = 50,
    model_access = ARRAY['haiku', 'sonnet'],
    features_enabled = '{
        "review_queue": true,
        "custom_agents": true,
        "webhook_triggers": true,
        "team_collaboration": true,
        "api_access": true,
        "priority_support": true,
        "custom_integrations": false,
        "white_label": false
    }'::jsonb,
    display_order = 3
WHERE id = 'pro';

UPDATE subscription_plans SET
    ai_actions_daily = -1,
    agent_tasks_daily = -1,
    automations_limit = -1,
    model_access = ARRAY['haiku', 'sonnet', 'opus'],
    features_enabled = '{
        "review_queue": true,
        "custom_agents": true,
        "webhook_triggers": true,
        "team_collaboration": true,
        "api_access": true,
        "priority_support": true,
        "custom_integrations": true,
        "white_label": true
    }'::jsonb,
    display_order = 4
WHERE id = 'enterprise';

UPDATE subscription_plans SET
    ai_actions_daily = 200,
    agent_tasks_daily = 100,
    automations_limit = 50,
    model_access = ARRAY['haiku', 'sonnet'],
    features_enabled = '{
        "review_queue": true,
        "custom_agents": true,
        "webhook_triggers": true,
        "team_collaboration": true,
        "api_access": true,
        "priority_support": true,
        "custom_integrations": false,
        "white_label": false
    }'::jsonb,
    display_order = 3
WHERE id = 'business';


-- ============================================
-- DAILY USAGE TRACKING TABLE
-- Track daily usage for accurate limit enforcement
-- ============================================

CREATE TABLE IF NOT EXISTS daily_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Daily counters
    ai_actions_count INTEGER DEFAULT 0,
    agent_tasks_count INTEGER DEFAULT 0,
    automation_runs_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(client_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_usage_client_id ON daily_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_client_date ON daily_usage(client_id, date);

-- Enable RLS
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view daily usage" ON daily_usage
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage daily usage" ON daily_usage
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================
-- AI MODEL DEFINITIONS TABLE
-- Define available AI models and their properties
-- ============================================

CREATE TABLE IF NOT EXISTS ai_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
    description TEXT,

    -- Capabilities
    max_tokens INTEGER DEFAULT 4096,
    supports_vision BOOLEAN DEFAULT false,
    supports_tools BOOLEAN DEFAULT true,

    -- Pricing (tokens per $1)
    input_cost_per_1k DECIMAL(10, 6) DEFAULT 0.003,
    output_cost_per_1k DECIMAL(10, 6) DEFAULT 0.015,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Display
    display_order INTEGER DEFAULT 0,
    badge_text VARCHAR(50),
    badge_color VARCHAR(20),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default models
INSERT INTO ai_models (id, name, provider, description, max_tokens, input_cost_per_1k, output_cost_per_1k, is_active, display_order, badge_text, badge_color) VALUES
    ('haiku', 'Claude Haiku', 'anthropic', 'Fast and efficient for simple tasks', 4096, 0.00025, 0.00125, true, 1, 'Fast', 'green'),
    ('sonnet', 'Claude Sonnet', 'anthropic', 'Balanced performance for most tasks', 4096, 0.003, 0.015, true, 2, 'Recommended', 'violet'),
    ('opus', 'Claude Opus', 'anthropic', 'Most capable for complex reasoning', 4096, 0.015, 0.075, true, 3, 'Premium', 'amber')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    input_cost_per_1k = EXCLUDED.input_cost_per_1k,
    output_cost_per_1k = EXCLUDED.output_cost_per_1k,
    display_order = EXCLUDED.display_order,
    badge_text = EXCLUDED.badge_text,
    badge_color = EXCLUDED.badge_color,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Everyone can read models
CREATE POLICY "Anyone can view AI models" ON ai_models
    FOR SELECT TO authenticated, anon USING (is_active = true);


-- ============================================
-- ADD PLAN_TIER TO CLIENTS TABLE
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'plan_tier') THEN
        ALTER TABLE clients ADD COLUMN plan_tier VARCHAR(50) DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE clients ADD COLUMN stripe_customer_id VARCHAR(255);
    END IF;
END $$;


-- ============================================
-- EMAIL NOTIFICATION LOGS TABLE
-- Track sent email notifications
-- ============================================

CREATE TABLE IF NOT EXISTS email_notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Email details
    email_type VARCHAR(50) NOT NULL, -- 'agent_task_completed', 'automation_failed', 'ai_draft_ready', 'usage_warning', etc.
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),

    -- Reference to source
    source_type VARCHAR(50), -- 'agent_task', 'automation', 'ai_action', etc.
    source_id UUID,

    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,

    -- Resend integration
    resend_id VARCHAR(255),

    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_client_id ON email_notification_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_email_type ON email_notification_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_source ON email_notification_logs(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_created_at ON email_notification_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage email logs" ON email_notification_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get client's current plan limits
CREATE OR REPLACE FUNCTION get_client_plan_limits(p_client_id UUID)
RETURNS TABLE (
    plan_tier VARCHAR,
    ai_actions_daily INTEGER,
    agent_tasks_daily INTEGER,
    automations_limit INTEGER,
    ai_tokens_limit INTEGER,
    model_access TEXT[],
    features_enabled JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(c.plan_tier, 'free')::VARCHAR,
        COALESCE(sp.ai_actions_daily, 10),
        COALESCE(sp.agent_tasks_daily, 5),
        COALESCE(sp.automations_limit, 3),
        COALESCE(sp.ai_tokens_limit, 10000),
        COALESCE(sp.model_access, ARRAY['haiku']),
        COALESCE(sp.features_enabled, '{}'::jsonb)
    FROM clients c
    LEFT JOIN subscription_plans sp ON sp.id = COALESCE(c.plan_tier, 'free')
    WHERE c.id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to increment daily usage
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_client_id UUID,
    p_field VARCHAR(50),
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_usage (client_id, date)
    VALUES (p_client_id, CURRENT_DATE)
    ON CONFLICT (client_id, date) DO NOTHING;

    EXECUTE format(
        'UPDATE daily_usage SET %I = %I + $1, updated_at = NOW() WHERE client_id = $2 AND date = CURRENT_DATE',
        p_field, p_field
    ) USING p_amount, p_client_id;
END;
$$ LANGUAGE plpgsql;


-- Function to check if action is within daily limits
CREATE OR REPLACE FUNCTION check_daily_limit(
    p_client_id UUID,
    p_action_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_usage INTEGER;
    v_limit INTEGER;
    v_plan_tier VARCHAR;
BEGIN
    -- Get client's plan tier
    SELECT COALESCE(plan_tier, 'free') INTO v_plan_tier
    FROM clients WHERE id = p_client_id;

    -- Get the limit for this action type
    SELECT
        CASE p_action_type
            WHEN 'ai_action' THEN ai_actions_daily
            WHEN 'agent_task' THEN agent_tasks_daily
            ELSE 0
        END INTO v_limit
    FROM subscription_plans WHERE id = v_plan_tier;

    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;

    -- Get current usage for today
    SELECT
        CASE p_action_type
            WHEN 'ai_action' THEN ai_actions_count
            WHEN 'agent_task' THEN agent_tasks_count
            ELSE 0
        END INTO v_current_usage
    FROM daily_usage
    WHERE client_id = p_client_id AND date = CURRENT_DATE;

    RETURN COALESCE(v_current_usage, 0) < COALESCE(v_limit, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to check if client has model access
CREATE OR REPLACE FUNCTION check_model_access(
    p_client_id UUID,
    p_model_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_allowed_models TEXT[];
    v_plan_tier VARCHAR;
BEGIN
    -- Get client's plan tier
    SELECT COALESCE(plan_tier, 'free') INTO v_plan_tier
    FROM clients WHERE id = p_client_id;

    -- Get allowed models for this plan
    SELECT model_access INTO v_allowed_models
    FROM subscription_plans WHERE id = v_plan_tier;

    RETURN p_model_id = ANY(COALESCE(v_allowed_models, ARRAY['haiku']));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_daily_usage_updated_at
    BEFORE UPDATE ON daily_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
