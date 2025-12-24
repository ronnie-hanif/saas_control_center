import prisma from "@/lib/db"
import type { Application, RiskLevel, AppStatus, Prisma } from "@prisma/client"

export interface ApplicationFilters {
  category?: string
  riskLevel?: RiskLevel
  status?: AppStatus
  ownerId?: string
  search?: string
  renewalBefore?: Date
}

export const applicationRepository = {
  async findAll(filters?: ApplicationFilters): Promise<Application[]> {
    const where: Prisma.ApplicationWhereInput = {}

    if (filters?.category) {
      where.category = filters.category
    }
    if (filters?.riskLevel) {
      where.riskLevel = filters.riskLevel
    }
    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.ownerId) {
      where.ownerUserId = filters.ownerId
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { vendor: { contains: filters.search, mode: "insensitive" } },
      ]
    }
    if (filters?.renewalBefore) {
      where.renewalDate = { lte: filters.renewalBefore }
    }

    return prisma.application.findMany({
      where,
      include: { owner: true },
      orderBy: { name: "asc" },
    })
  },

  async findById(id: string): Promise<Application | null> {
    return prisma.application.findUnique({
      where: { id },
      include: {
        owner: true,
        contracts: true,
      },
    })
  },

  async create(data: Prisma.ApplicationCreateInput): Promise<Application> {
    return prisma.application.create({ data })
  },

  async update(id: string, data: Prisma.ApplicationUpdateInput): Promise<Application> {
    return prisma.application.update({ where: { id }, data })
  },

  async delete(id: string): Promise<Application> {
    return prisma.application.delete({ where: { id } })
  },

  async count(filters?: ApplicationFilters): Promise<number> {
    const where: Prisma.ApplicationWhereInput = {}
    if (filters?.category) where.category = filters.category
    if (filters?.riskLevel) where.riskLevel = filters.riskLevel
    if (filters?.status) where.status = filters.status
    return prisma.application.count({ where })
  },

  async getCategories(): Promise<string[]> {
    const apps = await prisma.application.findMany({
      select: { category: true },
      distinct: ["category"],
    })
    return apps.map((a) => a.category)
  },

  async getMetrics() {
    const [total, highRisk, criticalRisk] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { riskLevel: "high" } }),
      prisma.application.count({ where: { riskLevel: "critical" } }),
    ])

    const totalSpend = await prisma.application.aggregate({
      _sum: { monthlyCost: true },
    })

    const unusedLicenses = await prisma.application.aggregate({
      _sum: { licensesPurchased: true, licensesAssigned: true },
    })

    return {
      totalApps: total,
      highRiskApps: highRisk + criticalRisk,
      totalMonthlySpend: totalSpend._sum.monthlyCost?.toNumber() ?? 0,
      unusedLicenses: (unusedLicenses._sum.licensesPurchased ?? 0) - (unusedLicenses._sum.licensesAssigned ?? 0),
    }
  },
}
