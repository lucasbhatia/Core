-- CoreOS Hub Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    deliverables TEXT,
    timeline VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Audits Table (for audit requests from marketing website)
CREATE TABLE IF NOT EXISTS audits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    business_url TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on audits
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);

-- System Builds Table (for AI-generated system designs)
CREATE TABLE IF NOT EXISTS system_builds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    result JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on system_builds
CREATE INDEX IF NOT EXISTS idx_system_builds_status ON system_builds(status);
CREATE INDEX IF NOT EXISTS idx_system_builds_created_at ON system_builds(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_builds ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients" ON clients
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" ON clients
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients" ON clients
    FOR DELETE TO authenticated USING (true);

-- Projects policies
CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE TO authenticated USING (true);

-- Audits policies
CREATE POLICY "Authenticated users can view audits" ON audits
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audits" ON audits
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update audits" ON audits
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete audits" ON audits
    FOR DELETE TO authenticated USING (true);

-- Also allow anonymous insert for audits (from external website forms)
CREATE POLICY "Anyone can submit audit requests" ON audits
    FOR INSERT TO anon WITH CHECK (true);

-- System Builds policies
CREATE POLICY "Authenticated users can view system builds" ON system_builds
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert system builds" ON system_builds
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update system builds" ON system_builds
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete system builds" ON system_builds
    FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at
    BEFORE UPDATE ON audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_builds_updated_at
    BEFORE UPDATE ON system_builds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - comment out if not needed)
-- Sample Clients
INSERT INTO clients (name, company, email, phone, notes) VALUES
    ('John Smith', 'Tech Innovators Inc', 'john@techinnovators.com', '+1 (555) 123-4567', 'Looking for CRM automation'),
    ('Sarah Johnson', 'Growth Marketing Co', 'sarah@growthmarketing.co', '+1 (555) 987-6543', 'E-commerce automation project'),
    ('Mike Chen', 'Startup Labs', 'mike@startuplabs.io', '+1 (555) 456-7890', 'AI chatbot integration')
ON CONFLICT DO NOTHING;

-- Sample Projects (will only insert if clients exist)
INSERT INTO projects (client_id, title, status, deliverables, timeline)
SELECT
    c.id,
    'CRM Integration Project',
    'active',
    'HubSpot integration, Lead scoring automation, Email sequences',
    'Q1 2025'
FROM clients c WHERE c.email = 'john@techinnovators.com'
ON CONFLICT DO NOTHING;

INSERT INTO projects (client_id, title, status, deliverables, timeline)
SELECT
    c.id,
    'E-commerce Automation Suite',
    'active',
    'Order processing, Inventory sync, Customer notifications',
    'Q1-Q2 2025'
FROM clients c WHERE c.email = 'sarah@growthmarketing.co'
ON CONFLICT DO NOTHING;

-- Sample Audit Requests
INSERT INTO audits (client_name, email, business_url, description, status) VALUES
    ('Alex Williams', 'alex@example.com', 'https://alexbusiness.com', 'Looking to automate our customer onboarding process. Currently takes too much manual effort.', 'new'),
    ('Emily Davis', 'emily@startup.io', 'https://startup.io', 'Need help with workflow automation for our sales team.', 'in-progress')
ON CONFLICT DO NOTHING;
