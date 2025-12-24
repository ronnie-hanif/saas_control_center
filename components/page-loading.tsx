"use client"

import {
  SkeletonKPICards,
  SkeletonTable,
  SkeletonChart,
  SkeletonDetailPage,
  SkeletonIntegrationCards,
  SkeletonList,
} from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

type PageType = "dashboard" | "table" | "detail" | "integrations" | "list" | "report"

interface PageLoadingProps {
  type?: PageType
  title?: string
}

export function PageLoading({ type = "table", title }: PageLoadingProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title ? (
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Content based on type */}
      {type === "dashboard" && (
        <>
          <SkeletonKPICards count={4} />
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <SkeletonTable rows={5} />
        </>
      )}

      {type === "table" && (
        <>
          {/* Filters */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28" />
            ))}
          </div>
          <SkeletonTable rows={10} />
        </>
      )}

      {type === "detail" && <SkeletonDetailPage />}

      {type === "integrations" && <SkeletonIntegrationCards count={6} />}

      {type === "list" && (
        <>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24" />
            ))}
          </div>
          <SkeletonList items={8} />
        </>
      )}

      {type === "report" && (
        <>
          <SkeletonKPICards count={4} />
          <SkeletonTable rows={10} />
        </>
      )}
    </div>
  )
}
