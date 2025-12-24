import prisma from "@/lib/db"
import type { User, UserStatus, Prisma } from "@prisma/client"

export interface UserFilters {
  department?: string
  status?: UserStatus
  search?: string
}

export interface UserWithStats extends User {
  appsUsed: number
  totalAppSpend: number
  highRiskAccessCount: number
}

export const userRepository = {
  async findAll(filters?: UserFilters): Promise<User[]> {
    const where: Prisma.UserWhereInput = {}

    if (filters?.department) {
      where.department = filters.department
    }
    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    return prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
    })
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  },

  async findWithStats(id: string): Promise<UserWithStats | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userAccess: {
          include: {
            application: true,
          },
        },
      },
    })

    if (!user) return null

    const appsUsed = user.userAccess.length
    const totalAppSpend = user.userAccess.reduce((sum, access) => {
      return sum + (access.application.monthlyCost?.toNumber() ?? 0)
    }, 0)
    const highRiskAccessCount = user.userAccess.filter(
      (access) => access.application.riskLevel === "high" || access.application.riskLevel === "critical",
    ).length

    return {
      ...user,
      userAccess: undefined,
      appsUsed,
      totalAppSpend,
      highRiskAccessCount,
    } as UserWithStats
  },

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data })
  },

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data })
  },

  async delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } })
  },

  async count(filters?: UserFilters): Promise<number> {
    const where: Prisma.UserWhereInput = {}
    if (filters?.department) where.department = filters.department
    if (filters?.status) where.status = filters.status
    return prisma.user.count({ where })
  },
}
