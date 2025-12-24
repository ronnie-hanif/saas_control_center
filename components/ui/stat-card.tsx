"use client"

import type * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label?: string
  }
  icon?: React.ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
  interactive = false,
  onClick,
}: StatCardProps) {
  const TrendIcon =
    trend?.value && trend.value > 0 ? TrendingUp : trend?.value && trend.value < 0 ? TrendingDown : Minus

  const trendColor =
    trend?.value && trend.value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : trend?.value && trend.value < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

  return (
    <Card
      className={cn("relative overflow-hidden", interactive && "interactive-card cursor-pointer", className)}
      onClick={interactive ? onClick : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {(description || trend) && (
              <div className="flex items-center gap-2 text-sm">
                {trend && (
                  <span className={cn("flex items-center gap-1 font-medium", trendColor)}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {Math.abs(trend.value)}%
                  </span>
                )}
                {description && <span className="text-muted-foreground">{description}</span>}
              </div>
            )}
          </div>
          {icon && <div className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
