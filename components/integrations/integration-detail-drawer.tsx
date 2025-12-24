"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IntegrationHealthBadge } from "./integration-health-badge"
import type { Integration, IntegrationSyncEvent } from "@/lib/types"
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Database, Shield, Play, History } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface IntegrationDetailDrawerProps {
  integration: Integration | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTriggerSync: (integrationId: string) => void
}

export function IntegrationDetailDrawer({
  integration,
  open,
  onOpenChange,
  onTriggerSync,
}: IntegrationDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!integration) return null

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    try {
      return format(new Date(date), "MMM d, yyyy h:mm a")
    } catch {
      return "N/A"
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getSyncStatusIcon = (status: IntegrationSyncEvent["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
    }
  }

  const getSyncStatusBadge = (status: IntegrationSyncEvent["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Success</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>
      case "partial":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>
    }
  }

  const successRate =
    integration.syncHistory.length > 0
      ? Math.round(
          (integration.syncHistory.filter((s) => s.status === "success").length / integration.syncHistory.length) * 100,
        )
      : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{integration.name}</SheetTitle>
            <IntegrationHealthBadge health={integration.health} />
          </div>
          <SheetDescription>{integration.description}</SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Clock className="h-4 w-4" />
                    Last Sync
                  </div>
                  <p className="mt-1 font-semibold">
                    {integration.lastSync
                      ? formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })
                      : "Never"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Database className="h-4 w-4" />
                    Records
                  </div>
                  <p className="mt-1 font-semibold">{integration.recordsIngested.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Success Rate
                  </div>
                  <p className="mt-1 font-semibold">{successRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <RefreshCw className="h-4 w-4" />
                    Next Sync
                  </div>
                  <p className="mt-1 font-semibold">
                    {integration.nextSync
                      ? formatDistanceToNow(new Date(integration.nextSync), { addSuffix: true })
                      : "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Error State */}
            {integration.errorMessage && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Error Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600">{integration.errorMessage}</p>
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Remediation</p>
                    <p className="text-sm">
                      {integration.health === "unhealthy"
                        ? "Please reconnect the integration to refresh authentication credentials."
                        : "Try triggering a manual sync. If the issue persists, check API rate limits."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Data Types Ingested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {integration.dataTypes.map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permission Scopes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {integration.permissionScopes.map((scope) => (
                    <div key={scope} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{scope}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trigger Sync */}
            <Button
              className="w-full"
              onClick={() => onTriggerSync(integration.id)}
              disabled={integration.status === "disconnected"}
            >
              <Play className="mr-2 h-4 w-4" />
              Trigger Manual Sync
            </Button>
          </TabsContent>

          {/* Sync History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing last {integration.syncHistory.length} sync events</p>
              <Badge variant="outline">{successRate}% success rate</Badge>
            </div>

            {integration.syncHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sync history available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {integration.syncHistory.map((event, index) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSyncStatusIcon(event.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              {getSyncStatusBadge(event.status)}
                              <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{event.recordsProcessed.toLocaleString()} records</span>
                              <span>{formatDuration(event.duration)}</span>
                            </div>
                            {event.errorMessage && <p className="mt-2 text-xs text-red-500">{event.errorMessage}</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Integration Settings</CardTitle>
                <CardDescription>Configuration for {integration.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(integration.config).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                    <Input value={String(value)} readOnly className="bg-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  Disconnect Integration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
