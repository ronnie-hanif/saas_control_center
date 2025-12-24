"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RenewalHealthBadge } from "@/components/contracts/renewal-health-badge"
import type { Contract } from "@/lib/types"
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  ArrowUpDown,
  Bell,
  Users,
  X,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ContractsTableProps {
  contracts: Contract[]
  onSelectContract?: (contract: Contract) => void
}

type SortField = "vendor" | "contractValue" | "renewalDate" | "owner"
type SortDir = "asc" | "desc"

export function ContractsTable({ contracts, onSelectContract }: ContractsTableProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [healthFilter, setHealthFilter] = useState<string>("all")
  const [autoRenewFilter, setAutoRenewFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("renewalDate")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)
  const tableRef = useRef<HTMLTableElement>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filteredContracts = contracts
    .filter((contract) => {
      const matchesSearch =
        (contract.vendor?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (contract.appName?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (contract.owner?.toLowerCase() || "").includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter
      const matchesHealth = healthFilter === "all" || contract.renewalHealth === healthFilter
      const matchesAutoRenew =
        autoRenewFilter === "all" ||
        (autoRenewFilter === "yes" && contract.autoRenew) ||
        (autoRenewFilter === "no" && !contract.autoRenew)
      return matchesSearch && matchesStatus && matchesHealth && matchesAutoRenew
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "vendor":
          comparison = (a.vendor || "").localeCompare(b.vendor || "")
          break
        case "contractValue":
          comparison = a.contractValue - b.contractValue
          break
        case "renewalDate":
          comparison = new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
          break
        case "owner":
          comparison = (a.owner || "").localeCompare(b.owner || "")
          break
      }
      return sortDir === "asc" ? comparison : -comparison
    })

  const totalPages = Math.ceil(filteredContracts.length / pageSize)
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const activeFilterCount = [statusFilter, healthFilter, autoRenewFilter].filter((f) => f !== "all").length

  const clearFilters = () => {
    setStatusFilter("all")
    setHealthFilter("all")
    setAutoRenewFilter("all")
    setSearch("")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj)
  }

  const getStatusBadge = (status: Contract["status"]) => {
    const config: Record<Contract["status"], { label: string; className: string }> = {
      active: {
        label: "Active",
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      },
      pending: { label: "Pending", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
      expiring: { label: "Expiring", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
      expired: { label: "Expired", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
    }
    return (
      <Badge variant="outline" className={config[status].className}>
        {config[status].label}
      </Badge>
    )
  }

  const getDaysUntilRenewal = (renewalDate: Date | string) => {
    const today = new Date()
    const dateObj = typeof renewalDate === "string" ? new Date(renewalDate) : renewalDate
    if (isNaN(dateObj.getTime())) return null
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleExport = () => {
    toast({ title: "Export started", description: "Your contracts CSV will download shortly." })
  }

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableElement>) => {
      const rows = paginatedContracts
      if (rows.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.min(prev + 1, rows.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Enter":
        case " ":
          if (focusedRowIndex >= 0 && focusedRowIndex < rows.length) {
            e.preventDefault()
            onSelectContract?.(rows[focusedRowIndex])
          }
          break
        case "Home":
          e.preventDefault()
          setFocusedRowIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusedRowIndex(rows.length - 1)
          break
      }
    },
    [paginatedContracts, focusedRowIndex, onSelectContract],
  )

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isSorted = sortField === field
    const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined

    return (
      <TableHead
        role="columnheader"
        aria-sort={ariaSort}
        tabIndex={0}
        className="cursor-pointer"
        onClick={() => handleSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleSort(field)
          }
        }}
      >
        <Button variant="ghost" size="sm" className="-ml-3 h-8 font-medium" tabIndex={-1}>
          {children}
          <ArrowUpDown className="ml-2 h-3 w-3" />
          {!isSorted && <span className="sr-only">(sortable)</span>}
        </Button>
      </TableHead>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vendor, app, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search contracts by vendor, app, or owner"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Renewal Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={autoRenewFilter} onValueChange={setAutoRenewFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Auto-Renew" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">Auto-Renew</SelectItem>
              <SelectItem value="no">Manual</SelectItem>
            </SelectContent>
          </Select>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
              <X className="h-3 w-3" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table
          ref={tableRef}
          onKeyDown={handleTableKeyDown}
          tabIndex={0}
          role="grid"
          aria-label="Contracts table"
          aria-rowcount={filteredContracts.length}
        >
          <TableHeader>
            <TableRow role="row">
              <TableHead>
                <SortableHeader field="vendor">Vendor / App</SortableHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader field="contractValue">Contract Value</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="renewalDate">Renewal Date</SortableHeader>
              </TableHead>
              <TableHead>Auto-Renew</TableHead>
              <TableHead>
                <SortableHeader field="owner">Owner</SortableHeader>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Renewal Health</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContracts.map((contract, index) => {
              const daysUntil = getDaysUntilRenewal(contract.renewalDate)
              return (
                <TableRow
                  key={contract.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    focusedRowIndex === index ? "ring-2 ring-inset ring-ring bg-muted/30" : ""
                  }`}
                  onClick={() => onSelectContract?.(contract)}
                  onFocus={() => setFocusedRowIndex(index)}
                  tabIndex={focusedRowIndex === index ? 0 : -1}
                  role="row"
                  aria-rowindex={index + 1}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.vendor}</p>
                      <p className="text-sm text-muted-foreground">{contract.appName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(contract.contractValue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{formatDate(contract.renewalDate)}</span>
                      {daysUntil !== null && daysUntil <= 30 && daysUntil > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {daysUntil}d
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.autoRenew ? "default" : "outline"}>
                      {contract.autoRenew ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contract.owner}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>
                    <RenewalHealthBadge health={contract.renewalHealth} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectContract?.(contract)
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Documents
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Stakeholders
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Bell className="mr-2 h-4 w-4" />
                          Set Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredContracts.length)} of{" "}
          {filteredContracts.length} contracts
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
