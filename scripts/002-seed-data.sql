-- Seed Data for SaaS Control Center
-- Run this after creating tables

-- Seed Departments
INSERT INTO departments (id, name, cost_center, annual_budget, manager_name) VALUES
  ('dept-1', 'Engineering', 'CC-001', 500000, 'John Smith'),
  ('dept-2', 'Sales', 'CC-002', 350000, 'Jane Doe'),
  ('dept-3', 'Marketing', 'CC-003', 250000, 'Bob Johnson'),
  ('dept-4', 'HR', 'CC-004', 150000, 'Sarah Wilson'),
  ('dept-5', 'Finance', 'CC-005', 200000, 'Mike Brown'),
  ('dept-6', 'Operations', 'CC-006', 180000, 'Emily Davis')
ON CONFLICT (name) DO NOTHING;

-- Seed Users
INSERT INTO users (id, name, email, department, title, status, start_date) VALUES
  ('user-admin', 'IT Administrator', 'admin@company.com', 'IT', 'IT Admin', 'active', NOW() - INTERVAL '1000 days'),
  ('user-security', 'Security Administrator', 'security@company.com', 'Security', 'Security Admin', 'active', NOW() - INTERVAL '800 days'),
  ('user-finance', 'Finance Administrator', 'finance@company.com', 'Finance', 'Finance Admin', 'active', NOW() - INTERVAL '600 days'),
  ('user-readonly', 'Demo User', 'user@company.com', 'Operations', 'Analyst', 'active', NOW() - INTERVAL '300 days'),
  ('user-1', 'Sarah Chen', 'sarah.chen@company.com', 'Engineering', 'VP Engineering', 'active', NOW() - INTERVAL '730 days'),
  ('user-2', 'Alex Turner', 'alex.turner@company.com', 'Engineering', 'Senior Developer', 'active', NOW() - INTERVAL '450 days'),
  ('user-3', 'Mike Rodriguez', 'mike.rodriguez@company.com', 'Sales', 'Sales Director', 'active', NOW() - INTERVAL '600 days'),
  ('user-4', 'Jennifer Adams', 'jennifer.adams@company.com', 'Marketing', 'Marketing Manager', 'active', NOW() - INTERVAL '380 days'),
  ('user-5', 'Robert Martinez', 'robert.martinez@company.com', 'Finance', 'Finance Controller', 'active', NOW() - INTERVAL '520 days'),
  ('user-6', 'Lisa Thompson', 'lisa.thompson@company.com', 'HR', 'HR Director', 'active', NOW() - INTERVAL '680 days'),
  ('user-7', 'David Kim', 'david.kim@company.com', 'Engineering', 'DevOps Engineer', 'active', NOW() - INTERVAL '290 days'),
  ('user-8', 'Emily Wang', 'emily.wang@company.com', 'Engineering', 'Frontend Developer', 'active', NOW() - INTERVAL '200 days'),
  ('user-9', 'Chris Johnson', 'chris.johnson@company.com', 'Sales', 'Account Executive', 'active', NOW() - INTERVAL '150 days'),
  ('user-10', 'Amanda Foster', 'amanda.foster@company.com', 'Marketing', 'Content Strategist', 'active', NOW() - INTERVAL '320 days')
ON CONFLICT (email) DO NOTHING;

