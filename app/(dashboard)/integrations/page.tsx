"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { IntegrationCards } from "@/components/integrations/integration-cards"
import { IntegrationDetailDrawer } from "@/components/integrations/integration-detail-drawer"
import { IntegrationHealthBadge } from "@/components/integrations/integration-health-badge"
import { OktaIntegrationCard } from "@/components/integrations/okta-integration-card"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { getIntegrations } from "@/lib/data"
import type { Integration } from "@/lib/types"
import { Plug, Shield, MessageSquare, Clipboard, DollarSign, Database } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const categoryIcons: Record<string, React.ElementType> = {
  identity: Shield,
  communication: MessageSquare,
  ticketing: Clipboard,
  finance: DollarSign,
  other: Database,
}

const categoryLabels: Record<string, string> = {
  identity: "Identity",
  communication: "Communication",
  ticketing: "Ticketing",
  finance: "Finance",
  other: "Other",
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getIntegrations()
        setIntegrations(data)
      } catch (err) {
        setError("Failed to load integrations")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Stats
  const stats = useMemo(() => {
    const connected = integrations.filter((i) => i.status === "connected" || i.status === "syncing").length
    const healthy = integrations.filter((i) => i.health === "healthy").length
    const withErrors = integrations.filter((i) => i.status === "error" || i.health === "unhealthy").length
    const totalRecords = integrations.reduce((sum, i) => sum + i.recordsIngested, 0)
    return { connected, healthy, withErrors, totalRecords }
  }, [integrations])

  // Filtered integrations (excluding Okta since it has its own card)
  const filteredIntegrations = useMemo(() => {
    const filtered = integrations.filter((i) => i.name.toLowerCase() !== "okta")
    if (selectedCategory === "all") return filtered
    return filtered.filter((i) => i.category === selectedCategory)
  }, [integrations, selectedCategory])

  // Categories with counts
  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    integrations.forEach((i) => {
      // Exclude Okta from category counts since it has its own section
      if (i.name.toLowerCase() !== "okta") {
        cats.set(i.category, (cats.get(i.category) || 0) + 1)
      }
    })
    return cats
  }, [integrations])

  const handleConnect = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              status: "connected" as const,
              health: "healthy" as const,
              lastSync: new Date().toISOString(),
              nextSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              errorMessage: null,
            }
          : i,
      ),
    )

    toast({
      title: "Integration connected",
      description: `Successfully connected to ${integration.name}. Initial sync starting...`,
    })
  }

  const handleDisconnect = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              status: "disconnected" as const,
              health: "unknown" as const,
              lastSync: null,
              nextSync: null,
            }
          : i,
      ),
    )

    toast({
      title: "Integration disconnected",
      description: `Disconnected from ${integration.name}`,
    })
  }

  const handleViewDetails = (integration: Integration) => {
    setSelectedIntegration(integration)
    setDrawerOpen(true)
  }

  const handleTriggerSync = (integrationId: string) => {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) return

    toast({
      title: "Sync triggered",
      description: `Manual sync started for ${integration.name}`,
    })
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load integrations" description={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect your identity providers, collaboration tools, and business systems to enable automated discovery and governance."
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold">{stats.connected}</p>
                    <p className="text-xs text-muted-foreground">of {integrations.length} integrations</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Plug className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy</p>
                    <p className="text-2xl font-bold">{stats.healthy}</p>
                    <p className="text-xs text-muted-foreground">syncing normally</p>
                  </div>
                  <IntegrationHealthBadge health="healthy" showLabel={false} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold">{stats.withErrors}</p>
                    <p className="text-xs text-muted-foreground">need attention</p>
                  </div>
                  <IntegrationHealthBadge health={stats.withErrors > 0 ? "unhealthy" : "healthy"} showLabel={false} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Records Synced</p>
                    <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">total ingested</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Identity Provider</h2>
            <OktaIntegrationCard />
          </div>

          {/* Other Integrations */}
          {filteredIntegrations.length > 0 && (
            <>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <Badge variant="secondary" className="ml-1">
                      {filteredIntegrations.length}
                    </Badge>
                  </TabsTrigger>
                  {Array.from(categories.entries()).map(([cat, count]) => {
                    const Icon = categoryIcons[cat] || Database
                    return (
                      <TabsTrigger key={cat} value={cat} className="gap-2">
                        <Icon className="h-4 w-4" />
                        {categoryLabels[cat]}
                        <Badge variant="secondary" className="ml-1">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-4">
                  <IntegrationCards
                    integrations={filteredIntegrations}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onViewDetails={handleViewDetails}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}

          {filteredIntegrations.length === 0 && integrations.length === 0 && (
            <EmptyState
              icon={Plug}
              title="No integrations available"
              description="Check back later for available integrations"
            />
          )}

          {/* Detail Drawer */}
          <IntegrationDetailDrawer
            integration={selectedIntegration}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onTriggerSync={handleTriggerSync}
          />
        </>
      )}
    </div>
  )
}
