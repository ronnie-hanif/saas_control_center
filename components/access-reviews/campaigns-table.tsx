"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { AccessReviewCampaign, CampaignStatus } from "@/lib/types"
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Send,
  Trash2,
  Users,
  Calendar,
  ShieldCheck,
  Filter,
  X,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface CampaignsTableProps {
  campaigns: AccessReviewCampaign[]
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize)
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Calculate summary stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    overdue: campaigns.filter((c) => c.status === "overdue").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  }

  const formatDate = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return "N/A"
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d)
    } catch {
      return "N/A"
    }
  }

  const getDaysUntilDue = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return null
      const now = new Date()
      const diffTime = d.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  const getStatusConfig = (status: CampaignStatus) => {
    const configs: Record<
      CampaignStatus,
      {
        variant: "default" | "secondary" | "destructive" | "outline"
        icon: React.ElementType
        label: string
        className: string
      }
    > = {
      active: {
        variant: "default",
        icon: Play,
        label: "Active",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20",
      },
      draft: {
        variant: "secondary",
        icon: FileEdit,
        label: "Draft",
        className: "bg-muted text-muted-foreground border-border",
      },
      completed: {
        variant: "outline",
        icon: CheckCircle2,
        label: "Completed",
        className: "bg-blue-500/10 text-blue-700 border-blue-200",
      },
      overdue: {
        variant: "destructive",
        icon: AlertTriangle,
        label: "Overdue",
        className: "bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20",
      },
    }
    return configs[status]
  }

  const handleSendReminders = (campaignId: string) => {
    toast({
      title: "Reminders sent",
      description: "Email reminders have been sent to all pending reviewers",
    })
  }

  const handleExportEvidence = (campaignId: string) => {
    toast({
      title: "Export started",
      description: "Generating compliance evidence package...",
    })
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
  }

  const hasActiveFilters = search || statusFilter !== "all"

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => setStatusFilter("active")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Play className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => setStatusFilter("overdue")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:border-foreground/20 transition-colors"
          onClick={() => setStatusFilter("completed")}
        >
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Campaign</TableHead>
              <TableHead className="font-semibold">Scope</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold">Reviewers</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No campaigns found
                </TableCell>
              </TableRow>
            ) : (
              paginatedCampaigns.map((campaign) => {
                const statusConfig = getStatusConfig(campaign.status)
                const StatusIcon = statusConfig.icon
                const daysUntil = getDaysUntilDue(campaign.dueDate)

                return (
                  <TableRow key={campaign.id} className="group">
                    <TableCell>
                      <Link href={`/access-reviews/${campaign.id}`} className="block">
                        <p className="font-medium group-hover:text-primary transition-colors">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{campaign.description}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.scope.apps.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {campaign.scope.apps.length} app{campaign.scope.apps.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {campaign.scope.departments.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {campaign.scope.departments.length} dept{campaign.scope.departments.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className={daysUntil !== null && daysUntil < 0 ? "text-red-600 font-medium" : ""}>
                                {formatDate(campaign.dueDate)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {daysUntil !== null &&
                              (daysUntil < 0
                                ? `${Math.abs(daysUntil)} days overdue`
                                : daysUntil === 0
                                  ? "Due today"
                                  : `${daysUntil} days remaining`)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <Progress value={campaign.completionPercent} className="h-2 flex-1" />
                        <span className="text-sm tabular-nums text-muted-foreground w-10">
                          {campaign.completionPercent}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaign.tasksCompleted} / {campaign.tasksTotal} tasks
                      </p>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{campaign.reviewers.length}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">{campaign.reviewers.join(", ")}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/access-reviews/${campaign.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {campaign.status === "active" && (
                            <DropdownMenuItem onClick={() => handleSendReminders(campaign.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Send Reminders
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleExportEvidence(campaign.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Evidence
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCampaigns.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
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
          <span className="text-sm tabular-nums">
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
