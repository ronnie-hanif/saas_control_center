"use client"

import { AlertCircle, RefreshCw, ArrowLeft, HelpCircle, WifiOff, ServerCrash, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ErrorVariant = "default" | "network" | "server" | "permission" | "not-found"

interface ErrorStateProps {
  title?: string
  message: string
  variant?: ErrorVariant
  retry?: () => void
  goBack?: () => void
  helpAction?: () => void
  className?: string
}

const variantConfig: Record<
  ErrorVariant,
  {
    icon: typeof AlertCircle
    defaultTitle: string
    bg: string
    iconColor: string
    suggestion: string
  }
> = {
  default: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    bg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    suggestion: "This may be a temporary issue. Please try again.",
  },
  network: {
    icon: WifiOff,
    defaultTitle: "Connection issue",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    suggestion: "Please check your internet connection and try again.",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Service unavailable",
    bg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    suggestion: "Our servers are experiencing issues. Please try again in a few minutes.",
  },
  permission: {
    icon: ShieldAlert,
    defaultTitle: "Access denied",
    bg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
    suggestion: "You may not have the required permissions. Contact your administrator.",
  },
  "not-found": {
    icon: AlertCircle,
    defaultTitle: "Not found",
    bg: "bg-muted",
    iconColor: "text-muted-foreground",
    suggestion: "The requested resource could not be found. It may have been moved or deleted.",
  },
}

export function ErrorState({
  title,
  message,
  variant = "default",
  retry,
  goBack,
  helpAction,
  className,
}: ErrorStateProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto", className)}>
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full mb-5", config.bg)}>
        <Icon className={cn("h-7 w-7", config.iconColor)} />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title || config.defaultTitle}</h3>

      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{message}</p>

      <p className="text-xs text-muted-foreground mb-6">{config.suggestion}</p>

      <div className="flex items-center gap-3">
        {retry && (
          <Button onClick={retry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        )}
        {goBack && (
          <Button variant="outline" onClick={goBack} className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        )}
        {helpAction && (
          <Button variant="ghost" onClick={helpAction} className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Get help
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-8">
        If this problem persists, please contact support with error details.
      </p>
    </div>
  )
}

// Preset error states for common scenarios
export function NetworkErrorState({ retry }: { retry?: () => void }) {
  return <ErrorState variant="network" message="We couldn't connect to the server." retry={retry} />
}

export function ServerErrorState({ retry }: { retry?: () => void }) {
  return (
    <ErrorState
      variant="server"
      message="The server encountered an unexpected error while processing your request."
      retry={retry}
    />
  )
}

export function NotFoundErrorState({
  resource,
  goBack,
}: {
  resource: string
  goBack?: () => void
}) {
  return (
    <ErrorState
      variant="not-found"
      message={`The ${resource} you're looking for doesn't exist or has been removed.`}
      goBack={goBack}
    />
  )
}

export function PermissionErrorState({
  resource,
  helpAction,
}: {
  resource: string
  helpAction?: () => void
}) {
  return (
    <ErrorState
      variant="permission"
      message={`You don't have permission to access this ${resource}.`}
      helpAction={helpAction}
    />
  )
}
