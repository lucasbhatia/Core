-- Add project_id to system_builds to link systems to projects
-- Run this in Supabase SQL Editor

-- Add the column (nullable so existing records aren't affected)
ALTER TABLE system_builds
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_builds_project_id ON system_builds(project_id);

-- Done! Systems can now be linked to projects
