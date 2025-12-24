/**
 * Production-safe logger for auth diagnostics.
 * Generates correlation IDs for request tracing without exposing secrets.
 */

export function generateCorrelationId(): string {
  // Use crypto.randomUUID if available (Node.js 19+, modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

interface AuthLogContext {
  correlationId: string
  action: string
  pathname?: string
  error?: {
    name?: string
    message?: string
  }
  userId?: string
  email?: string
}

/**
 * Log auth-related events with correlation ID.
 * Safe for production - never logs secrets, tokens, or full payloads.
 */
export function logAuth(level: "info" | "warn" | "error", context: AuthLogContext): void {
  const timestamp = new Date().toISOString()
  const prefix = `[Auth][${context.correlationId}]`

  const safeContext = {
    timestamp,
    correlationId: context.correlationId,
    action: context.action,
    ...(context.pathname && { pathname: context.pathname }),
    ...(context.error && { error: { name: context.error.name, message: context.error.message } }),
    ...(context.email && { email: maskEmail(context.email) }),
  }

  switch (level) {
    case "error":
      console.error(prefix, context.action, safeContext)
      break
    case "warn":
      console.warn(prefix, context.action, safeContext)
      break
    default:
      console.log(prefix, context.action, safeContext)
  }
}

/**
 * Mask email for safe logging (show first 2 chars and domain)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : "***"
  return `${maskedLocal}@${domain}`
}

/**
 * Get safe host from NEXTAUTH_URL for display (no path or credentials)
 */
export function getSafeAuthHost(): string {
  const url = process.env.NEXTAUTH_URL
  if (!url) return "not configured"
  try {
    const parsed = new URL(url)
    return parsed.host
  } catch {
    return "invalid URL"
  }
}
