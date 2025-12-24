import { type NextRequest, NextResponse } from "next/server"
import { AUTH_ENABLED } from "@/lib/config/auth"

export const runtime = "nodejs"

// Log config at startup (no secrets)
console.log("[NextAuth Route] AUTH_ENABLED:", AUTH_ENABLED)
console.log("[NextAuth Route] OKTA_ISSUER configured:", !!process.env.OKTA_ISSUER)

let handlers: { GET?: (req: NextRequest) => Promise<Response>; POST?: (req: NextRequest) => Promise<Response> } | null =
  null
let authFn: ((...args: unknown[]) => Promise<unknown>) | null = null

async function getHandlers() {
  if (!AUTH_ENABLED) {
    return null
  }

  if (!handlers) {
    try {
      const NextAuth = (await import("next-auth")).default
      const { authConfig } = await import("@/lib/auth/auth-config")
      const result = NextAuth(authConfig)
      handlers = result.handlers
      authFn = result.auth
      console.log("[NextAuth Route] Handlers initialized successfully")
    } catch (error) {
      console.error("[NextAuth Route] Failed to initialize:", error instanceof Error ? error.message : "Unknown error")
      return null
    }
  }

  return handlers
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl?.pathname ?? "/api/auth/unknown"
  console.log("[NextAuth Route] GET:", pathname)

  if (!AUTH_ENABLED) {
    return NextResponse.json(
      { error: "Authentication disabled", hint: "Set AUTH_ENABLED=true to enable Okta OIDC" },
      { status: 501 },
    )
  }

  const h = await getHandlers()

  if (h?.GET) {
    try {
      return await h.GET(request)
    } catch (error) {
      console.error("[NextAuth Route] GET error:", error instanceof Error ? error.message : "Unknown")
      const errorUrl = new URL("/auth/error", request.nextUrl.origin)
      errorUrl.searchParams.set("error", "Callback")
      return NextResponse.redirect(errorUrl)
    }
  }

  return NextResponse.json({ error: "Auth handlers not available" }, { status: 500 })
}

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl?.pathname ?? "/api/auth/unknown"
  console.log("[NextAuth Route] POST:", pathname)

  if (!AUTH_ENABLED) {
    return NextResponse.json(
      { error: "Authentication disabled", hint: "Set AUTH_ENABLED=true to enable Okta OIDC" },
      { status: 501 },
    )
  }

  const h = await getHandlers()

  if (h?.POST) {
    try {
      return await h.POST(request)
    } catch (error) {
      console.error("[NextAuth Route] POST error:", error instanceof Error ? error.message : "Unknown")
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Auth handlers not available" }, { status: 500 })
}

// Export auth function for server-side session retrieval
export async function auth() {
  if (!AUTH_ENABLED) return null
  await getHandlers()
  return authFn ? authFn() : null
}
