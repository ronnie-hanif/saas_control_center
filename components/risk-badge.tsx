import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

const riskConfig: Record<RiskLevel, { label: string; variant: string; description: string }> = {
  low: {
    label: "Low",
    variant: "badge-success",
    description: "Minimal risk - standard security controls in place",
  },
  medium: {
    label: "Medium",
    variant: "badge-warning",
    description: "Moderate risk - review recommended",
  },
  high: {
    label: "High",
    variant:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    description: "Elevated risk - requires attention",
  },
  critical: {
    label: "Critical",
    variant: "badge-danger",
    description: "Immediate action required",
  },
}

interface RiskBadgeProps {
  risk?: RiskLevel
  level?: RiskLevel
  showTooltip?: boolean
  className?: string
}

export function RiskBadge({ risk, level, showTooltip = true, className }: RiskBadgeProps) {
  const riskLevel = risk || level || "low"
  const config = riskConfig[riskLevel] || riskConfig.low

  const badge = <span className={cn("badge-base", config.variant, className)}>{config.label}</span>

  if (!showTooltip) return badge

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-xs">
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
