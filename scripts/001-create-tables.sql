-- SaaS Control Center Database Schema
-- Run this script to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  title TEXT,
  manager TEXT,
  manager_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'offboarding')),
  avatar TEXT,
  start_date TIMESTAMP,
  last_active TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  vendor TEXT,
  category TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('okta', 'google', 'azure', 'manual', 'browser_extension')),
  department TEXT,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'sanctioned' CHECK (status IN ('sanctioned', 'unsanctioned', 'under_review')),
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  annual_cost DECIMAL(10, 2) DEFAULT 0,
  licenses_purchased INT DEFAULT 0,
  licenses_assigned INT DEFAULT 0,
  sso_connected BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMP,
  renewal_date TIMESTAMP,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  contract_value DECIMAL(12, 2) NOT NULL,
  billing_cadence TEXT DEFAULT 'annual',
  term_start TIMESTAMP NOT NULL,
  term_end TIMESTAMP NOT NULL,
  renewal_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired', 'pending')),
  cancellation_notice INT DEFAULT 30,
  terms TEXT,
  payment_terms TEXT,
  notes TEXT,
  documents TEXT[] DEFAULT '{}',
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access Review Campaigns table
CREATE TABLE IF NOT EXISTS access_review_campaigns (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  description TEXT,
  scope_apps TEXT[] DEFAULT '{}',
  scope_departments TEXT[] DEFAULT '{}',
  due_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'completed', 'draft', 'overdue')),
  reviewers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access Review Decisions table
CREATE TABLE IF NOT EXISTS access_review_decisions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  campaign_id TEXT NOT NULL REFERENCES access_review_campaigns(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decision TEXT DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'revoked')),
  rationale TEXT,
  decided_at TIMESTAMP,
  decided_by_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, application_id, user_id)
);

-- User App Access table
CREATE TABLE IF NOT EXISTS user_app_access (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'user',
  license_type TEXT,
  last_login TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, application_id)
);

-- Audit Events table (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  actor TEXT NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  object_name TEXT,
  details_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT UNIQUE NOT NULL,
  cost_center TEXT,
  annual_budget DECIMAL(12, 2),
  manager_id TEXT,
  manager_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_events(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_category ON applications(category);
CREATE INDEX IF NOT EXISTS idx_applications_risk ON applications(risk_level);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal ON contracts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
