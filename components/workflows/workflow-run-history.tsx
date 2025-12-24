"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { WorkflowRun } from "@/lib/types"
import { Eye, RefreshCw } from "lucide-react"

interface WorkflowRunHistoryProps {
  runs: WorkflowRun[]
  onViewLogs: (runId: string) => void
}

export function WorkflowRunHistory({ runs, onViewLogs }: WorkflowRunHistoryProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: WorkflowRun["status"]) => {
    const variants: Record<WorkflowRun["status"], "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    }
    const colors: Record<WorkflowRun["status"], string> = {
      success: "bg-green-500",
      failed: "",
      running: "",
      pending: "",
    }
    return (
      <Badge variant={variants[status]} className={status === "success" ? colors[status] : ""}>
        {status === "running" && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
        {status}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow</TableHead>
            <TableHead>Triggered By</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-medium">{run.workflowName}</TableCell>
              <TableCell>{run.triggeredBy}</TableCell>
              <TableCell>{formatDate(run.startedAt)}</TableCell>
              <TableCell>{run.duration ? `${run.duration}s` : "-"}</TableCell>
              <TableCell>{getStatusBadge(run.status)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onViewLogs(run.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
