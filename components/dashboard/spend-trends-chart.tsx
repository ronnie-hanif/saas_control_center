"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, ArrowUpRight } from "lucide-react"
import type { App } from "@/lib/types"

interface SpendTrendsChartProps {
  apps: App[]
}

export function SpendTrendsChart({ apps }: SpendTrendsChartProps) {
  // Group by category
  const categorySpend = apps.reduce(
    (acc, app) => {
      acc[app.category] = (acc[app.category] || 0) + app.monthlySpend
      return acc
    },
    {} as Record<string, number>,
  )

  const data = Object.entries(categorySpend)
    .map(([category, spend]) => ({
      category,
      spend,
      // Mock previous month data for comparison
      previousSpend: spend * (0.85 + Math.random() * 0.2),
    }))
    .sort((a, b) => b.spend - a.spend)

  const totalSpend = data.reduce((sum, d) => sum + d.spend, 0)

  const categoryColors: Record<string, string> = {
    Collaboration: "#3b82f6",
    DevTools: "#10b981",
    Security: "#ef4444",
    Finance: "#f59e0b",
    Sales: "#8b5cf6",
    HR: "#ec4899",
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const current = payload[0]?.value || 0
      const previous = payload[1]?.value || 0
      const change = ((current - previous) / previous) * 100

      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Current</span>
              <span className="text-sm font-medium">{formatCurrency(current)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Previous</span>
              <span className="text-sm text-muted-foreground">{formatCurrency(previous)}</span>
            </div>
            <div className="pt-1 border-t">
              <span className={`text-xs font-medium ${change >= 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(1)}% change
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Spend by Category</CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports/spend-trends" className="flex items-center gap-1">
              View Report
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Total monthly: <span className="font-medium text-foreground">{formatCurrency(totalSpend)}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 10, bottom: 10 }} barGap={2}>
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={85}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
              <Bar dataKey="spend" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || "#6b7280"} />
                ))}
              </Bar>
              <Bar
                dataKey="previousSpend"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
                fill="hsl(var(--muted))"
                opacity={0.4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Legend */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
          {data.slice(0, 6).map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: categoryColors[item.category] || "#6b7280" }}
              />
              <span className="text-xs text-muted-foreground truncate">{item.category}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
