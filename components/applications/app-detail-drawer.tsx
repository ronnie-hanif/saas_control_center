"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RiskBadge } from "@/components/risk-badge"
import { StatusBadge } from "@/components/status-badge"
import { getAppUsers, getContractByAppId, getAuditEvents } from "@/lib/data"
import type { App, UserAppAccess, Contract, AuditEvent } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  ExternalLink,
  Users,
  DollarSign,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  User,
  KeyRound,
  Activity,
  TrendingDown,
  ChevronRight,
} from "lucide-react"

interface AppDetailDrawerProps {
  app: App | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppDetailDrawer({ app, open, onOpenChange }: AppDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [appUsers, setAppUsers] = useState<UserAppAccess[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const { toast } = useToast()
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || !drawerRef.current) return

      if (e.key === "Tab") {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    },
    [open],
  )

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.addEventListener("keydown", handleKeyDown)

      // Focus first focusable element after drawer opens
      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        firstFocusable?.focus()
      }, 100)
    } else {
      document.removeEventListener("keydown", handleKeyDown)
      // Restore focus to previous element
      previousActiveElement.current?.focus()
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    if (app && open) {
      setLoading(true)
      setNotes(app.notes || "")
      const fetchData = async () => {
        const [usersData, contractData, eventsData] = await Promise.all([
          getAppUsers(app.id),
          getContractByAppId(app.id),
          getAuditEvents("app", app.id),
        ])
        setAppUsers(usersData)
        setContract(contractData || null)
        setAuditEvents(eventsData)
        setLoading(false)
      }
      fetchData()
    }
  }, [app, open])

  if (!app) return null

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

  const formatDate = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return "N/A"
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return "N/A"
    }
  }

  const formatDateTime = (date: string | Date) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date
      if (isNaN(d.getTime())) return "N/A"
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    } catch {
      return "N/A"
    }
  }

  const unusedLicenses = app.licensesPurchased - app.licensesAssigned
  const potentialSavings = (unusedLicenses * app.monthlySpend) / app.licensesPurchased

  const activeUsers = appUsers.filter((u) => u.status === "active").length
  const inactiveUsers = appUsers.filter((u) => u.status === "inactive").length

  const handleReclaimSeats = () => {
    toast({
      title: "Seat reclamation initiated",
      description: `Processing ${inactiveUsers} inactive seats for ${app.name}`,
    })
  }

  const handleSaveNotes = () => {
    toast({ title: "Notes saved", description: "Application notes have been updated" })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={drawerRef}
        className="drawer-width-xl p-0 flex flex-col"
        aria-label={`Application details for ${app.name}`}
        aria-describedby="drawer-description"
      >
        <SheetHeader className="drawer-header">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                {app.name}
                <StatusBadge status={app.status} />
              </SheetTitle>
              <p id="drawer-description" className="helper-text">
                {app.vendor}
              </p>
            </div>
            <Link href={`/applications/${app.id}`}>
              <Button variant="outline" size="sm" className="btn-sm bg-transparent">
                Full Details
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-2 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="spend">Spend</TabsTrigger>
            <TabsTrigger value="risk">Risk & Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(app.monthlySpend)}</p>
                        <p className="text-xs text-muted-foreground">Monthly cost</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{app.licensesAssigned}</p>
                        <p className="text-xs text-muted-foreground">of {app.licensesPurchased} licenses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Utilization */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">License Utilization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{app.utilizationPercent}% utilized</span>
                    <span className="text-muted-foreground">{unusedLicenses} unused</span>
                  </div>
                  <Progress value={app.utilizationPercent} className="h-2" />
                  {unusedLicenses > 0 && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Potential savings: {formatCurrency(potentialSavings)}/mo
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* App Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Building className="h-3.5 w-3.5" /> Category
                    </span>
                    <Badge variant="secondary">{app.category}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <User className="h-3.5 w-3.5" /> Owner
                    </span>
                    <span className="font-medium">{app.owner || "Unknown"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" /> Risk Level
                    </span>
                    <RiskBadge risk={app.riskLevel} />
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5" /> SSO Connected
                    </span>
                    {app.ssoConnected ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        <XCircle className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> Renewal Date
                    </span>
                    <span className="font-medium">{formatDate(app.renewalDate)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Last Activity
                    </span>
                    <span className="font-medium">{formatDate(app.lastActivity)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {app.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {app.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-0 space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{appUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-500">{activeUsers}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-500">{inactiveUsers}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </CardContent>
                </Card>
              </div>

              {/* Reclaim Action */}
              {inactiveUsers > 0 && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">{inactiveUsers} inactive users</p>
                          <p className="text-xs text-muted-foreground">
                            Potential savings:{" "}
                            {formatCurrency((inactiveUsers * app.monthlySpend) / app.licensesPurchased)}/mo
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleReclaimSeats}>
                        Reclaim Seats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Last Login Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Login Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          label: "Last 7 days",
                          count: appUsers.filter((u) => {
                            const d = new Date(u.lastLogin)
                            return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
                          }).length,
                        },
                        {
                          label: "8-30 days",
                          count: appUsers.filter((u) => {
                            const d = new Date(u.lastLogin)
                            const diff = Date.now() - d.getTime()
                            return diff >= 7 * 24 * 60 * 60 * 1000 && diff < 30 * 24 * 60 * 60 * 1000
                          }).length,
                        },
                        {
                          label: "31-90 days",
                          count: appUsers.filter((u) => {
                            const d = new Date(u.lastLogin)
                            const diff = Date.now() - d.getTime()
                            return diff >= 30 * 24 * 60 * 60 * 1000 && diff < 90 * 24 * 60 * 60 * 1000
                          }).length,
                        },
                        {
                          label: "90+ days",
                          count: appUsers.filter((u) => {
                            const d = new Date(u.lastLogin)
                            return Date.now() - d.getTime() >= 90 * 24 * 60 * 60 * 1000
                          }).length,
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-24">{item.label}</span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${appUsers.length ? (item.count / appUsers.length) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
                  <Link
                    href={`/applications/${app.id}?tab=users`}
                    className="text-xs text-primary hover:underline flex items-center"
                  >
                    View all <ChevronRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : appUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users assigned</p>
                  ) : (
                    <div className="space-y-3">
                      {appUsers.slice(0, 5).map((user) => (
                        <div key={`${user.userId}-${user.appId}`} className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm font-medium">{user.appName || user.userId}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {user.accessLevel} - {user.licenseType}
                            </p>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={user.status} />
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(user.lastLogin)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spend Tab */}
            <TabsContent value="spend" className="mt-0 space-y-6">
              {/* Spend Overview */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(app.monthlySpend)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Annual Spend</p>
                    <p className="text-2xl font-bold">{formatCurrency(app.annualSpend)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Per License */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">License Economics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per license</span>
                    <span className="font-medium">{formatCurrency(app.monthlySpend / app.licensesPurchased)}/mo</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost per active user</span>
                    <span className="font-medium">{formatCurrency(app.monthlySpend / app.licensesAssigned)}/mo</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unused license cost</span>
                    <span className="font-medium text-amber-500">{formatCurrency(potentialSavings)}/mo</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Info */}
              {contract && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contract Value</span>
                      <span className="font-medium">{formatCurrency(contract.contractValue)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing</span>
                      <span className="font-medium capitalize">{contract.billingCadence}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Term</span>
                      <span className="font-medium">
                        {formatDate(contract.termStart)} - {formatDate(contract.termEnd)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Auto-Renew</span>
                      <span className="font-medium">{contract.autoRenew ? "Yes" : "No"}</span>
                    </div>
                    {contract.documents && contract.documents.length > 0 && (
                      <>
                        <Separator />
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">Documents</p>
                          <div className="flex flex-wrap gap-2">
                            {contract.documents.map((doc, i) => (
                              <Button key={i} variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                                <FileText className="mr-1 h-3 w-3" />
                                {typeof doc === "string" ? doc : doc}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Spend History Link */}
              <Card>
                <CardContent className="p-4">
                  <Link href={`/applications/${app.id}?tab=spend`} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">View Spend History</p>
                      <p className="text-xs text-muted-foreground">12-month trend and breakdown</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk & Notes Tab */}
            <TabsContent value="risk" className="mt-0 space-y-6">
              {/* Risk Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Risk Level</span>
                    <RiskBadge risk={app.riskLevel} />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {app.ssoConnected ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm">SSO Authentication</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.adminCount <= 5 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-sm">{app.adminCount} admin users</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.status === "sanctioned" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm capitalize">{app.status} status</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}
              {app.permissions && app.permissions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {app.permissions.map((perm, i) => (
                        <Badge key={i} variant="secondary">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* OAuth Scopes */}
              {app.oauthScopes && app.oauthScopes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">OAuth Scopes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {app.oauthScopes.map((scope, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="min-h-[100px] resize-none"
                  />
                  <Button size="sm" onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : auditEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {auditEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm">{event.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.actor} - {formatDateTime(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
