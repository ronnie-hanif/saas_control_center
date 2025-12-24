// This file maintains the same API as before but calls DB-backed services
// For development without DB, falls back to mock data

import type {
  App,
  User,
  Contract,
  Integration,
  AccessReviewCampaign,
  AccessReviewTask,
  Workflow,
  WorkflowRun,
  AuditEvent,
  UserAppAccess,
  DashboardFilters,
  DashboardMetrics,
  Department,
  RiskScoringRule,
  NotificationPreference,
} from "./types"

import {
  apps as mockApps,
  users as mockUsers,
  contracts as mockContracts,
  integrations,
  accessReviewCampaigns as mockCampaigns,
  accessReviewTasks as mockTasks,
  workflows,
  workflowRuns,
  auditEvents as mockAuditEvents,
  userAppAccess as mockUserAppAccess,
  departmentsList,
  riskScoringRules,
  notificationPreferences,
} from "./mock-data"

// Check if we should use the database - only on server
const USE_DATABASE = typeof window === "undefined" && !!process.env.DATABASE_URL

// Helper to safely convert values to avoid NaN
function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? fallback : num
}

async function getServices() {
  if (!USE_DATABASE) return null
  try {
    const services = await import("./services")
    return services
  } catch {
    return null
  }
}

// Apps
export async function getApps(filters?: Partial<DashboardFilters>): Promise<App[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const dbApps = await services.applicationService.getAll(filters)
        return dbApps.map((app: any) => ({
          ...app,
          annualCost: safeNumber(app.annualCost),
          licensesUsed: safeNumber(app.licensesUsed),
          licensesTotal: safeNumber(app.licensesTotal),
          utilizationPercent: safeNumber(app.utilizationPercent),
          complianceScore: safeNumber(app.complianceScore),
          riskScore: safeNumber(app.riskScore),
        }))
      }
    } catch (error) {
      console.error("Failed to fetch apps from DB:", error)
    }
  }
  // Fallback to mock data
  let result = [...mockApps]
  if (filters?.riskLevel && filters.riskLevel !== "all") {
    result = result.filter((app) => app.riskLevel === filters.riskLevel)
  }
  if (filters?.status && filters.status !== "all") {
    result = result.filter((app) => app.status === filters.status)
  }
  if (filters?.category && filters.category !== "all") {
    result = result.filter((app) => app.category === filters.category)
  }
  if (filters?.department && filters.department !== "all") {
    result = result.filter((app) => app.department === filters.department)
  }
  return result
}

export async function getAppById(id: string): Promise<App | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const app = await services.applicationService.getById(id)
        if (!app) return null
        return {
          id: app.id,
          name: app.name,
          vendor: app.vendor ?? "",
          category: app.category,
          description: app.description ?? "",
          owner: (app as any).owner?.name ?? "Unassigned",
          ownerId: app.ownerUserId ?? "",
          source: app.source?.replace("_", "-") as App["source"],
          department: app.department ?? "",
          monthlySpend: safeNumber(app.monthlyCost),
          annualSpend: safeNumber(app.annualCost),
          licensesPurchased: safeNumber(app.licensesPurchased),
          licensesAssigned: safeNumber(app.licensesAssigned),
          utilizationPercent: safeNumber(app.utilizationPercent),
          riskLevel: app.riskLevel as App["riskLevel"],
          ssoConnected: app.ssoConnected,
          lastActivity: app.lastActivity?.toISOString() ?? "",
          renewalDate: app.renewalDate?.toISOString() ?? "",
          status: app.status?.replace("_", "-") as App["status"],
          tags: app.tags ?? [],
          integrationsConnected: [],
          adminCount: 0,
          oauthScopes: [],
          permissions: [],
          notes: app.notes ?? "",
          createdAt: app.createdAt.toISOString(),
          licensesUsed: safeNumber(app.licensesUsed),
          licensesTotal: safeNumber(app.licensesTotal),
          complianceScore: safeNumber(app.complianceScore),
          riskScore: safeNumber(app.riskScore),
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch app from DB, falling back to mock:", error)
    }
  }
  return mockApps.find((app) => app.id === id) || null
}

