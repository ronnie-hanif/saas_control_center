"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { User, App, AuditEvent } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"
import { RiskBadge } from "@/components/risk-badge"
import { useToast } from "@/hooks/use-toast"

interface UserDetailDrawerProps {
  user: User | null
  apps: App[]
  auditEvents: AuditEvent[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailDrawer({ user, apps, auditEvents, open, onOpenChange }: UserDetailDrawerProps) {
  const { toast } = useToast()
  const [offboardingChecklist, setOffboardingChecklist] = useState({
    revokeEmail: false,
    revokeApps: false,
    transferFiles: false,
    disableSSO: false,
    notifyManager: false,
    archiveAccount: false,
  })
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

  if (!user) return null

  const userApps = apps.slice(0, user.appsUsed)
  const userEvents = auditEvents.filter((e) => e.userId === user.id).slice(0, 10)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleRunOffboarding = () => {
    const completedSteps = Object.values(offboardingChecklist).filter(Boolean).length
    toast({
      title: "Offboarding simulation started",
      description: `Running ${completedSteps} offboarding steps for ${user.name}`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={drawerRef}
        className="drawer-width-lg custom-scrollbar"
        aria-label={`User details for ${user.name}`}
        aria-describedby="user-drawer-description"
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">{user.name}</SheetTitle>
          <SheetDescription id="user-drawer-description" className="helper-text">
            {user.email}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <StatusBadge status={user.status} />
          <span className="text-sm text-muted-foreground">{user.department}</span>
          {user.manager && <span className="text-sm text-muted-foreground">Reports to: {user.manager}</span>}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="vercel-card">
            <div className="text-xl font-semibold">{user.appsUsed}</div>
            <p className="text-2xs text-muted-foreground">Apps Used</p>
          </div>
          <div className="vercel-card">
            <div className="text-xl font-semibold">{formatCurrency(user.totalAppSpend)}</div>
            <p className="text-2xs text-muted-foreground">App Spend</p>
          </div>
          <div className="vercel-card">
            <div className="text-xl font-semibold">{user.highRiskAccessCount}</div>
            <p className="text-2xs text-muted-foreground">High Risk</p>
          </div>
        </div>

        <Tabs defaultValue="apps" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apps">Apps</TabsTrigger>
            <TabsTrigger value="access">Access Changes</TabsTrigger>
            <TabsTrigger value="offboarding">Offboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {userApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-sm text-muted-foreground">{app.category}</p>
                    </div>
                    <div className="text-right">
                      <RiskBadge risk={app.risk} />
                      <p className="mt-1 text-xs text-muted-foreground">Last login: {formatDate(app.lastActivity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {userEvents.length > 0 ? (
                  userEvents.map((event) => (
                    <div key={event.id} className="flex gap-3">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${
                          event.action.includes("grant") || event.action.includes("create")
                            ? "bg-green-500"
                            : event.action.includes("revoke") || event.action.includes("remove")
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm">{event.details}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No access changes recorded</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="offboarding" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offboarding Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revokeEmail"
                    checked={offboardingChecklist.revokeEmail}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        revokeEmail: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="revokeEmail" className="text-sm">
                    Revoke email access
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="revokeApps"
                    checked={offboardingChecklist.revokeApps}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        revokeApps: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="revokeApps" className="text-sm">
                    Revoke all app access ({user.appsUsed} apps)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transferFiles"
                    checked={offboardingChecklist.transferFiles}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        transferFiles: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="transferFiles" className="text-sm">
                    Transfer files to manager
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disableSSO"
                    checked={offboardingChecklist.disableSSO}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        disableSSO: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="disableSSO" className="text-sm">
                    Disable SSO account
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifyManager"
                    checked={offboardingChecklist.notifyManager}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        notifyManager: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="notifyManager" className="text-sm">
                    Notify manager
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="archiveAccount"
                    checked={offboardingChecklist.archiveAccount}
                    onCheckedChange={(checked) =>
                      setOffboardingChecklist((prev) => ({
                        ...prev,
                        archiveAccount: !!checked,
                      }))
                    }
                  />
                  <label htmlFor="archiveAccount" className="text-sm">
                    Archive user account
                  </label>
                </div>
                <Separator />
                <Button className="w-full" variant="destructive" onClick={handleRunOffboarding}>
                  Run Offboarding Automation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
