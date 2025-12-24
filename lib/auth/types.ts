export type Role = "IT_ADMIN" | "SECURITY_ADMIN" | "FINANCE_ADMIN" | "APP_OWNER" | "REVIEWER" | "READ_ONLY"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  department: string
}

export interface Session {
  user: SessionUser
  expiresAt: string
}

// Permission definitions for RBAC
export type Permission =
  | "apps:read"
  | "apps:write"
  | "apps:delete"
  | "users:read"
  | "users:write"
  | "contracts:read"
  | "contracts:write"
  | "access_reviews:read"
  | "access_reviews:write"
  | "access_reviews:decide"
  | "workflows:read"
  | "workflows:write"
  | "workflows:run"
  | "integrations:read"
  | "integrations:write"
  | "reports:read"
  | "reports:export"
  | "settings:read"
  | "settings:write"
  | "audit:read"

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  IT_ADMIN: [
    "apps:read",
    "apps:write",
    "apps:delete",
    "users:read",
    "users:write",
    "contracts:read",
    "contracts:write",
    "access_reviews:read",
    "access_reviews:write",
    "access_reviews:decide",
    "workflows:read",
    "workflows:write",
    "workflows:run",
    "integrations:read",
    "integrations:write",
    "reports:read",
    "reports:export",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  SECURITY_ADMIN: [
    "apps:read",
    "apps:write",
    "users:read",
    "contracts:read",
    "access_reviews:read",
    "access_reviews:write",
    "access_reviews:decide",
    "workflows:read",
    "workflows:write",
    "workflows:run",
    "integrations:read",
    "reports:read",
    "reports:export",
    "settings:read",
    "audit:read",
  ],
  FINANCE_ADMIN: [
    "apps:read",
    "users:read",
    "contracts:read",
    "contracts:write",
    "access_reviews:read",
    "workflows:read",
    "integrations:read",
    "reports:read",
    "reports:export",
    "settings:read",
    "audit:read",
  ],
  APP_OWNER: [
    "apps:read",
    "apps:write",
    "users:read",
    "contracts:read",
    "access_reviews:read",
    "access_reviews:decide",
    "workflows:read",
    "integrations:read",
    "reports:read",
    "audit:read",
  ],
  REVIEWER: [
    "apps:read",
    "users:read",
    "contracts:read",
    "access_reviews:read",
    "access_reviews:decide",
    "reports:read",
    "audit:read",
  ],
  READ_ONLY: ["apps:read", "users:read", "contracts:read", "access_reviews:read", "workflows:read", "reports:read"],
}
