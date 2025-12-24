import { redirect } from "next/navigation"
import { getSession, createMockSession } from "./session"
import { hasPermission, hasAnyPermission } from "./rbac"
import type { Permission, Session } from "./types"

/**
 * Protect a route - redirects to sign-in if not authenticated
 */
export async function protectRoute(): Promise<Session> {
  const session = await getSession()

  // For development without DB, create a mock session
  if (!session && !process.env.DATABASE_URL) {
    return createMockSession()
  }

  if (!session) {
    redirect("/sign-in")
  }

  return session
}

/**
 * Protect a route with specific permission requirement
 */
export async function protectRouteWithPermission(permission: Permission): Promise<Session> {
  const session = await protectRoute()

  if (!hasPermission(session.user, permission)) {
    redirect("/unauthorized")
  }

  return session
}

/**
 * Protect a route with any of the specified permissions
 */
export async function protectRouteWithAnyPermission(permissions: Permission[]): Promise<Session> {
  const session = await protectRoute()

  if (!hasAnyPermission(session.user, permissions)) {
    redirect("/unauthorized")
  }

  return session
}