export async function getAppUsers(appId: string): Promise<User[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { userAppAccessRepository } = services
        const accessRecords = await userAppAccessRepository.findByApplicationId(appId)
        return accessRecords.map((access) => ({
          id: access.user.id,
          name: access.user.name,
          email: access.user.email,
          department: access.user.department,
          manager: "",
          managerId: "",
          status: "active" as const,
          appsUsed: 0,
          totalAppSpend: 0,
          highRiskAccessCount: 0,
          lastActive: access.lastLogin?.toISOString() ?? "",
          avatar: "",
          title: "",
          startDate: "",
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch app users from DB, falling back to mock:", error)
    }
  }

  // Fallback to mock data
  const usersWithAccess: User[] = []
  const allUsers = await getUsers()
  for (const user of allUsers) {
    const access = await getUserAppAccess(user.id)
    if (access.some((a) => a.appId === appId)) {
      usersWithAccess.push(user)
    }
  }
  return usersWithAccess
}

export async function getAppUserAccess(appId: string): Promise<UserAppAccess[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { userAppAccessRepository } = services
        const accessRecords = await userAppAccessRepository.findByApplicationId(appId)
        return accessRecords.map((access) => ({
          appId: access.applicationId,
          appName: access.application.name,
          accessLevel: access.accessLevel as "admin" | "user" | "viewer",
          lastLogin: access.lastLogin?.toISOString() ?? "",
          licenseType: access.licenseType ?? "Standard",
          monthlySpend: 0,
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch app user access from DB, falling back to mock:", error)
    }
  }

  // No mock implementation for this specific query
  return []
}

export async function updateApp(id: string, updates: Partial<App>): Promise<App | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { applicationService } = services
        const { systemContext } = await import("./audit")
        await applicationService.update(systemContext(), id, {
          name: updates.name,
          vendor: updates.vendor,
          category: updates.category,
          description: updates.description,
          riskLevel: updates.riskLevel as any,
          status: updates.status?.replace("-", "_") as any,
          notes: updates.notes,
        })
        return getAppById(id)
      }
    } catch (error) {
      console.error("[Data] Failed to update app in DB, falling back to mock:", error)
    }
  }
  const index = mockApps.findIndex((app) => app.id === id)
  if (index === -1) return null
  mockApps[index] = { ...mockApps[index], ...updates }
  return mockApps[index]
}

// Users
export async function getUsers(): Promise<User[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { userService } = services
        const users = await userService.getAll()
        return users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          manager: user.manager ?? "",
          managerId: user.managerId ?? "",
          status: user.status as User["status"],
          appsUsed: 0,
          totalAppSpend: 0,
          highRiskAccessCount: 0,
          lastActive: user.lastActive?.toISOString() ?? "",
          avatar: user.avatar ?? "",
          title: user.title ?? "",
          startDate: user.startDate?.toISOString() ?? "",
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch users from DB, falling back to mock:", error)
    }
  }
  return [...mockUsers]
}

export async function getUserById(id: string): Promise<User | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { userService } = services
        const user = await userService.getWithStats(id)
        if (!user) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          manager: user.manager ?? "",
          managerId: user.managerId ?? "",
          status: user.status as User["status"],
          appsUsed: safeNumber(user.appsUsed),
          totalAppSpend: safeNumber(user.totalAppSpend),
          highRiskAccessCount: safeNumber(user.highRiskAccessCount),
          lastActive: user.lastActive?.toISOString() ?? "",
          avatar: user.avatar ?? "",
          title: user.title ?? "",
          startDate: user.startDate?.toISOString() ?? "",
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch user from DB, falling back to mock:", error)
    }
  }
  return mockUsers.find((user) => user.id === id) || null
}

export async function getUserAppAccess(userId: string): Promise<UserAppAccess[]> {
  return mockUserAppAccess[userId] || []
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { userService } = services
        const { systemContext } = await import("./audit")
        await userService.update(systemContext(), id, {
          name: updates.name,
          email: updates.email,
          department: updates.department,
          status: updates.status as any,
          title: updates.title,
        })
        return getUserById(id)
      }
    } catch (error) {
      console.error("[Data] Failed to update user in DB, falling back to mock:", error)
    }
  }
  const index = mockUsers.findIndex((user) => user.id === id)
  if (index === -1) return null
  mockUsers[index] = { ...mockUsers[index], ...updates }
  return mockUsers[index]
}

