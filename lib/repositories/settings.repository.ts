import prisma from "@/lib/db"
import type { Setting, Department, Prisma } from "@prisma/client"

export const settingsRepository = {
  // Generic settings
  async get<T>(key: string): Promise<T | null> {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting ? (setting.value as T) : null
  },

  async set<T>(key: string, value: T): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    })
  },

  async delete(key: string): Promise<void> {
    await prisma.setting.delete({ where: { key } }).catch(() => {})
  },

  // Departments
  async findAllDepartments(): Promise<Department[]> {
    return prisma.department.findMany({
      orderBy: { name: "asc" },
    })
  },

  async findDepartmentById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } })
  },

  async findDepartmentByName(name: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { name } })
  },

  async createDepartment(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return prisma.department.create({ data })
  },

  async updateDepartment(id: string, data: Prisma.DepartmentUpdateInput): Promise<Department> {
    return prisma.department.update({ where: { id }, data })
  },

  async deleteDepartment(id: string): Promise<Department> {
    return prisma.department.delete({ where: { id } })
  },
}
