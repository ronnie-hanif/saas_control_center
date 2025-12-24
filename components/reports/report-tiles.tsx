"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle, TrendingUp, Calendar, Shield, Clock, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

interface ReportTile {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: "Cost Optimization" | "Security" | "Finance" | "Compliance"
  lastGenerated: Date
  keyMetric: { label: string; value: string }
  frequency: string
}

const reports: ReportTile[] = [
  {
    id: "unused-licenses",
    title: "Unused Licenses",
    description: "Identify licenses inactive for 30+ days with cost recovery opportunities",
    icon: FileText,
    category: "Cost Optimization",
    lastGenerated: new Date(Date.now() - 86400000),
    keyMetric: { label: "Est. Savings", value: "$24,500/mo" },
    frequency: "Updated daily",
  },
  {
    id: "high-risk",
    title: "High Risk Access",
    description: "Users with elevated permissions across critical applications",
    icon: Shield,
    category: "Security",
    lastGenerated: new Date(Date.now() - 259200000),
    keyMetric: { label: "Users Flagged", value: "23" },
    frequency: "Updated daily",
  },
  {
    id: "shadow-it",
    title: "Shadow IT Apps",
    description: "Unsanctioned applications discovered in your organization",
    icon: AlertTriangle,
    category: "Security",
    lastGenerated: new Date(Date.now() - 172800000),
    keyMetric: { label: "Apps Detected", value: "8" },
    frequency: "Updated weekly",
  },
  {
    id: "renewals-forecast",
    title: "Upcoming Renewals",
    description: "Contract renewals within the next 90 days requiring action",
    icon: Calendar,
    category: "Finance",
    lastGenerated: new Date(Date.now() - 432000000),
    keyMetric: { label: "Total Value", value: "$892K" },
    frequency: "Updated daily",
  },
  {
    id: "spend-trends",
    title: "Spend Trends",
    description: "Month-over-month SaaS spending analysis by department and category",
    icon: TrendingUp,
    category: "Finance",
    lastGenerated: new Date(Date.now() - 86400000),
    keyMetric: { label: "Monthly Spend", value: "$155K" },
    frequency: "Updated monthly",
  },
]

const categoryColors: Record<string, string> = {
  "Cost Optimization": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  Security: "bg-red-500/10 text-red-700 border-red-200",
  Finance: "bg-blue-500/10 text-blue-700 border-blue-200",
  Compliance: "bg-purple-500/10 text-purple-700 border-purple-200",
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

export function ReportTiles() {
  const groupedReports = {
    Security: reports.filter((r) => r.category === "Security"),
    Finance: reports.filter((r) => r.category === "Finance"),
    "Cost Optimization": reports.filter((r) => r.category === "Cost Optimization"),
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedReports).map(([category, categoryReports]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryReports.map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-muted p-2.5">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <Badge variant="outline" className={categoryColors[report.category]}>
                        {report.category}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-base">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metric */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">{report.keyMetric.label}</p>
                      <p className="text-xl font-semibold">{report.keyMetric.value}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>{formatRelativeTime(report.lastGenerated)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{report.frequency}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <Link href={`/reports/${report.id}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                      >
                        View Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
