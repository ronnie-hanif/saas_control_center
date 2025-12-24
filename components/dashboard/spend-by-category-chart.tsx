"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { App } from "@/lib/types"

interface SpendByCategoryChartProps {
  apps: App[]
}

export function SpendByCategoryChart({ apps }: SpendByCategoryChartProps) {
  // Aggregate spend by category
  const categorySpend = apps.reduce(
    (acc, app) => {
      acc[app.category] = (acc[app.category] || 0) + app.monthlySpend
      return acc
    },
    {} as Record<string, number>,
  )

  const data = Object.entries(categorySpend)
    .map(([category, spend]) => ({ category, spend }))
    .sort((a, b) => b.spend - a.spend)

  const colors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
  ]

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">Spend by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#888" fontSize={12} />
              <YAxis type="category" dataKey="category" width={100} stroke="#888" fontSize={12} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: "#fff" }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