// Contracts
export async function getContracts(): Promise<Contract[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { contractService } = services
        const contracts = await contractService.getAll()
        return contracts.map((c) => ({
          id: c.id,
          appId: c.applicationId,
          appName: (c as any).application?.name ?? "",
          vendor: c.vendor,
          contractValue: safeNumber(c.contractValue),
          billingCadence: c.billingCadence as Contract["billingCadence"],
          termStart: c.termStart.toISOString(),
          termEnd: c.termEnd.toISOString(),
          renewalDate: c.renewalDate.toISOString(),
          autoRenew: c.autoRenew,
          owner: (c as any).owner?.name ?? "Unassigned",
          ownerId: c.ownerUserId ?? "",
          status: c.status as Contract["status"],
          renewalHealth: c.renewalHealth,
          stakeholders: [],
          documents: c.documents ?? [],
          notes: c.notes ?? "",
          spendHistory: [],
          terms: c.terms ?? "",
          paymentTerms: c.paymentTerms ?? "",
          cancellationNotice: safeNumber(c.cancellationNotice, 30),
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch contracts from DB, falling back to mock:", error)
    }
  }
  return [...mockContracts]
}

export async function getContractById(id: string): Promise<Contract | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { contractService } = services
        const c = await contractService.getById(id)
        if (!c) return null
        return {
          id: c.id,
          appId: c.applicationId,
          appName: (c as any).application?.name ?? "",
          vendor: c.vendor,
          contractValue: safeNumber(c.contractValue),
          billingCadence: c.billingCadence as Contract["billingCadence"],
          termStart: c.termStart.toISOString(),
          termEnd: c.termEnd.toISOString(),
          renewalDate: c.renewalDate.toISOString(),
          autoRenew: c.autoRenew,
          owner: (c as any).owner?.name ?? "Unassigned",
          ownerId: c.ownerUserId ?? "",
          status: c.status as Contract["status"],
          renewalHealth: c.renewalHealth,
          stakeholders: [],
          documents: c.documents ?? [],
          notes: c.notes ?? "",
          spendHistory: [],
          terms: c.terms ?? "",
          paymentTerms: c.paymentTerms ?? "",
          cancellationNotice: safeNumber(c.cancellationNotice, 30),
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch contract from DB, falling back to mock:", error)
    }
  }
  return mockContracts.find((contract) => contract.id === id) || null
}

export async function getContractByAppId(appId: string): Promise<Contract | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { contractService } = services
        const c = await contractService.getByApplicationId(appId)
        if (!c) return null
        return {
          id: c.id,
          appId: c.applicationId,
          appName: (c as any).application?.name ?? "",
          vendor: c.vendor,
          contractValue: safeNumber(c.contractValue),
          billingCadence: c.billingCadence as Contract["billingCadence"],
          termStart: c.termStart.toISOString(),
          termEnd: c.termEnd.toISOString(),
          renewalDate: c.renewalDate.toISOString(),
          autoRenew: c.autoRenew,
          owner: (c as any).owner?.name ?? "Unassigned",
          ownerId: c.ownerUserId ?? "",
          status: c.status as Contract["status"],
          renewalHealth: c.renewalHealth,
          stakeholders: [],
          documents: c.documents ?? [],
          notes: c.notes ?? "",
          spendHistory: [],
          terms: c.terms ?? "",
          paymentTerms: c.paymentTerms ?? "",
          cancellationNotice: safeNumber(c.cancellationNotice, 30),
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch contract from DB, falling back to mock:", error)
    }
  }
  return mockContracts.find((contract) => contract.appId === appId) || null
}

// Integrations (mock only for now)
export async function getIntegrations(): Promise<Integration[]> {
  return [...integrations]
}

export async function updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | null> {
  const index = integrations.findIndex((i) => i.id === id)
  if (index === -1) return null
  integrations[index] = { ...integrations[index], ...updates }
  return integrations[index]
}

// Access Reviews
export async function getAccessReviewCampaigns(): Promise<AccessReviewCampaign[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { accessReviewService } = services
        const campaigns = await accessReviewService.getAllCampaigns()
        return campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          scope: { apps: c.scopeApps ?? [], departments: c.scopeDepartments ?? [] },
          dueDate: c.dueDate.toISOString(),
          completionPercent: safeNumber(c.completionPercent),
          reviewers: c.reviewers ?? [],
          status: c.status as AccessReviewCampaign["status"],
          createdAt: c.createdAt.toISOString(),
          tasksTotal: safeNumber(c.tasksTotal),
          tasksCompleted: safeNumber(c.tasksCompleted),
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch campaigns from DB, falling back to mock:", error)
    }
  }
  return [...mockCampaigns]
}

