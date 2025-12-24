import type { NextAuthConfig } from "next-auth"
import { AUTH_ENABLED } from "@/lib/config/auth"

export const authConfig: NextAuthConfig = {
  providers:
    AUTH_ENABLED && process.env.OKTA_ISSUER && process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET
      ? [
          {
            id: "okta",
            name: "Okta",
            type: "oidc" as const,
            issuer: process.env.OKTA_ISSUER,
            clientId: process.env.OKTA_CLIENT_ID,
            clientSecret: process.env.OKTA_CLIENT_SECRET,
          },
        ]
      : [],
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // When AUTH_ENABLED=false, always authorize
      if (!AUTH_ENABLED) return true

      const isLoggedIn = !!auth?.user
      const isProtectedRoute =
        !nextUrl.pathname.startsWith("/auth") &&
        !nextUrl.pathname.startsWith("/api/auth") &&
        !nextUrl.pathname.startsWith("/sign-in")

      if (isProtectedRoute && !isLoggedIn) {
        return false
      }

      if (isLoggedIn && nextUrl.pathname.startsWith("/auth/sign-in")) {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
    jwt({ token, user, profile }) {
      if (user) {
        console.log("[Auth] JWT callback - user sign in")
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      if (profile) {
        token.name = (profile.name as string) || token.name
        token.email = (profile.email as string) || token.email
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        console.log("[Auth] Session callback completed")
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
}
