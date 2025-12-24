"use server"

import { isOktaConfigured } from "@/lib/integrations/okta/client"
import { generateCorrelationId } from "@/lib/logger"

export interface SyncRunRecord {
  id: string
  connectionId: string
  status: string
  startedAt: Date
  finishedAt: Date | null
  recordsProcessed: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  errorMessage: string | null
}

export interface IntegrationConnectionWithRuns {
  id: string
  type: string
  name: string
  status: string
  configJson: unknown | null
  lastSyncAt: Date | null
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
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  errorMessage?: string
  durationMs: number
}

// Mock connection for when DB is not available
const mockOktaConnection: IntegrationConnectionWithRuns = {
  id: "okta-integration",
  type: "okta",
  name: "Okta",
  status: "pending",
  configJson: null,
  lastSyncAt: null,
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
 * Get the status of the Okta integration
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

  if (!isOktaConfigured()) {
    console.log(`[triggerOktaSync] correlationId=${correlationId} error=okta_not_configured`)
    return {
      success: false,
      syncRunId: "",
      recordsProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      appsCreated: 0,
      appsUpdated: 0,
      accessRecordsCreated: 0,
      errorMessage: "Okta is not configured. Add OKTA_DOMAIN and OKTA_API_TOKEN environment variables.",
      durationMs: 0,
    }
  }

  if (!dbCheck.available) {
    console.log(
      `[triggerOktaSync] correlationId=${correlationId} error=database_unavailable reason="${dbCheck.reason}"`,
    )
    return {
      success: false,
      syncRunId: "",
      recordsProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      appsCreated: 0,
      appsUpdated: 0,
      accessRecordsCreated: 0,
      errorMessage: dbCheck.reason || "Database not available.",
      durationMs: 0,
    }
  }

  try {
    console.log(`[triggerOktaSync] correlationId=${correlationId} status=starting_sync`)
    // Dynamic import to avoid Prisma issues in preview
    const { runOktaSync } = await import("@/lib/integrations/okta/sync")
    const result = await runOktaSync(correlationId)

    console.log(
      `[triggerOktaSync] correlationId=${correlationId} status=${result.success ? "success" : "failed"} records=${result.recordsProcessed}`,
    )

    return result
  } catch (error) {
    const errorName = error instanceof Error ? error.constructor.name : "UnknownError"
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    console.error(
      `[triggerOktaSync] correlationId=${correlationId} errorName=${errorName} errorMessage="${errorMessage}"`,
    )

    // Provide actionable error messages
    let userMessage = errorMessage
    if (errorMessage.includes("prisma") || errorMessage.includes("Prisma")) {
      userMessage = `Prisma client error: ${errorMessage}. Ensure database migrations are run.`
    } else if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      userMessage = `Database connection failed: ${errorMessage}. Check DATABASE_URL is correct.`
    }

    return {
      success: false,
      syncRunId: "",
      recordsProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      appsCreated: 0,
      appsUpdated: 0,
      accessRecordsCreated: 0,
      errorMessage: userMessage,
      durationMs: 0,
    }
  }
}

/**
 * Get recent sync runs for Okta
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
