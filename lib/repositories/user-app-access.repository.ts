import prisma from "@/lib/db"
import type { UserAppAccess, Prisma } from "@prisma/client"

export interface UserAppAccessWithDetails extends UserAppAccess {
  user: {
    id: string
    name: string
    email: string
    department: string
  }
  application: {
    id: string
    name: string
    category: string
    riskLevel: string
  }
}

export const userAppAccessRepository = {
  async findByApplicationId(applicationId: string): Promise<UserAppAccessWithDetails[]> {
    return prisma.userAppAccess.findMany({
      where: { applicationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        application: {
          select: { id: true, name: true, category: true, riskLevel: true },
        },
      },
      orderBy: { lastLogin: "desc" },
    })
  },

  async findByUserId(userId: string): Promise<UserAppAccessWithDetails[]> {
    return prisma.userAppAccess.findMany({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        application: {
          select: { id: true, name: true, category: true, riskLevel: true },
        },
      },
      orderBy: { lastLogin: "desc" },
    })
  },

  async findAll(): Promise<UserAppAccessWithDetails[]> {
    return prisma.userAppAccess.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        application: {
          select: { id: true, name: true, category: true, riskLevel: true },
        },
      },
      orderBy: { lastLogin: "desc" },
    })
  },

  async create(data: Prisma.UserAppAccessCreateInput): Promise<UserAppAccess> {
    return prisma.userAppAccess.create({ data })
  },

  async update(id: string, data: Prisma.UserAppAccessUpdateInput): Promise<UserAppAccess> {
    return prisma.userAppAccess.update({ where: { id }, data })
  },

  async delete(id: string): Promise<UserAppAccess> {
    return prisma.userAppAccess.delete({ where: { id } })
  },

  async getCountByApplication(applicationId: string): Promise<number> {
    return prisma.userAppAccess.count({ where: { applicationId } })
  },

  async findByUserAndApplication(userId: string, applicationId: string): Promise<UserAppAccess | null> {
    return prisma.userAppAccess.findFirst({
      where: { userId, applicationId },
    })
  },

  async findByUserAppPairs(
    pairs: Array<{ userId: string; applicationId: string }>,
  ): Promise<Map<string, UserAppAccess>> {
    if (pairs.length === 0) return new Map()

    // Build OR conditions for each pair
    const accessRecords = await prisma.userAppAccess.findMany({
      where: {
        OR: pairs.map((p) => ({
          userId: p.userId,
          applicationId: p.applicationId,
        })),
      },
    })

    // Create lookup map with composite key
    const map = new Map<string, UserAppAccess>()
    for (const record of accessRecords) {
      map.set(`${record.userId}:${record.applicationId}`, record)
    }
    return map
  },
}
