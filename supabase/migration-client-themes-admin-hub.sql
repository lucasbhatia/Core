-- ============================================
-- Client Customizable Themes & Admin Hub Enhancement
-- Core Automations LLC - CoreOS Hub
-- ============================================

-- ============================================
-- CLIENT THEME CUSTOMIZATION
-- ============================================

-- Client Theme Settings Table
CREATE TABLE IF NOT EXISTS client_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,

  -- Color Settings
  primary_color VARCHAR(7) DEFAULT '#7c3aed',
  secondary_color VARCHAR(7) DEFAULT '#6366f1',
  accent_color VARCHAR(7) DEFAULT '#8b5cf6',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  surface_color VARCHAR(7) DEFAULT '#f8fafc',
  text_color VARCHAR(7) DEFAULT '#1e293b',
  text_muted_color VARCHAR(7) DEFAULT '#64748b',
  border_color VARCHAR(7) DEFAULT '#e2e8f0',
  success_color VARCHAR(7) DEFAULT '#22c55e',
  warning_color VARCHAR(7) DEFAULT '#f59e0b',
  error_color VARCHAR(7) DEFAULT '#ef4444',

  -- Dark Mode Colors
  dark_background_color VARCHAR(7) DEFAULT '#0f172a',
  dark_surface_color VARCHAR(7) DEFAULT '#1e293b',
  dark_text_color VARCHAR(7) DEFAULT '#f1f5f9',
  dark_text_muted_color VARCHAR(7) DEFAULT '#94a3b8',
  dark_border_color VARCHAR(7) DEFAULT '#334155',

  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  company_name VARCHAR(255),

  -- Typography
  font_family VARCHAR(100) DEFAULT 'Inter',
  heading_font_family VARCHAR(100) DEFAULT 'Inter',
  font_size_base INTEGER DEFAULT 14,
  border_radius INTEGER DEFAULT 8,

  -- Layout Preferences
  sidebar_style VARCHAR(20) DEFAULT 'default', -- default, compact, minimal
  header_style VARCHAR(20) DEFAULT 'default', -- default, minimal, branded
  card_style VARCHAR(20) DEFAULT 'default', -- default, bordered, elevated, flat

  -- Feature Toggles
  show_powered_by BOOLEAN DEFAULT true,
  custom_css TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Theme Presets (reusable templates)
CREATE TABLE IF NOT EXISTS theme_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_image_url TEXT,

  -- Color Settings (same as client_themes)
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7) NOT NULL,
  accent_color VARCHAR(7) NOT NULL,
  background_color VARCHAR(7) NOT NULL,
  surface_color VARCHAR(7) NOT NULL,
  text_color VARCHAR(7) NOT NULL,
  text_muted_color VARCHAR(7) NOT NULL,
  border_color VARCHAR(7) NOT NULL,
  success_color VARCHAR(7) DEFAULT '#22c55e',
  warning_color VARCHAR(7) DEFAULT '#f59e0b',
  error_color VARCHAR(7) DEFAULT '#ef4444',

  -- Dark Mode Colors
  dark_background_color VARCHAR(7) NOT NULL,
  dark_surface_color VARCHAR(7) NOT NULL,
  dark_text_color VARCHAR(7) NOT NULL,
  dark_text_muted_color VARCHAR(7) NOT NULL,
  dark_border_color VARCHAR(7) NOT NULL,

  -- Settings
  font_family VARCHAR(100) DEFAULT 'Inter',
  border_radius INTEGER DEFAULT 8,

  -- Metadata
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default theme presets
INSERT INTO theme_presets (name, description, primary_color, secondary_color, accent_color, background_color, surface_color, text_color, text_muted_color, border_color, dark_background_color, dark_surface_color, dark_text_color, dark_text_muted_color, dark_border_color, is_default) VALUES
('Purple Professional', 'Clean professional purple theme', '#7c3aed', '#6366f1', '#8b5cf6', '#ffffff', '#f8fafc', '#1e293b', '#64748b', '#e2e8f0', '#0f172a', '#1e293b', '#f1f5f9', '#94a3b8', '#334155', true),
('Ocean Blue', 'Calm and trustworthy blue tones', '#0ea5e9', '#0284c7', '#38bdf8', '#f0f9ff', '#e0f2fe', '#0c4a6e', '#0369a1', '#bae6fd', '#082f49', '#0c4a6e', '#e0f2fe', '#7dd3fc', '#0369a1', false),
('Forest Green', 'Natural and growth-focused green', '#22c55e', '#16a34a', '#4ade80', '#f0fdf4', '#dcfce7', '#14532d', '#166534', '#bbf7d0', '#052e16', '#14532d', '#dcfce7', '#86efac', '#166534', false),
('Sunset Orange', 'Warm and energetic orange', '#f97316', '#ea580c', '#fb923c', '#fff7ed', '#ffedd5', '#7c2d12', '#c2410c', '#fed7aa', '#431407', '#7c2d12', '#ffedd5', '#fdba74', '#c2410c', false),
('Rose Pink', 'Modern and friendly pink', '#ec4899', '#db2777', '#f472b6', '#fdf2f8', '#fce7f3', '#831843', '#be185d', '#fbcfe8', '#500724', '#831843', '#fce7f3', '#f9a8d4', '#be185d', false),
('Slate Gray', 'Neutral and sophisticated', '#475569', '#334155', '#64748b', '#f8fafc', '#f1f5f9', '#0f172a', '#334155', '#cbd5e1', '#020617', '#0f172a', '#e2e8f0', '#94a3b8', '#1e293b', false),
('Emerald Teal', 'Fresh and modern teal', '#14b8a6', '#0d9488', '#2dd4bf', '#f0fdfa', '#ccfbf1', '#134e4a', '#115e59', '#99f6e4', '#042f2e', '#134e4a', '#ccfbf1', '#5eead4', '#115e59', false),
('Indigo Deep', 'Deep and professional indigo', '#6366f1', '#4f46e5', '#818cf8', '#eef2ff', '#e0e7ff', '#312e81', '#4338ca', '#c7d2fe', '#1e1b4b', '#312e81', '#e0e7ff', '#a5b4fc', '#4338ca', false);

