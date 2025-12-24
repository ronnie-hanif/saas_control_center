import prisma from "@/lib/db"
import type { Contract, ContractStatus, Prisma } from "@prisma/client"

export interface ContractFilters {
  status?: ContractStatus
  ownerId?: string
  applicationId?: string
  renewalBefore?: Date
}

export const contractRepository = {
  async findAll(filters?: ContractFilters): Promise<Contract[]> {
    const where: Prisma.ContractWhereInput = {}

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.ownerId) {
      where.ownerUserId = filters.ownerId
    }
    if (filters?.applicationId) {
      where.applicationId = filters.applicationId
    }
    if (filters?.renewalBefore) {
      where.renewalDate = { lte: filters.renewalBefore }
    }

    return prisma.contract.findMany({
      where,
      include: {
        application: true,
        owner: true,
      },
      orderBy: { renewalDate: "asc" },
    })
  },

  async findById(id: string): Promise<Contract | null> {
    return prisma.contract.findUnique({
      where: { id },
      include: {
        application: true,
        owner: true,
      },
    })
  },

  async findByApplicationId(applicationId: string): Promise<Contract | null> {
    return prisma.contract.findFirst({
      where: { applicationId },
      include: {
        application: true,
        owner: true,
      },
    })
  },

  async create(data: Prisma.ContractCreateInput): Promise<Contract> {
    return prisma.contract.create({ data })
  },

  async update(id: string, data: Prisma.ContractUpdateInput): Promise<Contract> {
    return prisma.contract.update({ where: { id }, data })
  },

  async delete(id: string): Promise<Contract> {
    return prisma.contract.delete({ where: { id } })
  },

  async getUpcomingRenewals(daysAhead = 30): Promise<Contract[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead)

    return prisma.contract.findMany({
      where: {
        renewalDate: { lte: cutoffDate },
        status: { not: "expired" },
      },
      include: { application: true, owner: true },
      orderBy: { renewalDate: "asc" },
    })
  },

  async getTotalValue(): Promise<number> {
    const result = await prisma.contract.aggregate({
      _sum: { contractValue: true },
      where: { status: { not: "expired" } },
    })
    return result._sum.contractValue?.toNumber() ?? 0
  },
}
