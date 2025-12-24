"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ErrorState } from "@/components/error-state"
import { getWorkflows } from "@/lib/data"
import type { Workflow, WorkflowStep } from "@/lib/types"
import { ArrowLeft, Plus, Trash2, GripVertical, Play, Save } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const workflowsData = await getWorkflows()
        const found = workflowsData.find((w) => w.id === id)
        if (found) {
          setWorkflow(found)
        } else {
          setError("Workflow not found")
        }
      } catch (err) {
        setError("Failed to load workflow")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSave = () => {
    toast({
      title: "Workflow saved",
      description: "Your changes have been saved",
    })
  }

  const handleRun = () => {
    toast({
      title: "Workflow started",
      description: `Running ${workflow?.name}...`,
    })
  }

  const handleAddStep = () => {
    if (!workflow) return
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: "notify",
      config: { channel: "#general", message: "New notification" },
      order: workflow.steps.length,
    }
    setWorkflow({ ...workflow, steps: [...workflow.steps, newStep] })
  }

  const handleRemoveStep = (stepId: string) => {
    if (!workflow) return
    setWorkflow({
      ...workflow,
      steps: workflow.steps.filter((s) => s.id !== stepId),
    })
  }

  const getStepLabel = (type: WorkflowStep["type"]) => {
    const labels: Record<WorkflowStep["type"], string> = {
      create_ticket: "Create Ticket",
      notify: "Send Notification",
      deprovision: "Deprovision Access",
      reclaim_license: "Reclaim License",
      request_approval: "Request Approval",
      wait: "Wait",
    }
    return labels[type]
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="p-6">
        <ErrorState
          title="Error loading workflow"
          description={error || "Workflow not found"}
          onRetry={() => router.back()}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title={workflow.name} description={workflow.description} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRun}>
            <Play className="mr-2 h-4 w-4" />
            Run Now
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={workflow.trigger}
                onValueChange={(value: Workflow["trigger"]) => setWorkflow({ ...workflow, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_deactivated">User Deactivated</SelectItem>
                  <SelectItem value="inactivity">User Inactivity</SelectItem>
                  <SelectItem value="renewal_window">Renewal Window</SelectItem>
                  <SelectItem value="unsanctioned_app">Shadow IT Detected</SelectItem>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {workflow.trigger === "inactivity" && (
              <div className="space-y-2">
                <Label>Inactivity Threshold (days)</Label>
                <Input type="number" defaultValue={30} />
              </div>
            )}

            {workflow.trigger === "renewal_window" && (
              <div className="space-y-2">
                <Label>Days Before Renewal</Label>
                <Input type="number" defaultValue={30} />
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enabled</p>
                <p className="text-sm text-muted-foreground">Workflow will run automatically when triggered</p>
              </div>
              <Switch checked={workflow.status === "active"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workflow Steps</CardTitle>
            <Button size="sm" onClick={handleAddStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <Select
                        value={step.type}
                        onValueChange={(value: WorkflowStep["type"]) => {
                          setWorkflow({
                            ...workflow,
                            steps: workflow.steps.map((s) => (s.id === step.id ? { ...s, type: value } : s)),
                          })
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create_ticket">Create Ticket</SelectItem>
                          <SelectItem value="notify">Send Notification</SelectItem>
                          <SelectItem value="deprovision">Deprovision Access</SelectItem>
                          <SelectItem value="reclaim_license">Reclaim License</SelectItem>
                          <SelectItem value="request_approval">Request Approval</SelectItem>
                          <SelectItem value="wait">Wait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.type === "notify" && "Send a Slack notification"}
                      {step.type === "create_ticket" && "Create a Jira/ServiceNow ticket"}
                      {step.type === "deprovision" && "Remove user access from app"}
                      {step.type === "reclaim_license" && "Reclaim unused license"}
                      {step.type === "request_approval" && "Wait for manager approval"}
                      {step.type === "wait" && "Wait for specified duration"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveStep(step.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
