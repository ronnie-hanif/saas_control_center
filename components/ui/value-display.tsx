"use client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValueDisplayProps {
  /**
   * The value to display
   */
  value: string | number | null | undefined
  /**
   * Unit or suffix (e.g., "/mo", "users", "%")
   */
  unit?: string
  /**
   * Prefix (e.g., "$", "~")
   */
  prefix?: string
  /**
   * Placeholder to show when value is invalid/missing
   */
  placeholder?: string
  /**
   * Help text explaining the metric
   */
  helpText?: string
  /**
   * Additional context shown below the value
   */
  context?: string
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg"
  /**
   * Custom className
   */
  className?: string
}

export function ValueDisplay({
  value,
  unit,
  prefix,
  placeholder = "—",
  helpText,
  context,
  size = "md",
  className,
}: ValueDisplayProps) {
  const isValidValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !(typeof value === "number" && (isNaN(value) || !isFinite(value)))

  const sizeClasses = {
    sm: "text-lg font-semibold",
    md: "text-2xl font-semibold",
    lg: "text-3xl font-bold",
  }

  const displayValue = isValidValue ? (
    <>
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      {value}
      {unit && <span className="text-muted-foreground text-[0.7em] ml-0.5">{unit}</span>}
    </>
  ) : (
    <span className="text-muted-foreground">{placeholder}</span>
  )

  const content = (
    <div className={cn("inline-flex flex-col", className)}>
      <span className={cn(sizeClasses[size], "tracking-tight tabular-nums")}>{displayValue}</span>
      {context && <span className="text-xs text-muted-foreground mt-0.5">{context}</span>}
    </div>
  )

  if (helpText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-start gap-1 cursor-help">
              {content}
              <HelpCircle className="h-3 w-3 text-muted-foreground mt-1" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{helpText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

/**
 * Inline value with proper null handling
 */
export function InlineValue({
  value,
  placeholder = "—",
  className,
}: {
  value: string | number | null | undefined
  placeholder?: string
  className?: string
}) {
  const isValidValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !(typeof value === "number" && (isNaN(value) || !isFinite(value)))

  return (
    <span className={cn(isValidValue ? "" : "text-muted-foreground", className)}>
      {isValidValue ? value : placeholder}
    </span>
  )
}
