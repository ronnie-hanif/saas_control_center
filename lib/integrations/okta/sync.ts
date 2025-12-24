/**
 * Okta Sync Service - Ingests Okta data into local database
 * Shadow mode: read-only, no write-back to Okta
 * Features: idempotent upserts, retry/backoff, incremental sync support, timebox
 */

import { getOktaConfig, listOktaUsers, listOktaApps, listOktaAppUsers, type OktaApp } from "./client"

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

interface SyncStats {
  recordsProcessed: number
  recordsRead: number
  recordsWritten: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
  accessRecordsUpdated: number
}

// Timebox: 4 minutes to leave buffer for serverless timeout
const SYNC_TIMEOUT_MS = 4 * 60 * 1000

/**
 * Map Okta user status to our UserStatus enum
 */
function mapUserStatus(oktaStatus: string): "active" | "inactive" | "suspended" | "offboarding" {
  switch (oktaStatus.toUpperCase()) {
    case "ACTIVE":
      return "active"
    case "SUSPENDED":
      return "suspended"
    case "DEPROVISIONED":
      return "offboarding"
    default:
      return "inactive"
  }
}

/**
 * Categorize app based on name/type
 */
function categorizeApp(app: OktaApp): string {
  const name = app.label.toLowerCase()

  if (name.includes("slack") || name.includes("zoom") || name.includes("teams") || name.includes("meet")) {
    return "Communication"
  }
  if (name.includes("jira") || name.includes("asana") || name.includes("monday") || name.includes("trello")) {
    return "Productivity"
  }
  if (name.includes("salesforce") || name.includes("hubspot") || name.includes("crm")) {
    return "CRM"
  }
  if (name.includes("aws") || name.includes("azure") || name.includes("gcp") || name.includes("cloud")) {
    return "Infrastructure"
  }
  if (name.includes("github") || name.includes("gitlab") || name.includes("bitbucket")) {
    return "Development"
  }
  if (name.includes("google") || name.includes("office") || name.includes("microsoft")) {
    return "Productivity"
  }

  return "Other"
}

/**
 * Sanitize error message for safe display (no secrets)
 */
