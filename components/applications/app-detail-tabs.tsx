"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { RiskBadge } from "@/components/risk-badge"
import { StatusBadge } from "@/components/status-badge"
import { getAppUsers, getContractByAppId, getAuditEvents, getWorkflowRuns } from "@/lib/data"
import type { App, UserAppAccess, Contract, AuditEvent, WorkflowRun } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Shield, Workflow, Clock, FileText, KeyRound } from "lucide-react"

interface AppDetailTabsProps {
  app: App
}

export function AppDetailTabs({ app }: AppDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [appUsers, setAppUsers] = useState<UserAppAccess[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState(app.notes)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [usersData, contractData, eventsData, workflowsData] = await Promise.all([
        getAppUsers(app.id),
        getContractByAppId(app.id),
        getAuditEvents("app", app.id),
        getWorkflowRuns(),
      ])
      setAppUsers(usersData)
      setContract(contractData || null)
      setAuditEvents(eventsData)
      setWorkflows(workflowsData.filter((w) => w.workflowName.toLowerCase().includes(app.name.toLowerCase())))
      setLoading(false)
    }
    fetchData()
  }, [app.id, app.name])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })

  const handleReclaimSeats = () => {
    const inactiveCount = appUsers.filter((u) => u.status === "inactive").length
    toast({
      title: "Seat reclamation initiated",
      description: `Processing ${inactiveCount} inactive seats for ${app.name}`,
    })
  }

  const handleSaveNotes = () => {
    toast({ title: "Notes saved", description: "Application notes have been updated" })
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users & Access</TabsTrigger>
        <TabsTrigger value="spend">Spend & Licenses</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="workflows">Workflows</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vendor Info */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium">{app.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{app.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium">{app.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{app.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={app.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Level</span>
                <RiskBadge risk={app.riskLevel} />
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Spend</span>
                <span className="font-medium">{formatCurrency(app.monthlySpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Licenses</span>
                <span className="font-medium">
                  {app.licensesAssigned} / {app.licensesPurchased}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Utilization</span>
                <span className={`font-medium ${app.utilizationPercent < 70 ? "text-amber-500" : ""}`}>
                  {app.utilizationPercent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSO Connected</span>
                <span className="font-medium">{app.ssoConnected ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Activity</span>
                <span className="font-medium">{formatDate(app.lastActivity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renewal Date</span>
                <span className="font-medium">{formatDate(app.renewalDate)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags and Integrations */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {app.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {app.tags.length === 0 && <span className="text-sm text-muted-foreground">No tags assigned</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this application..."
                className="min-h-[80px] bg-transparent"
              />
              <Button size="sm" onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded</p>
            ) : (
              <div className="space-y-4">
                {auditEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{event.performedBy}</span> {event.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.performedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Assigned Users</CardTitle>
              <CardDescription>{appUsers.length} users have access to this application</CardDescription>
            </div>
            <Button variant="outline" onClick={handleReclaimSeats} className="bg-transparent">
              <KeyRound className="mr-2 h-4 w-4" />
              Reclaim Inactive Seats
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : appUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users assigned</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>License Type</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appUsers.map((access) => (
                    <TableRow key={`${access.userId}-${access.appId}`} className="border-border">
                      <TableCell className="font-medium">{access.appName || access.userId}</TableCell>
                      <TableCell className="capitalize">{access.accessLevel}</TableCell>
                      <TableCell className="capitalize">{access.licenseType}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(access.lastLogin)}</TableCell>
                      <TableCell>
                        <StatusBadge status={access.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="spend" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(app.monthlySpend)}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(app.monthlySpend * 12)} annually</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cost per License</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(app.monthlySpend / app.licensesPurchased)}</div>
              <p className="text-xs text-muted-foreground">per month</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unused Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{app.licensesPurchased - app.licensesAssigned}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(
                  ((app.licensesPurchased - app.licensesAssigned) * app.monthlySpend) / app.licensesPurchased,
                )}{" "}
                wasted/mo
              </p>
            </CardContent>
          </Card>
        </div>

        {contract && (
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Value</span>
                  <span className="font-medium">{formatCurrency(contract.contractValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-medium capitalize">{contract.billingCadence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term Start</span>
                  <span className="font-medium">{formatDate(contract.termStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term End</span>
                  <span className="font-medium">{formatDate(contract.termEnd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-Renew</span>
                  <span className="font-medium">{contract.autoRenew ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={contract.status} />
                </div>
              </div>
              {contract.documents.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {contract.documents.map((doc, i) => (
                      <Button key={i} variant="outline" size="sm" className="bg-transparent">
                        <FileText className="mr-2 h-4 w-4" />
                        {doc.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Security Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Level</span>
                <RiskBadge risk={app.riskLevel} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSO Enabled</span>
                <span className="font-medium">{app.ssoConnected ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin Count</span>
                <span className="font-medium">{app.adminCount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {app.permissions.map((perm, i) => (
                  <Badge key={i} variant="outline">
                    {perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">OAuth Scopes</CardTitle>
            <CardDescription>Permissions granted to this application</CardDescription>
          </CardHeader>
          <CardContent>
            {app.oauthScopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No OAuth scopes configured</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {app.oauthScopes.map((scope, i) => (
                  <Badge key={i} variant="secondary">
                    {scope}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">Security Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : auditEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events recorded</p>
            ) : (
              <div className="space-y-3">
                {auditEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{event.action}</span>
                    <span className="text-muted-foreground">{formatDateTime(event.performedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="workflows" className="space-y-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Related Workflows</CardTitle>
              <CardDescription>Automation workflows associated with this application</CardDescription>
            </div>
            <Button>
              <Workflow className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : workflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workflows configured for this application</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((run) => (
                    <TableRow key={run.id} className="border-border">
                      <TableCell className="font-medium">{run.workflowName}</TableCell>
                      <TableCell>
                        <StatusBadge status={run.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(run.startedAt)}</TableCell>
                      <TableCell>
                        {run.currentStep}/{run.totalSteps} steps
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
