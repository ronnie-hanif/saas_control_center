"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, KeyRound, ShieldCheck, AlertTriangle, ChevronRight } from "lucide-react"
import type { App, AccessReviewCampaign, User } from "@/lib/types"

interface ActionQueueProps {
  apps: App[]
  campaigns: AccessReviewCampaign[]
  users: User[]
}

export function ActionQueue({ apps, campaigns, users }: ActionQueueProps) {
  const now = new Date()
  const in30Days = new Date()
  in30Days.setDate(now.getDate() + 30)

  // Renewals due soon
  const upcomingRenewals = apps
    .filter((app) => new Date(app.renewalDate) <= in30Days)
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
    .slice(0, 3)

  // Unused seats to reclaim
  const appsWithUnusedSeats = apps
    .filter((app) => app.utilizationPercent < 70)
    .sort((a, b) => a.utilizationPercent - b.utilizationPercent)
    .slice(0, 3)

  // Access review campaigns due
  const activeCampaigns = campaigns.filter((c) => c.status === "active").slice(0, 2)

  // Shadow IT (unsanctioned apps)
  const shadowIT = apps.filter((app) => app.status === "unsanctioned").slice(0, 3)

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <Card className="bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Action Queue</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          {/* Renewals */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Renewals Due Soon</span>
              <Badge variant="secondary" className="ml-auto">
                {upcomingRenewals.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {upcomingRenewals.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(app.renewalDate)} • ${(app.annualSpend / 1000).toFixed(0)}k/yr
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Unused Seats */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Unused Seats to Reclaim</span>
              <Badge variant="secondary" className="ml-auto">
                {appsWithUnusedSeats.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {appsWithUnusedSeats.map((app) => (
                <Link
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.utilizationPercent}% utilized • {app.licensesPurchased - app.licensesAssigned} unused
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Access Reviews */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Access Review Campaigns</span>
              <Badge variant="secondary" className="ml-auto">
                {activeCampaigns.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {activeCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/access-reviews/${campaign.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.completionPercent}% complete • Due {formatDate(campaign.dueDate)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Shadow IT */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Shadow IT Detected</span>
              <Badge variant="secondary" className="ml-auto">
                {shadowIT.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {shadowIT.length > 0 ? (
                shadowIT.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.licensesAssigned} users • Unsanctioned</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">No shadow IT detected</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
