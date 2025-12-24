"use client"

import type React from "react"
import { useState, useMemo, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { App, AppSource } from "@/lib/types"
import { RiskBadge } from "@/components/risk-badge"
import { StatusBadge } from "@/components/status-badge"
import { AppDetailDrawer } from "./app-detail-drawer"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Search,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Download,
  Shield,
  Play,
  X,
  Cloud,
  Globe,
  Monitor,
} from "lucide-react"

interface AppTableProps {
  initialApps: App[]
}

type SortField =
  | "name"
  | "category"
  | "owner"
  | "monthlySpend"
  | "licensesAssigned"
  | "utilization"
  | "risk"
  | "renewalDate"
  | "lastActivity"
type SortDirection = "asc" | "desc"

const allColumns = [
  { id: "name", label: "Application", visible: true },
  { id: "category", label: "Category", visible: true },
  { id: "owner", label: "Owner", visible: true },
  { id: "users", label: "Users", visible: true },
  { id: "monthlySpend", label: "Monthly Cost", visible: true },
  { id: "risk", label: "Risk", visible: true },
  { id: "source", label: "Source", visible: true },
  { id: "utilization", label: "Utilization", visible: false },
  { id: "ssoConnected", label: "SSO", visible: false },
  { id: "lastActivity", label: "Last Activity", visible: false },
  { id: "renewalDate", label: "Renewal", visible: false },
]

const sourceLabels: Record<AppSource, { label: string; icon: typeof Cloud }> = {
  okta: { label: "Okta", icon: Cloud },
  google: { label: "Google", icon: Globe },
  azure: { label: "Azure AD", icon: Cloud },
  manual: { label: "Manual", icon: Monitor },
  "browser-extension": { label: "Browser", icon: Monitor },
}

const ITEMS_PER_PAGE = 15

