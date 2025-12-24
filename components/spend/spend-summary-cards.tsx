"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpendSummaryCardsProps {
  monthlySpend: number
  annualSpend: number
  unusedLicenses: number
  potentialSavings: number
  avgUtilization: number
  appsCount: number
}

export function SpendSummaryCards({
  monthlySpend,
  annualSpend,
  unusedLicenses,
  potentialSavings,
  avgUtilization,
  appsCount,
}: SpendSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const cards = [
    {
      title: "Monthly Spend",
      value: formatCurrency(monthlySpend),
      change: "+2.4%",
      changeType: "increase" as const,
      subtitle: `${formatCurrency(annualSpend)} annually`,
      icon: DollarSign,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
    {
      title: "Unused Licenses",
      value: unusedLicenses.toLocaleString(),
      change: "-12 this month",
      changeType: "decrease" as const,
      subtitle: `Est. ${formatCurrency(potentialSavings)}/mo savings`,
      icon: Users,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
    },
    {
      title: "Potential Savings",
      value: formatCurrency(potentialSavings * 12),
      change: "annually",
      changeType: "neutral" as const,
      subtitle: `${formatCurrency(potentialSavings)}/month`,
      icon: AlertTriangle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600",
    },
    {
      title: "Avg Utilization",
      value: `${avgUtilization}%`,
      change: "+3.2%",
      changeType: "increase" as const,
      subtitle: `Across ${appsCount} apps`,
      icon: Percent,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <div className="flex items-center gap-1.5">
                  {card.changeType !== "neutral" && (
                    <>
                      {card.changeType === "increase" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-green-600" />
                      )}
                    </>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      card.changeType === "neutral" ? "text-muted-foreground" : "text-green-600",
                    )}
                  >
                    {card.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.iconBg)}>
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
