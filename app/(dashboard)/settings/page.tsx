"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Department {
  id: string
  name: string
  costCenter: string
  budget: number
  manager: string
}

const initialDepartments: Department[] = [
  { id: "1", name: "Engineering", costCenter: "CC-001", budget: 500000, manager: "John Smith" },
  { id: "2", name: "Sales", costCenter: "CC-002", budget: 350000, manager: "Jane Doe" },
  { id: "3", name: "Marketing", costCenter: "CC-003", budget: 250000, manager: "Bob Johnson" },
  { id: "4", name: "HR", costCenter: "CC-004", budget: 150000, manager: "Sarah Wilson" },
  { id: "5", name: "Finance", costCenter: "CC-005", budget: 200000, manager: "Mike Brown" },
  { id: "6", name: "Operations", costCenter: "CC-006", budget: 180000, manager: "Emily Davis" },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState("")
  const [newCostCenter, setNewCostCenter] = useState("")
  const [newBudget, setNewBudget] = useState("")
  const [newManager, setNewManager] = useState("")

  // Risk scoring weights
  const [riskWeights, setRiskWeights] = useState({
    dataAccess: 40,
    userPrivileges: 30,
    complianceGap: 20,
    lastAudit: 10,
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    renewalReminders: true,
    unusedLicenseAlerts: true,
    shadowItDetection: true,
    accessReviewDue: true,
    weeklyDigest: false,
    slackNotifications: true,
    emailNotifications: true,
  })

  const handleSaveDepartment = () => {
    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                name: newDeptName || d.name,
                costCenter: newCostCenter || d.costCenter,
                budget: Number(newBudget) || d.budget,
                manager: newManager || d.manager,
              }
            : d,
        ),
      )
      toast({ title: "Department updated", description: `${newDeptName} has been updated` })
    } else {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: newDeptName,
        costCenter: newCostCenter,
        budget: Number(newBudget),
        manager: newManager,
      }
      setDepartments((prev) => [...prev, newDept])
      toast({ title: "Department created", description: `${newDeptName} has been added` })
    }
    resetForm()
  }

  const handleDeleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id))
    toast({ title: "Department deleted", description: "The department has been removed" })
  }

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept)
    setNewDeptName(dept.name)
    setNewCostCenter(dept.costCenter)
    setNewBudget(dept.budget.toString())
    setNewManager(dept.manager)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingDept(null)
    setNewDeptName("")
    setNewCostCenter("")
    setNewBudget("")
    setNewManager("")
    setDialogOpen(false)
  }

  const handleSaveRiskWeights = () => {
    toast({ title: "Risk weights saved", description: "Risk scoring rules have been updated" })
  }

  const handleSaveNotifications = () => {
    toast({ title: "Notifications saved", description: "Your notification preferences have been updated" })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="page-container space-y-6">
      <PageHeader title="Settings" description="Configure your SaaS Control Center preferences" />

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="risk">Risk Scoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departments & Cost Centers</CardTitle>
                <CardDescription>Manage organizational structure for spend allocation</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm()
                      setDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDept ? "Edit Department" : "Add Department"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Department Name</Label>
                      <Input
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="Engineering"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost Center</Label>
                      <Input
                        value={newCostCenter}
                        onChange={(e) => setNewCostCenter(e.target.value)}
                        placeholder="CC-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Budget</Label>
                      <Input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Department Manager</Label>
                      <Input
                        value={newManager}
                        onChange={(e) => setNewManager(e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveDepartment}>{editingDept ? "Save Changes" : "Add Department"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Annual Budget</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dept.costCenter}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(dept.budget)}</TableCell>
                      <TableCell>{dept.manager}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDepartment(dept)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDepartment(dept.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Scoring Rules</CardTitle>
              <CardDescription>Configure weights for risk calculation factors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Data Access Sensitivity</Label>
                    <span className="text-sm font-medium">{riskWeights.dataAccess}%</span>
                  </div>
                  <Slider
                    value={[riskWeights.dataAccess]}
                    onValueChange={([value]) => setRiskWeights((prev) => ({ ...prev, dataAccess: value }))}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">Weight for apps with access to sensitive or PII data</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>User Privileges</Label>
                    <span className="text-sm font-medium">{riskWeights.userPrivileges}%</span>
                  </div>
                  <Slider
                    value={[riskWeights.userPrivileges]}
                    onValueChange={([value]) => setRiskWeights((prev) => ({ ...prev, userPrivileges: value }))}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">Weight for admin and elevated access levels</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Compliance Gap</Label>
                    <span className="text-sm font-medium">{riskWeights.complianceGap}%</span>
                  </div>
                  <Slider
                    value={[riskWeights.complianceGap]}
                    onValueChange={([value]) => setRiskWeights((prev) => ({ ...prev, complianceGap: value }))}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">Weight for apps without required certifications</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Time Since Last Audit</Label>
                    <span className="text-sm font-medium">{riskWeights.lastAudit}%</span>
                  </div>
                  <Slider
                    value={[riskWeights.lastAudit]}
                    onValueChange={([value]) => setRiskWeights((prev) => ({ ...prev, lastAudit: value }))}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">Weight based on recency of security review</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Total Weight</p>
                  <p className="text-sm text-muted-foreground">All weights should sum to 100%</p>
                </div>
                <Badge
                  variant={Object.values(riskWeights).reduce((a, b) => a + b, 0) === 100 ? "default" : "destructive"}
                >
                  {Object.values(riskWeights).reduce((a, b) => a + b, 0)}%
                </Badge>
              </div>

              <Button onClick={handleSaveRiskWeights}>Save Risk Weights</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Alert Types</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Renewal Reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified before contracts renew</p>
                  </div>
                  <Switch
                    checked={notifications.renewalReminders}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, renewalReminders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Unused License Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert when licenses go unused for 30+ days</p>
                  </div>
                  <Switch
                    checked={notifications.unusedLicenseAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, unusedLicenseAlerts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Shadow IT Detection</p>
                    <p className="text-sm text-muted-foreground">Alert when unsanctioned apps are discovered</p>
                  </div>
                  <Switch
                    checked={notifications.shadowItDetection}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, shadowItDetection: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Access Review Due</p>
                    <p className="text-sm text-muted-foreground">Reminder when access reviews need completion</p>
                  </div>
                  <Switch
                    checked={notifications.accessReviewDue}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, accessReviewDue: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Summary of key metrics every Monday</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Delivery Channels</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Slack Notifications</p>
                    <p className="text-sm text-muted-foreground">Send alerts to connected Slack workspace</p>
                  </div>
                  <Switch
                    checked={notifications.slackNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, slackNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send alerts via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
