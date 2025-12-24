"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Lightbulb,
  MoreHorizontal,
  AlertCircle,
  Users,
  Copy,
  TrendingDown,
  ExternalLink,
  Download,
  ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type OpportunityType = "unused-licenses" | "overlapping-tools" | "underutilized" | "pricing-optimization"

interface OptimizationOpportunity {
  id: string
  appId: string
  appName: string
  type: OpportunityType
  description: string
  impact: "high" | "medium" | "low"
  estimatedSavings: number
  unusedLicenses?: number
  currentUtilization?: number
  overlappingWith?: string[]
  recommendation: string
}

interface OptimizationOpportunitiesProps {
  opportunities: OptimizationOpportunity[]
}

export function OptimizationOpportunities({ opportunities }: OptimizationOpportunitiesProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"savings" | "impact">("savings")
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    if (sortBy === "savings") {
      return b.estimatedSavings - a.estimatedSavings
    }
    const impactOrder = { high: 3, medium: 2, low: 1 }
    return impactOrder[b.impact] - impactOrder[a.impact]
  })

  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.estimatedSavings, 0)
  const selectedSavings = opportunities
    .filter((opp) => selectedIds.includes(opp.id))
    .reduce((sum, opp) => sum + opp.estimatedSavings, 0)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === opportunities.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(opportunities.map((opp) => opp.id))
    }
  }

  const getTypeIcon = (type: OpportunityType) => {
    switch (type) {
      case "unused-licenses":
        return <Users className="h-4 w-4 text-amber-600" />
      case "overlapping-tools":
        return <Copy className="h-4 w-4 text-blue-600" />
      case "underutilized":
        return <TrendingDown className="h-4 w-4 text-orange-600" />
      case "pricing-optimization":
        return <AlertCircle className="h-4 w-4 text-purple-600" />
    }
  }

  const getTypeLabel = (type: OpportunityType) => {
    switch (type) {
      case "unused-licenses":
        return "Unused Licenses"
      case "overlapping-tools":
        return "Overlapping Tools"
      case "underutilized":
        return "Underutilized"
      case "pricing-optimization":
        return "Pricing"
    }
  }

  const getImpactBadge = (impact: "high" | "medium" | "low") => {
    const styles = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-green-100 text-green-700 border-green-200",
    }
    return (
      <Badge variant="outline" className={styles[impact]}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)}
      </Badge>
    )
  }

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Optimization opportunities report is being generated.",
    })
  }

  const handleCreateWorkflow = (appName: string) => {
    toast({
      title: "Workflow created",
      description: `Seat reclamation workflow created for ${appName}.`,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>Actionable recommendations to reduce SaaS spend</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Total Potential Savings</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPotentialSavings)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Opportunities Found</p>
              <p className="text-xl font-bold">{opportunities.length}</p>
            </div>
            {selectedIds.length > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground">Selected Savings</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedSavings)}</p>
                </div>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === "savings" ? "impact" : "savings")}>
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            Sort by {sortBy === "savings" ? "Impact" : "Savings"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.length === opportunities.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead className="text-right">Est. Savings</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOpportunities.map((opportunity) => (
                <TableRow key={opportunity.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(opportunity.id)}
                      onCheckedChange={() => toggleSelect(opportunity.id)}
                      aria-label={`Select ${opportunity.appName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link href={`/applications/${opportunity.appId}`} className="font-medium hover:underline">
                      {opportunity.appName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(opportunity.type)}
                            <span className="text-sm">{getTypeLabel(opportunity.type)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{opportunity.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm text-muted-foreground">
                      {opportunity.unusedLicenses && <span>{opportunity.unusedLicenses} unused licenses</span>}
                      {opportunity.currentUtilization !== undefined && (
                        <span>{opportunity.currentUtilization}% utilization</span>
                      )}
                      {opportunity.overlappingWith && (
                        <span>Overlaps with {opportunity.overlappingWith.join(", ")}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getImpactBadge(opportunity.impact)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600 tabular-nums">
                      {formatCurrency(opportunity.estimatedSavings)}
                    </span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/applications/${opportunity.appId}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Application
                          </Link>
                        </DropdownMenuItem>
                        {opportunity.type === "unused-licenses" && (
                          <DropdownMenuItem onClick={() => handleCreateWorkflow(opportunity.appName)}>
                            <Users className="mr-2 h-4 w-4" />
                            Create Reclamation Workflow
                          </DropdownMenuItem>
                        )}
                        {opportunity.type === "overlapping-tools" && (
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Compare Tools
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
