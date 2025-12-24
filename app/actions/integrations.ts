"use server"

import { isOktaConfigured } from "@/lib/integrations/okta/client"
import { generateCorrelationId } from "@/lib/logger"

export interface SyncRunRecord {
  id: string
  connectionId: string
  status: string
  startedAt: Date
  finishedAt: Date | null
  durationMs: number | null
  recordsProcessed: number
  recordsRead: number
  recordsWritten: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  accessRecordsUpdated: number
  errorMessage: string | null
  errorSummary: string | null
  isPartial: boolean
  resumeToken: string | null
}

export interface IntegrationConnectionWithRuns {
  id: string
  type: string
  name: string
  status: string
  configJson: unknown | null
  lastSyncAt: Date | null
  lastSuccessfulSyncAt: Date | null
  syncCursor: string | null
  createdAt: Date
  updatedAt: Date
  syncRuns: SyncRunRecord[]
}

export interface OktaConnectionStatus {
  configured: boolean
  connection: IntegrationConnectionWithRuns | null
}

export interface SyncResult {
  success: boolean
  syncRunId: string
  recordsProcessed: number
  recordsRead: number
  recordsWritten: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  accessRecordsUpdated: number
  errorMessage?: string
  errorSummary?: string
  durationMs: number
  isPartial: boolean
  resumeToken?: string
}

// Mock connection for when DB is not available
const mockOktaConnection: IntegrationConnectionWithRuns = {
  id: "okta-integration",
  type: "okta",
  name: "Okta",
  status: "pending",
  configJson: null,
  lastSyncAt: null,
  lastSuccessfulSyncAt: null,
  syncCursor: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  syncRuns: [],
}

/**
 * Check database availability at runtime with detailed diagnostics
 */
function checkDatabaseAvailability(): {
  available: boolean
  reason?: string
  hasDatabaseUrl: boolean
  hasDatabaseEnabled: boolean
} {
  const hasDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
  const hasDatabaseEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED === "true"

  if (!hasDatabaseEnabled) {
    return {
      available: false,
      reason: "Database feature is disabled. Set NEXT_PUBLIC_DATABASE_ENABLED=true to enable.",
      hasDatabaseUrl,
      hasDatabaseEnabled,
    }
  }

  if (!hasDatabaseUrl) {
    return {
      available: false,
      reason: "DATABASE_URL environment variable is not set.",
      hasDatabaseUrl,
      hasDatabaseEnabled,
    }
  }

  return { available: true, hasDatabaseUrl, hasDatabaseEnabled }
}

/**
 * Get the status of the Okta integration from real database
 */
