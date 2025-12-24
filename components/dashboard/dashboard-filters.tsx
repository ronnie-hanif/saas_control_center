"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X } from "lucide-react"
import type { DashboardFilters, RiskLevel } from "@/lib/types"

interface DashboardFiltersProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  departments: string[]
  owners: { id: string; name: string }[]
}

export function DashboardFiltersComponent({ filters, onFiltersChange, departments, owners }: DashboardFiltersProps) {
  const hasActiveFilters =
    filters.department !== "all" ||
    filters.owner !== "all" ||
    filters.riskLevel !== "all" ||
    filters.renewalWindow !== "all"

  const clearFilters = () => {
    onFiltersChange({
      department: "all",
      owner: "all",
      riskLevel: "all",
      renewalWindow: "all",
      costRange: null,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters:
      </div>

      <Select value={filters.department} onValueChange={(value) => onFiltersChange({ ...filters, department: value })}>
        <SelectTrigger className="w-[140px] bg-transparent">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.owner} onValueChange={(value) => onFiltersChange({ ...filters, owner: value })}>
        <SelectTrigger className="w-[140px] bg-transparent">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Owners</SelectItem>
          {owners.map((owner) => (
            <SelectItem key={owner.id} value={owner.id}>
              {owner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.riskLevel}
        onValueChange={(value) => onFiltersChange({ ...filters, riskLevel: value as RiskLevel | "all" })}
      >
        <SelectTrigger className="w-[120px] bg-transparent">
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.renewalWindow?.toString() || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            renewalWindow: value === "all" ? "all" : (Number.parseInt(value) as 30 | 60 | 90),
          })
        }
      >
        <SelectTrigger className="w-[140px] bg-transparent">
          <SelectValue placeholder="Renewal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Renewals</SelectItem>
          <SelectItem value="30">30 Days</SelectItem>
          <SelectItem value="60">60 Days</SelectItem>
          <SelectItem value="90">90 Days</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
