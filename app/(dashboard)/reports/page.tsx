"use client"

import { PageHeader } from "@/components/page-header"
import { ReportTiles } from "@/components/reports/report-tiles"
import { FileText, Shield, TrendingUp, Clock } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="page-container space-y-6">
      <PageHeader title="Reports" description="Pre-built reports for audit, compliance, and executive review" />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="vercel-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">5</p>
              <p className="helper-text">Available Reports</p>
            </div>
          </div>
        </div>
        <div className="vercel-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 dark:bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">$24.5K</p>
              <p className="helper-text">Identified Savings</p>
            </div>
          </div>
        </div>
        <div className="vercel-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 dark:bg-red-500/20">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">31</p>
              <p className="helper-text">Security Findings</p>
            </div>
          </div>
        </div>
        <div className="vercel-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 dark:bg-amber-500/20">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold">Daily</p>
              <p className="helper-text">Auto-refresh</p>
            </div>
          </div>
        </div>
      </div>

      <ReportTiles />
    </div>
  )
}
