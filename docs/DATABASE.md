# Database Setup

This project uses **Prisma** with **PostgreSQL** (Neon) for data persistence.

## Environment Variables

Add these to your `.env.local` or Vercel environment:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Generate Prisma client
```bash
npm run prisma:generate
```

### 3. Push schema to database
```bash
npm run prisma:push
```

### 4. Seed the database
```bash
npm run prisma:seed
```

### 5. (Optional) Open Prisma Studio
```bash
npm run prisma:studio
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run prisma:generate` | Generate Prisma client from schema |
| `npm run prisma:migrate` | Create and apply migrations (dev) |
| `npm run prisma:push` | Push schema changes without migration |
| `npm run prisma:seed` | Seed database with sample data |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database and re-seed |

## Schema Overview

The database schema includes:

- **User** - Organization users with roles and departments
- **Application** - SaaS applications tracked in the system
- **UserAppAccess** - Junction table for user-application access
- **AccessReviewCampaign** - Access certification campaigns
- **AccessReviewDecision** - Individual review decisions
- **AuditEvent** - Append-only audit log
- **Department** - Organizational cost centers
- **Setting** - System configuration key-value store

## Demo Mode

When `DATABASE_URL` is not set, the application falls back to mock data for demo purposes. All features work identically, but data is not persisted.

## Troubleshooting

### "Cannot find module '@prisma/client'"
Run `npm run prisma:generate` to generate the client.

### "Connection refused" or "ECONNREFUSED"
Verify your `DATABASE_URL` is correct and the database is accessible.

### Reset everything
Run `npm run db:reset` to drop all data and re-seed.
