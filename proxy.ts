import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!AUTH_ENABLED) {
    return NextResponse.next()
  }

  // Public routes that don't require auth
  const publicRoutes = [
    "/auth/sign-in",
    "/auth/error",
    "/api/auth",
    "/sign-in", // Legacy route
  ]

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Skip static assets
  const isStaticAsset = pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2)$/)

  if (isPublicRoute || isStaticAsset) {
    return NextResponse.next()
  }

  // Check for NextAuth session cookies
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token")

  const isLoggedIn = !!sessionCookie?.value

  // Also check demo session for transition
  const demoSession = request.cookies.get("demo-session")
  const hasDemo = !!demoSession?.value

  const isAuthenticated = isLoggedIn || hasDemo

  if (!isAuthenticated) {
    console.log("[Proxy] Unauthenticated request, redirecting:", pathname)
    const signInUrl = new URL("/auth/sign-in", request.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect logged-in users away from sign-in
  if (isAuthenticated && (pathname === "/auth/sign-in" || pathname === "/sign-in")) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
