import prisma from "@/lib/db"
import type { AuditEvent, Prisma } from "@prisma/client"

export interface AuditFilters {
  actor?: string
  objectType?: string
  objectId?: string
  action?: string
  startDate?: Date
  endDate?: Date
}

export const auditRepository = {
  async findAll(filters?: AuditFilters, limit = 100): Promise<AuditEvent[]> {
    const where: Prisma.AuditEventWhereInput = {}

    if (filters?.actor) {
      where.actor = filters.actor
    }
    if (filters?.objectType) {
      where.objectType = filters.objectType
    }
    if (filters?.objectId) {
      where.objectId = filters.objectId
    }
    if (filters?.action) {
      where.action = filters.action
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    return prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  },

  async findByObject(objectType: string, objectId: string): Promise<AuditEvent[]> {
    return prisma.auditEvent.findMany({
      where: { objectType, objectId },
      orderBy: { createdAt: "desc" },
    })
  },

  async create(data: Prisma.AuditEventCreateInput): Promise<AuditEvent> {
    return prisma.auditEvent.create({ data })
  },

  async count(filters?: AuditFilters): Promise<number> {
    const where: Prisma.AuditEventWhereInput = {}
    if (filters?.objectType) where.objectType = filters.objectType
    if (filters?.actor) where.actor = filters.actor
    return prisma.auditEvent.count({ where })
  },
}
