"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import type { App } from "@/lib/types"

interface LicenseUtilizationChartProps {
  apps: App[]
}

export function LicenseUtilizationChart({ apps }: LicenseUtilizationChartProps) {
  // Group apps by utilization ranges
  const ranges = [
    { range: "0-20%", min: 0, max: 20, count: 0 },
    { range: "21-40%", min: 21, max: 40, count: 0 },
    { range: "41-60%", min: 41, max: 60, count: 0 },
    { range: "61-80%", min: 61, max: 80, count: 0 },
    { range: "81-100%", min: 81, max: 100, count: 0 },
  ]

  apps.forEach((app) => {
    const range = ranges.find((r) => app.utilizationPercent >= r.min && app.utilizationPercent <= r.max)
    if (range) range.count++
  })

  const getColor = (range: string) => {
    if (range.startsWith("0") || range.startsWith("21")) return "#ef4444" // red
    if (range.startsWith("41")) return "#f59e0b" // amber
    return "#10b981" // emerald
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium">License Utilization Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranges} margin={{ bottom: 20 }}>
              <XAxis dataKey="range" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} apps`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ranges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Low ({`<`}40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-muted-foreground">Medium (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Good ({`>`}60%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