export async function getAccessReviewTasks(campaignId?: string): Promise<AccessReviewTask[]> {
  if (campaignId) {
    return mockTasks.filter((t) => t.campaignId === campaignId)
  }
  return [...mockTasks]
}

export async function getCampaignById(id: string): Promise<AccessReviewCampaign | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { accessReviewService } = services
        const c = await accessReviewService.getCampaignById(id)
        if (!c) return null
        return {
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          scope: { apps: c.scopeApps ?? [], departments: c.scopeDepartments ?? [] },
          dueDate: c.dueDate.toISOString(),
          completionPercent: safeNumber(c.completionPercent),
          reviewers: c.reviewers ?? [],
          status: c.status as AccessReviewCampaign["status"],
          createdAt: c.createdAt.toISOString(),
          tasksTotal: safeNumber(c.tasksTotal),
          tasksCompleted: safeNumber(c.tasksCompleted),
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch campaign from DB, falling back to mock:", error)
    }
  }
  return mockCampaigns.find((c) => c.id === id) || null
}

export async function getCampaignTasks(campaignId: string): Promise<AccessReviewTask[]> {
  return getAccessReviewTasks(campaignId)
}

export async function updateTask(
  taskId: string,
  decision: "approved" | "revoked",
  decidedBy: string,
): Promise<AccessReviewTask | null> {
  const index = mockTasks.findIndex((t) => t.id === taskId)
  if (index === -1) return null
  mockTasks[index] = {
    ...mockTasks[index],
    decision,
    decidedBy,
    decidedAt: new Date().toISOString(),
  }
  return mockTasks[index]
}

// Workflows (mock only for now)
export async function getWorkflows(): Promise<Workflow[]> {
  return [...workflows]
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  return workflows.find((w) => w.id === id) || null
}

export async function getWorkflowRuns(workflowId?: string): Promise<WorkflowRun[]> {
  if (workflowId) {
    return workflowRuns.filter((r) => r.workflowId === workflowId)
  }
  return [...workflowRuns]
}

export async function runWorkflow(workflowId: string): Promise<WorkflowRun> {
  const workflow = workflows.find((w) => w.id === workflowId)
  if (!workflow) throw new Error("Workflow not found")

  const newRun: WorkflowRun = {
    id: `run-${Date.now()}`,
    workflowId,
    workflowName: workflow.name,
    status: "success",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    triggeredBy: "Manual",
    logs: workflow.steps.map((step) => ({
      timestamp: new Date().toISOString(),
      step: step.name,
      status: "success",
      message: `${step.name} completed successfully`,
    })),
  }

  workflowRuns.unshift(newRun)
  return newRun
}

// Audit Events
export async function getAuditEvents(entityType?: string, entityId?: string): Promise<AuditEvent[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { auditRepository } = services
        const events = await auditRepository.findAll({
          objectType: entityType,
          objectId: entityId,
        })
        return events.map((e) => ({
          id: e.id,
          entityType: e.objectType as AuditEvent["entityType"],
          entityId: e.objectId,
          entityName: e.objectName ?? "",
          action: e.action,
          actor: e.actor,
          actorId: e.actor,
          timestamp: e.createdAt.toISOString(),
          details: (e.detailsJson as Record<string, unknown>) ?? {},
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch audit events from DB, falling back to mock:", error)
    }
  }
  let result = [...mockAuditEvents]
  if (entityType) {
    result = result.filter((e) => e.entityType === entityType)
  }
  if (entityId) {
    result = result.filter((e) => e.entityId === entityId)
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Dashboard
export async function getDashboardMetrics(filters?: Partial<DashboardFilters>): Promise<DashboardMetrics> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { applicationService } = services
        const metrics = await applicationService.getMetrics()
        return {
          totalApps: safeNumber(metrics.totalApps),
          totalMonthlySpend: safeNumber(metrics.totalMonthlySpend),
          licensesUnused: safeNumber(metrics.unusedLicenses),
          highRiskApps: safeNumber(metrics.highRiskApps),
          renewalsIn30Days: safeNumber(metrics.renewalsIn30Days),
          offboardingTasksPending: safeNumber(metrics.offboardingTasksPending),
        }
      }
    } catch (error) {
      console.error("[Data] Failed to fetch metrics from DB, falling back to mock:", error)
    }
  }

  const filteredApps = await getApps(filters)
  const now = new Date()
  const in30Days = new Date()
  in30Days.setDate(now.getDate() + 30)

  return {
    totalApps: filteredApps.length,
    totalMonthlySpend: filteredApps.reduce((sum, app) => sum + safeNumber(app.monthlySpend), 0),
    licensesUnused: filteredApps.reduce(
      (sum, app) => sum + (safeNumber(app.licensesPurchased) - safeNumber(app.licensesAssigned)),
      0,
    ),
    highRiskApps: filteredApps.filter((app) => app.riskLevel === "high" || app.riskLevel === "critical").length,
    renewalsIn30Days: filteredApps.filter((app) => new Date(app.renewalDate) <= in30Days).length,
    offboardingTasksPending: mockUsers.filter((u) => u.status === "offboarding").length,
  }
}

