import { settingsRepository } from "@/lib/repositories"
import { audit, type AuditContext } from "@/lib/audit"
import type { Department, Prisma } from "@prisma/client"
import { decimalToNumber } from "@/lib/db/utils"

export interface DepartmentDTO extends Omit<Department, "annualBudget"> {
  annualBudget: number | null
}

function toDTO(dept: Department): DepartmentDTO {
  return {
    ...dept,
    annualBudget: dept.annualBudget ? decimalToNumber(dept.annualBudget) : null,
  }
}

export const settingsService = {
  // Generic settings
  async getSetting<T>(key: string): Promise<T | null> {
    return settingsRepository.get<T>(key)
  },

  async setSetting<T>(ctx: AuditContext, key: string, value: T): Promise<void> {
    await settingsRepository.set(key, value)

    await audit(ctx, {
      action: "update",
      objectType: "setting",
      objectId: key,
      objectName: key,
    })
  },

  // Departments
  async getAllDepartments(): Promise<DepartmentDTO[]> {
    const depts = await settingsRepository.findAllDepartments()
    return depts.map(toDTO)
  },

  async getDepartmentById(id: string): Promise<DepartmentDTO | null> {
    const dept = await settingsRepository.findDepartmentById(id)
    return dept ? toDTO(dept) : null
  },

  async createDepartment(ctx: AuditContext, data: Prisma.DepartmentCreateInput): Promise<DepartmentDTO> {
    const dept = await settingsRepository.createDepartment(data)

    await audit(ctx, {
      action: "create",
      objectType: "department",
      objectId: dept.id,
      objectName: dept.name,
    })

    return toDTO(dept)
  },

  async updateDepartment(ctx: AuditContext, id: string, data: Prisma.DepartmentUpdateInput): Promise<DepartmentDTO> {
    const dept = await settingsRepository.updateDepartment(id, data)

    await audit(ctx, {
      action: "update",
      objectType: "department",
      objectId: dept.id,
      objectName: dept.name,
      details: { changes: Object.keys(data) },
    })

    return toDTO(dept)
  },

  async deleteDepartment(ctx: AuditContext, id: string): Promise<Department> {
    const dept = await settingsRepository.deleteDepartment(id)

    await audit(ctx, {
      action: "delete",
      objectType: "department",
      objectId: dept.id,
      objectName: dept.name,
    })

    return dept
  },
}
