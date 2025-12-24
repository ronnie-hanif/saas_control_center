"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { RenewalCalendar } from "@/components/contracts/renewal-calendar"
import { RenewalTimeline } from "@/components/contracts/renewal-timeline"
import { ContractDetailDrawer } from "@/components/contracts/contract-detail-drawer"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { getContracts } from "@/lib/data"
import type { Contract } from "@/lib/types"
import { FileText, DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getContracts()
        setContracts(data)
      } catch (err) {
        setError("Failed to load contracts")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const today = new Date()
  const totalValue = contracts.reduce((sum, c) => sum + c.contractValue, 0)
  const renewalsIn30Days = contracts.filter((c) => {
    const days = Math.ceil((new Date(c.renewalDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 && days <= 30
  }).length
  const atRiskCount = contracts.filter((c) => c.renewalHealth === "at-risk").length
  const healthyCount = contracts.filter((c) => c.renewalHealth === "healthy").length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      notation: "compact",
    }).format(value)
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load contracts" description={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Contracts & Renewals"
        description="Manage vendor contracts and track upcoming renewals for IT and Finance collaboration"
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts found"
          description="Add your first contract to start tracking renewals"
          actionLabel="Add Contract"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="vercel-card">
              <div className="flex flex-row items-center justify-between pb-2">
                <p className="section-title">Total Contract Value</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="helper-text">{contracts.length} active contracts</p>
            </div>
            <div className="vercel-card">
              <div className="flex flex-row items-center justify-between pb-2">
                <p className="section-title">Renewals in 30 Days</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{renewalsIn30Days}</p>
              <p className="helper-text">Require immediate attention</p>
            </div>
            <div className="vercel-card">
              <div className="flex flex-row items-center justify-between pb-2">
                <p className="section-title">At Risk</p>
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{atRiskCount}</p>
              <p className="helper-text">Contracts need action</p>
            </div>
            <div className="vercel-card">
              <div className="flex flex-row items-center justify-between pb-2">
                <p className="section-title">Healthy</p>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{healthyCount}</p>
              <p className="helper-text">On track for renewal</p>
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">Contract List</TabsTrigger>
              <TabsTrigger value="timeline">Renewal Timeline</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {/* Contract List */}
              <div className="vercel-card p-0">
                <div className="p-6">
                  <ContractsTable contracts={contracts} onSelectContract={setSelectedContract} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              {/* Renewal Timeline */}
              <RenewalTimeline contracts={contracts} onSelectContract={setSelectedContract} />
            </TabsContent>

            <TabsContent value="calendar">
              {/* Calendar View */}
              <RenewalCalendar contracts={contracts} />
            </TabsContent>
          </Tabs>

          <ContractDetailDrawer
            contract={selectedContract}
            open={!!selectedContract}
            onClose={() => setSelectedContract(null)}
          />
        </>
      )}
    </div>
  )
}
