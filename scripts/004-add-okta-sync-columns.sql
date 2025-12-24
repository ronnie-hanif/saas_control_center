-- Migration: Add Okta sync columns for idempotent syncing
-- This migration adds oktaId to users, oktaAppId to applications,
-- and new tracking columns to integration_connections and sync_runs

-- Add oktaId to users table for idempotent user sync
ALTER TABLE users
ADD COLUMN IF NOT EXISTS okta_id TEXT UNIQUE;

-- Add oktaAppId to applications table for idempotent app sync
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS okta_app_id TEXT UNIQUE;

-- Add incremental sync tracking to integration_connections
ALTER TABLE integration_connections
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_cursor TEXT;

-- Add new tracking columns to sync_runs
ALTER TABLE sync_runs
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS records_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS records_written INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_records_updated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_summary TEXT,
ADD COLUMN IF NOT EXISTS resume_token TEXT,
ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT FALSE;

-- Add lastLogin to user_app_access if not exists
ALTER TABLE user_app_access
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create indexes for Okta IDs for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_users_okta_id ON users(okta_id) WHERE okta_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_okta_app_id ON applications(okta_app_id) WHERE okta_app_id IS NOT NULL;

-- Fixed column names to match Prisma's camelCase mapping (Prisma uses camelCase in schema but maps to same names in DB)
-- Log the migration
INSERT INTO audit_events (id, actor, action, "objectType", "objectId", "objectName", "detailsJson", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'system',
  'migrate',
  'database',
  '004-add-okta-sync-columns',
  'Migration: Add Okta sync columns',
  '{"version": "004", "description": "Added oktaId, oktaAppId, and sync tracking columns"}'::jsonb,
  NOW()
);
