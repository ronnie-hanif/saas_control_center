/**
 * Okta API Client - Read-only connector for user and app data
 * Uses OKTA_DOMAIN and OKTA_API_TOKEN env vars
 */

export interface OktaUser {
  id: string
  status: string
  profile: {
    login: string
    email: string
    firstName: string
    lastName: string
    displayName?: string
    title?: string
    department?: string
    manager?: string
    managerId?: string
  }
  lastLogin?: string
  created: string
  activated?: string
}

export interface OktaApp {
  id: string
  name: string
  label: string
  status: string
  created: string
  lastUpdated: string
  signOnMode: string
  features?: string[]
}

export interface OktaAppUser {
  id: string
  scope: string
  status: string
  created: string
  lastUpdated: string
  profile?: {
    role?: string
  }
  credentials?: {
    userName?: string
  }
}

export interface OktaConfig {
  domain: string
  apiToken: string
}

export function getOktaConfig(): OktaConfig | null {
  const domain = process.env.OKTA_DOMAIN
  const apiToken = process.env.OKTA_API_TOKEN

  if (!domain || !apiToken) {
    return null
  }

  return { domain, apiToken }
}

export function isOktaConfigured(): boolean {
  return getOktaConfig() !== null
}

async function oktaFetch<T>(config: OktaConfig, endpoint: string, options: { limit?: number } = {}): Promise<T[]> {
  const { domain, apiToken } = config
  const baseUrl = domain.startsWith("https://") ? domain : `https://${domain}`
  const limit = options.limit || 200

  const url = new URL(`${baseUrl}/api/v1${endpoint}`)
  url.searchParams.set("limit", String(limit))

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `SSWS ${apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // Disable caching for API calls
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Okta API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export async function listOktaUsers(config: OktaConfig): Promise<OktaUser[]> {
  console.log("[Okta] Fetching users...")
  const users = await oktaFetch<OktaUser>(config, "/users", { limit: 200 })
  console.log(`[Okta] Fetched ${users.length} users`)
  return users
}

export async function listOktaApps(config: OktaConfig): Promise<OktaApp[]> {
  console.log("[Okta] Fetching applications...")
  const apps = await oktaFetch<OktaApp>(config, "/apps", { limit: 200 })
  console.log(`[Okta] Fetched ${apps.length} applications`)
  return apps
}

export async function listOktaAppUsers(config: OktaConfig, appId: string): Promise<OktaAppUser[]> {
  const users = await oktaFetch<OktaAppUser>(config, `/apps/${appId}/users`, { limit: 200 })
  return users
}
