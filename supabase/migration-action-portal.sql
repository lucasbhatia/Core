-- Migration: Action-Based Client Portal
-- This adds actions to systems and creates the client portal infrastructure

-- Add actions column to system_builds
ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '[]';

-- Add client_id to system_builds (for portal access)
ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index on client_id
CREATE INDEX IF NOT EXISTS idx_system_builds_client_id ON system_builds(client_id);

-- Client Portal Access Tokens (for magic link authentication)
CREATE TABLE IF NOT EXISTS client_access_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_access_tokens_token ON client_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_client_id ON client_access_tokens(client_id);

-- System Data Storage (for storing client-entered data like leads, contacts, etc.)
CREATE TABLE IF NOT EXISTS system_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_id UUID NOT NULL REFERENCES system_builds(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action_id VARCHAR(255) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    ai_result JSONB,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'processed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_data_system_id ON system_data(system_id);
CREATE INDEX IF NOT EXISTS idx_system_data_client_id ON system_data(client_id);
CREATE INDEX IF NOT EXISTS idx_system_data_action_id ON system_data(action_id);
CREATE INDEX IF NOT EXISTS idx_system_data_created_at ON system_data(created_at DESC);

-- System Activity Log (for showing recent activity in portal)
CREATE TABLE IF NOT EXISTS system_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_id UUID NOT NULL REFERENCES system_builds(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_activity_system_id ON system_activity(system_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_client_id ON system_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_system_activity_created_at ON system_activity(created_at DESC);

-- Enable RLS
ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_access_tokens (admin only)
CREATE POLICY "Authenticated users can manage access tokens" ON client_access_tokens
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for system_data
CREATE POLICY "Authenticated users can manage system data" ON system_data
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies for system_activity
CREATE POLICY "Authenticated users can view system activity" ON system_activity
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert system activity" ON system_activity
    FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for system_data updated_at
CREATE TRIGGER update_system_data_updated_at
    BEFORE UPDATE ON system_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
