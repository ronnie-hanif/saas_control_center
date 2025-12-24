import { userRepository, type UserFilters, type UserWithStats } from "@/lib/repositories"
import { audit, type AuditContext } from "@/lib/audit"
import type { User, Prisma } from "@prisma/client"

export const userService = {
  async getAll(filters?: UserFilters): Promise<User[]> {
    return userRepository.findAll(filters)
  },

  async getById(id: string): Promise<User | null> {
    return userRepository.findById(id)
  },

  async getByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email)
  },

  async getWithStats(id: string): Promise<UserWithStats | null> {
    return userRepository.findWithStats(id)
  },

  async create(ctx: AuditContext, data: Prisma.UserCreateInput): Promise<User> {
    const user = await userRepository.create(data)

    await audit(ctx, {
      action: "create",
      objectType: "user",
      objectId: user.id,
      objectName: user.name,
      details: { email: user.email, department: user.department },
    })

    return user
  },

  async update(ctx: AuditContext, id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const existing = await userRepository.findById(id)
    const user = await userRepository.update(id, data)

    await audit(ctx, {
      action: "update",
      objectType: "user",
      objectId: user.id,
      objectName: user.name,
      details: {
        changes: Object.keys(data),
        previousValues: existing
          ? Object.fromEntries(Object.keys(data).map((k) => [k, (existing as Record<string, unknown>)[k]]))
          : {},
      },
    })

    return user
  },

  async delete(ctx: AuditContext, id: string): Promise<User> {
    const user = await userRepository.delete(id)

    await audit(ctx, {
      action: "delete",
      objectType: "user",
      objectId: user.id,
      objectName: user.name,
    })

    return user
  },

  async count(filters?: UserFilters): Promise<number> {
    return userRepository.count(filters)
  },
}
