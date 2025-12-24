"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { CampaignsTable } from "@/components/access-reviews/campaigns-table"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { getAccessReviewCampaigns } from "@/lib/data"
import type { AccessReviewCampaign } from "@/lib/types"
import { ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const IS_DATABASE_MODE = !!process.env.NEXT_PUBLIC_DATABASE_ENABLED

export default function AccessReviewsPage() {
  const [campaigns, setCampaigns] = useState<AccessReviewCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAccessReviewCampaigns()
      setCampaigns(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError("Failed to load access review campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <div className="page-container p-6">
        <ErrorState title="Failed to load campaigns" description={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Access Reviews"
        description="Run access certification campaigns to ensure proper access controls"
        showDataFreshness={!loading}
        isMockData={!IS_DATABASE_MODE}
        lastUpdated={lastUpdated}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No access reviews yet"
          description="Start your first access review campaign to certify user permissions"
          actionLabel="Start Campaign"
          onAction={() => {}}
        />
      ) : (
        <CampaignsTable campaigns={campaigns} />
      )}
    </div>
  )
}
