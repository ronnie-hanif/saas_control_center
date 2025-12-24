"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface ReportFiltersProps {
  departments: string[]
  applications: string[]
  onFiltersChange: (filters: ReportFilterState) => void
  filters: ReportFilterState
}

export interface ReportFilterState {
  dateRange: DateRange | undefined
  department: string
  application: string
}

const presetRanges = [
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Last 90 days", getValue: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  {
    label: "Last month",
    getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }),
  },
  { label: "Last 6 months", getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
  { label: "Last 12 months", getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
]

export function ReportFilters({ departments, applications, onFiltersChange, filters }: ReportFiltersProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const hasActiveFilters = filters.dateRange || filters.department !== "all" || filters.application !== "all"

  const clearFilters = () => {
    onFiltersChange({
      dateRange: undefined,
      department: "all",
      application: "all",
    })
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Select date range"
    if (!range.to) return format(range.from, "MMM d, yyyy")
    return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Date Range */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Date Range</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !filters.dateRange && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange(filters.dateRange)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="border-r p-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Presets</p>
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      onFiltersChange({ ...filters, dateRange: preset.getValue() })
                      setCalendarOpen(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) => onFiltersChange({ ...filters, dateRange: range })}
                numberOfMonths={2}
                defaultMonth={filters.dateRange?.from || subMonths(new Date(), 1)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Department Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Department</Label>
        <Select
          value={filters.department}
          onValueChange={(value) => onFiltersChange({ ...filters, department: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Application Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Application</Label>
        <Select
          value={filters.application}
          onValueChange={(value) => onFiltersChange({ ...filters, application: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All applications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All applications</SelectItem>
            {applications.map((app) => (
              <SelectItem key={app} value={app}>
                {app}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
          <X className="mr-1.5 h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
