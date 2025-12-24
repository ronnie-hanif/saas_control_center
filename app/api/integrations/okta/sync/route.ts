/**
 * API route for triggering Okta sync (for external automation/webhooks)
 */

import { NextResponse } from "next/server"
import { runOktaSync, isOktaConfigured } from "@/lib/integrations"

export const runtime = "nodejs"

export async function POST() {
  if (!isOktaConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Okta is not configured",
      },
      { status: 400 },
    )
  }

  try {
    const result = await runOktaSync()

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error("[Okta Sync API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