-- ============================================
-- ADMIN ACTIVITY AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- client, project, automation, settings, billing, team
  resource_id UUID,
  resource_name VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SYSTEM HEALTH & MONITORING
-- ============================================

CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- healthy, degraded, down
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 4) NOT NULL,
  metric_unit VARCHAR(50),
  tags JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INTEGRATION HUB
-- ============================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- api, webhook, oauth, database
  provider VARCHAR(100) NOT NULL, -- stripe, airtable, n8n, slack, zapier, etc.
  description TEXT,
  icon_url TEXT,

  -- Configuration (encrypted in production)
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, error
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Usage
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,

  -- Metadata
  is_global BOOLEAN DEFAULT true, -- true = platform-wide, false = client-specific
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- inbound, outbound
  status VARCHAR(20) NOT NULL, -- success, failed, pending
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REPORTS & EXPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- analytics, billing, usage, performance, client

  -- Schedule
  schedule_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
  schedule_day INTEGER, -- day of week (0-6) or day of month (1-31)
  schedule_time TIME DEFAULT '09:00:00',
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Configuration
  config JSONB DEFAULT '{}', -- report-specific options
  filters JSONB DEFAULT '{}', -- date ranges, client filters, etc.
  format VARCHAR(20) DEFAULT 'pdf', -- pdf, csv, excel, json

  -- Recipients
  recipients JSONB DEFAULT '[]', -- array of email addresses

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_error TEXT,

  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Export Configuration
  format VARCHAR(20) NOT NULL, -- pdf, csv, excel, json
  filters JSONB DEFAULT '{}',

  -- File Info
  file_url TEXT,
  file_size_bytes BIGINT,
  row_count INTEGER,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENHANCED ADMIN DASHBOARD METRICS
-- ============================================

CREATE TABLE IF NOT EXISTS dashboard_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(50) NOT NULL UNIQUE,
  metric_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '5 minutes')
);

-- ============================================
-- API KEY MANAGEMENT ENHANCEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Client themes
CREATE INDEX IF NOT EXISTS idx_client_themes_client ON client_themes(client_id);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON admin_audit_logs(severity);

-- System health
CREATE INDEX IF NOT EXISTS idx_health_service ON system_health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded ON system_metrics(recorded_at DESC);

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_client ON integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_type ON scheduled_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_next_run ON scheduled_reports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_exports_status ON report_exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_created ON report_exports(created_at DESC);

-- API usage
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_key_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_key_usage(endpoint);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE client_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view their client theme" ON client_themes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Public can view theme presets" ON theme_presets FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated can view audit logs" ON admin_audit_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view health checks" ON system_health_checks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view metrics" ON system_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view integrations" ON integrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view integration logs" ON integration_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view reports" ON scheduled_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view exports" ON report_exports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view dashboard cache" ON dashboard_metrics_cache FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view API usage" ON api_key_usage FOR SELECT USING (auth.role() = 'authenticated');

-- Service role full access
CREATE POLICY "Service role full access client_themes" ON client_themes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access theme_presets" ON theme_presets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audit_logs" ON admin_audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access health_checks" ON system_health_checks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access metrics" ON system_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access integrations" ON integrations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access integration_logs" ON integration_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reports" ON scheduled_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access exports" ON report_exports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access dashboard_cache" ON dashboard_metrics_cache FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access api_usage" ON api_key_usage FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_client_themes_updated_at ON client_themes;
CREATE TRIGGER update_client_themes_updated_at BEFORE UPDATE ON client_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
