import { contractRepository, type ContractFilters } from "@/lib/repositories"
import { audit, type AuditContext } from "@/lib/audit"
import type { Contract, Prisma } from "@prisma/client"
import { decimalToNumber } from "@/lib/db/utils"

export interface ContractDTO extends Omit<Contract, "contractValue"> {
  contractValue: number
  daysUntilRenewal: number
  renewalHealth: "healthy" | "needs-review" | "at-risk"
}

function toDTO(contract: Contract): ContractDTO {
  const contractValue = decimalToNumber(contract.contractValue)
  const daysUntilRenewal = Math.ceil((new Date(contract.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  let renewalHealth: "healthy" | "needs-review" | "at-risk" = "healthy"
  if (daysUntilRenewal <= 30) {
    renewalHealth = "at-risk"
  } else if (daysUntilRenewal <= 60) {
    renewalHealth = "needs-review"
  }

  return {
    ...contract,
    contractValue,
    daysUntilRenewal,
    renewalHealth,
  }
}

export const contractService = {
  async getAll(filters?: ContractFilters): Promise<ContractDTO[]> {
    const contracts = await contractRepository.findAll(filters)
    return contracts.map(toDTO)
  },

  async getById(id: string): Promise<ContractDTO | null> {
    const contract = await contractRepository.findById(id)
    return contract ? toDTO(contract) : null
  },

  async getByApplicationId(applicationId: string): Promise<ContractDTO | null> {
    const contract = await contractRepository.findByApplicationId(applicationId)
    return contract ? toDTO(contract) : null
  },

  async create(ctx: AuditContext, data: Prisma.ContractCreateInput): Promise<ContractDTO> {
    const contract = await contractRepository.create(data)

    await audit(ctx, {
      action: "create",
      objectType: "contract",
      objectId: contract.id,
      objectName: contract.vendor,
      details: { applicationId: contract.applicationId, value: contract.contractValue.toString() },
    })

    return toDTO(contract)
  },

  async update(ctx: AuditContext, id: string, data: Prisma.ContractUpdateInput): Promise<ContractDTO> {
    const existing = await contractRepository.findById(id)
    const contract = await contractRepository.update(id, data)

    await audit(ctx, {
      action: "update",
      objectType: "contract",
      objectId: contract.id,
      objectName: contract.vendor,
      details: {
        changes: Object.keys(data),
      },
    })

    return toDTO(contract)
  },

  async delete(ctx: AuditContext, id: string): Promise<Contract> {
    const contract = await contractRepository.delete(id)

    await audit(ctx, {
      action: "delete",
      objectType: "contract",
      objectId: contract.id,
      objectName: contract.vendor,
    })

    return contract
  },

  async getUpcomingRenewals(daysAhead = 30): Promise<ContractDTO[]> {
    const contracts = await contractRepository.getUpcomingRenewals(daysAhead)
    return contracts.map(toDTO)
  },

  async getTotalValue(): Promise<number> {
    return contractRepository.getTotalValue()
  },
}
