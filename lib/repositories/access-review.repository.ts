import prisma from "@/lib/db"
import type { AccessReviewCampaign, AccessReviewDecision, CampaignStatus, TaskDecision, Prisma } from "@prisma/client"
import { calculatePercent } from "@/lib/db/utils"

export interface CampaignWithStats extends AccessReviewCampaign {
  tasksTotal: number
  tasksCompleted: number
  completionPercent: number
}

export const accessReviewRepository = {
  // Campaigns
  async findAllCampaigns(status?: CampaignStatus): Promise<CampaignWithStats[]> {
    const where: Prisma.AccessReviewCampaignWhereInput = status ? { status } : {}

    const campaigns = await prisma.accessReviewCampaign.findMany({
      where,
      include: {
        decisions: {
          select: { decision: true },
        },
      },
      orderBy: { dueDate: "asc" },
    })

    return campaigns.map((campaign) => {
      const tasksTotal = campaign.decisions.length
      const tasksCompleted = campaign.decisions.filter((d) => d.decision !== "pending").length

      return {
        ...campaign,
        decisions: undefined,
        tasksTotal,
        tasksCompleted,
        completionPercent: calculatePercent(tasksCompleted, tasksTotal),
      } as CampaignWithStats
    })
  },

  async findCampaignById(id: string): Promise<CampaignWithStats | null> {
    const campaign = await prisma.accessReviewCampaign.findUnique({
      where: { id },
      include: {
        decisions: {
          select: { decision: true },
        },
      },
    })

    if (!campaign) return null

    const tasksTotal = campaign.decisions.length
    const tasksCompleted = campaign.decisions.filter((d) => d.decision !== "pending").length

    return {
      ...campaign,
      decisions: undefined,
      tasksTotal,
      tasksCompleted,
      completionPercent: calculatePercent(tasksCompleted, tasksTotal),
    } as CampaignWithStats
  },

  async createCampaign(data: Prisma.AccessReviewCampaignCreateInput): Promise<AccessReviewCampaign> {
    return prisma.accessReviewCampaign.create({ data })
  },

  async updateCampaign(id: string, data: Prisma.AccessReviewCampaignUpdateInput): Promise<AccessReviewCampaign> {
    return prisma.accessReviewCampaign.update({ where: { id }, data })
  },

  async deleteCampaign(id: string): Promise<AccessReviewCampaign> {
    return prisma.accessReviewCampaign.delete({ where: { id } })
  },

  // Decisions
  async findDecisionsByCampaign(campaignId: string): Promise<AccessReviewDecision[]> {
    return prisma.accessReviewDecision.findMany({
      where: { campaignId },
      include: {
        application: true,
        user: true,
      },
      orderBy: { createdAt: "asc" },
    })
  },

  async findDecisionById(id: string): Promise<AccessReviewDecision | null> {
    return prisma.accessReviewDecision.findUnique({
      where: { id },
      include: {
        application: true,
        user: true,
        campaign: true,
      },
    })
  },

  async createDecision(data: Prisma.AccessReviewDecisionCreateInput): Promise<AccessReviewDecision> {
    return prisma.accessReviewDecision.create({ data })
  },

  async updateDecision(
    id: string,
    decision: TaskDecision,
    decidedById: string,
    rationale?: string,
  ): Promise<AccessReviewDecision> {
    return prisma.accessReviewDecision.update({
      where: { id },
      data: {
        decision,
        decidedById,
        decidedAt: new Date(),
        rationale,
      },
    })
  },

  async bulkCreateDecisions(
    campaignId: string,
    decisions: Array<{ applicationId: string; userId: string }>,
  ): Promise<number> {
    const result = await prisma.accessReviewDecision.createMany({
      data: decisions.map((d) => ({
        campaignId,
        applicationId: d.applicationId,
        userId: d.userId,
        decision: "pending" as TaskDecision,
      })),
      skipDuplicates: true,
    })
    return result.count
  },

  async getCompletionStats(campaignId: string) {
    const [total, completed, approved, revoked] = await Promise.all([
      prisma.accessReviewDecision.count({ where: { campaignId } }),
      prisma.accessReviewDecision.count({
        where: { campaignId, decision: { not: "pending" } },
      }),
      prisma.accessReviewDecision.count({
        where: { campaignId, decision: "approved" },
      }),
      prisma.accessReviewDecision.count({
        where: { campaignId, decision: "revoked" },
      }),
    ])

    return {
      total,
      completed,
      pending: total - completed,
      approved,
      revoked,
      completionPercent: calculatePercent(completed, total),
    }
  },
}
