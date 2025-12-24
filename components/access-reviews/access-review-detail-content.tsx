"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { ErrorState } from "@/components/error-state"
import { RiskBadge } from "@/components/risk-badge"
import { getAccessReviewCampaigns, getAccessReviewTasks, getAuditEvents } from "@/lib/data"
import { makeAccessDecision, bulkAccessDecision } from "@/app/actions/access-reviews"
import type { AccessReviewCampaign, AccessReviewTask, AuditEvent, RiskLevel, TaskDecision } from "@/lib/types"
import {
  ArrowLeft,
  Check,
  X,
  Download,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  ShieldAlert,
  FileText,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface AccessReviewDetailContentProps {
  params: Promise<{ id: string }>
}

export function AccessReviewDetailContent({ params }: AccessReviewDetailContentProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<AccessReviewCampaign | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<AccessReviewTask[]>([])
  const [saving, setSaving] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [decisionFilter, setDecisionFilter] = useState<TaskDecision | "all">("all")
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all")
  const [showUnusedOnly, setShowUnusedOnly] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  // Rationale dialog
  const [rationaleDialog, setRationaleDialog] = useState<{
    open: boolean
    taskId: string | null
    action: "approve" | "revoke" | null
    rationale: string
  }>({ open: false, taskId: null, action: null, rationale: "" })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [campaignsData, tasksData, eventsData] = await Promise.all([
        getAccessReviewCampaigns(),
        getAccessReviewTasks(),
        getAuditEvents(),
      ])
      const foundCampaign = campaignsData.find((c) => c.id === id)
      if (foundCampaign) {
        setCampaign(foundCampaign)
        setTasks(tasksData.filter((t) => t.campaignId === id))
      } else {
        setError("Campaign not found")
      }
      setAuditEvents(eventsData.slice(0, 30))
    } catch (err) {
      setError("Failed to load campaign details")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered and paginated tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.userName.toLowerCase().includes(search.toLowerCase()) ||
      task.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      task.appName.toLowerCase().includes(search.toLowerCase())
    const matchesDecision = decisionFilter === "all" || task.decision === decisionFilter
    const matchesRisk = riskFilter === "all" || task.riskLevel === riskFilter
    const matchesUnused = !showUnusedOnly || task.unusedAccess
    return matchesSearch && matchesDecision && matchesRisk && matchesUnused
  })

  const totalPages = Math.ceil(filteredTasks.length / pageSize)
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const openRationaleDialog = (taskId: string, action: "approve" | "revoke") => {
    setRationaleDialog({ open: true, taskId, action, rationale: "" })
  }

  const handleDecision = async () => {
    if (!rationaleDialog.taskId || !rationaleDialog.action) return

    setSaving(true)
    try {
      const result = await makeAccessDecision(
        rationaleDialog.taskId,
        rationaleDialog.action === "approve" ? "approved" : "revoked",
        rationaleDialog.rationale,
      )

      if (result.success) {
        // Update local state for immediate feedback
        setTasks((prev) =>
          prev.map((t) =>
            t.id === rationaleDialog.taskId
              ? {
                  ...t,
                  decision: rationaleDialog.action === "approve" ? "approved" : "revoked",
                  decidedBy: "system", // Placeholder until OIDC
                  decidedAt: new Date().toISOString(),
                  rationale: rationaleDialog.rationale,
                }
              : t,
          ),
        )

        // Update campaign completion stats
        if (campaign) {
          const newCompleted = campaign.tasksCompleted + 1
          setCampaign({
            ...campaign,
            tasksCompleted: newCompleted,
            completionPercent: Math.round((newCompleted / campaign.tasksTotal) * 100),
          })
        }

        toast({
          title: rationaleDialog.action === "approve" ? "Access approved" : "Access revoked",
          description: "Decision recorded and persisted to database",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record decision",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to record decision",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setRationaleDialog({ open: false, taskId: null, action: null, rationale: "" })
    }
  }

  const handleBulkDecision = async (action: "approve" | "revoke") => {
    const pendingSelected = Array.from(selectedTasks).filter((id) => {
      const task = tasks.find((t) => t.id === id)
      return task?.decision === "pending"
    })

    if (pendingSelected.length === 0) {
      toast({
        title: "No pending tasks selected",
        description: "Select pending tasks to make bulk decisions",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const result = await bulkAccessDecision(pendingSelected, action === "approve" ? "approved" : "revoked")

      if (result.success) {
        const decision = action === "approve" ? "approved" : "revoked"
        setTasks((prev) =>
          prev.map((t) =>
            selectedTasks.has(t.id) && t.decision === "pending"
              ? {
                  ...t,
                  decision,
                  decidedBy: "system",
                  decidedAt: new Date().toISOString(),
                  rationale: `Bulk ${action} action`,
                }
              : t,
          ),
        )

        // Update campaign completion stats
        if (campaign) {
          const newCompleted = campaign.tasksCompleted + result.count
          setCampaign({
            ...campaign,
            tasksCompleted: newCompleted,
            completionPercent: Math.round((newCompleted / campaign.tasksTotal) * 100),
          })
        }

        setSelectedTasks(new Set())
        toast({
          title: `Bulk ${action} completed`,
          description: `${result.count} access decisions recorded and persisted`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record bulk decisions",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to record bulk decisions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = useCallback(() => {
    window.open(`/api/exports/access-reviews/${id}`, "_blank")
    toast({
      title: "Export started",
      description: "CSV download will begin shortly",
    })
  }, [id, toast])

  const toggleSelectAll = () => {
    const pendingTaskIds = paginatedTasks.filter((t) => t.decision === "pending").map((t) => t.id)
    if (pendingTaskIds.every((id) => selectedTasks.has(id))) {
      setSelectedTasks(new Set([...selectedTasks].filter((id) => !pendingTaskIds.includes(id))))
    } else {
      setSelectedTasks(new Set([...selectedTasks, ...pendingTaskIds]))
    }
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

  const formatDateTime = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return "N/A"
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d)
    } catch {
      return "N/A"
    }
  }

  const getDaysSinceLogin = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return null
      const now = new Date()
      const diffTime = now.getTime() - d.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  if (loading) {
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

  if (error || !campaign) {
    return (
      <div className="p-6">
        <ErrorState
          title="Error loading campaign"
          description={error || "Campaign not found"}
          onRetry={() => router.back()}
        />
      </div>
    )
  }

  const completedTasks = tasks.filter((t) => t.decision !== "pending").length
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const approvedCount = tasks.filter((t) => t.decision === "approved").length
  const revokedCount = tasks.filter((t) => t.decision === "revoked").length
  const pendingCount = tasks.filter((t) => t.decision === "pending").length
  const highRiskPending = tasks.filter(
    (t) => t.decision === "pending" && (t.riskLevel === "high" || t.riskLevel === "critical"),
  ).length
  const unusedPending = tasks.filter((t) => t.decision === "pending" && t.unusedAccess).length

  const getStatusConfig = (status: AccessReviewCampaign["status"]) => {
    const configs = {
      active: {
        className:
          "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-500/30",
        label: "Active",
      },
      draft: { className: "bg-muted text-muted-foreground border-border", label: "Draft" },
      completed: {
        className: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-500/30",
        label: "Completed",
      },
      overdue: {
        className: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-500/30",
        label: "Overdue",
      },
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(campaign.status)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold">{campaign.name}</h1>
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{campaign.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due: {formatDate(campaign.dueDate)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {campaign.reviewers.join(", ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button variant="outline" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{campaign.completionPercent}%</p>
              </div>
              <Progress value={campaign.completionPercent} className="w-16 h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.tasksCompleted} of {campaign.tasksTotal} reviewed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revoked</p>
                <p className="text-2xl font-bold text-red-600">{revokedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Attention Needed</p>
                <p className="text-2xl font-bold text-amber-700">{highRiskPending + unusedPending}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-amber-300" />
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {highRiskPending} high-risk, {unusedPending} unused
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <Eye className="h-4 w-4" />
            Review Tasks
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users, apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={decisionFilter} onValueChange={(v) => setDecisionFilter(v as TaskDecision | "all")}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | "all")}>
                <SelectTrigger className="w-[130px]">
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
              <div className="flex items-center gap-2">
                <Checkbox id="unused" checked={showUnusedOnly} onCheckedChange={(c) => setShowUnusedOnly(c === true)} />
                <label htmlFor="unused" className="text-sm cursor-pointer">
                  Unused only
                </label>
              </div>
            </div>
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedTasks.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => handleBulkDecision("approve")} disabled={saving}>
                  <Check className="mr-1 h-4 w-4" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 bg-transparent"
                  onClick={() => handleBulkDecision("revoke")}
                  disabled={saving}
                >
                  <X className="mr-1 h-4 w-4" />
                  Revoke All
                </Button>
              </div>
            )}
          </div>

          {/* Tasks Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          paginatedTasks.filter((t) => t.decision === "pending").length > 0 &&
                          paginatedTasks.filter((t) => t.decision === "pending").every((t) => selectedTasks.has(t.id))
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Application</TableHead>
                    <TableHead className="font-semibold">Access Level</TableHead>
                    <TableHead className="font-semibold">Last Login</TableHead>
                    <TableHead className="font-semibold">Risk</TableHead>
                    <TableHead className="font-semibold">Decision</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No tasks match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTasks.map((task) => {
                      const daysSinceLogin = getDaysSinceLogin(task.lastLogin)
                      const isStale = daysSinceLogin !== null && daysSinceLogin > 30

                      return (
                        <TableRow key={task.id} className="group">
                          <TableCell>
                            {task.decision === "pending" && (
                              <Checkbox
                                checked={selectedTasks.has(task.id)}
                                onCheckedChange={(c) => {
                                  const newSet = new Set(selectedTasks)
                                  c ? newSet.add(task.id) : newSet.delete(task.id)
                                  setSelectedTasks(newSet)
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{task.userName}</p>
                              <p className="text-sm text-muted-foreground">{task.userEmail}</p>
                              <p className="text-xs text-muted-foreground">{task.userDepartment}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{task.appName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.accessLevel}</Badge>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <span className={isStale ? "text-amber-600" : ""}>
                                      {formatDate(task.lastLogin)}
                                    </span>
                                    {task.unusedAccess && (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                                      >
                                        Unused
                                      </Badge>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {daysSinceLogin !== null ? `${daysSinceLogin} days ago` : "Unknown"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <RiskBadge risk={task.riskLevel} />
                          </TableCell>
                          <TableCell>
                            {task.decision === "pending" && (
                              <Badge variant="secondary" className="bg-muted">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            {task.decision === "approved" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                      <Check className="mr-1 h-3 w-3" />
                                      Approved
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>By: {task.decidedBy}</p>
                                    <p>At: {formatDateTime(task.decidedAt || "")}</p>
                                    {task.rationale && <p>Rationale: {task.rationale}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {task.decision === "revoked" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive">
                                      <X className="mr-1 h-3 w-3" />
                                      Revoked
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>By: {task.decidedBy}</p>
                                    <p>At: {formatDateTime(task.decidedAt || "")}</p>
                                    {task.rationale && <p>Rationale: {task.rationale}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {task.decision === "pending" && (
                              <div className="flex justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => openRationaleDialog(task.id, "approve")}
                                        disabled={saving}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve access</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => openRationaleDialog(task.id, "revoke")}
                                        disabled={saving}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Revoke access</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTasks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks
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
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Decision Audit Trail</CardTitle>
              <CardDescription>
                Complete history of all access review decisions for compliance reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {tasks
                    .filter((t) => t.decision !== "pending")
                    .sort((a, b) => new Date(b.decidedAt || 0).getTime() - new Date(a.decidedAt || 0).getTime())
                    .map((task) => (
                      <div key={task.id} className="flex gap-4 border-b pb-4 last:border-0">
                        <div
                          className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                            task.decision === "approved" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {task.decision === "approved" ? "Approved" : "Revoked"} access for{" "}
                                <span className="text-primary">{task.userName}</span> to{" "}
                                <span className="text-primary">{task.appName}</span>
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">Access level: {task.accessLevel}</p>
                              {task.rationale && (
                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                  <span className="font-medium">Rationale:</span> {task.rationale}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">
                              {task.decision}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Decided by: {task.decidedBy}</span>
                            <span>•</span>
                            <span>{formatDateTime(task.decidedAt || "")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  {tasks.filter((t) => t.decision !== "pending").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No decisions recorded yet</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rationale Dialog */}
      <Dialog
        open={rationaleDialog.open}
        onOpenChange={(open) => !open && setRationaleDialog({ ...rationaleDialog, open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rationaleDialog.action === "approve" ? "Approve Access" : "Revoke Access"}</DialogTitle>
            <DialogDescription>
              Provide a rationale for this decision. This will be recorded in the audit trail for compliance purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rationale for this decision (required for audit compliance)..."
              value={rationaleDialog.rationale}
              onChange={(e) => setRationaleDialog({ ...rationaleDialog, rationale: e.target.value })}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRationaleDialog({ ...rationaleDialog, open: false })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecision}
              className={rationaleDialog.action === "revoke" ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={saving}
            >
              {rationaleDialog.action === "approve" ? "Approve" : "Revoke"} Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
