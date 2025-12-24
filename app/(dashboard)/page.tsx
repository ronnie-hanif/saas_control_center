"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RenewalsTimeline } from "@/components/dashboard/renewals-timeline"
import { RiskCompliance } from "@/components/dashboard/risk-compliance"
import { SpendTrendsChart } from "@/components/dashboard/spend-trends-chart"
import { ActionQueue } from "@/components/dashboard/action-queue"
import { SkeletonKPICards, SkeletonCard } from "@/components/ui/skeleton-card"
import { ErrorState } from "@/components/error-state"
import { getApps, getDashboardMetrics, getAccessReviewCampaigns, getUsers, getContracts } from "@/lib/data"
import type { App, DashboardMetrics, AccessReviewCampaign, User, Contract } from "@/lib/types"

export default function DashboardPage() {
  const [apps, setApps] = useState<App[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [campaigns, setCampaigns] = useState<AccessReviewCampaign[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [appsData, metricsData, campaignsData, usersData, contractsData] = await Promise.all([
        getApps(),
        getDashboardMetrics(),
        getAccessReviewCampaigns(),
        getUsers(),
        getContracts(),
      ])
      setApps(appsData)
      setMetrics(metricsData)
      setCampaigns(campaignsData)
      setUsers(usersData)
      setContracts(contractsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError("Unable to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const unusedLicenseSavings = useMemo(() => {
    return apps.reduce((sum, app) => {
      const unusedLicenses = app.licensesPurchased - app.licensesAssigned
      const perLicenseCost = app.monthlySpend / Math.max(app.licensesPurchased, 1)
      return sum + unusedLicenses * perLicenseCost
    }, 0)
  }, [apps])

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Command Center"
        description="SaaS governance overview and actionable insights for your organization"
        showDataFreshness={!loading}
        isMockData={true}
        lastUpdated={lastUpdated}
      />

      {error ? (
        <ErrorState message={error} retry={fetchData} />
      ) : loading ? (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <SkeletonKPICards count={4} />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <SkeletonCard className="h-[400px]" />
              <SkeletonCard className="h-[380px]" />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <SkeletonCard className="h-[500px]" />
              <SkeletonCard className="h-[280px]" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          {metrics && <KPICards metrics={metrics} unusedLicenseSavings={unusedLicenseSavings} />}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <RenewalsTimeline contracts={contracts} />
              <SpendTrendsChart apps={apps} />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <RiskCompliance apps={apps} campaigns={campaigns} />
              <ActionQueue apps={apps} campaigns={campaigns} users={users} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
