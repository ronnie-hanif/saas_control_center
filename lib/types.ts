export type RiskLevel = "low" | "medium" | "high" | "critical"
export type AppStatus = "sanctioned" | "unsanctioned" | "under-review"
export type AppSource = "okta" | "google" | "azure" | "manual" | "browser-extension"
export type UserStatus = "active" | "inactive" | "suspended" | "offboarding"
export type ContractStatus = "active" | "expiring" | "expired" | "pending"
export type RenewalHealth = "healthy" | "needs-review" | "at-risk"
export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing"
export type WorkflowStatus = "active" | "inactive" | "draft"
export type WorkflowRunStatus = "success" | "failed" | "running" | "pending"
export type CampaignStatus = "active" | "completed" | "draft" | "overdue"
export type TaskDecision = "pending" | "approved" | "revoked"

export interface App {
  id: string
  name: string
  vendor: string
  category: string
  description: string
  owner: string
  ownerId: string
  source: AppSource
  department: string
  monthlySpend: number
  annualSpend: number
  licensesPurchased: number
  licensesAssigned: number
  utilizationPercent: number
  riskLevel: RiskLevel
  ssoConnected: boolean
  lastActivity: string
  renewalDate: string
  status: AppStatus
  tags: string[]
  integrationsConnected: string[]
  adminCount: number
  oauthScopes: string[]
  permissions: string[]
  notes: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  department: string
  manager: string
  managerId: string
  status: UserStatus
  appsUsed: number
  totalAppSpend: number
  highRiskAccessCount: number
  lastActive: string
  avatar: string
  title: string
  startDate: string
  role?: "IT_ADMIN" | "SECURITY_ADMIN" | "FINANCE_ADMIN" | "APP_OWNER" | "REVIEWER" | "READ_ONLY"
}

export interface UserAppAccess {
  appId: string
  appName: string
  accessLevel: "admin" | "user" | "viewer"
  lastLogin: string
  licenseType: string
  status: "active" | "inactive"
}

export interface Contract {
  id: string
  appId: string
  appName: string
  vendor: string
  contractValue: number
  billingCadence: "monthly" | "quarterly" | "annual"
  termStart: string
  termEnd: string
  renewalDate: string
  autoRenew: boolean
  owner: string
  ownerId: string
  status: ContractStatus
  renewalHealth: RenewalHealth
  stakeholders: ContractStakeholder[]
  documents: string[]
  notes: string
  spendHistory: { month: string; amount: number }[]
  terms: string
  paymentTerms: string
  cancellationNotice: number // days
}

export interface ContractStakeholder {
  id: string
  name: string
  role: "owner" | "finance" | "it" | "legal" | "approver"
  email: string
}

export interface Integration {
  id: string
  name: string
  description: string
  icon: string
  status: IntegrationStatus
  health: "healthy" | "degraded" | "unhealthy" | "unknown"
  lastSync: string | null
  nextSync: string | null
  permissionScopes: string[]
  category: "identity" | "communication" | "ticketing" | "finance" | "other"
  dataTypes: string[]
  recordsIngested: number
  errorMessage: string | null
  syncHistory: IntegrationSyncEvent[]
  config: Record<string, unknown>
}

export interface IntegrationSyncEvent {
  id: string
  timestamp: string
  status: "success" | "failed" | "partial"
  recordsProcessed: number
  duration: number // seconds
  errorMessage: string | null
}

export interface AccessReviewCampaign {
  id: string
  name: string
  description: string
  scope: {
    apps: string[]
    departments: string[]
  }
  dueDate: string
  completionPercent: number
  reviewers: string[]
  status: CampaignStatus
  createdAt: string
  tasksTotal: number
  tasksCompleted: number
}

export interface AccessReviewTask {
  id: string
  campaignId: string
  userId: string
  userName: string
  userEmail: string
  userDepartment: string // Added for filtering
  appId: string
  appName: string
  accessLevel: string
  lastLogin: string
  riskLevel: RiskLevel // Added for risk indicator
  unusedAccess: boolean // Added for unused indicator
  decision: TaskDecision
  decidedBy: string | null
  decidedAt: string | null
  rationale: string // Changed from notes to rationale
}

export interface Workflow {
  id: string
  name: string
  description: string
  type: "onboarding" | "offboarding" | "seat-reclamation" | "access-request" | "renewal-reminder"
  status: WorkflowStatus
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  createdAt: string
  lastRun: string | null
  runCount: number
}

export interface WorkflowTrigger {
  type: "user-created" | "user-deactivated" | "inactivity" | "renewal-window" | "unsanctioned-app"
  config: Record<string, unknown>
}

export interface WorkflowStep {
  id: string
  type: "create-ticket" | "slack-notify" | "deprovision" | "reclaim-license" | "request-approval" | "wait"
  name: string
  config: Record<string, unknown>
  order: number
}

export interface WorkflowRun {
  id: string
  workflowId: string
  workflowName: string
  status: WorkflowRunStatus
  startedAt: string
  completedAt: string | null
  triggeredBy: string
  logs: WorkflowRunLog[]
}

export interface WorkflowRunLog {
  timestamp: string
  step: string
  status: "success" | "failed" | "skipped"
  message: string
}

export interface AuditEvent {
  id: string
  entityType: "app" | "user" | "contract" | "workflow" | "access-review"
  entityId: string
  entityName: string
  action: string
  actor: string
  actorId: string
  timestamp: string
  details: Record<string, unknown>
}

export interface DashboardFilters {
  department: string
  owner: string
  riskLevel: RiskLevel | "all"
  renewalWindow: 30 | 60 | 90 | "all"
  costRange: [number, number] | null
}

export interface DashboardMetrics {
  totalApps: number
  totalMonthlySpend: number
  licensesUnused: number
  highRiskApps: number
  renewalsIn30Days: number
  offboardingTasksPending: number
}

export interface Department {
  id: string
  name: string
  costCenter: string
  headcount: number
  appCount: number
  monthlySpend: number
}

export interface RiskScoringRule {
  id: string
  name: string
  weight: number
  enabled: boolean
}

export interface NotificationPreference {
  id: string
  type: string
  email: boolean
  slack: boolean
  inApp: boolean
}
