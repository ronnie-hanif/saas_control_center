"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Contract } from "@/lib/types"
import { AlertCircle, FileText, Calendar } from "lucide-react"

interface RenewalPlaybookProps {
  contracts: Contract[]
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date() : d
}

export function RenewalPlaybook({ contracts }: RenewalPlaybookProps) {
  const upcomingRenewals = contracts
    .filter((c) => {
      const renewalDate = toDate(c.renewalDate)
      const daysUntil = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 60
    })
    .sort((a, b) => toDate(a.renewalDate).getTime() - toDate(b.renewalDate).getTime())
    .slice(0, 3)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
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
    return Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Renewal Playbook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {upcomingRenewals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renewals in the next 60 days</p>
        ) : (
          upcomingRenewals.map((contract) => (
            <div key={contract.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{contract.appName || contract.vendor}</h4>
                  <p className="text-sm text-muted-foreground">{contract.vendor}</p>
                </div>
                <Badge variant={getDaysUntil(contract.renewalDate) <= 30 ? "destructive" : "secondary"}>
                  {getDaysUntil(contract.renewalDate)} days
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(contract.renewalDate)}
                </span>
                <span className="font-medium">{formatCurrency(contract.contractValue)}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Stakeholders</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{contract.owner.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{contract.owner}</span>
                  <Badge variant="outline" className="text-xs">
                    Owner
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Checklist</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`usage-${contract.id}`} />
                    <label htmlFor={`usage-${contract.id}`} className="text-sm">
                      Review usage metrics
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`alternatives-${contract.id}`} />
                    <label htmlFor={`alternatives-${contract.id}`} className="text-sm">
                      Evaluate alternatives
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`negotiate-${contract.id}`} />
                    <label htmlFor={`negotiate-${contract.id}`} className="text-sm">
                      Negotiate terms
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id={`approval-${contract.id}`} />
                    <label htmlFor={`approval-${contract.id}`} className="text-sm">
                      Get approval
                    </label>
                  </div>
                </div>
              </div>

              {upcomingRenewals.indexOf(contract) < upcomingRenewals.length - 1 && <Separator />}
            </div>
          ))
        )}

        {upcomingRenewals.length > 0 && (
          <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Action Required</p>
                <p className="text-amber-700 dark:text-amber-300">
                  {upcomingRenewals.length} renewal{upcomingRenewals.length > 1 ? "s" : ""} worth{" "}
                  {formatCurrency(upcomingRenewals.reduce((sum, c) => sum + c.contractValue, 0))} due soon
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
