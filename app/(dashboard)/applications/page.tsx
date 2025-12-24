"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { AppTable } from "@/components/applications/app-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ErrorState } from "@/components/error-state"
import { SkeletonTable } from "@/components/ui/skeleton-card"
import { getApps } from "@/lib/data"
import type { App } from "@/lib/types"

const IS_DATABASE_MODE = !!process.env.NEXT_PUBLIC_DATABASE_ENABLED

export default function ApplicationsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchApps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApps()
      setApps(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError("Unable to load applications. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Applications"
        description="Manage and monitor all SaaS applications across your organization"
        showDataFreshness={!loading}
        isMockData={!IS_DATABASE_MODE}
        lastUpdated={lastUpdated}
      >
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </PageHeader>

      {error ? (
        <ErrorState message={error} retry={fetchApps} />
      ) : loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-9 w-64 bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
          </div>
          <SkeletonTable rows={10} />
        </div>
      ) : (
        <AppTable initialApps={apps} />
      )}
    </div>
  )
}
