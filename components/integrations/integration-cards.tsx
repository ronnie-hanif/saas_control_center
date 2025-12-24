"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { IntegrationHealthBadge } from "./integration-health-badge"
import type { Integration } from "@/lib/types"
import {
  Shield,
  Cloud,
  Mail,
  MessageSquare,
  Clipboard,
  DollarSign,
  Settings,
  Globe,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Database,
  Receipt,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface IntegrationCardsProps {
  integrations: Integration[]
  onConnect: (integrationId: string) => void
  onDisconnect: (integrationId: string) => void
  onViewDetails: (integration: Integration) => void
}

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  cloud: Cloud,
  mail: Mail,
  "message-square": MessageSquare,
  clipboard: Clipboard,
  "dollar-sign": DollarSign,
  settings: Settings,
  globe: Globe,
  receipt: Receipt,
}

const categoryLabels: Record<Integration["category"], string> = {
  identity: "Identity",
  communication: "Communication",
  ticketing: "Ticketing",
  finance: "Finance",
  other: "Other",
}

const categoryColors: Record<Integration["category"], string> = {
  identity: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  communication: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  ticketing: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  finance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  other: "bg-muted text-muted-foreground border-border",
}

export function IntegrationCards({ integrations, onConnect, onDisconnect, onViewDetails }: IntegrationCardsProps) {
  const formatLastSync = (date: string | null) => {
    if (!date) return "Never"
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  const getStatusBorder = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return "border-l-emerald-500"
      case "error":
        return "border-l-red-500"
      case "syncing":
        return "border-l-blue-500"
      default:
        return "border-l-muted"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration) => {
        const Icon = iconMap[integration.icon] || Database
        const isConnected = integration.status === "connected" || integration.status === "syncing"
        const hasError = integration.status === "error"

        return (
          <Card
            key={integration.id}
            className={`border-l-4 ${getStatusBorder(integration.status)} transition-shadow hover:shadow-md`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${categoryColors[integration.category]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant="outline" className={`mt-1 text-xs ${categoryColors[integration.category]}`}>
                      {categoryLabels[integration.category]}
                    </Badge>
                  </div>
                </div>
                <IntegrationHealthBadge health={integration.health} showLabel={false} />
              </div>
              <CardDescription className="mt-2 line-clamp-2">{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && (
                <>
                  {/* Sync Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <RefreshCw className={`h-3 w-3 ${integration.status === "syncing" ? "animate-spin" : ""}`} />
                        Last Sync
                      </span>
                      <span className="font-medium">{formatLastSync(integration.lastSync)}</span>
                    </div>
                    {integration.status === "syncing" && <Progress value={45} className="h-1" />}
                  </div>

                  {/* Data Types */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Ingested</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.dataTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs font-normal">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {integration.recordsIngested.toLocaleString()} records
                    </p>
                  </div>

                  {/* Error Message */}
                  {hasError && integration.errorMessage && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600 dark:text-red-400">{integration.errorMessage}</p>
                    </div>
                  )}

                  {/* Degraded Warning */}
                  {integration.health === "degraded" && integration.errorMessage && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">{integration.errorMessage}</p>
                    </div>
                  )}
                </>
              )}

              {!isConnected && !hasError && (
                <div className="py-4 text-center text-sm text-muted-foreground">Connect to start syncing data</div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {isConnected || hasError ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => onViewDetails(integration)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                    {hasError ? (
                      <Button size="sm" className="flex-1" onClick={() => onConnect(integration.id)}>
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => onDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </>
                ) : (
                  <Button className="w-full" onClick={() => onConnect(integration.id)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
