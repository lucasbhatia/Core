-- Migration: Billing, Usage Tracking, and Team Management System
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly INTEGER NOT NULL, -- in cents
    price_yearly INTEGER, -- in cents (optional annual pricing)
    automation_limit INTEGER NOT NULL DEFAULT 5,
    runs_limit INTEGER NOT NULL DEFAULT 500,
    ai_tokens_limit INTEGER NOT NULL DEFAULT 100000,
    storage_limit_mb INTEGER NOT NULL DEFAULT 1024,
    team_members_limit INTEGER NOT NULL DEFAULT 1,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly, automation_limit, runs_limit, ai_tokens_limit, storage_limit_mb, team_members_limit, features) VALUES
    ('free', 'Free', 0, 1, 100, 10000, 100, 1, '["Basic automations", "Email support"]'::jsonb),
    ('starter', 'Starter', 4900, 3, 500, 50000, 512, 1, '["3 automations", "500 runs/month", "Email support"]'::jsonb),
    ('pro', 'Pro', 14900, 15, 5000, 100000, 2048, 5, '["15 automations", "5,000 runs/month", "AI chat assistant", "Analytics dashboard", "Priority support"]'::jsonb),
    ('business', 'Business', 39900, 50, 25000, 500000, 10240, 15, '["50 automations", "25,000 runs/month", "Team access", "API access", "Custom integrations", "Dedicated support"]'::jsonb),
    ('enterprise', 'Enterprise', 0, -1, -1, -1, -1, -1, '["Unlimited automations", "Unlimited runs", "White-label", "Custom SLA", "Dedicated account manager"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CLIENT SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
    -- Stripe integration
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    -- Billing details
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    -- Trial
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client_id ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_stripe_customer_id ON client_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON client_subscriptions(status);

-- ============================================
-- MONTHLY USAGE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    -- Usage counters
    automation_runs INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    -- Breakdown by type
    manual_runs INTEGER DEFAULT 0,
    scheduled_runs INTEGER DEFAULT 0,
    webhook_runs INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, month)
);

CREATE INDEX IF NOT EXISTS idx_client_usage_client_id ON client_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_client_usage_month ON client_usage(month);

-- ============================================
-- BILLING HISTORY / INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('draft', 'open', 'pending', 'paid', 'void', 'uncollectible')),
    description TEXT,
    invoice_url TEXT,
    invoice_pdf TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_client_id ON billing_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe_invoice_id ON billing_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status);

-- ============================================
-- PORTAL CHAT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS portal_chat_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    context_type VARCHAR(50) DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_chat_logs_client_id ON portal_chat_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_chat_logs_created_at ON portal_chat_logs(created_at DESC);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'removed')),
    -- Authentication
    invite_token VARCHAR(255),
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    -- Permissions (JSON for flexibility)
    permissions JSONB DEFAULT '{
        "can_run_automations": true,
        "can_view_analytics": true,
        "can_view_billing": false,
        "can_manage_team": false,
        "can_create_automations": false
    }'::jsonb,
    -- Metadata
    invited_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_client_id ON team_members(client_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_invite_token ON team_members(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID, -- Can be team member or null for client owner
    type VARCHAR(50) NOT NULL, -- 'automation_success', 'automation_failed', 'usage_warning', 'billing', 'team', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional link to related resource
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    -- For email notifications
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID, -- Can be team member or null for client owner
    -- Email preferences
    email_automation_success BOOLEAN DEFAULT false,
    email_automation_failed BOOLEAN DEFAULT true,
    email_usage_warnings BOOLEAN DEFAULT true,
    email_weekly_reports BOOLEAN DEFAULT false,
    email_billing_alerts BOOLEAN DEFAULT true,
    email_team_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    -- Browser push preferences
    push_enabled BOOLEAN DEFAULT false,
    push_automation_alerts BOOLEAN DEFAULT true,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_client_id ON notification_preferences(client_id);

-- ============================================
-- WEBHOOK EVENTS LOG (for verification)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- 'stripe', 'external', 'internal'
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255), -- External event ID for deduplication
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- ============================================
-- API KEYS TABLE (for client API access)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL, -- Store hashed key, not plain text
    key_prefix VARCHAR(10) NOT NULL, -- First few chars for identification (e.g., "core_sk_")
    scopes JSONB DEFAULT '["read", "write"]'::jsonb,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_client_id ON api_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT TO authenticated, anon USING (is_active = true);

-- Other tables - authenticated users can access
CREATE POLICY "Authenticated users can view client subscriptions" ON client_subscriptions
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage client subscriptions" ON client_subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage client usage" ON client_usage
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage billing invoices" ON billing_invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage portal chat logs" ON portal_chat_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage team members" ON team_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage notifications" ON notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage notification preferences" ON notification_preferences
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view webhook events" ON webhook_events
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage webhook events" ON webhook_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage api keys" ON api_keys
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_subscriptions_updated_at
    BEFORE UPDATE ON client_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_usage_updated_at
    BEFORE UPDATE ON client_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at
    BEFORE UPDATE ON billing_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment usage counters atomically
CREATE OR REPLACE FUNCTION increment_usage(
    p_client_id UUID,
    p_field VARCHAR(50),
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_month VARCHAR(7);
BEGIN
    v_month := to_char(NOW(), 'YYYY-MM');

    INSERT INTO client_usage (client_id, month)
    VALUES (p_client_id, v_month)
    ON CONFLICT (client_id, month) DO NOTHING;

    EXECUTE format(
        'UPDATE client_usage SET %I = %I + $1, updated_at = NOW() WHERE client_id = $2 AND month = $3',
        p_field, p_field
    ) USING p_amount, p_client_id, v_month;
END;
$$ LANGUAGE plpgsql;

-- Function to check if client is within usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
    p_client_id UUID,
    p_limit_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_usage INTEGER;
    v_limit INTEGER;
    v_month VARCHAR(7);
BEGIN
    v_month := to_char(NOW(), 'YYYY-MM');

    -- Get current usage
    SELECT COALESCE(
        CASE p_limit_type
            WHEN 'runs' THEN automation_runs
            WHEN 'ai_tokens' THEN ai_tokens_used
            WHEN 'storage' THEN storage_used_mb
            WHEN 'api_calls' THEN api_calls
        END, 0
    ) INTO v_current_usage
    FROM client_usage
    WHERE client_id = p_client_id AND month = v_month;

    -- Get limit from subscription
    SELECT COALESCE(
        CASE p_limit_type
            WHEN 'runs' THEN sp.runs_limit
            WHEN 'ai_tokens' THEN sp.ai_tokens_limit
            WHEN 'storage' THEN sp.storage_limit_mb
        END, 0
    ) INTO v_limit
    FROM client_subscriptions cs
    JOIN subscription_plans sp ON cs.plan_id = sp.id
    WHERE cs.client_id = p_client_id AND cs.status = 'active';

    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;

    RETURN COALESCE(v_current_usage, 0) < COALESCE(v_limit, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_client_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (client_id, type, title, message, link, metadata)
    VALUES (p_client_id, p_type, p_title, p_message, p_link, p_metadata)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;