function sanitizeError(error: unknown): { message: string; summary: string } {
  const message = error instanceof Error ? error.message : String(error)
  // Remove any potential secrets/tokens from error
  const sanitized = message
    .replace(/SSWS\s+\S+/gi, "SSWS [REDACTED]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/api[_-]?token[=:]\S+/gi, "api_token=[REDACTED]")
    .replace(/password[=:]\S+/gi, "password=[REDACTED]")

  // Create a short summary for UI
  const summary = sanitized.length > 200 ? sanitized.substring(0, 197) + "..." : sanitized

  return { message: sanitized, summary }
}

/**
 * Get Prisma client with runtime checks
 */
async function getPrismaClient(correlationId: string): Promise<{
  prisma: Awaited<ReturnType<typeof import("@/lib/db/prisma")>>["prisma"] | null
  error?: string
}> {
  const hasDatabaseUrl = !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
  const hasDatabaseEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED === "true"

  console.log(
    `[Okta Sync] correlationId=${correlationId} getPrismaClient hasDatabaseUrl=${hasDatabaseUrl} hasDatabaseEnabled=${hasDatabaseEnabled}`,
  )

  if (!hasDatabaseEnabled) {
    return { prisma: null, error: "Database feature is disabled (NEXT_PUBLIC_DATABASE_ENABLED != true)" }
  }

  if (!hasDatabaseUrl) {
    return { prisma: null, error: "DATABASE_URL environment variable is not set" }
  }

  try {
    const { prisma } = await import("@/lib/db/prisma")
    return { prisma }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[Okta Sync] correlationId=${correlationId} Prisma import failed: ${errorMsg}`)
    return { prisma: null, error: `Prisma client initialization failed: ${errorMsg}` }
  }
}

/**
 * Run a full Okta sync with idempotent upserts
 */
export async function runOktaSync(correlationId?: string): Promise<SyncResult> {
  const cid = correlationId || `sync-${Date.now()}`
  const startTime = Date.now()
  const config = getOktaConfig()

  console.log(`[Okta Sync] correlationId=${cid} Starting sync`)

  const emptyResult = (errorMessage: string, errorSummary?: string): SyncResult => ({
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
    errorSummary: errorSummary || errorMessage,
    durationMs: Date.now() - startTime,
    isPartial: false,
  })

  if (!config) {
    console.log(`[Okta Sync] correlationId=${cid} error=okta_not_configured`)
    return emptyResult("Okta not configured. Set OKTA_DOMAIN and OKTA_API_TOKEN.")
  }

  const { prisma, error: prismaError } = await getPrismaClient(cid)
  if (!prisma) {
    console.log(`[Okta Sync] correlationId=${cid} error=database_unavailable reason="${prismaError}"`)
    return emptyResult(prismaError || "Database not available")
  }

  // Get or create the Okta integration connection
  let connection = await prisma.integrationConnection.findUnique({
    where: { type: "okta" },
  })

  if (!connection) {
    connection = await prisma.integrationConnection.create({
      data: {
        type: "okta",
        name: "Okta",
        status: "connected",
      },
    })
  }

  // Create a new sync run
  const syncRun = await prisma.syncRun.create({
    data: {
      connectionId: connection.id,
      status: "running",
    },
  })

  const stats: SyncStats = {
    recordsProcessed: 0,
    recordsRead: 0,
    recordsWritten: 0,
    usersCreated: 0,
    usersUpdated: 0,
    appsCreated: 0,
    appsUpdated: 0,
    accessRecordsCreated: 0,
    accessRecordsUpdated: 0,
  }

  let isPartial = false
  let resumeToken: string | undefined

  // Helper to check if we should stop due to timeout
  const shouldStop = () => {
    const elapsed = Date.now() - startTime
    if (elapsed > SYNC_TIMEOUT_MS) {
      console.log(`[Okta Sync] correlationId=${cid} Timebox reached at ${elapsed}ms`)
      return true
    }
    return false
  }

  try {
    console.log(`[Okta Sync] correlationId=${cid} Starting sync run ${syncRun.id}`)

    // 1. Fetch and sync users with idempotent upserts
    const oktaUsers = await listOktaUsers(config)
    stats.recordsRead += oktaUsers.length
    const userIdMap = new Map<string, string>() // Okta ID -> DB ID

    for (const oktaUser of oktaUsers) {
      if (shouldStop()) {
        isPartial = true
        resumeToken = `users:${oktaUser.id}`
        break
      }

      const email = oktaUser.profile.email
      if (!email) continue

      const userData = {
        oktaId: oktaUser.id,
        name: oktaUser.profile.displayName || `${oktaUser.profile.firstName} ${oktaUser.profile.lastName}`,
        email,
        department: oktaUser.profile.department || "Unknown",
        title: oktaUser.profile.title || null,
        manager: oktaUser.profile.manager || null,
        status: mapUserStatus(oktaUser.status),
        lastActive: oktaUser.lastLogin ? new Date(oktaUser.lastLogin) : null,
        startDate: oktaUser.created ? new Date(oktaUser.created) : null,
      }

      // Idempotent upsert by oktaId
      const result = await prisma.user.upsert({
        where: { oktaId: oktaUser.id },
        create: userData,
        update: {
          name: userData.name,
          email: userData.email,
          department: userData.department,
          title: userData.title,
          manager: userData.manager,
          status: userData.status,
          lastActive: userData.lastActive,
        },
      })

      userIdMap.set(oktaUser.id, result.id)

      // Check if this was a create or update by comparing createdAt and updatedAt
      const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
      if (isNew) {
        stats.usersCreated++
      } else {
        stats.usersUpdated++
      }
      stats.recordsProcessed++
      stats.recordsWritten++
    }

    console.log(`[Okta Sync] correlationId=${cid} Synced ${stats.usersCreated + stats.usersUpdated} users`)

    if (isPartial) {
      // Stop early if timeboxed
      throw new Error("Sync timeboxed - will resume on next run")
    }

    // 2. Fetch and sync applications with idempotent upserts
    const oktaApps = await listOktaApps(config)
    stats.recordsRead += oktaApps.length
    const appIdMap = new Map<string, string>() // Okta App ID -> DB ID

    for (const oktaApp of oktaApps) {
      if (shouldStop()) {
        isPartial = true
        resumeToken = `apps:${oktaApp.id}`
        break
      }

      // Skip inactive apps
      if (oktaApp.status !== "ACTIVE") continue

      const appData = {
        oktaAppId: oktaApp.id,
        name: oktaApp.label,
        vendor: oktaApp.name,
        category: categorizeApp(oktaApp),
        source: "okta" as const,
        status: "sanctioned" as const,
        ssoConnected: true,
        lastActivity: oktaApp.lastUpdated ? new Date(oktaApp.lastUpdated) : null,
      }

      // Idempotent upsert by oktaAppId
      const result = await prisma.application.upsert({
        where: { oktaAppId: oktaApp.id },
        create: appData,
        update: {
          name: appData.name,
          vendor: appData.vendor,
          category: appData.category,
          lastActivity: appData.lastActivity,
        },
      })

      appIdMap.set(oktaApp.id, result.id)

      const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
      if (isNew) {
        stats.appsCreated++
      } else {
        stats.appsUpdated++
      }
      stats.recordsProcessed++
      stats.recordsWritten++
    }

    console.log(`[Okta Sync] correlationId=${cid} Synced ${stats.appsCreated + stats.appsUpdated} applications`)

    if (isPartial) {
      throw new Error("Sync timeboxed - will resume on next run")
    }

    // 3. Fetch and sync app assignments (user access) with idempotent upserts
    for (const oktaApp of oktaApps) {
      if (shouldStop()) {
        isPartial = true
        resumeToken = `access:${oktaApp.id}`
        break
      }

      if (oktaApp.status !== "ACTIVE") continue

      const dbAppId = appIdMap.get(oktaApp.id)
      if (!dbAppId) continue

      try {
        const appUsers = await listOktaAppUsers(config, oktaApp.id)
        stats.recordsRead += appUsers.length

        for (const appUser of appUsers) {
          // Find the user by their Okta ID from our map
          const dbUserId = userIdMap.get(appUser.id)
          if (!dbUserId) continue

          // Idempotent upsert by unique constraint
          const result = await prisma.userAppAccess.upsert({
            where: {
              userId_applicationId: {
                userId: dbUserId,
                applicationId: dbAppId,
              },
            },
            create: {
              userId: dbUserId,
              applicationId: dbAppId,
              accessLevel: appUser.profile?.role || "user",
              status: appUser.status === "ACTIVE" ? "active" : "inactive",
              lastLogin: appUser.lastUpdated ? new Date(appUser.lastUpdated) : null,
            },
            update: {
              accessLevel: appUser.profile?.role || "user",
              status: appUser.status === "ACTIVE" ? "active" : "inactive",
              lastLogin: appUser.lastUpdated ? new Date(appUser.lastUpdated) : null,
              updatedAt: new Date(),
            },
          })

          const isNew = result.createdAt.getTime() === result.updatedAt.getTime()
          if (isNew) {
            stats.accessRecordsCreated++
          } else {
            stats.accessRecordsUpdated++
          }
          stats.recordsProcessed++
          stats.recordsWritten++
        }
      } catch (err) {
        // Log but continue - some apps may not allow listing users
        console.warn(`[Okta Sync] correlationId=${cid} Could not fetch users for app ${oktaApp.label}: ${err}`)
      }
    }

    console.log(
      `[Okta Sync] correlationId=${cid} Created ${stats.accessRecordsCreated}, updated ${stats.accessRecordsUpdated} access records`,
    )

    const durationMs = Date.now() - startTime

    // Update sync run as completed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: isPartial ? "failed" : "completed",
        finishedAt: new Date(),
        durationMs,
        isPartial,
        resumeToken,
        ...stats,
      },
    })

    // Update connection status
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: "connected",
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: isPartial ? connection.lastSuccessfulSyncAt : new Date(),
      },
    })

    // Log audit event
    await prisma.auditEvent.create({
      data: {
        actor: "system",
        action: "sync",
        objectType: "integration",
        objectId: connection.id,
        objectName: "Okta",
        detailsJson: {
          syncRunId: syncRun.id,
          correlationId: cid,
          ...stats,
          durationMs,
          isPartial,
        },
      },
    })

    console.log(`[Okta Sync] correlationId=${cid} Sync completed successfully in ${durationMs}ms`)

    return {
      success: !isPartial,
      syncRunId: syncRun.id,
      ...stats,
      durationMs,
      isPartial,
      resumeToken,
    }
  } catch (error) {
    const { message, summary } = sanitizeError(error)
    console.error(`[Okta Sync] correlationId=${cid} Sync failed: ${message}`)

    const durationMs = Date.now() - startTime

    // Update sync run as failed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        durationMs,
        errorMessage: message,
        errorSummary: summary,
        isPartial,
        resumeToken,
        ...stats,
      },
    })

    // Update connection status to error
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: "error",
      },
    })

    return {
      success: false,
      syncRunId: syncRun.id,
      ...stats,
      errorMessage: message,
      errorSummary: summary,
      durationMs,
      isPartial,
      resumeToken,
    }
  }
}
