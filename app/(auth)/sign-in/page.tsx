import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle, Info } from "lucide-react"
import { OktaSignInButton } from "@/components/auth/okta-sign-in-button"
import { AUTH_ENABLED, OKTA_CONFIGURED } from "@/lib/config/auth"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const params = await searchParams

  // Check for existing session
  const cookieStore = await cookies()
  const demoSession = cookieStore.get("demo-session")

  if (demoSession?.value) {
    redirect(params.callbackUrl || "/")
  }

  async function signInDemo() {
    "use server"
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()

    cookieStore.set(
      "demo-session",
      JSON.stringify({
        user: {
          id: "demo-user",
          email: "admin@company.com",
          name: "IT Administrator",
        },
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      },
    )

    const { redirect } = await import("next/navigation")
    redirect(params.callbackUrl || "/")
  }

  if (!AUTH_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">SaaS Control Center</CardTitle>
            <CardDescription>Sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Auth disabled (AUTH_ENABLED=false). Access is not protected.</span>
            </div>

            <form action={signInDemo}>
              <Button type="submit" className="w-full" size="lg">
                Continue as Demo User
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Set AUTH_ENABLED=true and configure Okta to enable SSO.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // AUTH_ENABLED=true but Okta not configured
  if (!OKTA_CONFIGURED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive">
              <AlertCircle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl">Configuration Error</CardTitle>
            <CardDescription>Okta OIDC is not configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              AUTH_ENABLED=true but Okta environment variables are missing.
            </div>
            <p className="text-sm text-muted-foreground">Please configure the following environment variables:</p>
            <ul className="text-xs text-muted-foreground space-y-1 font-mono bg-muted p-3 rounded-md">
              <li>OKTA_ISSUER</li>
              <li>OKTA_CLIENT_ID</li>
              <li>OKTA_CLIENT_SECRET</li>
              <li>NEXTAUTH_URL</li>
              <li>NEXTAUTH_SECRET</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  // AUTH_ENABLED=true and Okta configured - show Okta sign-in
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">SaaS Control Center</CardTitle>
          <CardDescription>Sign in to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {params.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {params.error === "OAuthCallback"
                ? "There was an error signing in. Please try again."
                : "Authentication failed. Please try again."}
            </div>
          )}

          <OktaSignInButton />

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
