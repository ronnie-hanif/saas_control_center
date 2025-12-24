/**
 * Singleton Prisma client for database access
 * Uses @prisma/adapter-pg for Prisma 7 compatibility
 * IMPORTANT: Only use in Node.js runtime (not Edge)
 */

import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error("[Prisma] DATABASE_URL is not set")
    throw new Error("DATABASE_URL environment variable is required")
  }

  // Create or reuse pg Pool
  const pool = globalForPrisma.pool ?? new Pool({ connectionString })
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool
  }

  // Create adapter
  const adapter = new PrismaPg(pool)

  // Create Prisma client with adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
