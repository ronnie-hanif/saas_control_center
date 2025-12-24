/**
 * API route for checking Okta integration status
 */

import { NextResponse } from "next/server"
import { isOktaConfigured } from "@/lib/integrations/okta/client"

export const runtime = "nodejs"

const USE_DATABASE = !!process.env.DATABASE_URL

export async function GET() {
  try {
    const configured = isOktaConfigured()

    if (!USE_DATABASE) {
      return NextResponse.json({
        configured,
        status: "pending",
        lastSyncAt: null,
        recentSyncs: [],
      })
    }

    // Dynamic import to avoid Prisma issues
    const { prisma } = await import("@/lib/db")

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

    return NextResponse.json({
      configured,
      status: connection.status,
      lastSyncAt: connection.lastSyncAt,
      recentSyncs: connection.syncRuns,
    })
  } catch (error) {
    console.error("[Okta Status API] Error:", error)
    return NextResponse.json(
      {
        configured: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
