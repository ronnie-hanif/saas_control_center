import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react"

interface IntegrationHealthBadgeProps {
  health: "healthy" | "degraded" | "unhealthy" | "unknown"
  showLabel?: boolean
}

const healthConfig = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    variant: "default" as const,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10",
    tooltip: "All systems operational. Data syncing normally.",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    variant: "secondary" as const,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10",
    tooltip: "Partial issues detected. Some data may be delayed.",
  },
  unhealthy: {
    label: "Unhealthy",
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10",
    tooltip: "Integration is failing. Immediate attention required.",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground",
    tooltip: "Integration not connected. Health status unavailable.",
  },
}

export function IntegrationHealthBadge({ health, showLabel = true }: IntegrationHealthBadgeProps) {
  const config = healthConfig[health]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
            <Icon className="h-3 w-3" />
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
