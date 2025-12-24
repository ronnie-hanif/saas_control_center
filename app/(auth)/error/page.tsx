import Link from "next/link"
import { Shield, AlertTriangle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const errorMessages: Record<string, { title: string; description: string; icon: typeof AlertTriangle }> = {
  Configuration: {
    title: "Configuration Error",
    description: "There is a problem with the server configuration. Please contact your administrator.",
    icon: XCircle,
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in. Please contact your administrator.",
    icon: XCircle,
  },
  Verification: {
    title: "Verification Error",
    description: "The sign-in link is no longer valid. It may have been used already or expired.",
    icon: AlertTriangle,
  },
  OAuthSignin: {
    title: "OAuth Sign-in Error",
    description: "Could not start the sign-in process with your identity provider.",
    icon: AlertTriangle,
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "Could not complete sign-in with your identity provider.",
    icon: AlertTriangle,
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account. Please contact your administrator.",
    icon: XCircle,
  },
  Callback: {
    title: "Callback Error",
    description: "There was an error during authentication. Please try again.",
    icon: AlertTriangle,
  },
  SessionRequired: {
    title: "Session Required",
    description: "You must be signed in to access this page.",
    icon: AlertTriangle,
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred. Please try again.",
    icon: AlertTriangle,
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; correlationId?: string }>
}) {
  const { error, correlationId } = await searchParams
  const errorKey = error && error in errorMessages ? error : "Default"
  const errorInfo = errorMessages[errorKey]
  const ErrorIcon = errorInfo.icon

  // Server-side logging (no secrets)
  console.log("[Auth Error Page]", { error: error || "unknown", correlationId: correlationId || "none" })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ErrorIcon className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || correlationId) && (
            <div className="rounded-md bg-muted p-3 space-y-1.5">
              {error && (
                <p className="text-xs text-muted-foreground">
                  Error: <code className="font-mono text-foreground">{error}</code>
                </p>
              )}
              {correlationId && (
                <p className="text-xs text-muted-foreground">
                  ID: <code className="font-mono text-foreground">{correlationId}</code>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/sign-in">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/">
                <Shield className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            If this persists, contact your administrator with the error details above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
