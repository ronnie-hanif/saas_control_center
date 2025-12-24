-- Create enums for integration types
DO $$ BEGIN
  CREATE TYPE integration_type AS ENUM ('okta', 'google', 'azure', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE integration_status AS ENUM ('pending', 'connected', 'disconnected', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_run_status AS ENUM ('running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create integration_connections table
CREATE TABLE IF NOT EXISTS integration_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type integration_type NOT NULL,
  name TEXT NOT NULL,
  status integration_status NOT NULL DEFAULT 'pending',
  config_json JSONB,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(type)
);

-- Create sync_runs table
CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  status sync_run_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  records_processed INT NOT NULL DEFAULT 0,
  users_created INT NOT NULL DEFAULT 0,
  users_updated INT NOT NULL DEFAULT 0,
  apps_created INT NOT NULL DEFAULT 0,
  apps_updated INT NOT NULL DEFAULT 0,
  access_records_created INT NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_runs_connection_id ON sync_runs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started_at ON sync_runs(started_at);

-- Insert default Okta integration connection (pending state)
INSERT INTO integration_connections (id, type, name, status)
VALUES ('okta-integration', 'okta', 'Okta', 'pending')
ON CONFLICT (type) DO NOTHING;
