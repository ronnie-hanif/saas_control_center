"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Workflow } from "@/lib/types"
import { Play, Settings, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface WorkflowCardsProps {
  workflows: Workflow[]
  onRun: (workflowId: string) => void
}

export function WorkflowCards({ workflows, onRun }: WorkflowCardsProps) {
  const getStatusIcon = (status: Workflow["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
      case "draft":
        return <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
      case "disabled":
        return <XCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTriggerLabel = (trigger: Workflow["trigger"]) => {
    const labels: Record<Workflow["trigger"], string> = {
      user_created: "User Created",
      user_deactivated: "User Deactivated",
      inactivity: "User Inactivity",
      renewal_window: "Renewal Window",
      unsanctioned_app: "Shadow IT Detected",
      manual: "Manual Trigger",
    }
    return labels[trigger]
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(workflow.status)}
                <Badge variant={workflow.status === "active" ? "default" : "secondary"}>{workflow.status}</Badge>
              </div>
              <Link href={`/workflows/${workflow.id}`}>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardTitle className="mt-2">{workflow.name}</CardTitle>
            <CardDescription>{workflow.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Trigger</p>
                <Badge variant="outline" className="mt-1">
                  {getTriggerLabel(workflow.trigger)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Steps</p>
                <p className="text-sm">{workflow.steps.length} actions configured</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Last Run</p>
                <p className="text-sm">
                  {workflow.lastRun ? new Date(workflow.lastRun).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Button className="w-full" onClick={() => onRun(workflow.id)} disabled={workflow.status === "disabled"}>
              <Play className="mr-2 h-4 w-4" />
              Run Now
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