-- Seed Applications
INSERT INTO applications (id, name, vendor, category, description, source, risk_level, status, monthly_cost, licenses_purchased, licenses_assigned, sso_connected, renewal_date, owner_user_id) VALUES
  ('app-1', 'Slack', 'Salesforce', 'Collaboration', 'Team communication platform', 'okta', 'low', 'sanctioned', 12500, 500, 485, true, NOW() + INTERVAL '180 days', 'user-1'),
  ('app-2', 'GitHub', 'Microsoft', 'Development', 'Code repository and collaboration', 'okta', 'medium', 'sanctioned', 8500, 200, 195, true, NOW() + INTERVAL '90 days', 'user-1'),
  ('app-3', 'Salesforce', 'Salesforce', 'CRM', 'Customer relationship management', 'okta', 'high', 'sanctioned', 45000, 150, 142, true, NOW() + INTERVAL '60 days', 'user-3'),
  ('app-4', 'Figma', 'Figma', 'Design', 'Design and prototyping tool', 'manual', 'low', 'sanctioned', 3200, 50, 48, false, NOW() + INTERVAL '120 days', 'user-4'),
  ('app-5', 'Notion', 'Notion Labs', 'Productivity', 'Team workspace and documentation', 'google', 'low', 'sanctioned', 2400, 300, 280, false, NOW() + INTERVAL '200 days', 'user-6'),
  ('app-6', 'Jira', 'Atlassian', 'Project Management', 'Issue tracking and project management', 'okta', 'medium', 'sanctioned', 6800, 250, 235, true, NOW() + INTERVAL '150 days', 'user-1'),
  ('app-7', 'AWS', 'Amazon', 'Infrastructure', 'Cloud computing services', 'manual', 'critical', 'sanctioned', 125000, 100, 95, true, NOW() + INTERVAL '365 days', 'user-7'),
  ('app-8', 'Zoom', 'Zoom', 'Communication', 'Video conferencing', 'okta', 'medium', 'sanctioned', 5600, 400, 380, true, NOW() + INTERVAL '45 days', 'user-6'),
  ('app-9', 'HubSpot', 'HubSpot', 'Marketing', 'Marketing automation platform', 'manual', 'medium', 'sanctioned', 18000, 80, 75, false, NOW() + INTERVAL '90 days', 'user-4'),
  ('app-10', 'Datadog', 'Datadog', 'Monitoring', 'Infrastructure monitoring', 'manual', 'high', 'sanctioned', 15000, 50, 45, true, NOW() + INTERVAL '180 days', 'user-7'),
  ('app-11', 'Dropbox', 'Dropbox', 'Storage', 'Cloud file storage', 'browser_extension', 'medium', 'under_review', 4200, 200, 150, false, NOW() + INTERVAL '30 days', NULL),
  ('app-12', 'Trello', 'Atlassian', 'Project Management', 'Visual project management', 'browser_extension', 'low', 'unsanctioned', 1800, 100, 85, false, NOW() + INTERVAL '60 days', NULL),
  ('app-13', 'Linear', 'Linear', 'Project Management', 'Modern issue tracking', 'manual', 'low', 'sanctioned', 2800, 80, 78, true, NOW() + INTERVAL '240 days', 'user-2'),
  ('app-14', 'Stripe', 'Stripe', 'Finance', 'Payment processing', 'manual', 'critical', 'sanctioned', 8500, 20, 18, true, NOW() + INTERVAL '300 days', 'user-5'),
  ('app-15', 'Okta', 'Okta', 'Security', 'Identity management', 'okta', 'critical', 'sanctioned', 22000, 500, 485, true, NOW() + INTERVAL '270 days', 'user-admin')
ON CONFLICT (id) DO NOTHING;

