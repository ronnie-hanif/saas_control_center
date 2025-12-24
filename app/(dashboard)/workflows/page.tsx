"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { WorkflowCards } from "@/components/workflows/workflow-cards"
import { WorkflowRunHistory } from "@/components/workflows/workflow-run-history"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getWorkflows, getWorkflowRuns } from "@/lib/data"
import type { Workflow, WorkflowRun } from "@/lib/types"
import { WorkflowIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function WorkflowsPage() {
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [workflowsData, runsData] = await Promise.all([getWorkflows(), getWorkflowRuns()])
        setWorkflows(workflowsData)
        setRuns(runsData)
      } catch (err) {
        setError("Failed to load workflows")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRunWorkflow = (workflowId: string) => {
    const workflow = workflows.find((w) => w.id === workflowId)
    if (!workflow) return

    const newRun: WorkflowRun = {
      id: `run-${Date.now()}`,
      workflowId,
      workflowName: workflow.name,
      status: "running",
      triggeredBy: "Manual",
      startedAt: new Date(),
      logs: ["Starting workflow...", "Executing steps...", "Workflow completed successfully"],
    }

    setRuns((prev) => [newRun, ...prev])

    setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === newRun.id ? { ...r, status: "success" as const, duration: 3, completedAt: new Date() } : r,
        ),
      )
      toast({
        title: "Workflow completed",
        description: `${workflow.name} completed successfully`,
      })
    }, 3000)

    toast({
      title: "Workflow started",
      description: `Running ${workflow.name}...`,
    })
  }

  const handleViewLogs = (runId: string) => {
    const run = runs.find((r) => r.id === runId)
    if (run) {
      setSelectedRun(run)
      setLogsOpen(true)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Failed to load workflows" description={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader title="Workflows" description="Automate IT operations with no-code workflows" />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows configured"
          description="Create your first workflow to automate IT operations"
          actionLabel="Create Workflow"
          onAction={() => {}}
        />
      ) : (
        <Tabs defaultValue="workflows" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="history">Run History</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <WorkflowCards workflows={workflows} onRun={handleRunWorkflow} />
          </TabsContent>

          <TabsContent value="history">
            {runs.length === 0 ? (
              <EmptyState
                icon={WorkflowIcon}
                title="No workflow runs yet"
                description="Run a workflow to see execution history"
              />
            ) : (
              <WorkflowRunHistory runs={runs} onViewLogs={handleViewLogs} />
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Logs - {selectedRun?.workflowName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 font-mono text-sm">
              {selectedRun?.logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground">[{i + 1}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
