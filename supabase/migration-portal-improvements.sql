-- Migration: Portal Improvements
-- Enhances deliverables and adds client portal automation features

-- ============================================
-- DELIVERABLES IMPROVEMENTS
-- ============================================

-- Add category for organization
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general'
    CHECK (category IN ('report', 'document', 'analysis', 'presentation', 'code', 'data', 'general'));

-- Add tags for filtering
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add updated_at for tracking edits
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add archived status to status check
-- First drop the existing constraint
ALTER TABLE deliverables DROP CONSTRAINT IF EXISTS deliverables_status_check;

-- Add new constraint with archived
ALTER TABLE deliverables ADD CONSTRAINT deliverables_status_check
    CHECK (status IN ('draft', 'review', 'approved', 'delivered', 'rejected', 'archived'));

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_deliverables_category ON deliverables(category);

-- Index for tags (GIN for array searching)
CREATE INDEX IF NOT EXISTS idx_deliverables_tags ON deliverables USING GIN(tags);

-- ============================================
-- WORKFLOW/AUTOMATION IMPROVEMENTS
-- ============================================

-- Add template_id for automation runs to reference their template
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS template_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

-- Index for finding runs of a template
CREATE INDEX IF NOT EXISTS idx_workflows_template ON workflows(template_workflow_id)
WHERE template_workflow_id IS NOT NULL;

-- ============================================
-- CLIENT PORTAL ACCESS LOGGING
-- ============================================

CREATE TABLE IF NOT EXISTS client_automation_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    automation_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    workflow_run_id UUID REFERENCES workflows(id) ON DELETE SET NULL,

    -- Run info
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input_data JSONB DEFAULT '{}',

    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Results
    output_summary TEXT,
    deliverable_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_client_automation_runs_client ON client_automation_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_automation_runs_automation ON client_automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_client_automation_runs_status ON client_automation_runs(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update deliverables updated_at on change
CREATE OR REPLACE FUNCTION update_deliverable_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deliverable_updated ON deliverables;
CREATE TRIGGER trigger_deliverable_updated
    BEFORE UPDATE ON deliverables
    FOR EACH ROW
    EXECUTE FUNCTION update_deliverable_timestamp();
