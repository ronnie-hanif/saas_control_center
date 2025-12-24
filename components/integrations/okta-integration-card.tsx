"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getOktaStatus, triggerOktaSync, type OktaConnectionStatus } from "@/app/actions/integrations"
import type { SyncResult } from "@/lib/integrations"
import { Shield, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface SyncRun {
  id: string
  status: string
  startedAt: Date
  finishedAt: Date | null
  recordsProcessed: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  errorMessage: string | null
}

export function OktaIntegrationCard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<OktaConnectionStatus | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getOktaStatus()
      setStatus(data)
    } catch (error) {
      console.error("[OktaIntegrationCard] Failed to fetch status:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSync = async () => {
    setSyncing(true)

    try {
      const result: SyncResult = await triggerOktaSync()

      if (result.success) {
        toast({
          title: "Sync completed",
          description: `Processed ${result.recordsProcessed} records in ${(result.durationMs / 1000).toFixed(1)}s`,
        })
      } else {
        toast({
          title: "Sync failed",
          description: result.errorMessage || "Unknown error",
          variant: "destructive",
        })
      }

      // Refresh status after sync
      await fetchStatus()
    } catch (error) {
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "Failed to run sync",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (connectionStatus: string) => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending Setup
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            {connectionStatus}
          </Badge>
        )
    }
  }

  const getSyncStatusBadge = (syncStatus: string) => {
    switch (syncStatus) {
      case "completed":
        return (
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 dark:text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      case "running":
        return (
          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Running
          </Badge>
        )
      default:
        return <Badge variant="outline">{syncStatus}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const connection = status?.connection
  const syncRuns = (connection?.syncRuns || []) as SyncRun[]
  const lastSync = connection?.lastSyncAt

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Okta</CardTitle>
              <CardDescription className="mt-1">
                Identity provider integration for user and application sync
              </CardDescription>
            </div>
          </div>
          {connection && getStatusBadge(connection.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        {!status?.configured && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Configuration Required</p>
                <p className="text-sm text-muted-foreground">
                  Add <code className="px-1 py-0.5 rounded bg-muted">OKTA_DOMAIN</code> and{" "}
                  <code className="px-1 py-0.5 rounded bg-muted">OKTA_API_TOKEN</code> environment variables to enable
                  Okta sync.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Info */}
        {status?.configured && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Sync</p>
              <p className="mt-1 text-sm font-medium">
                {lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true }) : "Never"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Syncs</p>
              <p className="mt-1 text-sm font-medium">{syncRuns.length}</p>
            </div>
          </div>
        )}

        {/* Run Sync Button */}
        <Button onClick={handleSync} disabled={!status?.configured || syncing} className="w-full">
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Sync
            </>
          )}
        </Button>

        {/* Sync History */}
        {syncRuns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Sync History</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncRuns.slice(0, 5).map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm">{format(new Date(run.startedAt), "MMM d, h:mm a")}</TableCell>
                      <TableCell>{getSyncStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-right text-sm">{run.recordsProcessed.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                        {run.finishedAt
                          ? `${((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000).toFixed(1)}s`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Show last error if any */}
            {syncRuns[0]?.status === "failed" && syncRuns[0]?.errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Last error:</strong> {syncRuns[0].errorMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
