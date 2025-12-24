import { NextResponse } from "next/server"
import { createSession } from "@/lib/auth/session"
import { users } from "@/lib/mock-data"
import type { Role } from "@/lib/auth/types"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find user in mock data
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Create session with user data
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user.role as Role) || "READ_ONLY",
      department: user.department,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sign-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
