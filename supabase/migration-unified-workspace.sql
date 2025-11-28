-- Migration: Unified Workspace
-- Merges System Builder and AI Workspace into one unified experience

-- Add automation fields to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS is_automation BOOLEAN DEFAULT false;

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS automation_schedule VARCHAR(100); -- cron expression

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS automation_trigger VARCHAR(50)
    CHECK (automation_trigger IS NULL OR automation_trigger IN ('manual', 'scheduled', 'webhook', 'email'));

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS automation_status VARCHAR(50) DEFAULT 'inactive'
    CHECK (automation_status IN ('inactive', 'active', 'paused'));

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);

-- Create index for finding active automations
CREATE INDEX IF NOT EXISTS idx_workflows_automation ON workflows(is_automation, automation_status)
WHERE is_automation = true;

-- Function to generate webhook credentials
CREATE OR REPLACE FUNCTION generate_workflow_webhook()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_automation = true AND NEW.webhook_url IS NULL THEN
        NEW.webhook_secret := encode(gen_random_bytes(32), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate webhook secret
DROP TRIGGER IF EXISTS trigger_workflow_webhook ON workflows;
CREATE TRIGGER trigger_workflow_webhook
    BEFORE INSERT OR UPDATE ON workflows
    FOR EACH ROW
    WHEN (NEW.is_automation = true)
    EXECUTE FUNCTION generate_workflow_webhook();
