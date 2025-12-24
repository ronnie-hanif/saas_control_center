"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { RenewalHealthBadge } from "@/components/contracts/renewal-health-badge"
import type { Contract } from "@/lib/types"
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  Bell,
  CreditCard,
  Clock,
  CheckCircle2,
  TrendingUp,
  Download,
  Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ContractDetailDrawerProps {
  contract: Contract | null
  open: boolean
  onClose: () => void
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date() : d
}

export function ContractDetailDrawer({ contract, open, onClose }: ContractDetailDrawerProps) {
  const { toast } = useToast()
  const [renewalTasks, setRenewalTasks] = useState<Record<string, boolean>>({})
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

      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        firstFocusable?.focus()
      }, 100)
    } else {
      document.removeEventListener("keydown", handleKeyDown)
      previousActiveElement.current?.focus()
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!contract) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    const d = toDate(date)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d)
  }

  const getDaysUntil = (date: Date | string) => {
    const d = toDate(date)
    return Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  const daysUntilRenewal = getDaysUntil(contract.renewalDate)
  const renewalProgress = Math.max(0, Math.min(100, ((90 - daysUntilRenewal) / 90) * 100))

  const renewalChecklistItems = [
    {
      id: "review-usage",
      label: "Review usage metrics and utilization",
      description: "Check if current license count matches actual usage",
    },
    {
      id: "gather-feedback",
      label: "Gather user feedback",
      description: "Survey key stakeholders on product satisfaction",
    },
    {
      id: "evaluate-alternatives",
      label: "Evaluate alternatives",
      description: "Research competitive options and pricing",
    },
    { id: "negotiate-terms", label: "Negotiate terms with vendor", description: "Request discount or improved terms" },
    { id: "legal-review", label: "Legal review", description: "Have legal team review contract changes" },
    { id: "budget-approval", label: "Get budget approval", description: "Secure finance sign-off for renewal" },
    { id: "exec-approval", label: "Executive approval", description: "Final sign-off from leadership" },
  ]

  const toggleTask = (taskId: string) => {
    setRenewalTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const completedTasks = Object.values(renewalTasks).filter(Boolean).length

  const handleSetReminder = () => {
    toast({ title: "Reminder set", description: `You'll be notified 30 days before renewal.` })
  }

  const handleDownloadContract = () => {
    toast({ title: "Download started", description: "Contract document downloading..." })
  }

  const handleContactVendor = () => {
    toast({ title: "Email draft created", description: "Opening email to vendor contact..." })
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      finance: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      it: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      legal: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      approver: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    }
    return colors[role] || "bg-muted text-muted-foreground"
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        ref={drawerRef}
        className="drawer-width-xl overflow-y-auto custom-scrollbar"
        aria-label={`Contract details for ${contract.vendor}`}
        aria-describedby="contract-drawer-description"
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">{contract.appName || contract.vendor}</SheetTitle>
              <SheetDescription id="contract-drawer-description" className="helper-text">
                {contract.vendor}
              </SheetDescription>
            </div>
            <RenewalHealthBadge health={contract.renewalHealth} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="vercel-card text-center">
              <DollarSign className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-base font-semibold">{formatCurrency(contract.contractValue)}</p>
              <p className="text-2xs text-muted-foreground">Contract Value</p>
            </div>
            <div className="vercel-card text-center">
              <Calendar className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-base font-semibold">{daysUntilRenewal}d</p>
              <p className="text-2xs text-muted-foreground">Until Renewal</p>
            </div>
            <div className="vercel-card text-center">
              <CheckCircle2 className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-base font-semibold">
                {completedTasks}/{renewalChecklistItems.length}
              </p>
              <p className="text-2xs text-muted-foreground">Tasks Done</p>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spend">Spend</TabsTrigger>
            <TabsTrigger value="stakeholders">Team</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contract Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{contract.terms}</p>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Term Period</p>
                      <p className="font-medium">
                        {formatDate(contract.termStart)} - {formatDate(contract.termEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">{contract.paymentTerms}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Billing Cadence</p>
                      <p className="font-medium capitalize">{contract.billingCadence}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Cancellation Notice</p>
                      <p className="font-medium">{contract.cancellationNotice} days</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-Renew</p>
                    <Badge variant={contract.autoRenew ? "default" : "outline"}>
                      {contract.autoRenew ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Renewal Date</p>
                    <p className="font-semibold">{formatDate(contract.renewalDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleDownloadContract}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSetReminder}>
                <Bell className="mr-2 h-4 w-4" />
                Set Reminder
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={handleContactVendor}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Vendor
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="spend" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Spend Trend (12 months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={contract.spendHistory}>
                      <defs>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Spend"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        fill="url(#spendGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(contract.contractValue)}</p>
                    <p className="text-sm text-muted-foreground">Annual Contract Value</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(contract.contractValue / 12)}</p>
                    <p className="text-sm text-muted-foreground">Monthly Average</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {contract.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contract.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contract Stakeholders
                </CardTitle>
                <CardDescription>Team members responsible for this contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {stakeholder.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{stakeholder.name}</p>
                        <p className="text-sm text-muted-foreground">{stakeholder.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getRoleColor(stakeholder.role)}>
                      {stakeholder.role.charAt(0).toUpperCase() + stakeholder.role.slice(1)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button variant="outline" className="w-full bg-transparent">
              <Users className="mr-2 h-4 w-4" />
              Add Stakeholder
            </Button>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Renewal Progress</CardTitle>
                <CardDescription>
                  {completedTasks} of {renewalChecklistItems.length} tasks completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(completedTasks / renewalChecklistItems.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Renewal Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renewalChecklistItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={item.id}
                      checked={renewalTasks[item.id] || false}
                      onCheckedChange={() => toggleTask(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className={`text-sm font-medium cursor-pointer ${renewalTasks[item.id] ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea placeholder="Add notes about this renewal..." className="min-h-[80px]" />
                <Button size="sm">Save Note</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