// Settings
export async function getDepartments(): Promise<Department[]> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { settingsService } = services
        const depts = await settingsService.getAllDepartments()
        return depts.map((d) => ({
          id: d.id,
          name: d.name,
          costCenter: d.costCenter ?? "",
          headcount: 0,
          appCount: 0,
          monthlySpend: 0,
        }))
      }
    } catch (error) {
      console.error("[Data] Failed to fetch departments from DB, falling back to mock:", error)
    }
  }
  return [...departmentsList]
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department | null> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { settingsService } = services
        const { systemContext } = await import("./audit")
        const d = await settingsService.updateDepartment(systemContext(), id, {
          name: updates.name,
          costCenter: updates.costCenter,
        })
        return {
          id: d.id,
          name: d.name,
          costCenter: d.costCenter ?? "",
          headcount: 0,
          appCount: 0,
          monthlySpend: 0,
        }
      }
    } catch (error) {
      console.error("[Data] Failed to update department in DB, falling back to mock:", error)
    }
  }
  const index = departmentsList.findIndex((d) => d.id === id)
  if (index === -1) return null
  departmentsList[index] = { ...departmentsList[index], ...updates }
  return departmentsList[index]
}

export async function createDepartment(dept: Omit<Department, "id">): Promise<Department> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { settingsService } = services
        const { systemContext } = await import("./audit")
        const d = await settingsService.createDepartment(systemContext(), {
          name: dept.name,
          costCenter: dept.costCenter,
        })
        return {
          id: d.id,
          name: d.name,
          costCenter: d.costCenter ?? "",
          headcount: 0,
          appCount: 0,
          monthlySpend: 0,
        }
      }
    } catch (error) {
      console.error("[Data] Failed to create department in DB, falling back to mock:", error)
    }
  }
  const newDept: Department = { ...dept, id: `dept-${Date.now()}` }
  departmentsList.push(newDept)
  return newDept
}

export async function deleteDepartment(id: string): Promise<boolean> {
  if (USE_DATABASE) {
    try {
      const services = await getServices()
      if (services) {
        const { settingsService } = services
        const { systemContext } = await import("./audit")
        await settingsService.deleteDepartment(systemContext(), id)
        return true
      }
    } catch (error) {
      console.error("[Data] Failed to delete department in DB, falling back to mock:", error)
    }
  }
  const index = departmentsList.findIndex((d) => d.id === id)
  if (index === -1) return false
  departmentsList.splice(index, 1)
  return true
}

export async function getRiskScoringRules(): Promise<RiskScoringRule[]> {
  return [...riskScoringRules]
}

export async function updateRiskScoringRule(
  id: string,
  updates: Partial<RiskScoringRule>,
): Promise<RiskScoringRule | null> {
  const index = riskScoringRules.findIndex((r) => r.id === id)
  if (index === -1) return null
  riskScoringRules[index] = { ...riskScoringRules[index], ...updates }
  return riskScoringRules[index]
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  return [...notificationPreferences]
}

export async function updateNotificationPreference(
  id: string,
  updates: Partial<NotificationPreference>,
): Promise<NotificationPreference | null> {
  const index = notificationPreferences.findIndex((n) => n.id === id)
  if (index === -1) return null
  notificationPreferences[index] = { ...notificationPreferences[index], ...updates }
  return notificationPreferences[index]
}
