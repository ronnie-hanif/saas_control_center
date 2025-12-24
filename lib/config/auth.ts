/**
 * Authentication configuration with production kill switch.
 *
 * Set AUTH_ENABLED=true in Vercel to enforce Okta OIDC.
 * When AUTH_ENABLED=false (default), the app runs in demo mode without auth.
 */

export const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

export const OKTA_CONFIGURED = !!(
  process.env.OKTA_ISSUER &&
  process.env.OKTA_CLIENT_ID &&
  process.env.OKTA_CLIENT_SECRET
)

/**
 * Validates that required environment variables are set when AUTH_ENABLED is true.
 * Throws a clear error if any required vars are missing.
 * Does nothing when AUTH_ENABLED is false.
 */
export function validateAuthConfig(): void {
  if (!AUTH_ENABLED) {
    console.log("[Auth Config] AUTH_ENABLED=false - authentication disabled")
    return
  }

  const requiredVars = ["OKTA_ISSUER", "OKTA_CLIENT_ID", "OKTA_CLIENT_SECRET", "NEXTAUTH_URL", "NEXTAUTH_SECRET"]

  const missing = requiredVars.filter((v) => !process.env[v])

  if (missing.length > 0) {
    const errorMsg = `[Auth Config] AUTH_ENABLED=true but missing required env vars: ${missing.join(", ")}`
    console.error(errorMsg)
    throw new Error(errorMsg)
  }

  console.log("[Auth Config] AUTH_ENABLED=true - Okta OIDC authentication active")
  console.log("[Auth Config] Okta issuer:", process.env.OKTA_ISSUER?.replace(/\/oauth2.*/, "/..."))
}

/**
 * Mock user returned when AUTH_ENABLED=false
 */
export const MOCK_USER = {
  id: "mock-admin-user",
  name: "IT Administrator",
  email: "admin@company.com",
  role: "IT_ADMIN" as const,
  department: "IT",
}
