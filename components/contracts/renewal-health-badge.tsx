import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RenewalHealth } from "@/lib/types"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

interface RenewalHealthBadgeProps {
  health: RenewalHealth
  showLabel?: boolean
}

const healthConfig: Record<
  RenewalHealth,
  { label: string; icon: typeof CheckCircle2; className: string; description: string }
> = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    description: "Contract is on track with no action needed",
  },
  "needs-review": {
    label: "Needs Review",
    icon: AlertTriangle,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    description: "Contract requires attention before renewal",
  },
  "at-risk": {
    label: "At Risk",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    description: "Urgent action required - renewal deadline approaching",
  },
}

export function RenewalHealthBadge({ health, showLabel = true }: RenewalHealthBadgeProps) {
  const config = healthConfig[health]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${config.className} gap-1 font-medium`}>
            <Icon className="h-3 w-3" />
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
