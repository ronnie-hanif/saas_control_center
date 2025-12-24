import { NextResponse } from "next/server"
import { generateCSV, generateFilename, type CSVColumn } from "@/lib/export/csv"
import { auditExport, systemContext } from "@/lib/audit"

export const runtime = "nodejs"

const USE_DATABASE = !!process.env.DATABASE_URL

interface DecisionExportRow {
  campaignId: string
  campaignName: string
  userName: string
  userEmail: string
  userDepartment: string
  applicationName: string
  applicationCategory: string
  riskLevel: string
  accessLevel: string
  lastLogin: string
  decision: string
  decidedBy: string
  decidedAt: string
  rationale: string
}

const columns: CSVColumn<DecisionExportRow>[] = [
  { header: "Campaign ID", accessor: "campaignId" },
  { header: "Campaign Name", accessor: "campaignName" },
  { header: "User Name", accessor: "userName" },
  { header: "User Email", accessor: "userEmail" },
  { header: "Department", accessor: "userDepartment" },
  { header: "Application", accessor: "applicationName" },
  { header: "Category", accessor: "applicationCategory" },
  { header: "Risk Level", accessor: "riskLevel" },
  { header: "Access Level", accessor: "accessLevel" },
  { header: "Last Login", accessor: "lastLogin" },
  { header: "Decision", accessor: "decision" },
  { header: "Decided By", accessor: "decidedBy" },
  { header: "Decided At", accessor: "decidedAt" },
  { header: "Rationale", accessor: "rationale" },
]

export async function GET(request: Request, { params }: { params: { campaignId: string } }) {
  try {
    const { campaignId } = params
    let data: DecisionExportRow[] = []
    let campaignName = ""

    if (USE_DATABASE) {
      const { accessReviewRepository, userAppAccessRepository } = await import("@/lib/repositories")
      const campaign = await accessReviewRepository.findCampaignById(campaignId)
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
      }
      campaignName = campaign.name

      const decisions = await accessReviewRepository.findDecisionsByCampaign(campaignId)

      const pairs = decisions.map((d) => ({
        userId: d.userId,
        applicationId: d.applicationId,
      }))
      const accessMap = await userAppAccessRepository.findByUserAppPairs(pairs)

      data = decisions.map((d) => {
        const accessKey = `${d.userId}:${d.applicationId}`
        const accessRecord = accessMap.get(accessKey)

        return {
          campaignId: d.campaignId,
          campaignName,
          userName: (d as any).user?.name ?? "",
          userEmail: (d as any).user?.email ?? "",
          userDepartment: (d as any).user?.department ?? "",
          applicationName: (d as any).application?.name ?? "",
          applicationCategory: (d as any).application?.category ?? "",
          riskLevel: (d as any).application?.riskLevel ?? "",
          accessLevel: accessRecord?.accessLevel ?? "—",
          lastLogin: accessRecord?.lastLogin ? accessRecord.lastLogin.toISOString().split("T")[0] : "—",
          decision: d.decision,
          decidedBy: d.decidedById ?? "",
          decidedAt: d.decidedAt?.toISOString() ?? "",
          rationale: d.rationale ?? "",
        }
      })
    } else {
      // Fallback to mock data
      const { accessReviewCampaigns, accessReviewTasks } = await import("@/lib/mock-data")
      const campaign = accessReviewCampaigns.find((c) => c.id === campaignId)
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
      }
      campaignName = campaign.name

      const tasks = accessReviewTasks.filter((t) => t.campaignId === campaignId)

      data = tasks.map((t) => ({
        campaignId: t.campaignId,
        campaignName,
        userName: t.userName,
        userEmail: t.userEmail,
        userDepartment: t.userDepartment,
        applicationName: t.appName,
        applicationCategory: t.appCategory,
        riskLevel: t.riskLevel,
        accessLevel: t.accessLevel,
        lastLogin: t.lastLogin,
        decision: t.decision,
        decidedBy: t.decidedBy ?? "",
        decidedAt: t.decidedAt ?? "",
        rationale: t.rationale ?? "",
      }))
    }

    const csv = generateCSV(data, columns)
    const filename = generateFilename(`access_review_${campaignId}`)

    // Audit the export
    await auditExport(systemContext(), "campaign", "csv", data.length, { campaignId, campaignName })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[Export] Access review export failed:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
