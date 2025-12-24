"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { SpendSummaryCards } from "@/components/spend/spend-summary-cards"
import { SpendByDepartment } from "@/components/spend/spend-by-department"
import { SpendByCategory } from "@/components/spend/spend-by-category"
import { OptimizationOpportunities } from "@/components/spend/optimization-opportunities"
import { SpendTrendMini } from "@/components/spend/spend-trend-mini"
import { getApps } from "@/lib/data"
import type { App } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function SpendPage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const appsData = await getApps()
        setApps(appsData)
      } catch (error) {
        console.error("Failed to fetch apps:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate summary metrics
  const monthlySpend = apps.reduce((sum, app) => sum + app.monthlySpend, 0)
  const annualSpend = apps.reduce((sum, app) => sum + app.annualSpend, 0)
  const unusedLicenses = apps.reduce((sum, app) => sum + (app.licensesPurchased - app.licensesAssigned), 0)
  const avgCostPerLicense =
    apps.reduce((sum, app) => {
      if (app.licensesPurchased > 0) {
        return sum + app.monthlySpend / app.licensesPurchased
      }
      return sum
    }, 0) / apps.filter((a) => a.licensesPurchased > 0).length || 25
  const potentialSavings = Math.round(unusedLicenses * avgCostPerLicense)
  const avgUtilization = Math.round(apps.reduce((sum, app) => sum + app.utilizationPercent, 0) / apps.length)

  // Calculate department breakdown
  const departmentMap = new Map<string, { spend: number; appCount: number; userCount: number }>()
  apps.forEach((app) => {
    const dept = app.department || "Other"
    const existing = departmentMap.get(dept) || { spend: 0, appCount: 0, userCount: 0 }
    departmentMap.set(dept, {
      spend: existing.spend + app.monthlySpend,
      appCount: existing.appCount + 1,
      userCount: existing.userCount + app.licensesAssigned,
    })
  })

  const departments = Array.from(departmentMap.entries()).map(([name, data]) => ({
    department: name,
    monthlySpend: data.spend,
    annualSpend: data.spend * 12,
    appCount: data.appCount,
    userCount: data.userCount,
    percentOfTotal: monthlySpend > 0 ? (data.spend / monthlySpend) * 100 : 0,
    change: Math.round((Math.random() - 0.3) * 10),
  }))

  // Calculate category breakdown
  const categoryColors: Record<string, string> = {
    Collaboration: "#3b82f6",
    DevTools: "#8b5cf6",
    Security: "#ef4444",
    Finance: "#22c55e",
    Sales: "#f59e0b",
    HR: "#ec4899",
  }

  const categoryMap = new Map<string, { spend: number; appCount: number; topApp: string; topSpend: number }>()
  apps.forEach((app) => {
    const cat = app.category || "Other"
    const existing = categoryMap.get(cat) || { spend: 0, appCount: 0, topApp: "", topSpend: 0 }
    categoryMap.set(cat, {
      spend: existing.spend + app.monthlySpend,
      appCount: existing.appCount + 1,
      topApp: app.monthlySpend > existing.topSpend ? app.name : existing.topApp,
      topSpend: Math.max(app.monthlySpend, existing.topSpend),
    })
  })

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    category: name,
    monthlySpend: data.spend,
    appCount: data.appCount,
    topApp: data.topApp,
    color: categoryColors[name] || "#6b7280",
  }))

  // Generate optimization opportunities
  const opportunities = apps
    .filter((app) => {
      const unusedCount = app.licensesPurchased - app.licensesAssigned
      return unusedCount > 10 || app.utilizationPercent < 70
    })
    .map((app) => {
      const unusedCount = app.licensesPurchased - app.licensesAssigned
      const costPerLicense = app.licensesPurchased > 0 ? app.monthlySpend / app.licensesPurchased : 0

      if (unusedCount > 10) {
        return {
          id: `opp-${app.id}-unused`,
          appId: app.id,
          appName: app.name,
          type: "unused-licenses" as const,
          description: `${unusedCount} licenses are purchased but not assigned to users.`,
          impact: unusedCount > 50 ? ("high" as const) : unusedCount > 20 ? ("medium" as const) : ("low" as const),
          estimatedSavings: Math.round(unusedCount * costPerLicense),
          unusedLicenses: unusedCount,
          recommendation: `Reduce license count by ${unusedCount} to save ${Math.round(unusedCount * costPerLicense)}/month.`,
        }
      }

      return {
        id: `opp-${app.id}-util`,
        appId: app.id,
        appName: app.name,
        type: "underutilized" as const,
        description: `Application has only ${app.utilizationPercent}% utilization.`,
        impact: app.utilizationPercent < 50 ? ("high" as const) : ("medium" as const),
        estimatedSavings: Math.round(app.monthlySpend * ((100 - app.utilizationPercent) / 100) * 0.5),
        currentUtilization: app.utilizationPercent,
        recommendation: `Review usage patterns and consider downgrading or consolidating.`,
      }
    })

  // Add overlapping tools opportunities
  const overlappingOpportunities = [
    {
      id: "opp-overlap-1",
      appId: "app-21",
      appName: "Trello",
      type: "overlapping-tools" as const,
      description: "Trello functionality overlaps significantly with Jira for project management.",
      impact: "medium" as const,
      estimatedSavings: 500,
      overlappingWith: ["Jira"],
      recommendation: "Consider consolidating to Jira for all project management needs.",
    },
    {
      id: "opp-overlap-2",
      appId: "app-22",
      appName: "Dropbox Business",
      type: "overlapping-tools" as const,
      description: "Dropbox overlaps with Google Drive included in Google Workspace subscription.",
      impact: "high" as const,
      estimatedSavings: 3200,
      overlappingWith: ["Google Drive"],
      recommendation: "Migrate files to Google Drive and eliminate Dropbox subscription.",
    },
  ]

  const allOpportunities = [...opportunities, ...overlappingOpportunities]

  // Generate spend trend data
  const spendTrendData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const baseSpend = monthlySpend * 0.85
    const variance = Math.random() * 0.15
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      spend: Math.round(baseSpend * (1 + variance + i * 0.01)),
    }
  })

  if (loading) {
    return (
      <div className="page-container space-y-6">
        <PageHeader title="Spend Management" description="Monitor SaaS costs and identify optimization opportunities" />
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="vercel-card">
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="vercel-card">
              <Skeleton className="mb-4 h-5 w-40" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="vercel-card">
              <Skeleton className="mb-4 h-5 w-40" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader title="Spend Management" description="Monitor SaaS costs and identify optimization opportunities" />

      <SpendSummaryCards
        monthlySpend={monthlySpend}
        annualSpend={annualSpend}
        unusedLicenses={unusedLicenses}
        potentialSavings={potentialSavings}
        avgUtilization={avgUtilization}
        appsCount={apps.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SpendByDepartment departments={departments} totalMonthlySpend={monthlySpend} />
        <SpendByCategory categories={categories} />
      </div>

      <SpendTrendMini data={spendTrendData} />

      <OptimizationOpportunities opportunities={allOpportunities} />
    </div>
  )
}