-- Seed Contracts
INSERT INTO contracts (id, application_id, vendor, contract_value, term_start, term_end, renewal_date, auto_renew, status, owner_user_id) VALUES
  ('contract-1', 'app-1', 'Salesforce', 150000, NOW() - INTERVAL '180 days', NOW() + INTERVAL '180 days', NOW() + INTERVAL '180 days', true, 'active', 'user-1'),
  ('contract-2', 'app-2', 'Microsoft', 102000, NOW() - INTERVAL '270 days', NOW() + INTERVAL '90 days', NOW() + INTERVAL '90 days', true, 'expiring', 'user-1'),
  ('contract-3', 'app-3', 'Salesforce', 540000, NOW() - INTERVAL '300 days', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', false, 'expiring', 'user-3'),
  ('contract-4', 'app-7', 'Amazon', 1500000, NOW() - INTERVAL '1 year', NOW() + INTERVAL '1 year', NOW() + INTERVAL '365 days', true, 'active', 'user-7'),
  ('contract-5', 'app-8', 'Zoom', 67200, NOW() - INTERVAL '320 days', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', false, 'expiring', 'user-6'),
  ('contract-6', 'app-10', 'Datadog', 180000, NOW() - INTERVAL '180 days', NOW() + INTERVAL '180 days', NOW() + INTERVAL '180 days', true, 'active', 'user-7'),
  ('contract-7', 'app-14', 'Stripe', 102000, NOW() - INTERVAL '65 days', NOW() + INTERVAL '300 days', NOW() + INTERVAL '300 days', true, 'active', 'user-5'),
  ('contract-8', 'app-15', 'Okta', 264000, NOW() - INTERVAL '90 days', NOW() + INTERVAL '270 days', NOW() + INTERVAL '270 days', true, 'active', 'user-admin')
ON CONFLICT (id) DO NOTHING;

-- Seed Access Review Campaigns
INSERT INTO access_review_campaigns (id, name, description, scope_apps, scope_departments, due_date, status, reviewers) VALUES
  ('campaign-1', 'Q4 2024 Access Review', 'Quarterly review of all high-risk application access', ARRAY['app-7', 'app-10', 'app-14'], ARRAY[]::TEXT[], NOW() + INTERVAL '14 days', 'active', ARRAY['Sarah Chen', 'Alex Turner']),
  ('campaign-2', 'Finance Apps Review', 'Annual review of finance application access for SOC 2 compliance', ARRAY[]::TEXT[], ARRAY['Finance'], NOW() + INTERVAL '30 days', 'active', ARRAY['Robert Martinez', 'Lisa Thompson']),
  ('campaign-3', 'Q3 2024 Access Review', 'Completed quarterly review', ARRAY[]::TEXT[], ARRAY['Engineering', 'Sales'], NOW() - INTERVAL '30 days', 'completed', ARRAY['Mike Rodriguez', 'Jennifer Adams'])
ON CONFLICT (id) DO NOTHING;

-- Seed some Access Review Decisions for active campaigns
INSERT INTO access_review_decisions (campaign_id, application_id, user_id, decision) VALUES
  ('campaign-1', 'app-7', 'user-1', 'approved'),
  ('campaign-1', 'app-7', 'user-2', 'approved'),
  ('campaign-1', 'app-7', 'user-7', 'pending'),
  ('campaign-1', 'app-10', 'user-1', 'approved'),
  ('campaign-1', 'app-10', 'user-7', 'pending'),
  ('campaign-1', 'app-14', 'user-5', 'approved'),
  ('campaign-2', 'app-3', 'user-5', 'pending'),
  ('campaign-2', 'app-14', 'user-5', 'approved'),
  ('campaign-3', 'app-1', 'user-1', 'approved'),
  ('campaign-3', 'app-1', 'user-2', 'approved'),
  ('campaign-3', 'app-2', 'user-1', 'approved'),
  ('campaign-3', 'app-2', 'user-2', 'revoked')
ON CONFLICT (campaign_id, application_id, user_id) DO NOTHING;

-- Seed User App Access
INSERT INTO user_app_access (user_id, application_id, access_level, license_type, last_login, status) VALUES
  ('user-1', 'app-1', 'admin', 'Premium', NOW() - INTERVAL '1 day', 'active'),
  ('user-1', 'app-2', 'admin', 'Enterprise', NOW() - INTERVAL '2 hours', 'active'),
  ('user-1', 'app-6', 'admin', 'Premium', NOW() - INTERVAL '1 day', 'active'),
  ('user-1', 'app-7', 'user', 'Standard', NOW() - INTERVAL '3 days', 'active'),
  ('user-2', 'app-1', 'user', 'Standard', NOW() - INTERVAL '4 hours', 'active'),
  ('user-2', 'app-2', 'admin', 'Enterprise', NOW() - INTERVAL '1 hour', 'active'),
  ('user-2', 'app-6', 'user', 'Standard', NOW() - INTERVAL '2 days', 'active'),
  ('user-2', 'app-13', 'admin', 'Premium', NOW() - INTERVAL '5 hours', 'active'),
  ('user-3', 'app-1', 'user', 'Standard', NOW() - INTERVAL '1 day', 'active'),
  ('user-3', 'app-3', 'admin', 'Enterprise', NOW() - INTERVAL '3 hours', 'active'),
  ('user-3', 'app-8', 'user', 'Standard', NOW() - INTERVAL '6 hours', 'active'),
  ('user-4', 'app-1', 'user', 'Standard', NOW() - INTERVAL '2 days', 'active'),
  ('user-4', 'app-4', 'admin', 'Premium', NOW() - INTERVAL '4 hours', 'active'),
  ('user-4', 'app-9', 'admin', 'Enterprise', NOW() - INTERVAL '1 day', 'active'),
  ('user-5', 'app-3', 'user', 'Standard', NOW() - INTERVAL '1 day', 'active'),
  ('user-5', 'app-14', 'admin', 'Enterprise', NOW() - INTERVAL '2 days', 'active'),
  ('user-7', 'app-2', 'admin', 'Enterprise', NOW() - INTERVAL '30 minutes', 'active'),
  ('user-7', 'app-7', 'admin', 'Enterprise', NOW() - INTERVAL '1 hour', 'active'),
  ('user-7', 'app-10', 'admin', 'Enterprise', NOW() - INTERVAL '2 hours', 'active')
ON CONFLICT (user_id, application_id) DO NOTHING;

-- Insert initial audit event for seeding
INSERT INTO audit_events (actor, action, object_type, object_id, object_name, details_json) VALUES
  ('system', 'create', 'setting', 'seed', 'Database Seed', ('{"message": "Initial database seeding completed", "timestamp": "' || NOW() || '"}')::jsonb);
