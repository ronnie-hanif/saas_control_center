import { defineConfig } from "prisma/config"

// Prisma 7 configuration file
// This file must be at the repository root (same level as package.json)
export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  migrate: {
    async adapter() {
      // Use unpooled connection for migrations if available, otherwise pooled
      const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
      if (!url) {
        throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED must be set for Prisma migrations")
      }
      const { Pool } = await import("pg")
      const { PrismaPg } = await import("@prisma/adapter-pg")
      return new PrismaPg(new Pool({ connectionString: url }))
    },
  },
})
