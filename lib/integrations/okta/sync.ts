/**
 * Okta Sync Service - Ingests Okta data into local database
 * Shadow mode: read-only, no write-back to Okta
 * Uses dynamic imports to avoid Prisma issues in v0 preview
 */

import { getOktaConfig, listOktaUsers, listOktaApps, listOktaAppUsers, type OktaApp } from "./client"

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

interface SyncStats {
  recordsProcessed: number
  usersCreated: number
  usersUpdated: number
  appsCreated: number
  appsUpdated: number
  accessRecordsCreated: number
}

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
 * Get Prisma client with runtime checks
 */
async function getPrismaClient(correlationId: string): Promise<{
  prisma: Awaited<ReturnType<typeof import("@/lib/db/prisma")>>["prisma"] | null
  error?: string
}> {
  // Check at runtime, not module load
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
 * Run a full Okta sync
 */
export async function runOktaSync(correlationId?: string): Promise<SyncResult> {
  const cid = correlationId || `sync-${Date.now()}`
  const startTime = Date.now()
  const config = getOktaConfig()

  console.log(`[Okta Sync] correlationId=${cid} Starting sync`)

  if (!config) {
    console.log(`[Okta Sync] correlationId=${cid} error=okta_not_configured`)
    return {
      success: false,
      syncRunId: "",
      recordsProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      appsCreated: 0,
      appsUpdated: 0,
      accessRecordsCreated: 0,
      errorMessage: "Okta not configured. Set OKTA_DOMAIN and OKTA_API_TOKEN.",
      durationMs: Date.now() - startTime,
    }
  }

  const { prisma, error: prismaError } = await getPrismaClient(cid)
  if (!prisma) {
    console.log(`[Okta Sync] correlationId=${cid} error=database_unavailable reason="${prismaError}"`)
    return {
      success: false,
      syncRunId: "",
      recordsProcessed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      appsCreated: 0,
      appsUpdated: 0,
      accessRecordsCreated: 0,
      errorMessage: prismaError || "Database not available",
      durationMs: Date.now() - startTime,
    }
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
    usersCreated: 0,
    usersUpdated: 0,
    appsCreated: 0,
    appsUpdated: 0,
    accessRecordsCreated: 0,
  }

  try {
    console.log(`[Okta Sync] correlationId=${cid} Starting sync run ${syncRun.id}`)

    // 1. Fetch and sync users
    const oktaUsers = await listOktaUsers(config)
    const userIdMap = new Map<string, string>() // Okta ID -> DB ID

    for (const oktaUser of oktaUsers) {
      const email = oktaUser.profile.email
      if (!email) continue

      const userData = {
        name: oktaUser.profile.displayName || `${oktaUser.profile.firstName} ${oktaUser.profile.lastName}`,
        email,
        department: oktaUser.profile.department || "Unknown",
        title: oktaUser.profile.title || null,
        manager: oktaUser.profile.manager || null,
        status: mapUserStatus(oktaUser.status),
        lastActive: oktaUser.lastLogin ? new Date(oktaUser.lastLogin) : null,
        startDate: oktaUser.created ? new Date(oktaUser.created) : null,
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        await prisma.user.update({
          where: { email },
          data: userData,
        })
        userIdMap.set(oktaUser.id, existingUser.id)
        stats.usersUpdated++
      } else {
        const newUser = await prisma.user.create({
          data: userData,
        })
        userIdMap.set(oktaUser.id, newUser.id)
        stats.usersCreated++
      }
      stats.recordsProcessed++
    }

    console.log(`[Okta Sync] correlationId=${cid} Synced ${stats.usersCreated + stats.usersUpdated} users`)

    // 2. Fetch and sync applications
    const oktaApps = await listOktaApps(config)
    const appIdMap = new Map<string, string>() // Okta App ID -> DB ID

    for (const oktaApp of oktaApps) {
      // Skip inactive apps
      if (oktaApp.status !== "ACTIVE") continue

      const appData = {
        name: oktaApp.label,
        vendor: oktaApp.name,
        category: categorizeApp(oktaApp),
        source: "okta" as const,
        status: "sanctioned" as const,
        ssoConnected: true,
        lastActivity: oktaApp.lastUpdated ? new Date(oktaApp.lastUpdated) : null,
      }

      // Check if app exists by name (since Okta ID isn't stored)
      const existingApp = await prisma.application.findFirst({
        where: {
          name: oktaApp.label,
          source: "okta",
        },
      })

      if (existingApp) {
        await prisma.application.update({
          where: { id: existingApp.id },
          data: appData,
        })
        appIdMap.set(oktaApp.id, existingApp.id)
        stats.appsUpdated++
      } else {
        const newApp = await prisma.application.create({
          data: appData,
        })
        appIdMap.set(oktaApp.id, newApp.id)
        stats.appsCreated++
      }
      stats.recordsProcessed++
    }

    console.log(`[Okta Sync] correlationId=${cid} Synced ${stats.appsCreated + stats.appsUpdated} applications`)

    // 3. Fetch and sync app assignments (user access)
    for (const oktaApp of oktaApps) {
      if (oktaApp.status !== "ACTIVE") continue

      const dbAppId = appIdMap.get(oktaApp.id)
      if (!dbAppId) continue

      try {
        const appUsers = await listOktaAppUsers(config, oktaApp.id)

        for (const appUser of appUsers) {
          // Find the user by their Okta ID from our map
          const dbUserId = userIdMap.get(appUser.id)
          if (!dbUserId) continue

          // Upsert the access record
          await prisma.userAppAccess.upsert({
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
            },
            update: {
              accessLevel: appUser.profile?.role || "user",
              status: appUser.status === "ACTIVE" ? "active" : "inactive",
              updatedAt: new Date(),
            },
          })

          stats.accessRecordsCreated++
          stats.recordsProcessed++
        }
      } catch (err) {
        // Log but continue - some apps may not allow listing users
        console.warn(`[Okta Sync] correlationId=${cid} Could not fetch users for app ${oktaApp.label}: ${err}`)
      }
    }

    console.log(`[Okta Sync] correlationId=${cid} Created ${stats.accessRecordsCreated} access records`)

    // Update sync run as completed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        ...stats,
      },
    })

    // Update connection status
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: "connected",
        lastSyncAt: new Date(),
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
          ...stats,
        },
      },
    })

    console.log(`[Okta Sync] correlationId=${cid} Sync completed successfully`)

    return {
      success: true,
      syncRunId: syncRun.id,
      ...stats,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`[Okta Sync] correlationId=${cid} Sync failed: ${errorMessage}`)

    // Update sync run as failed
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage,
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
      errorMessage,
      durationMs: Date.now() - startTime,
    }
  }
}
