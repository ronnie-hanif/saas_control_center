import type React from "react"
import { DataFreshness } from "@/components/ui/data-freshness"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  breadcrumb?: React.ReactNode
  lastUpdated?: Date | string | null
  isMockData?: boolean
  showDataFreshness?: boolean
}

export function PageHeader({
  title,
  description,
  children,
  breadcrumb,
  lastUpdated,
  isMockData = true, // Default to true since we're using mock data
  showDataFreshness = false,
}: PageHeaderProps) {
  return (
    <div className="space-y-1">
      {breadcrumb && (
        <nav className="flex items-center text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
          {breadcrumb}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title text-balance">{title}</h1>
            {showDataFreshness && <DataFreshness isMockData={isMockData} lastUpdated={lastUpdated} variant="badge" />}
          </div>
          {description && <p className="helper-text max-w-2xl text-pretty">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
      </div>
    </div>
  )
}
