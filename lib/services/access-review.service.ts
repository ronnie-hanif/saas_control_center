import { accessReviewRepository, type CampaignWithStats } from "@/lib/repositories"
import { audit, type AuditContext } from "@/lib/audit"
import type { AccessReviewCampaign, AccessReviewDecision, CampaignStatus, TaskDecision, Prisma } from "@prisma/client"

export const accessReviewService = {
  // Campaigns
  async getAllCampaigns(status?: CampaignStatus): Promise<CampaignWithStats[]> {
    return accessReviewRepository.findAllCampaigns(status)
  },

  async getCampaignById(id: string): Promise<CampaignWithStats | null> {
    return accessReviewRepository.findCampaignById(id)
  },

  async createCampaign(ctx: AuditContext, data: Prisma.AccessReviewCampaignCreateInput): Promise<AccessReviewCampaign> {
    const campaign = await accessReviewRepository.createCampaign(data)

    await audit(ctx, {
      action: "create",
      objectType: "campaign",
      objectId: campaign.id,
      objectName: campaign.name,
      details: { dueDate: campaign.dueDate, status: campaign.status },
    })

    return campaign
  },

  async updateCampaign(
    ctx: AuditContext,
    id: string,
    data: Prisma.AccessReviewCampaignUpdateInput,
  ): Promise<AccessReviewCampaign> {
    const campaign = await accessReviewRepository.updateCampaign(id, data)

    await audit(ctx, {
      action: "update",
      objectType: "campaign",
      objectId: campaign.id,
      objectName: campaign.name,
      details: { changes: Object.keys(data) },
    })

    return campaign
  },

  async deleteCampaign(ctx: AuditContext, id: string): Promise<AccessReviewCampaign> {
    const campaign = await accessReviewRepository.deleteCampaign(id)

    await audit(ctx, {
      action: "delete",
      objectType: "campaign",
      objectId: campaign.id,
      objectName: campaign.name,
    })

    return campaign
  },

  // Decisions
  async getDecisionsByCampaign(campaignId: string): Promise<AccessReviewDecision[]> {
    return accessReviewRepository.findDecisionsByCampaign(campaignId)
  },

  async makeDecision(
    ctx: AuditContext,
    decisionId: string,
    decision: TaskDecision,
    rationale?: string,
  ): Promise<AccessReviewDecision> {
    const updated = await accessReviewRepository.updateDecision(decisionId, decision, ctx.actor, rationale)

    await audit(ctx, {
      action: "decision",
      objectType: "decision",
      objectId: updated.id,
      objectName: `Decision for campaign ${updated.campaignId}`,
      details: {
        decision,
        rationale,
        applicationId: updated.applicationId,
        userId: updated.userId,
      },
    })

    return updated
  },

  async bulkCreateDecisions(
    ctx: AuditContext,
    campaignId: string,
    decisions: Array<{ applicationId: string; userId: string }>,
  ): Promise<number> {
    const count = await accessReviewRepository.bulkCreateDecisions(campaignId, decisions)

    await audit(ctx, {
      action: "bulk_update",
      objectType: "decision",
      objectId: campaignId,
      objectName: `Bulk decisions for campaign ${campaignId}`,
      details: { count, campaignId },
    })

    return count
  },

  async getCompletionStats(campaignId: string) {
    return accessReviewRepository.getCompletionStats(campaignId)
  },
}
