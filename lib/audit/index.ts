// Now uses dynamic import for auditRepository

export type AuditAction = "create" | "update" | "delete" | "export" | "bulk_update" | "decision"
export type AuditObjectType = "user" | "application" | "contract" | "campaign" | "decision" | "department" | "setting"

export interface AuditContext {
  actor: string // user id or "system"
  actorEmail?: string
}

export interface AuditEventInput {
  action: AuditAction
  objectType: AuditObjectType
  objectId: string
  objectName?: string
  details?: Record<string, unknown>
}

/**
 * Create an audit event. Should be called after every write operation.
 * Uses dynamic import to avoid bundling database code into client.
 */
export async function audit(ctx: AuditContext, event: AuditEventInput): Promise<void> {
  // Skip audit if not on server or no database
  if (typeof window !== "undefined" || !process.env.DATABASE_URL) {
    return
  }

  try {
    const { auditRepository } = await import("@/lib/repositories")
    await auditRepository.create({
      actor: ctx.actor,
      actorEmail: ctx.actorEmail,
      action: event.action,
      objectType: event.objectType,
      objectId: event.objectId,
      objectName: event.objectName,
      detailsJson: event.details ?? null,
    })
  } catch (error) {
    // Log but don't throw - audit failures shouldn't break the main operation
    console.error("[Audit] Failed to create audit event:", error)
  }
}

/**
 * Get a system context for automated operations
 */
export function systemContext(): AuditContext {
  return { actor: "system", actorEmail: undefined }
}

/**
 * Create audit context from user session
 */
export function userContext(userId: string, email?: string): AuditContext {
  return { actor: userId, actorEmail: email }
}

/**
 * Helper to audit an export action
 */
export async function auditExport(
  ctx: AuditContext,
  objectType: AuditObjectType,
  format: "csv" | "json",
  recordCount: number,
  filters?: Record<string, unknown>,
): Promise<void> {
  await audit(ctx, {
    action: "export",
    objectType,
    objectId: "bulk",
    objectName: `${objectType} export`,
    details: {
      format,
      recordCount,
      filters,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Get audit repository dynamically (for direct access when needed)
 */
export async function getAuditRepository() {
  if (typeof window !== "undefined" || !process.env.DATABASE_URL) {
    return null
  }
  const { auditRepository } = await import("@/lib/repositories")
  return auditRepository
}
