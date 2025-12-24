"use server"

import { revalidatePath } from "next/cache"

const USE_DATABASE = !!process.env.DATABASE_URL

export async function makeAccessDecision(
  decisionId: string,
  decision: "approved" | "revoked",
  rationale: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_DATABASE) {
      const { accessReviewService } = await import("@/lib/services")
      const { systemContext } = await import("@/lib/audit")

      await accessReviewService.makeDecision(
        systemContext(), // Use "system" until OIDC is implemented
        decisionId,
        decision,
        rationale,
      )
    } else {
      // Mock: just update in-memory (will reset on reload)
      const { updateTask } = await import("@/lib/data")
      await updateTask(decisionId, decision, "system")
    }

    revalidatePath("/access-reviews")
    return { success: true }
  } catch (error) {
    console.error("[AccessReview] Decision failed:", error)
    return { success: false, error: "Failed to record decision" }
  }
}

export async function bulkAccessDecision(
  decisionIds: string[],
  decision: "approved" | "revoked",
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0

    if (USE_DATABASE) {
      const { accessReviewService } = await import("@/lib/services")
      const { systemContext } = await import("@/lib/audit")
      const ctx = systemContext()

      for (const id of decisionIds) {
        await accessReviewService.makeDecision(ctx, id, decision, `Bulk ${decision} action`)
        count++
      }
    } else {
      // Mock: update in-memory
      const { updateTask } = await import("@/lib/data")
      for (const id of decisionIds) {
        await updateTask(id, decision, "system")
        count++
      }
    }

    revalidatePath("/access-reviews")
    return { success: true, count }
  } catch (error) {
    console.error("[AccessReview] Bulk decision failed:", error)
    return { success: false, count: 0, error: "Failed to record bulk decisions" }
  }
}
