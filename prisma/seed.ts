import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Starting seed...")

  // Clear existing data in reverse dependency order
  await prisma.auditEvent.deleteMany()
  await prisma.accessReviewDecision.deleteMany()
  await prisma.accessReviewCampaign.deleteMany()
  await prisma.userAppAccess.deleteMany()
  await prisma.application.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.setting.deleteMany()

  console.log("📦 Creating departments...")
  const departments = await Promise.all([
    prisma.department.create({
      data: { name: "Engineering", costCenter: "CC-001", annualBudget: 500000, manager: "John Smith" },
    }),
    prisma.department.create({
      data: { name: "Sales", costCenter: "CC-002", annualBudget: 350000, manager: "Jane Doe" },
    }),
    prisma.department.create({
      data: { name: "Marketing", costCenter: "CC-003", annualBudget: 250000, manager: "Bob Johnson" },
    }),
    prisma.department.create({
      data: { name: "HR", costCenter: "CC-004", annualBudget: 150000, manager: "Sarah Wilson" },
    }),
    prisma.department.create({
      data: { name: "Finance", costCenter: "CC-005", annualBudget: 200000, manager: "Mike Brown" },
    }),
  ])

  console.log("👥 Creating users...")
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Sarah Chen",
        email: "admin@company.com",
        department: "Engineering",
        role: "IT_ADMIN",
        status: "ACTIVE",
        title: "IT Administrator",
        avatarUrl: "/professional-headshot-1.png",
      },
    }),
    prisma.user.create({
      data: {
        name: "Michael Torres",
        email: "security@company.com",
        department: "Engineering",
        role: "SECURITY_ADMIN",
        status: "ACTIVE",
        title: "Security Manager",
        avatarUrl: "/professional-headshot-2.png",
      },
    }),
    prisma.user.create({
      data: {
        name: "Emily Rodriguez",
        email: "finance@company.com",
        department: "Finance",
        role: "FINANCE_ADMIN",
        status: "ACTIVE",
        title: "Finance Director",
        avatarUrl: "/professional-headshot-3.png",
      },
    }),
    prisma.user.create({
      data: {
        name: "David Kim",
        email: "user@company.com",
        department: "Sales",
        role: "USER",
        status: "ACTIVE",
        title: "Sales Representative",
        avatarUrl: "/professional-headshot-4.png",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jessica Martinez",
        email: "jessica.martinez@company.com",
        department: "Marketing",
        role: "DEPARTMENT_ADMIN",
        status: "ACTIVE",
        title: "Marketing Manager",
      },
    }),
    prisma.user.create({
      data: {
        name: "Robert Johnson",
        email: "robert.johnson@company.com",
        department: "HR",
        role: "USER",
        status: "ACTIVE",
        title: "HR Specialist",
      },
    }),
    prisma.user.create({
      data: {
        name: "Amanda Lee",
        email: "amanda.lee@company.com",
        department: "Engineering",
        role: "USER",
        status: "ACTIVE",
        title: "Software Engineer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Chris Wilson",
        email: "chris.wilson@company.com",
        department: "Sales",
        role: "USER",
        status: "INACTIVE",
        title: "Account Executive",
      },
    }),
  ])

  console.log("📱 Creating applications...")
  const apps = await Promise.all([
    prisma.application.create({
      data: {
        name: "Slack",
        category: "Communication",
        ownerId: users[0].id,
        riskLevel: "LOW",
        status: "APPROVED",
        monthlyCost: 1250,
        source: "SSO",
        vendor: "Slack Technologies",
        description: "Team communication and collaboration platform",
        website: "https://slack.com",
        usersCount: 142,
        licensesTotal: 200,
        licensesUsed: 142,
      },
    }),
    prisma.application.create({
      data: {
        name: "Salesforce",
        category: "CRM",
        ownerId: users[3].id,
        riskLevel: "MEDIUM",
        status: "APPROVED",
        monthlyCost: 8500,
        source: "SSO",
        vendor: "Salesforce Inc",
        description: "Customer relationship management platform",
        website: "https://salesforce.com",
        usersCount: 85,
        licensesTotal: 100,
        licensesUsed: 85,
      },
    }),
    prisma.application.create({
      data: {
        name: "GitHub Enterprise",
        category: "Development",
        ownerId: users[0].id,
        riskLevel: "HIGH",
        status: "APPROVED",
        monthlyCost: 4200,
        source: "SSO",
        vendor: "GitHub Inc",
        description: "Source code management and collaboration",
        website: "https://github.com",
        usersCount: 67,
        licensesTotal: 75,
        licensesUsed: 67,
      },
    }),
    prisma.application.create({
      data: {
        name: "Figma",
        category: "Design",
        ownerId: users[4].id,
        riskLevel: "LOW",
        status: "APPROVED",
        monthlyCost: 1800,
        source: "MANUAL",
        vendor: "Figma Inc",
        description: "Collaborative design tool",
        website: "https://figma.com",
        usersCount: 32,
        licensesTotal: 50,
        licensesUsed: 32,
      },
    }),
    prisma.application.create({
      data: {
        name: "Notion",
        category: "Productivity",
        ownerId: users[0].id,
        riskLevel: "LOW",
        status: "PENDING_REVIEW",
        monthlyCost: 960,
        source: "DISCOVERY",
        vendor: "Notion Labs",
        description: "All-in-one workspace for notes and docs",
        website: "https://notion.so",
        usersCount: 89,
        licensesTotal: 100,
        licensesUsed: 89,
      },
    }),
    prisma.application.create({
      data: {
        name: "Dropbox Business",
        category: "Storage",
        ownerId: users[2].id,
        riskLevel: "MEDIUM",
        status: "APPROVED",
        monthlyCost: 2400,
        source: "SSO",
        vendor: "Dropbox Inc",
        description: "Cloud file storage and sharing",
        website: "https://dropbox.com",
        usersCount: 120,
        licensesTotal: 150,
        licensesUsed: 120,
      },
    }),
    prisma.application.create({
      data: {
        name: "Zoom",
        category: "Communication",
        ownerId: users[0].id,
        riskLevel: "LOW",
        status: "APPROVED",
        monthlyCost: 3200,
        source: "SSO",
        vendor: "Zoom Video Communications",
        description: "Video conferencing platform",
        website: "https://zoom.us",
        usersCount: 142,
        licensesTotal: 150,
        licensesUsed: 142,
      },
    }),
    prisma.application.create({
      data: {
        name: "Jira",
        category: "Project Management",
        ownerId: users[6].id,
        riskLevel: "MEDIUM",
        status: "APPROVED",
        monthlyCost: 1500,
        source: "SSO",
        vendor: "Atlassian",
        description: "Issue tracking and project management",
        website: "https://atlassian.com/jira",
        usersCount: 78,
        licensesTotal: 100,
        licensesUsed: 78,
      },
    }),
    prisma.application.create({
      data: {
        name: "AWS Console",
        category: "Infrastructure",
        ownerId: users[0].id,
        riskLevel: "CRITICAL",
        status: "APPROVED",
        monthlyCost: 45000,
        source: "SSO",
        vendor: "Amazon Web Services",
        description: "Cloud infrastructure platform",
        website: "https://aws.amazon.com",
        usersCount: 25,
        licensesTotal: 50,
        licensesUsed: 25,
      },
    }),
    prisma.application.create({
      data: {
        name: "HubSpot",
        category: "Marketing",
        ownerId: users[4].id,
        riskLevel: "MEDIUM",
        status: "APPROVED",
        monthlyCost: 3600,
        source: "MANUAL",
        vendor: "HubSpot Inc",
        description: "Marketing automation platform",
        website: "https://hubspot.com",
        usersCount: 28,
        licensesTotal: 30,
        licensesUsed: 28,
      },
    }),
  ])

  console.log("🔗 Creating user app access...")
  const accessLevels = ["Admin", "Editor", "Viewer", "User"]
  const accessRecords = []

  for (const app of apps) {
    // Give 3-6 random users access to each app
    const numUsers = Math.floor(Math.random() * 4) + 3
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5).slice(0, numUsers)

    for (const user of shuffledUsers) {
      accessRecords.push({
        applicationId: app.id,
        userId: user.id,
        accessLevel: accessLevels[Math.floor(Math.random() * accessLevels.length)],
        lastLoginAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      })
    }
  }

  await prisma.userAppAccess.createMany({ data: accessRecords })

  console.log("📋 Creating access review campaigns...")
  const campaigns = await Promise.all([
    prisma.accessReviewCampaign.create({
      data: {
        name: "Q4 2024 Access Review",
        description: "Quarterly access certification for all critical applications",
        scopeApps: apps.filter((a) => a.riskLevel === "CRITICAL" || a.riskLevel === "HIGH").map((a) => a.id),
        scopeDepartments: ["Engineering", "Finance"],
        dueDate: new Date("2024-12-31"),
        status: "IN_PROGRESS",
        reviewers: [users[0].id, users[1].id],
        createdById: users[0].id,
        tasksTotal: 15,
        tasksCompleted: 8,
        completionPercent: 53,
      },
    }),
    prisma.accessReviewCampaign.create({
      data: {
        name: "SOC2 Annual Review",
        description: "Annual access review for SOC2 compliance",
        scopeApps: apps.map((a) => a.id),
        scopeDepartments: [],
        dueDate: new Date("2024-11-30"),
        status: "COMPLETED",
        reviewers: [users[1].id],
        createdById: users[1].id,
        tasksTotal: 42,
        tasksCompleted: 42,
        completionPercent: 100,
      },
    }),
    prisma.accessReviewCampaign.create({
      data: {
        name: "New Hire Access Audit",
        description: "Review access for employees hired in the last quarter",
        scopeApps: [apps[0].id, apps[1].id, apps[2].id],
        scopeDepartments: ["Engineering", "Sales"],
        dueDate: new Date("2025-01-15"),
        status: "PENDING",
        reviewers: [users[0].id, users[5].id],
        createdById: users[0].id,
        tasksTotal: 24,
        tasksCompleted: 0,
        completionPercent: 0,
      },
    }),
  ])

  console.log("✅ Creating sample access review decisions...")
  // Add some decisions for the completed campaign
  const completedCampaign = campaigns[1]
  const decisionData = []

  for (const access of accessRecords.slice(0, 10)) {
    decisionData.push({
      campaignId: completedCampaign.id,
      applicationId: access.applicationId,
      userId: access.userId,
      decision: Math.random() > 0.2 ? "APPROVED" : "REVOKED",
      rationale: Math.random() > 0.2 ? "Access verified and appropriate for role" : "Access no longer required",
      decidedAt: new Date(),
      decidedById: users[1].id,
    })
  }

  await prisma.accessReviewDecision.createMany({ data: decisionData as any })

  console.log("📝 Creating audit events...")
  await prisma.auditEvent.createMany({
    data: [
      {
        actor: "system",
        action: "CAMPAIGN_CREATED",
        objectType: "AccessReviewCampaign",
        objectId: campaigns[0].id,
        detailsJson: { name: campaigns[0].name },
      },
      {
        actor: "system",
        action: "CAMPAIGN_CREATED",
        objectType: "AccessReviewCampaign",
        objectId: campaigns[1].id,
        detailsJson: { name: campaigns[1].name },
      },
      {
        actor: users[1].email,
        action: "CAMPAIGN_COMPLETED",
        objectType: "AccessReviewCampaign",
        objectId: campaigns[1].id,
        detailsJson: { name: campaigns[1].name, completedAt: new Date().toISOString() },
      },
    ],
  })

  console.log("⚙️ Creating settings...")
  await prisma.setting.createMany({
    data: [
      { key: "risk_scoring_enabled", value: "true", category: "risk" },
      { key: "risk_critical_threshold", value: "90", category: "risk" },
      { key: "risk_high_threshold", value: "70", category: "risk" },
      { key: "notification_email_enabled", value: "true", category: "notifications" },
      { key: "notification_slack_enabled", value: "false", category: "notifications" },
    ],
  })

  console.log("✅ Seed completed successfully!")
  console.log(`   - ${departments.length} departments`)
  console.log(`   - ${users.length} users`)
  console.log(`   - ${apps.length} applications`)
  console.log(`   - ${accessRecords.length} user-app access records`)
  console.log(`   - ${campaigns.length} access review campaigns`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
