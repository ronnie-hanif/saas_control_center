import { applicationRepository, type ApplicationFilters } from "@/lib/repositories"
import { audit, type AuditContext } from "@/lib/audit"
import type { Application, Prisma } from "@prisma/client"
import { decimalToNumber } from "@/lib/db/utils"

export interface ApplicationDTO extends Omit<Application, "monthlyCost" | "annualCost"> {
  monthlyCost: number
  annualCost: number
  utilizationPercent: number
}

function toDTO(app: Application): ApplicationDTO {
  const monthlyCost = decimalToNumber(app.monthlyCost)
  const annualCost = decimalToNumber(app.annualCost)
  const utilizationPercent =
    app.licensesPurchased > 0 ? Math.round((app.licensesAssigned / app.licensesPurchased) * 100) : 0

  return {
    ...app,
    monthlyCost,
    annualCost,
    utilizationPercent,
  }
}

export const applicationService = {
  async getAll(filters?: ApplicationFilters): Promise<ApplicationDTO[]> {
    const apps = await applicationRepository.findAll(filters)
    return apps.map(toDTO)
  },

  async getById(id: string): Promise<ApplicationDTO | null> {
    const app = await applicationRepository.findById(id)
    return app ? toDTO(app) : null
  },

  async create(ctx: AuditContext, data: Prisma.ApplicationCreateInput): Promise<ApplicationDTO> {
    const app = await applicationRepository.create(data)

    await audit(ctx, {
      action: "create",
      objectType: "application",
      objectId: app.id,
      objectName: app.name,
      details: { category: app.category, vendor: app.vendor },
    })

    return toDTO(app)
  },

  async update(ctx: AuditContext, id: string, data: Prisma.ApplicationUpdateInput): Promise<ApplicationDTO> {
    const existing = await applicationRepository.findById(id)
    const app = await applicationRepository.update(id, data)

    await audit(ctx, {
      action: "update",
      objectType: "application",
      objectId: app.id,
      objectName: app.name,
      details: {
        changes: Object.keys(data),
        previousValues: existing
          ? Object.fromEntries(Object.keys(data).map((k) => [k, (existing as Record<string, unknown>)[k]]))
          : {},
      },
    })

    return toDTO(app)
  },

  async delete(ctx: AuditContext, id: string): Promise<Application> {
    const app = await applicationRepository.delete(id)

    await audit(ctx, {
      action: "delete",
      objectType: "application",
      objectId: app.id,
      objectName: app.name,
    })

    return app
  },

  async getCategories(): Promise<string[]> {
    return applicationRepository.getCategories()
  },

  async getMetrics() {
    return applicationRepository.getMetrics()
  },

  async count(filters?: ApplicationFilters): Promise<number> {
    return applicationRepository.count(filters)
  },
}
