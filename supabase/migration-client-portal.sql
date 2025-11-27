-- CoreOS Hub - Client Portal Migration
-- Run this SQL in your Supabase SQL Editor to add client portal features

-- Create the updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);

-- Client Tools Table (AI tools built for specific clients)
CREATE TABLE IF NOT EXISTS client_tools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Wand2',
    tool_type VARCHAR(50) DEFAULT 'ai_generator' CHECK (tool_type IN ('ai_generator', 'workflow', 'form', 'dashboard')),
    system_prompt TEXT NOT NULL,
    input_fields JSONB DEFAULT '[]',
    output_format VARCHAR(50) DEFAULT 'text' CHECK (output_format IN ('text', 'markdown', 'json', 'html')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on client_tools
CREATE INDEX IF NOT EXISTS idx_client_tools_client_id ON client_tools(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tools_is_active ON client_tools(is_active);

-- Tool Usage Logs (track how clients use their tools)
CREATE TABLE IF NOT EXISTS tool_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES client_tools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    input_data JSONB,
    output_data JSONB,
    tokens_used INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on tool_usage_logs
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_tool_id ON tool_usage_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_user_id ON tool_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_client_id ON tool_usage_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_created_at ON tool_usage_logs(created_at DESC);

-- Client Invitations Table (for inviting clients to the portal)
CREATE TABLE IF NOT EXISTS client_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on client_invitations
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
        OR id = auth.uid()
    );

-- Client Tools Policies
CREATE POLICY "Admins can manage all tools" ON client_tools
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Clients can view their own tools" ON client_tools
    FOR SELECT TO authenticated USING (
        client_id IN (
            SELECT client_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Tool Usage Logs Policies
CREATE POLICY "Admins can view all usage logs" ON tool_usage_logs
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can view their own usage logs" ON tool_usage_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage logs" ON tool_usage_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Client Invitations Policies
CREATE POLICY "Admins can manage invitations" ON client_invitations
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_tools_updated_at
    BEFORE UPDATE ON client_tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record client_invitations%ROWTYPE;
    default_role VARCHAR(50);
    linked_client_id UUID;
BEGIN
    -- Check if user was invited as a client
    SELECT * INTO invitation_record
    FROM client_invitations
    WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF invitation_record.id IS NOT NULL THEN
        -- User was invited - set as client
        default_role := 'client';
        linked_client_id := invitation_record.client_id;

        -- Mark invitation as accepted
        UPDATE client_invitations
        SET accepted_at = NOW()
        WHERE id = invitation_record.id;
    ELSE
        -- Check if admin email (you can customize this list)
        IF NEW.email IN ('lucasbhatia@icloud.com') THEN
            default_role := 'admin';
            linked_client_id := NULL;
        ELSE
            -- Default to client with no linked client (will need admin to link)
            default_role := 'client';
            linked_client_id := NULL;
        END IF;
    END IF;

    INSERT INTO user_profiles (id, email, full_name, role, client_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        default_role,
        linked_client_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert profile for existing admin user (run this if you already have users)
INSERT INTO user_profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'lucasbhatia@icloud.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
