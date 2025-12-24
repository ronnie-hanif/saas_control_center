"use client"

import type { LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, FolderOpen, Lock, Sparkles } from "lucide-react"

type EmptyStateVariant = "default" | "no-results" | "no-data" | "no-access" | "coming-soon"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  variant?: EmptyStateVariant
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  helpText?: string
  className?: string
}

const variantStyles: Record<EmptyStateVariant, { bg: string; icon: string }> = {
  default: { bg: "bg-muted", icon: "text-muted-foreground" },
  "no-results": { bg: "bg-amber-500/10", icon: "text-amber-600" },
  "no-data": { bg: "bg-blue-500/10", icon: "text-blue-600" },
  "no-access": { bg: "bg-red-500/10", icon: "text-red-600" },
  "coming-soon": { bg: "bg-violet-500/10", icon: "text-violet-600" },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = "default",
  action,
  secondaryAction,
  helpText,
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-full mb-5", styles.bg)}>
        <Icon className={cn("h-7 w-7", styles.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {helpText && <p className="text-xs text-muted-foreground mt-6 max-w-sm">{helpText}</p>}
    </div>
  )
}

export function NoResultsState({
  searchTerm,
  onClearFilters,
}: {
  searchTerm?: string
  onClearFilters?: () => void
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchTerm
          ? `We couldn't find any items matching "${searchTerm}". Try adjusting your search or filters.`
          : "No items match your current filters. Try adjusting your criteria to see more results."
      }
      variant="no-results"
      action={onClearFilters ? { label: "Clear filters", onClick: onClearFilters } : undefined}
      helpText="Tip: Try using broader search terms or fewer filters"
    />
  )
}

export function NoDataState({
  resource,
  onAdd,
  addRoute,
}: {
  resource: string
  onAdd?: () => void
  addRoute?: string
}) {
  const router = useRouter()

  const handleAdd = () => {
    if (onAdd) {
      onAdd()
    } else if (addRoute) {
      router.push(addRoute)
    }
  }

  return (
    <EmptyState
      icon={FolderOpen}
      title={`No ${resource} yet`}
      description={`There are no ${resource} to display. Once ${resource} are added to the system, they will appear here.`}
      variant="no-data"
      action={onAdd || addRoute ? { label: `Add ${resource}`, onClick: handleAdd } : undefined}
      helpText={`${resource} are typically added through integrations or manual entry`}
    />
  )
}

export function NoAccessState({
  resource,
  onRequestAccess,
}: {
  resource: string
  onRequestAccess?: () => void
}) {
  return (
    <EmptyState
      icon={Lock}
      title="Access restricted"
      description={`You don't have permission to view ${resource}. Contact your administrator if you believe this is an error.`}
      variant="no-access"
      action={onRequestAccess ? { label: "Request access", onClick: onRequestAccess } : undefined}
      helpText="Your current role may not include access to this resource"
    />
  )
}

export function ComingSoonState({
  feature,
}: {
  feature: string
}) {
  return (
    <EmptyState
      icon={Sparkles}
      title="Coming soon"
      description={`${feature} is currently in development and will be available in an upcoming release.`}
      variant="coming-soon"
      helpText="Check back later or contact support for more information"
    />
  )
}
