"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, Clock, AlertTriangle } from "lucide-react"
import type { Contract } from "@/lib/types"

interface RenewalsTimelineProps {
  contracts: Contract[]
}

export function RenewalsTimeline({ contracts }: RenewalsTimelineProps) {
  const now = new Date()

  const toDate = (d: Date | string): Date => {
    if (d instanceof Date) return d
    return new Date(d)
  }

  const in90Days = new Date()
  in90Days.setDate(now.getDate() + 90)

  const upcomingRenewals = contracts
    .filter((c) => {
      const renewalDate = toDate(c.renewalDate)
      return renewalDate >= now && renewalDate <= in90Days
    })
    .sort((a, b) => toDate(a.renewalDate).getTime() - toDate(b.renewalDate).getTime())

  const getDaysUntil = (date: Date | string): number => {
    const d = toDate(date)
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 7) return { label: "This week", variant: "destructive" as const }
    if (daysUntil <= 14) return { label: "2 weeks", variant: "destructive" as const }
    if (daysUntil <= 30) return { label: "30 days", variant: "default" as const }
    if (daysUntil <= 60) return { label: "60 days", variant: "secondary" as const }
    return { label: "90 days", variant: "outline" as const }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  const formatDate = (date: Date | string) => {
    const d = toDate(date)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // Group by time period
  const thisWeek = upcomingRenewals.filter((c) => getDaysUntil(c.renewalDate) <= 7)
  const thisMonth = upcomingRenewals.filter((c) => {
    const days = getDaysUntil(c.renewalDate)
    return days > 7 && days <= 30
  })
  const later = upcomingRenewals.filter((c) => getDaysUntil(c.renewalDate) > 30)

  const totalValue = upcomingRenewals.reduce((sum, c) => sum + c.value, 0)

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Renewals Timeline</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next 90 days</p>
              <p className="text-sm font-semibold">{formatCurrency(totalValue)}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/contracts">View All</Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingRenewals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No renewals in the next 90 days</p>
          </div>
        ) : (
          <>
            {/* This Week - Urgent */}
            {thisWeek.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium text-destructive uppercase tracking-wider">This Week</span>
                  <Badge variant="destructive" className="ml-auto">
                    {thisWeek.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {thisWeek.map((contract) => (
                    <RenewalItem
                      key={contract.id}
                      contract={contract}
                      daysUntil={getDaysUntil(contract.renewalDate)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* This Month */}
            {thisMonth.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</span>
                  <Badge variant="secondary" className="ml-auto">
                    {thisMonth.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {thisMonth.map((contract) => (
                    <RenewalItem
                      key={contract.id}
                      contract={contract}
                      daysUntil={getDaysUntil(contract.renewalDate)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Later */}
            {later.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">31-90 Days</span>
                  <Badge variant="outline" className="ml-auto">
                    {later.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {later.slice(0, 3).map((contract) => (
                    <RenewalItem
                      key={contract.id}
                      contract={contract}
                      daysUntil={getDaysUntil(contract.renewalDate)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                  {later.length > 3 && (
                    <Link
                      href="/contracts"
                      className="block text-xs text-muted-foreground hover:text-foreground text-center py-2"
                    >
                      +{later.length - 3} more renewals
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RenewalItem({
  contract,
  daysUntil,
  formatCurrency,
  formatDate,
}: {
  contract: Contract
  daysUntil: number
  formatCurrency: (v: number) => string
  formatDate: (d: Date | string) => string
}) {
  return (
    <Link
      href={`/contracts`}
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center border">
          <span className="text-xs font-bold">{daysUntil}d</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{contract.vendor}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(contract.renewalDate)}</span>
            {contract.autoRenew && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Auto
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{formatCurrency(contract.value)}</p>
          <p className="text-xs text-muted-foreground">{contract.billingCadence}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
      </div>
    </Link>
  )
}
