import type { Session } from "next-auth"

export const isOktaConfigured = !!(
  process.env.OKTA_ISSUER &&
  process.env.OKTA_CLIENT_ID &&
  process.env.OKTA_CLIENT_SECRET
)

// Re-export auth from the NextAuth route handler for server-side session retrieval
export async function auth(): Promise<Session | null> {
  if (!isOktaConfigured) {
    console.log("[Auth] Okta not configured - returning null session")
    return null
  }

  try {
    const { auth: getSession } = await import("@/app/api/auth/[...nextauth]/route")
    const session = await getSession()
    if (session) {
      console.log("[Auth] Session retrieved for:", session.user?.email)
    }
    return session
  } catch (error) {
    console.error("[Auth] Error retrieving session:", error instanceof Error ? error.message : "Unknown error")
    return null
  }
}
