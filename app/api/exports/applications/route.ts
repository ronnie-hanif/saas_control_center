import { NextResponse } from "next/server"
import { generateCSV, generateFilename, type CSVColumn } from "@/lib/export/csv"
import { auditExport, systemContext } from "@/lib/audit"

export const runtime = "nodejs"

const USE_DATABASE = !!process.env.DATABASE_URL

interface AppExportRow {
  id: string
  name: string
  vendor: string
  category: string
  status: string
  riskLevel: string
  monthlyCost: number
  owner: string
  ssoConnected: boolean
  renewalDate: string
  licensesUsed: string
}

const columns: CSVColumn<AppExportRow>[] = [
  { header: "ID", accessor: "id" },
  { header: "Application Name", accessor: "name" },
  { header: "Vendor", accessor: "vendor" },
  { header: "Category", accessor: "category" },
  { header: "Status", accessor: "status" },
  { header: "Risk Level", accessor: "riskLevel" },
  { header: "Monthly Cost (USD)", accessor: "monthlyCost" },
  { header: "Owner", accessor: "owner" },
  { header: "SSO Connected", accessor: (row) => (row.ssoConnected ? "Yes" : "No") },
  { header: "Renewal Date", accessor: "renewalDate" },
  { header: "Licenses (Assigned/Purchased)", accessor: "licensesUsed" },
]

export async function GET() {
  try {
    let data: AppExportRow[] = []

    if (USE_DATABASE) {
      const { applicationRepository } = await import("@/lib/repositories")
      const apps = await applicationRepository.findAll()

      data = apps.map((app) => ({
        id: app.id,
        name: app.name,
        vendor: app.vendor ?? "",
        category: app.category,
        status: app.status,
        riskLevel: app.riskLevel,
        monthlyCost: app.monthlyCost?.toNumber() ?? 0,
        owner: (app as any).owner?.name ?? "Unassigned",
        ssoConnected: app.ssoConnected,
        renewalDate: app.renewalDate?.toISOString().split("T")[0] ?? "",
        licensesUsed: `${app.licensesAssigned}/${app.licensesPurchased}`,
      }))
    } else {
      // Fallback to mock data
      const { apps } = await import("@/lib/mock-data")
      data = apps.map((app) => ({
        id: app.id,
        name: app.name,
        vendor: app.vendor,
        category: app.category,
        status: app.status,
        riskLevel: app.riskLevel,
        monthlyCost: app.monthlySpend,
        owner: app.owner,
        ssoConnected: app.ssoConnected,
        renewalDate: app.renewalDate?.split("T")[0] ?? "",
        licensesUsed: `${app.licensesAssigned}/${app.licensesPurchased}`,
      }))
    }

    const csv = generateCSV(data, columns)
    const filename = generateFilename("applications_export")

    // Audit the export
    await auditExport(systemContext(), "application", "csv", data.length)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[Export] Applications export failed:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