const AppTableRow = memo(function AppTableRow({
  app,
  index,
  isSelected,
  isFocused,
  visibleColumns,
  onSelect,
  onFocus,
  onRowClick,
  onViewDetails,
  onCreateWorkflow,
  onStartReview,
}: {
  app: App
  index: number
  isSelected: boolean
  isFocused: boolean
  visibleColumns: string[]
  onSelect: () => void
  onFocus: () => void
  onRowClick: () => void
  onViewDetails: () => void
  onCreateWorkflow: () => void
  onStartReview: () => void
}) {
  const utilization = Math.round((app.licensesAssigned / app.licensesPurchased) * 100)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onRowClick()
      }
    },
    [onRowClick],
  )

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleActionsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-primary/5",
        isFocused && "ring-2 ring-inset ring-ring bg-muted/30",
      )}
      onKeyDown={handleKeyDown}
      onClick={onRowClick}
      onFocus={onFocus}
      tabIndex={isFocused ? 0 : -1}
      role="row"
      aria-rowindex={index + 1}
      aria-selected={isSelected}
    >
      <TableCell onClick={handleCheckboxClick}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      {visibleColumns.includes("name") && (
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
              {app.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{app.name}</p>
              <p className="text-sm text-muted-foreground">{app.vendor}</p>
            </div>
          </div>
        </TableCell>
      )}
      {visibleColumns.includes("category") && (
        <TableCell>
          <Badge variant="outline">{app.category}</Badge>
        </TableCell>
      )}
      {visibleColumns.includes("owner") && (
        <TableCell className="text-muted-foreground">{app.owner || "Unknown"}</TableCell>
      )}
      {visibleColumns.includes("users") && (
        <TableCell className="text-right">
          <span className="font-medium">{app.licensesAssigned}</span>
          <span className="text-muted-foreground"> / {app.licensesPurchased}</span>
        </TableCell>
      )}
      {visibleColumns.includes("monthlySpend") && (
        <TableCell className="text-right font-medium">{formatCurrency(app.monthlySpend)}</TableCell>
      )}
      {visibleColumns.includes("risk") && (
        <TableCell>
          <RiskBadge risk={app.riskLevel} />
        </TableCell>
      )}
      {visibleColumns.includes("source") && (
        <TableCell>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="gap-1">
                {(() => {
                  const SourceIcon = sourceLabels[app.source as AppSource]?.icon
                  return SourceIcon ? <SourceIcon className="h-3 w-3" /> : null
                })()}
                {sourceLabels[app.source as AppSource]?.label || "Unknown"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Discovered via {app.source || "manual entry"}</TooltipContent>
          </Tooltip>
        </TableCell>
      )}
      {visibleColumns.includes("utilization") && (
        <TableCell className="text-right">
          <span className={utilization < 50 ? "text-amber-600" : ""}>{utilization}%</span>
        </TableCell>
      )}
      {visibleColumns.includes("ssoConnected") && (
        <TableCell>
          <StatusBadge status={app.ssoConnected ? "active" : "inactive"} />
        </TableCell>
      )}
      {visibleColumns.includes("lastActivity") && (
        <TableCell className="text-muted-foreground text-sm">{formatDate(app.lastActivity)}</TableCell>
      )}
      {visibleColumns.includes("renewalDate") && (
        <TableCell className="text-muted-foreground text-sm">{formatDate(app.renewalDate)}</TableCell>
      )}
      <TableCell onClick={handleActionsClick}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateWorkflow}>
              <Play className="mr-2 h-4 w-4" />
              Create Workflow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onStartReview}>
              <Shield className="mr-2 h-4 w-4" />
              Start Access Review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value)

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "N/A"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AppTable({ initialApps }: AppTableProps) {
  const router = useRouter()
  const [apps, setApps] = useState<App[]>(initialApps)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("monthlySpend")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState(() => allColumns.filter((c) => c.visible).map((c) => c.id))
  const [page, setPage] = useState(1)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  const categories = useMemo(() => [...new Set(apps.map((a) => a.category))].sort(), [apps])
  const owners = useMemo(() => [...new Set(apps.map((a) => a.owner).filter(Boolean))].sort(), [apps])
  const sources = useMemo(() => [...new Set(apps.map((a) => a.source).filter(Boolean))], [apps])

  const filteredApps = useMemo(() => {
    let result = [...apps]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.vendor.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q) ||
          app.owner.toLowerCase().includes(q),
      )
    }

    if (categoryFilter !== "all") {
      result = result.filter((app) => app.category === categoryFilter)
    }

    if (riskFilter !== "all") {
      result = result.filter((app) => app.riskLevel === riskFilter)
    }

    if (sourceFilter !== "all") {
      result = result.filter((app) => app.source === sourceFilter)
    }

    if (ownerFilter !== "all") {
      result = result.filter((app) => app.owner === ownerFilter)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "monthlySpend":
          comparison = a.monthlySpend - b.monthlySpend
          break
        case "utilizationPercent":
          comparison = a.utilizationPercent - b.utilizationPercent
          break
        case "licensesAssigned":
          comparison = a.licensesAssigned - b.licensesAssigned
          break
        case "renewalDate":
          comparison = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
          break
        case "lastActivity":
          comparison = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "owner":
          comparison = (a.owner || "").localeCompare(b.owner || "")
          break
        case "risk":
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1, undefined: 0 }
          comparison =
            (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0) -
            (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [apps, searchQuery, categoryFilter, riskFilter, sourceFilter, ownerFilter, sortField, sortDirection])

  const paginatedApps = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredApps.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredApps, page])

  const totalPages = useMemo(() => Math.ceil(filteredApps.length / ITEMS_PER_PAGE), [filteredApps.length])

  const activeFiltersCount = useMemo(() => {
    return [categoryFilter, riskFilter, sourceFilter, ownerFilter].filter((f) => f !== "all").length
  }, [categoryFilter, riskFilter, sourceFilter, ownerFilter])

  const clearAllFilters = useCallback(() => {
    setCategoryFilter("all")
    setRiskFilter("all")
    setSourceFilter("all")
    setOwnerFilter("all")
    setSearchQuery("")
    setPage(1)
  }, [])

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
        return prev
      }
      setSortDirection("desc")
      return field
    })
  }, [])

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === paginatedApps.length) {
        return new Set()
      }
      return new Set(paginatedApps.map((a) => a.id))
    })
  }, [paginatedApps])

  const handleBulkAction = useCallback(
    (action: string) => {
      toast({
        title: `${action} initiated`,
        description: `Processing ${selectedRows.size} applications...`,
      })
      setSelectedRows(new Set())
    },
    [selectedRows.size],
  )

  const handleExport = useCallback(() => {
    window.open("/api/exports/applications", "_blank")
    toast({
      title: "Export started",
      description: "CSV download will begin shortly",
    })
  }, [toast])

  const openAppDrawer = useCallback((app: App) => {
    setSelectedApp(app)
    setDrawerOpen(true)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }, [])

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }, [])

  const handleRiskChange = useCallback((value: string) => {
    setRiskFilter(value)
    setPage(1)
  }, [])

  const handleSourceChange = useCallback((value: string) => {
    setSourceFilter(value)
    setPage(1)
  }, [])

  const handleOwnerChange = useCallback((value: string) => {
    setOwnerFilter(value)
    setPage(1)
  }, [])

  const handleColumnToggle = useCallback((columnId: string, checked: boolean) => {
    setVisibleColumns((prev) => (checked ? [...prev, columnId] : prev.filter((id) => id !== columnId)))
  }, [])

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
      if (paginatedApps.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.min(prev + 1, paginatedApps.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Home":
          e.preventDefault()
          setFocusedRowIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedRowIndex(paginatedApps.length - 1)
          break
      }
    },
    [paginatedApps.length],
  )

  const handlePrevPage = useCallback(() => setPage((p) => p - 1), [])
  const handleNextPage = useCallback(() => setPage((p) => p + 1), [])

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField
    children: React.ReactNode
    className?: string
  }) => {
    const isSorted = sortField === field
    const ariaSort = isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined

    return (
      <TableHead
        className={`cursor-pointer hover:bg-muted/50 select-none transition-colors ${className || ""}`}
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleSort(field)
          }
        }}
        tabIndex={0}
        role="columnheader"
        aria-sort={ariaSort}
      >
        <div className="flex items-center gap-1">
          {children}
          {isSorted &&
            (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
          {!isSorted && <span className="sr-only">(sortable)</span>}
        </div>
      </TableHead>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
              aria-label="Search applications by name, vendor, category, or owner"
            />
          </div>

          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={handleRiskChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((src) => (
                <SelectItem key={src} value={src}>
                  {src.charAt(0).toUpperCase() + src.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={handleOwnerChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-9 gap-1">
              <X className="h-4 w-4" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions ({selectedRows.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction("Mark as Sanctioned")}>
                  Mark as Sanctioned
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Add Tags")}>Add Tags</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("Trigger Seat Reclamation")}>
                  Trigger Seat Reclamation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>Export Selected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={(checked) => handleColumnToggle(column.id, checked)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="rounded-md border">
          <Table className="enterprise-table">
            <TableHeader>
              <TableRow role="row">
                <TableHead className="w-12" role="columnheader">
                  <Checkbox
                    checked={paginatedApps.length > 0 && selectedRows.size === paginatedApps.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all applications on this page"
                  />
                </TableHead>
                {visibleColumns.includes("name") && <SortableHeader field="name">Application</SortableHeader>}
                {visibleColumns.includes("category") && <SortableHeader field="category">Category</SortableHeader>}
                {visibleColumns.includes("owner") && <SortableHeader field="owner">Owner</SortableHeader>}
                {visibleColumns.includes("users") && (
                  <SortableHeader field="licensesAssigned" className="text-right">
                    Users
                  </SortableHeader>
                )}
                {visibleColumns.includes("monthlySpend") && (
                  <SortableHeader field="monthlySpend" className="text-right">
                    Monthly Cost
                  </SortableHeader>
                )}
                {visibleColumns.includes("risk") && <SortableHeader field="risk">Risk</SortableHeader>}
                {visibleColumns.includes("source") && <TableHead>Source</TableHead>}
                {visibleColumns.includes("utilization") && (
                  <SortableHeader field="utilization" className="text-right">
                    Utilization
                  </SortableHeader>
                )}
                {visibleColumns.includes("ssoConnected") && <TableHead>SSO</TableHead>}
                {visibleColumns.includes("lastActivity") && (
                  <SortableHeader field="lastActivity">Last Activity</SortableHeader>
                )}
                {visibleColumns.includes("renewalDate") && <SortableHeader field="renewalDate">Renewal</SortableHeader>}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody onKeyDown={handleRowKeyDown}>
              {paginatedApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                    No applications to display
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApps.map((app, index) => (
                  <AppTableRow
                    key={app.id}
                    app={app}
                    index={index}
                    isSelected={selectedRows.has(app.id)}
                    isFocused={focusedRowIndex === index}
                    visibleColumns={visibleColumns}
                    onSelect={() => toggleRowSelection(app.id)}
                    onFocus={() => setFocusedRowIndex(index)}
                    onRowClick={() => openAppDrawer(app)}
                    onViewDetails={() => openAppDrawer(app)}
                    onCreateWorkflow={() => router.push(`/workflows/new?app=${app.id}`)}
                    onStartReview={() => router.push(`/access-reviews/new?app=${app.id}`)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredApps.length === 0
              ? "No applications to display"
              : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, filteredApps.length)} of ${filteredApps.length} applications`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages || 1}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AppDetailDrawer app={selectedApp} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </TooltipProvider>
  )
}
