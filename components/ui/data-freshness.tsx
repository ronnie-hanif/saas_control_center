"use client"

import { Clock, Database, FlaskConical } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface DataFreshnessProps {
  /**
   * When the data was last updated
   */
  lastUpdated?: Date | string | null
  /**
   * Whether the data is from a mock/demo source
   */
  isMockData?: boolean
  /**
   * Optional label override
   */
  label?: string
  /**
   * Show as compact badge or full text
   */
  variant?: "badge" | "text" | "minimal"
}

export function DataFreshness({ lastUpdated, isMockData = false, label, variant = "badge" }: DataFreshnessProps) {
  const formatLastUpdated = (date: Date | string | null | undefined): string => {
    if (!date) return "Unknown"
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return "Unknown"

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help">
              {isMockData ? <FlaskConical className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {isMockData ? "Demo" : formatLastUpdated(lastUpdated)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isMockData
              ? "Showing demo data. Connect integrations for live data."
              : `Last synced: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : "Unknown"}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === "text") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {isMockData ? (
          <>
            <FlaskConical className="h-3 w-3" />
            <span>{label || "Demo data"}</span>
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
          </>
        )}
      </span>
    )
  }

  // Badge variant (default)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-normal cursor-help ${
              isMockData
                ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-border text-muted-foreground"
            }`}
          >
            {isMockData ? (
              <>
                <FlaskConical className="h-3 w-3" />
                {label || "Demo Data"}
              </>
            ) : (
              <>
                <Database className="h-3 w-3" />
                {label || `Synced ${formatLastUpdated(lastUpdated)}`}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isMockData
            ? "This view is showing demo data. Connect your integrations to see live data."
            : `Data last synchronized: ${lastUpdated ? new Date(lastUpdated).toLocaleString() : "Unknown"}`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
