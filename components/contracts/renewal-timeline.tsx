"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RenewalHealthBadge } from "@/components/contracts/renewal-health-badge"
import type { Contract } from "@/lib/types"
import { Calendar, DollarSign, ArrowRight } from "lucide-react"

interface RenewalTimelineProps {
  contracts: Contract[]
  onSelectContract?: (contract: Contract) => void
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date() : d
}

export function RenewalTimeline({ contracts, onSelectContract }: RenewalTimelineProps) {
  const today = new Date()

  const getUpcomingRenewals = (days: number) => {
    return contracts
      .filter((c) => {
        const renewalDate = toDate(c.renewalDate)
        const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil > 0 && daysUntil <= days
      })
      .sort((a, b) => toDate(a.renewalDate).getTime() - toDate(b.renewalDate).getTime())
  }

  const renewals30 = getUpcomingRenewals(30)
  const renewals60 = getUpcomingRenewals(60)
  const renewals90 = getUpcomingRenewals(90)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const d = toDate(date)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d)
  }

  const getDaysUntil = (date: Date | string) => {
    const d = toDate(date)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getTotalValue = (contracts: Contract[]) => {
    return contracts.reduce((sum, c) => sum + c.contractValue, 0)
  }

  const TimelineItem = ({ contract }: { contract: Contract }) => {
    const daysUntil = getDaysUntil(contract.renewalDate)

    return (
      <div
        className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer"
        onClick={() => onSelectContract?.(contract)}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
          <span className="text-lg font-bold">{daysUntil}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{contract.appName || contract.vendor}</p>
            <RenewalHealthBadge health={contract.renewalHealth} showLabel={false} />
          </div>
          <p className="text-sm text-muted-foreground">{contract.vendor}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold">{formatCurrency(contract.contractValue)}</p>
          <p className="text-sm text-muted-foreground">{formatDate(contract.renewalDate)}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  const TimelineContent = ({ renewals, period }: { renewals: Contract[]; period: string }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {renewals.length} renewals in {period}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(getTotalValue(renewals))} total value</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            {renewals.filter((c) => c.renewalHealth === "at-risk").length} at risk
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {renewals.filter((c) => c.renewalHealth === "needs-review").length} need review
          </Badge>
        </div>
      </div>

      {renewals.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No renewals in this period</div>
      ) : (
        <div className="space-y-2">
          {renewals.map((contract) => (
            <TimelineItem key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renewal Timeline</CardTitle>
        <CardDescription>Upcoming contract renewals by time period</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="30" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="30" className="gap-2">
              30 Days
              {renewals30.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {renewals30.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="60" className="gap-2">
              60 Days
              {renewals60.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {renewals60.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="90" className="gap-2">
              90 Days
              {renewals90.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {renewals90.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="30">
            <TimelineContent renewals={renewals30} period="30 days" />
          </TabsContent>
          <TabsContent value="60">
            <TimelineContent renewals={renewals60} period="60 days" />
          </TabsContent>
          <TabsContent value="90">
            <TimelineContent renewals={renewals90} period="90 days" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
