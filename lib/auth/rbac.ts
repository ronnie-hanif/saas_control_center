import type { Permission, SessionUser, Role } from "./types"
import { ROLE_PERMISSIONS } from "./types"

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: SessionUser, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[user.role]
  return permissions?.includes(permission) ?? false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission))
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: SessionUser, role: Role): boolean {
  return user.role === role
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: SessionUser, roles: Role[]): boolean {
  return roles.includes(user.role)
}

/**
 * Get all permissions for a user based on their role
 */
export function getUserPermissions(user: SessionUser): Permission[] {
  return ROLE_PERMISSIONS[user.role] || []
}

/**
 * Authorization error class
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public requiredPermission?: Permission,
  ) {
    super(message)
    this.name = "AuthorizationError"
  }
}

/**
 * Require a specific permission, throws if not authorized
 */
export function requirePermission(user: SessionUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(`Permission denied: ${permission}`, permission)
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(user: SessionUser, permissions: Permission[]): void {
  if (!hasAnyPermission(user, permissions)) {
    throw new AuthorizationError(`Permission denied: requires one of ${permissions.join(", ")}`)
  }
}
