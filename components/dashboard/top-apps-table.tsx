"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiskBadge } from "@/components/risk-badge"
import type { App } from "@/lib/types"

interface TopAppsTableProps {
  apps: App[]
}

export function TopAppsTable({ apps }: TopAppsTableProps) {
  const topApps = [...apps].sort((a, b) => b.monthlySpend - a.monthlySpend).slice(0, 10)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Top 10 Apps by Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Application</TableHead>
              <TableHead className="text-right">Monthly Spend</TableHead>
              <TableHead className="text-center">Utilization</TableHead>
              <TableHead>Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topApps.map((app) => (
              <TableRow key={app.id} className="border-border">
                <TableCell>
                  <Link href={`/applications/${app.id}`} className="font-medium hover:underline">
                    {app.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{app.vendor}</p>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(app.monthlySpend)}</TableCell>
                <TableCell className="text-center">
                  <span className={app.utilizationPercent < 70 ? "text-amber-500" : ""}>{app.utilizationPercent}%</span>
                </TableCell>
                <TableCell>
                  <RiskBadge risk={app.riskLevel} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
