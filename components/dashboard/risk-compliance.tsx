"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, ChevronRight, ExternalLink } from "lucide-react"
import { RiskBadge } from "@/components/risk-badge"
import type { App, AccessReviewCampaign } from "@/lib/types"

interface RiskComplianceProps {
  apps: App[]
  campaigns: AccessReviewCampaign[]
}

export function RiskCompliance({ apps, campaigns }: RiskComplianceProps) {
  const highRiskApps = apps.filter((app) => app.riskLevel === "high" || app.riskLevel === "critical")
  const unsanctionedApps = apps.filter((app) => app.status === "unsanctioned")

  const now = new Date()
  const overdueCampaigns = campaigns.filter((c) => {
    const dueDate = new Date(c.dueDate)
    return c.status === "active" && dueDate < now
  })
  const activeCampaigns = campaigns.filter((c) => c.status === "active")

  const riskScore = Math.max(
    0,
    100 - highRiskApps.length * 5 - unsanctionedApps.length * 3 - overdueCampaigns.length * 10,
  )

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Risk & Compliance</CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/access-reviews">Manage Reviews</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Risk Score */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Security Posture</span>
            <span
              className={`text-lg font-bold ${
                riskScore >= 80 ? "text-emerald-500" : riskScore >= 60 ? "text-amber-500" : "text-destructive"
              }`}
            >
              {riskScore}%
            </span>
          </div>
          <Progress
            value={riskScore}
            className={`h-2 ${
              riskScore >= 80
                ? "[&>div]:bg-emerald-500"
                : riskScore >= 60
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-destructive"
            }`}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Based on app risk levels, sanctioning status, and compliance reviews
          </p>
        </div>

        {/* High Risk Apps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">High Risk Applications</span>
            </div>
            <Badge variant={highRiskApps.length > 0 ? "destructive" : "secondary"}>{highRiskApps.length}</Badge>
          </div>
          {highRiskApps.length > 0 ? (
            <div className="space-y-1">
              {highRiskApps.slice(0, 3).map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{app.name}</span>
                    <RiskBadge level={app.riskLevel} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
              {highRiskApps.length > 3 && (
                <Link
                  href="/applications?risk=high,critical"
                  className="block text-xs text-muted-foreground hover:text-foreground text-center py-1"
                >
                  +{highRiskApps.length - 3} more high risk apps
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-emerald-600">No high risk applications</span>
            </div>
          )}
        </div>

        {/* Access Reviews */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Access Review Status</span>
            </div>
            {overdueCampaigns.length > 0 && <Badge variant="destructive">{overdueCampaigns.length} Overdue</Badge>}
          </div>
          {activeCampaigns.length > 0 ? (
            <div className="space-y-2">
              {activeCampaigns.slice(0, 2).map((campaign) => {
                const isOverdue = new Date(campaign.dueDate) < now
                return (
                  <Link
                    key={campaign.id}
                    href={`/access-reviews/${campaign.id}`}
                    className={`block p-3 rounded-lg border transition-colors group ${
                      isOverdue
                        ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{campaign.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={campaign.completionPercent} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground">{campaign.completionPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>
                        {campaign.tasksCompleted}/{campaign.tasksTotal} reviewed
                      </span>
                      {isOverdue ? (
                        <span className="text-destructive font-medium">Overdue</span>
                      ) : (
                        <span>
                          Due{" "}
                          {new Date(campaign.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">No active access reviews</p>
              <Button variant="link" size="sm" asChild className="mt-1">
                <Link href="/access-reviews">Start a Review Campaign</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Shadow IT Alert */}
        {unsanctionedApps.length > 0 && (
          <Link
            href="/applications?status=unsanctioned"
            className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700">Shadow IT Detected</p>
                <p className="text-xs text-amber-600">{unsanctionedApps.length} unsanctioned apps require review</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-600 group-hover:text-amber-700" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
