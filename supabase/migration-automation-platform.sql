-- Migration: Automation Delivery Platform
-- Transforms the system from a form portal to an automation delivery platform

-- Add automation fields to system_builds
ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS automation_status VARCHAR(50) DEFAULT 'pending'
    CHECK (automation_status IN ('pending', 'active', 'paused', 'error', 'archived'));

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS automation_type VARCHAR(50) DEFAULT 'webhook'
    CHECK (automation_type IN ('webhook', 'scheduled', 'manual', 'api'));

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS automation_config JSONB DEFAULT '{}';

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Create automation_runs table for tracking each execution
CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_id UUID NOT NULL REFERENCES system_builds(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Run details
    status VARCHAR(50) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual'
        CHECK (trigger_type IN ('webhook', 'scheduled', 'manual', 'api')),

    -- Input/Output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',

    -- Metrics
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    -- Error handling
    error_message TEXT,
    error_details JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_system_id ON automation_runs(system_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_client_id ON automation_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON automation_runs(created_at DESC);

-- Create automation_logs table for detailed logging
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES system_builds(id) ON DELETE CASCADE,

    -- Log details
    level VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',

    -- Step tracking
    step_name VARCHAR(255),
    step_index INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_run_id ON automation_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_system_id ON automation_logs(system_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_level ON automation_logs(level);

-- Create daily metrics aggregation table
CREATE TABLE IF NOT EXISTS automation_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    system_id UUID NOT NULL REFERENCES system_builds(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Date for aggregation
    metric_date DATE NOT NULL,

    -- Counts
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Timing
    avg_duration_ms INTEGER,
    min_duration_ms INTEGER,
    max_duration_ms INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(system_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_automation_metrics_system_id ON automation_metrics(system_id);
CREATE INDEX IF NOT EXISTS idx_automation_metrics_date ON automation_metrics(metric_date DESC);

-- Enable RLS
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Authenticated users can manage automation runs" ON automation_runs;
DROP POLICY IF EXISTS "Authenticated users can manage automation logs" ON automation_logs;
DROP POLICY IF EXISTS "Authenticated users can manage automation metrics" ON automation_metrics;
DROP POLICY IF EXISTS "Anonymous can insert automation runs via webhook" ON automation_runs;
DROP POLICY IF EXISTS "Anonymous can insert automation logs via webhook" ON automation_logs;
DROP POLICY IF EXISTS "Service role full access to automation_runs" ON automation_runs;
DROP POLICY IF EXISTS "Service role full access to automation_logs" ON automation_logs;
DROP POLICY IF EXISTS "Service role full access to automation_metrics" ON automation_metrics;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can manage automation runs" ON automation_runs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage automation logs" ON automation_logs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage automation metrics" ON automation_metrics
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anonymous access for webhooks
CREATE POLICY "Anonymous can insert automation runs via webhook" ON automation_runs
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous can insert automation logs via webhook" ON automation_logs
    FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (for API routes using service role key)
CREATE POLICY "Service role full access to automation_runs" ON automation_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to automation_logs" ON automation_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to automation_metrics" ON automation_metrics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to update automation metrics after a run
CREATE OR REPLACE FUNCTION update_automation_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process completed runs
    IF NEW.status IN ('success', 'failed') AND NEW.completed_at IS NOT NULL THEN
        INSERT INTO automation_metrics (
            system_id,
            client_id,
            metric_date,
            total_runs,
            successful_runs,
            failed_runs,
            avg_duration_ms,
            min_duration_ms,
            max_duration_ms
        )
        VALUES (
            NEW.system_id,
            NEW.client_id,
            DATE(NEW.completed_at),
            1,
            CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            NEW.duration_ms,
            NEW.duration_ms,
            NEW.duration_ms
        )
        ON CONFLICT (system_id, metric_date) DO UPDATE SET
            total_runs = automation_metrics.total_runs + 1,
            successful_runs = automation_metrics.successful_runs +
                CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
            failed_runs = automation_metrics.failed_runs +
                CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            avg_duration_ms = (automation_metrics.avg_duration_ms * automation_metrics.total_runs + NEW.duration_ms) / (automation_metrics.total_runs + 1),
            min_duration_ms = LEAST(automation_metrics.min_duration_ms, NEW.duration_ms),
            max_duration_ms = GREATEST(automation_metrics.max_duration_ms, NEW.duration_ms),
            updated_at = NOW();

        -- Update system_builds run count
        UPDATE system_builds SET
            run_count = run_count + 1,
            last_run_at = NEW.completed_at,
            error_count = CASE WHEN NEW.status = 'failed' THEN error_count + 1 ELSE error_count END,
            last_error = CASE WHEN NEW.status = 'failed' THEN NEW.error_message ELSE last_error END
        WHERE id = NEW.system_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics on run completion
DROP TRIGGER IF EXISTS trigger_update_automation_metrics ON automation_runs;
CREATE TRIGGER trigger_update_automation_metrics
    AFTER UPDATE ON automation_runs
    FOR EACH ROW
    WHEN (OLD.status = 'running' AND NEW.status IN ('success', 'failed'))
    EXECUTE FUNCTION update_automation_metrics();

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;
