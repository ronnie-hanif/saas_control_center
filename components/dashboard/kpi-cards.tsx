"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { AppWindow, DollarSign, KeyRound, Calendar, ArrowRight, TrendingDown, TrendingUp } from "lucide-react"
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/format"
import type { DashboardMetrics } from "@/lib/types"

interface KPICardsProps {
  metrics: DashboardMetrics
  unusedLicenseSavings: number
}

export function KPICards({ metrics, unusedLicenseSavings }: KPICardsProps) {
  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "—"
    return value.toLocaleString()
  }

  const formatCurrency = (value: number | null | undefined): string => {
    return formatCurrencyUtil(value, { maximumFractionDigits: 0 })
  }

  const formatCompactCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return "—"
    return `$${(value / 1000).toFixed(0)}k`
  }

  const cards = [
    {
      title: "Total SaaS Apps",
      value: formatValue(metrics.totalApps),
      subtitle: "Across all departments",
      icon: AppWindow,
      href: "/applications",
      ariaLabel: `View all ${metrics.totalApps ?? 0} applications`,
      trend: { value: "+3", label: "this month", up: true },
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Monthly Spend",
      value: formatCurrency(metrics.totalMonthlySpend),
      subtitle: metrics.totalMonthlySpend
        ? `${formatCompactCurrency(metrics.totalMonthlySpend * 12)} annually`
        : "No spend data",
      icon: DollarSign,
      href: "/reports/spend-trends",
      ariaLabel: "View spend trends report",
      trend: { value: "+2.5%", label: "vs last month", up: false },
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Unused Licenses",
      value: formatValue(metrics.licensesUnused),
      subtitle: unusedLicenseSavings
        ? `${formatCompactCurrency(unusedLicenseSavings)} potential savings`
        : "No savings identified",
      icon: KeyRound,
      href: "/reports/unused-licenses",
      ariaLabel: "View unused licenses report",
      trend: { value: "-12", label: "reclaimed this week", up: true },
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Renewals (30 Days)",
      value: formatValue(metrics.renewalsIn30Days),
      subtitle: "Contracts upcoming",
      icon: Calendar,
      href: "/contracts",
      ariaLabel: `View ${metrics.renewalsIn30Days ?? 0} upcoming contract renewals`,
      trend: { value: "$45k", label: "total value", up: null },
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href} aria-label={card.ariaLabel}>
          <Card className="bg-card hover:bg-muted/50 transition-colors cursor-pointer group h-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
                </div>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                {card.trend.up !== null &&
                  (card.trend.up ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-amber-500" aria-hidden="true" />
                  ))}
                <span
                  className={`text-xs font-medium ${
                    card.trend.up === true
                      ? "text-emerald-500"
                      : card.trend.up === false
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {card.trend.value}
                </span>
                <span className="text-xs text-muted-foreground">{card.trend.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
