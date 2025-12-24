"use client"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AccessReviewDetailContent } from "@/components/access-reviews/access-review-detail-content"

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[500px]" />
    </div>
  )
}

export default function AccessReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AccessReviewDetailContent params={params} />
    </Suspense>
  )
}
