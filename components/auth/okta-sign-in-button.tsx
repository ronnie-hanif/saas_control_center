"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function OktaSignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("okta", { callbackUrl: "/" })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSignIn} disabled={isLoading} className="w-full bg-[#007dc1] hover:bg-[#006ba1] text-white">
      {isLoading ? "Redirecting to Okta..." : "Continue with Okta"}
    </Button>
  )
}
