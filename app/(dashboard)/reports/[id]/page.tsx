"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getApps, getUsers, getContracts } from "@/lib/data"
import type { App, User, Contract } from "@/lib/types"
import {
  ArrowLeft,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { RiskBadge } from "@/components/risk-badge"
import { ReportFilters, type ReportFilterState } from "@/components/reports/report-filters"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const reportMeta: Record<string, { title: string; description: string; category: string }> = {
  "unused-licenses": {
    title: "Unused Licenses Report",
    description: "Applications with low utilization and cost recovery opportunities",
    category: "Cost Optimization",
  },
  "shadow-it": {
    title: "Shadow IT Apps Report",
    description: "Unsanctioned applications discovered in your organization",
    category: "Security",
  },
  "high-risk": {
    title: "High Risk Access Report",
    description: "Users with elevated permissions across critical applications",
    category: "Security",
  },
  "spend-trends": {
    title: "Spend Trends Report",
    description: "Monthly SaaS spending analysis by department and category",
    category: "Finance",
  },
  "renewals-forecast": {
    title: "Upcoming Renewals Report",
    description: "Contract renewals requiring action in the next 90 days",
    category: "Finance",
  },
}

function ReportDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [apps, setApps] = useState<App[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilterState>({
    dateRange: undefined,
    department: "all",
    application: "all",
  })

  const meta = reportMeta[id] || { title: "Report", description: "", category: "General" }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [appsData, usersData, contractsData] = await Promise.all([getApps(), getUsers(), getContracts()])
        setApps(appsData)
        setUsers(usersData)
        setContracts(contractsData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get unique departments and applications for filters
  const departments = [...new Set(users.map((u) => u.department))]
  const applications = apps.map((a) => a.name).sort()

  const handleExport = (format: "csv" | "pdf") => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your report will be ready shortly...",
    })

    // Simulate download
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `${meta.title}.${format} has been downloaded.`,
      })
    }, 1500)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    setLoading(true)
    toast({
      title: "Refreshing report",
      description: "Fetching latest data...",
    })
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Report refreshed",
        description: "Data is now up to date.",
      })
    }, 1000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Apply department filter
  const filteredUsers = filters.department === "all" ? users : users.filter((u) => u.department === filters.department)

  const filteredApps = filters.application === "all" ? apps : apps.filter((a) => a.name === filters.application)

  const renderReportContent = () => {
    switch (id) {
      case "unused-licenses": {
        const underutilized = filteredApps
          .filter((a) => a.utilization < 50)
          .sort((a, b) => a.utilization - b.utilization)

        const totalUnusedLicenses = underutilized.reduce(
          (sum, a) => sum + (a.licensesPurchased - a.licensesAssigned),
          0,
        )
        const totalPotentialSavings = underutilized.reduce(
          (sum, a) => sum + a.monthlySpend * ((100 - a.utilization) / 100),
          0,
        )

        return (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Underutilized Apps</p>
                  <p className="text-2xl font-semibold">{underutilized.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Unused Licenses</p>
                  <p className="text-2xl font-semibold">{totalUnusedLicenses}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly Waste</p>
                  <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalPotentialSavings)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Annual Savings Potential</p>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {formatCurrency(totalPotentialSavings * 12)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Table */}
            <Card>
              <CardHeader>
                <CardTitle>Underutilized Applications</CardTitle>
                <CardDescription>Applications with less than 50% license utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-center">Utilization</TableHead>
                      <TableHead className="text-right">Purchased</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Unused</TableHead>
                      <TableHead className="text-right">Monthly Cost</TableHead>
                      <TableHead className="text-right">Est. Savings</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {underutilized.map((app) => {
                      const unused = app.licensesPurchased - app.licensesAssigned
                      const savings = app.monthlySpend * ((100 - app.utilization) / 100)
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>{app.category}</TableCell>
                          <TableCell>{app.owner}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={app.utilization < 30 ? "destructive" : "secondary"}>
                              {app.utilization}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{app.licensesPurchased}</TableCell>
                          <TableCell className="text-right">{app.licensesAssigned}</TableCell>
                          <TableCell className="text-right font-medium">{unused}</TableCell>
                          <TableCell className="text-right">{formatCurrency(app.monthlySpend)}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">
                            {formatCurrency(savings)}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Reclaim
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }

      case "shadow-it": {
        const shadowApps = filteredApps.filter((a) => a.status === "unsanctioned")
        const highRiskCount = shadowApps.filter((a) => a.risk === "high" || a.risk === "critical").length
        const totalUsers = shadowApps.reduce((sum, a) => sum + a.licensesAssigned, 0)

        return (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Shadow IT Apps</p>
                  <p className="text-2xl font-semibold">{shadowApps.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">High Risk Apps</p>
                  <p className="text-2xl font-semibold text-red-600">{highRiskCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Affected Users</p>
                  <p className="text-2xl font-semibold">{totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Discovery Sources</p>
                  <p className="text-2xl font-semibold">3</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Shadow IT Applications</CardTitle>
                <CardDescription>Unsanctioned applications requiring review</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>SSO</TableHead>
                      <TableHead>Discovered</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shadowApps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No shadow IT applications detected
                        </TableCell>
                      </TableRow>
                    ) : (
                      shadowApps.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>{app.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{app.source || "Manual"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{app.licensesAssigned}</TableCell>
                          <TableCell>
                            <RiskBadge risk={app.risk} />
                          </TableCell>
                          <TableCell>
                            {app.ssoConnected ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell>{formatDate(app.lastActivity)}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }

      case "high-risk": {
        const highRiskUsers = filteredUsers
          .filter((u) => u.highRiskAccessCount > 0)
          .sort((a, b) => b.highRiskAccessCount - a.highRiskAccessCount)

        const totalHighRiskAccess = highRiskUsers.reduce((sum, u) => sum + u.highRiskAccessCount, 0)
        const criticalUsers = highRiskUsers.filter((u) => u.highRiskAccessCount >= 3).length

        return (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Users with High Risk Access</p>
                  <p className="text-2xl font-semibold">{highRiskUsers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total High Risk Assignments</p>
                  <p className="text-2xl font-semibold text-red-600">{totalHighRiskAccess}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Critical Users (3+ apps)</p>
                  <p className="text-2xl font-semibold text-amber-600">{criticalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Departments Affected</p>
                  <p className="text-2xl font-semibold">{new Set(highRiskUsers.map((u) => u.department)).size}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>High Risk Access Users</CardTitle>
                <CardDescription>Users with elevated permissions across critical applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-center">High Risk Apps</TableHead>
                      <TableHead className="text-center">Total Apps</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highRiskUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>{user.manager || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.highRiskAccessCount >= 3 ? "destructive" : "secondary"}>
                            {user.highRiskAccessCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{user.appsUsed}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "outline"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.lastActive)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Review Access
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }

      case "spend-trends": {
        // Group by category
        const categorySpend = filteredApps.reduce(
          (acc, app) => {
            acc[app.category] = (acc[app.category] || 0) + app.monthlySpend
            return acc
          },
          {} as Record<string, number>,
        )

        // Group by department (using owner as proxy)
        const departmentSpend = filteredApps.reduce(
          (acc, app) => {
            const dept = app.department || "Unassigned"
            acc[dept] = (acc[dept] || 0) + app.monthlySpend
            return acc
          },
          {} as Record<string, number>,
        )

        const totalMonthly = filteredApps.reduce((sum, a) => sum + a.monthlySpend, 0)

        return (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Monthly Spend</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalMonthly)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Annual Spend</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalMonthly * 12)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-semibold">{filteredApps.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Avg. per App</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalMonthly / filteredApps.length || 0)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Spend by Category</CardTitle>
                  <CardDescription>Monthly spend breakdown by application category</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Monthly</TableHead>
                        <TableHead className="text-right">Annual</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(categorySpend)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, spend]) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">{category}</TableCell>
                            <TableCell className="text-right">{formatCurrency(spend)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(spend * 12)}</TableCell>
                            <TableCell className="text-right">{((spend / totalMonthly) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* By Department */}
              <Card>
                <CardHeader>
                  <CardTitle>Spend by Department</CardTitle>
                  <CardDescription>Monthly spend breakdown by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Monthly</TableHead>
                        <TableHead className="text-right">Annual</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(departmentSpend)
                        .sort(([, a], [, b]) => b - a)
                        .map(([department, spend]) => (
                          <TableRow key={department}>
                            <TableCell className="font-medium">{department}</TableCell>
                            <TableCell className="text-right">{formatCurrency(spend)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(spend * 12)}</TableCell>
                            <TableCell className="text-right">{((spend / totalMonthly) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Top Apps Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top Applications by Spend</CardTitle>
                <CardDescription>Highest spending applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">Monthly Spend</TableHead>
                      <TableHead className="text-right">Annual Spend</TableHead>
                      <TableHead className="text-center">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps
                      .sort((a, b) => b.monthlySpend - a.monthlySpend)
                      .slice(0, 15)
                      .map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>{app.category}</TableCell>
                          <TableCell>{app.owner}</TableCell>
                          <TableCell className="text-right">{formatCurrency(app.monthlySpend)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(app.monthlySpend * 12)}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                app.utilization >= 70 ? "default" : app.utilization >= 50 ? "secondary" : "destructive"
                              }
                            >
                              {app.utilization}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }

      case "renewals-forecast": {
        const toDate = (d: Date | string) => (typeof d === "string" ? new Date(d) : d)

        const sortedContracts = [...contracts].sort(
          (a, b) => toDate(a.renewalDate).getTime() - toDate(b.renewalDate).getTime(),
        )

        const next30Days = sortedContracts.filter((c) => {
          const daysUntil = Math.ceil((toDate(c.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 0 && daysUntil <= 30
        })

        const next60Days = sortedContracts.filter((c) => {
          const daysUntil = Math.ceil((toDate(c.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 30 && daysUntil <= 60
        })

        const next90Days = sortedContracts.filter((c) => {
          const daysUntil = Math.ceil((toDate(c.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil > 60 && daysUntil <= 90
        })

        const allUpcoming = [...next30Days, ...next60Days, ...next90Days]
        const totalValue = allUpcoming.reduce((sum, c) => sum + c.contractValue, 0)
        const autoRenewCount = allUpcoming.filter((c) => c.autoRenew).length

        return (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Renewals (Next 90 Days)</p>
                  <p className="text-2xl font-semibold">{allUpcoming.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Contract Value</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Auto-Renew Enabled</p>
                  <p className="text-2xl font-semibold">{autoRenewCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Urgent (Next 30 Days)</p>
                  <p className="text-2xl font-semibold text-red-600">{next30Days.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgency Breakdown */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    Next 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{next30Days.length} contracts</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(next30Days.reduce((sum, c) => sum + c.contractValue, 0))} total value
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    31-60 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{next60Days.length} contracts</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(next60Days.reduce((sum, c) => sum + c.contractValue, 0))} total value
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    61-90 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{next90Days.length} contracts</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(next90Days.reduce((sum, c) => sum + c.contractValue, 0))} total value
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
                <CardDescription>Contracts renewing in the next 90 days</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Days Until</TableHead>
                      <TableHead className="text-right">Contract Value</TableHead>
                      <TableHead className="text-center">Auto-Renew</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUpcoming.map((contract) => {
                      const daysUntil = Math.ceil(
                        (toDate(contract.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                      )
                      return (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.appName}</TableCell>
                          <TableCell>{contract.vendor}</TableCell>
                          <TableCell>{contract.owner}</TableCell>
                          <TableCell>{formatDate(contract.renewalDate)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={daysUntil <= 30 ? "destructive" : daysUntil <= 60 ? "secondary" : "outline"}
                            >
                              {daysUntil} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(contract.contractValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            {contract.autoRenew ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )
      }

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">Report not found</CardContent>
          </Card>
        )
    }
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{meta.title}</h1>
                <Badge variant="outline">{meta.category}</Badge>
              </div>
              <p className="text-muted-foreground">{meta.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print report</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <ReportFilters
          departments={departments}
          applications={applications}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Report timestamp */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Report generated: {new Date().toLocaleString()}</span>
        </div>

        {/* Report Content */}
        <div className="space-y-6 print:space-y-4">{renderReportContent()}</div>
      </div>
    </TooltipProvider>
  )
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <ReportDetailContent id={id} />
    </Suspense>
  )
}
