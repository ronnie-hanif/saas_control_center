"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppDetailTabs } from "@/components/applications/app-detail-tabs"
import { RiskBadge } from "@/components/risk-badge"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { getAppById, updateApp } from "@/lib/data"
import type { App } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ExternalLink, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [app, setApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const data = await getAppById(resolvedParams.id)
        if (!data) {
          setError(true)
        } else {
          setApp(data)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchApp()
  }, [resolvedParams.id])

  const handleStatusChange = async (status: "sanctioned" | "unsanctioned") => {
    if (!app) return
    await updateApp(app.id, { status })
    setApp({ ...app, status })
    toast({
      title: `App ${status === "sanctioned" ? "sanctioned" : "marked as unsanctioned"}`,
      description: `${app.name} status has been updated`,
    })
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState
          title="Application not found"
          message="The application you're looking for doesn't exist or has been removed."
          onRetry={() => router.push("/applications")}
        />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/applications" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Link>
        <span>/</span>
        <span>{app.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <span className="text-lg font-bold">{app.name.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{app.name}</h1>
              <StatusBadge status={app.status} />
              <RiskBadge risk={app.riskLevel} />
            </div>
            <p className="text-sm text-muted-foreground">
              {app.vendor} · {app.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-transparent" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open App
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("sanctioned")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Sanctioned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("unsanctioned")}>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Unsanctioned
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/workflows?app=${app.id}`)}>
                Create Workflow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/access-reviews?app=${app.id}`)}>
                Start Access Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AppDetailTabs app={app} />
    </div>
  )
}