export async function getOktaStatus(): Promise<OktaConnectionStatus> {
  const configured = isOktaConfigured()
  const dbCheck = checkDatabaseAvailability()

  if (!dbCheck.available) {
    return {
      configured,
      connection: mockOktaConnection,
    }
  }

  try {
    const { prisma } = await import("@/lib/db/prisma")

    // Ensure connection exists
    let connection = await prisma.integrationConnection.findUnique({
      where: { type: "okta" },
      include: {
        syncRuns: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    })

    if (!connection) {
      connection = await prisma.integrationConnection.create({
        data: {
          type: "okta",
          name: "Okta",
          status: "pending",
        },
        include: {
          syncRuns: {
            orderBy: { startedAt: "desc" },
            take: 10,
          },
        },
      })
    }

    return {
      configured,
      connection: connection as IntegrationConnectionWithRuns,
    }
  } catch (error) {
    console.error("[getOktaStatus] Error:", error)
    return {
      configured,
      connection: mockOktaConnection,
    }
  }
}

/**
 * Trigger a manual Okta sync
 */
export async function triggerOktaSync(): Promise<SyncResult> {
  const correlationId = generateCorrelationId()
  const dbCheck = checkDatabaseAvailability()

  console.log(
    `[triggerOktaSync] correlationId=${correlationId} hasDatabaseUrl=${dbCheck.hasDatabaseUrl} hasDatabaseEnabled=${dbCheck.hasDatabaseEnabled}`,
  )

  const emptyResult = (errorMessage: string): SyncResult => ({
    success: false,
    syncRunId: "",
    recordsProcessed: 0,
    recordsRead: 0,
    recordsWritten: 0,
    usersCreated: 0,
    usersUpdated: 0,
    appsCreated: 0,
    appsUpdated: 0,
    accessRecordsCreated: 0,
    accessRecordsUpdated: 0,
    errorMessage,
    durationMs: 0,
    isPartial: false,
  })

  if (!isOktaConfigured()) {
    console.log(`[triggerOktaSync] correlationId=${correlationId} error=okta_not_configured`)
    return emptyResult("Okta is not configured. Add OKTA_DOMAIN and OKTA_API_TOKEN environment variables.")
  }

  if (!dbCheck.available) {
    console.log(
      `[triggerOktaSync] correlationId=${correlationId} error=database_unavailable reason="${dbCheck.reason}"`,
    )
    return emptyResult(dbCheck.reason || "Database not available.")
  }

  try {
    console.log(`[triggerOktaSync] correlationId=${correlationId} status=starting_sync`)
    const { runOktaSync } = await import("@/lib/integrations/okta/sync")
    const result = await runOktaSync(correlationId)

    console.log(
      `[triggerOktaSync] correlationId=${correlationId} status=${result.success ? "success" : "failed"} records=${result.recordsProcessed} duration=${result.durationMs}ms`,
    )

    return result
  } catch (error) {
    const errorName = error instanceof Error ? error.constructor.name : "UnknownError"
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    console.error(
      `[triggerOktaSync] correlationId=${correlationId} errorName=${errorName} errorMessage="${errorMessage}"`,
    )

    let userMessage = errorMessage
    if (errorMessage.includes("prisma") || errorMessage.includes("Prisma")) {
      userMessage = `Prisma client error: ${errorMessage}. Ensure database migrations are run.`
    } else if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = `Database connection failed: ${errorMessage}. Check DATABASE_URL is correct.`
    }

    return emptyResult(userMessage)
  }
}

/**
 * Get recent sync runs for Okta from real database
 */
export async function getOktaSyncHistory(): Promise<SyncRunRecord[]> {
  const dbCheck = checkDatabaseAvailability()

  if (!dbCheck.available) {
    return []
  }

  try {
    const { prisma } = await import("@/lib/db/prisma")

    const connection = await prisma.integrationConnection.findUnique({
      where: { type: "okta" },
    })

    if (!connection) {
      return []
    }

    const runs = await prisma.syncRun.findMany({
      where: { connectionId: connection.id },
      orderBy: { startedAt: "desc" },
      take: 10,
    })

    return runs as SyncRunRecord[]
  } catch (error) {
    console.error("[getOktaSyncHistory] Error:", error)
    return []
  }
}

/**
 * Get sync statistics for dashboard/overview
 */
export async function getOktaSyncStats(): Promise<{
  totalSyncs: number
  successfulSyncs: number
  totalUsersImported: number
  totalAppsImported: number
  lastSuccessfulSync: Date | null
}> {
  const dbCheck = checkDatabaseAvailability()

  if (!dbCheck.available) {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      totalUsersImported: 0,
      totalAppsImported: 0,
      lastSuccessfulSync: null,
    }
  }

  try {
    const { prisma } = await import("@/lib/db/prisma")

    const connection = await prisma.integrationConnection.findUnique({
      where: { type: "okta" },
      include: {
        syncRuns: true,
      },
    })

    if (!connection) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        totalUsersImported: 0,
        totalAppsImported: 0,
        lastSuccessfulSync: null,
      }
    }

    const successfulRuns = connection.syncRuns.filter((r) => r.status === "completed")

    return {
      totalSyncs: connection.syncRuns.length,
      successfulSyncs: successfulRuns.length,
      totalUsersImported: successfulRuns.reduce((sum, r) => sum + r.usersCreated + r.usersUpdated, 0),
      totalAppsImported: successfulRuns.reduce((sum, r) => sum + r.appsCreated + r.appsUpdated, 0),
      lastSuccessfulSync: connection.lastSuccessfulSyncAt,
    }
  } catch (error) {
    console.error("[getOktaSyncStats] Error:", error)
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      totalUsersImported: 0,
      totalAppsImported: 0,
      lastSuccessfulSync: null,
    }
  }
}
