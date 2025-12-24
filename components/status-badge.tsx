import type { AppStatus, UserStatus, ContractStatus, CampaignStatus, WorkflowRunStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type Status = AppStatus | UserStatus | ContractStatus | CampaignStatus | WorkflowRunStatus

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> =
  {
    sanctioned: { label: "Sanctioned", variant: "success" },
    unsanctioned: { label: "Unsanctioned", variant: "danger" },
    "under-review": { label: "Under Review", variant: "warning" },
    active: { label: "Active", variant: "success" },
    inactive: { label: "Inactive", variant: "neutral" },
    suspended: { label: "Suspended", variant: "danger" },
    offboarding: { label: "Offboarding", variant: "warning" },
    expiring: { label: "Expiring", variant: "warning" },
    expired: { label: "Expired", variant: "danger" },
    pending: { label: "Pending", variant: "info" },
    completed: { label: "Completed", variant: "success" },
    draft: { label: "Draft", variant: "neutral" },
    overdue: { label: "Overdue", variant: "danger" },
    success: { label: "Success", variant: "success" },
    failed: { label: "Failed", variant: "danger" },
    running: { label: "Running", variant: "info" },
  }

const variantClasses: Record<string, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
}

interface StatusBadgeProps {
  status: Status
  className?: string
  animated?: boolean
}

export function StatusBadge({ status, className, animated = false }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "neutral" }

  return (
    <span
      className={cn(
        "badge-base",
        variantClasses[config.variant],
        animated && status === "running" && "loading-pulse",
        className,
      )}
    >
      {config.label}
    </span>
  )
}
