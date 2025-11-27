-- CoreOS Hub - Complete Database Setup
-- Run this ONCE in Supabase SQL Editor to set up everything

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. User Profiles Table (for admin vs client roles)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Client Tools Table (AI tools you build for clients)
CREATE TABLE IF NOT EXISTS client_tools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tool_type VARCHAR(50) DEFAULT 'ai_generator',
    system_prompt TEXT NOT NULL,
    input_fields JSONB DEFAULT '[]',
    output_format VARCHAR(50) DEFAULT 'markdown',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tool Usage Logs (track client usage)
CREATE TABLE IF NOT EXISTS tool_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES client_tools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    input_data JSONB,
    output_data JSONB,
    tokens_used INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Allow authenticated users full access (simple for now)
DROP POLICY IF EXISTS "Allow all for authenticated" ON user_profiles;
CREATE POLICY "Allow all for authenticated" ON user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON client_tools;
CREATE POLICY "Allow all for authenticated" ON client_tools FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON tool_usage_logs;
CREATE POLICY "Allow all for authenticated" ON tool_usage_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Create your admin profile
INSERT INTO user_profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'lucasbhatia@icloud.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Done! Your admin account is set up.
