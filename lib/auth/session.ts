import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_ENABLED, MOCK_USER, validateAuthConfig } from "@/lib/config/auth"
import type { Session, SessionUser, Role } from "./types"

const SESSION_COOKIE_NAME = "saas_control_session"
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

interface SessionPayload {
  userId: string
  email: string
  name: string
  role: Role
  department: string
  expiresAt: number
}

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

function decodeSession(token: string): SessionPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
    return decoded as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const token = encodeSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  })
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = decodeSession(token)
  if (!payload || payload.expiresAt < Date.now()) {
    return null
  }

  const sessionUser: SessionUser = {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    department: payload.department,
  }

  return {
    user: sessionUser,
    expiresAt: new Date(payload.expiresAt).toISOString(),
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export function createMockSession(): Session {
  return {
    user: MOCK_USER,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  }
}

/**
 * Server-side session wrapper that respects AUTH_ENABLED flag.
 * Returns NextAuth session when enabled, null otherwise.
 */
export async function getServerSession(): Promise<Session | null> {
  if (!AUTH_ENABLED) {
    console.log("[Session] AUTH_ENABLED=false - returning null (use requireAuth for mock)")
    return null
  }

  try {
    const { auth } = await import("@/lib/auth/auth")
    const nextAuthSession = await auth()

    if (!nextAuthSession?.user) {
      return null
    }

    // Map NextAuth session to app session format
    return {
      user: {
        id: nextAuthSession.user.id || nextAuthSession.user.email || "unknown",
        email: nextAuthSession.user.email || "",
        name: nextAuthSession.user.name || "User",
        role: "IT_ADMIN",
        department: "General",
      },
      expiresAt: nextAuthSession.expires || new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    }
  } catch (error) {
    console.error("[Session] Error retrieving NextAuth session:", error instanceof Error ? error.message : "Unknown")
    return null
  }
}

/**
 * Requires authentication and returns the session user.
 * - If AUTH_ENABLED=false: returns mock user
 * - If AUTH_ENABLED=true: requires NextAuth session, redirects to /auth/sign-in if missing
 */
export async function requireAuth(): Promise<Session> {
  if (!AUTH_ENABLED) {
    console.log("[Session] AUTH_ENABLED=false - returning mock session")
    return createMockSession()
  }

  validateAuthConfig()

  // Check for demo session cookie first (for transition/testing)
  const cookieStore = await cookies()
  const demoSession = cookieStore.get("demo-session")

  if (demoSession?.value) {
    try {
      const parsed = JSON.parse(demoSession.value)
      return {
        user: {
          id: parsed.user.id || "demo-user",
          email: parsed.user.email || "admin@company.com",
          name: parsed.user.name || "Demo Admin",
          role: "IT_ADMIN",
          department: "IT",
        },
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      }
    } catch {
      // Invalid demo session, continue to NextAuth
    }
  }

  const session = await getServerSession()

  if (!session) {
    console.log("[Session] No session found, redirecting to sign-in")
    redirect("/auth/sign-in")
  }

  return session
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthenticationError"
  }
}
