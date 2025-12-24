/**
 * Okta API Client - Read-only connector for user and app data
 * Uses OKTA_DOMAIN and OKTA_API_TOKEN env vars
 * Includes retry/backoff for rate limits and pagination support
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
  lastUpdated?: string
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
  syncState?: string
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

export interface OktaPaginatedResult<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function oktaFetchWithRetry<T>(
  config: OktaConfig,
  url: string,
  maxRetries = 3,
): Promise<{ data: T[]; nextLink: string | null }> {
  const { apiToken } = config
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `SSWS ${apiToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get("x-rate-limit-reset")
        const waitMs = retryAfter
          ? Math.max(0, Number.parseInt(retryAfter, 10) * 1000 - Date.now())
          : Math.pow(2, attempt) * 1000
        console.log(`[Okta] Rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}`)
        await sleep(Math.min(waitMs, 60000)) // Max 60s wait
        continue
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        throw new Error(`Okta API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      // Parse Link header for pagination
      const linkHeader = response.headers.get("link")
      let nextLink: string | null = null
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
        if (nextMatch) {
          nextLink = nextMatch[1]
        }
      }

      return { data, nextLink }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Retry on transient errors
      if (attempt < maxRetries && isTransientError(lastError)) {
        const backoffMs = Math.pow(2, attempt) * 1000
        console.log(`[Okta] Transient error, retrying in ${backoffMs}ms: ${lastError.message}`)
        await sleep(backoffMs)
        continue
      }

      throw lastError
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("network") ||
    message.includes("socket")
  )
}

async function oktaFetchAll<T>(
  config: OktaConfig,
  endpoint: string,
  options: { limit?: number; maxPages?: number } = {},
): Promise<T[]> {
  const { domain } = config
  const baseUrl = domain.startsWith("https://") ? domain : `https://${domain}`
  const limit = options.limit || 200
  const maxPages = options.maxPages || 50 // Safety limit

  const url = new URL(`${baseUrl}/api/v1${endpoint}`)
  url.searchParams.set("limit", String(limit))

  const allData: T[] = []
  let nextUrl: string | null = url.toString()
  let pageCount = 0

  while (nextUrl && pageCount < maxPages) {
    const { data, nextLink } = await oktaFetchWithRetry<T>(config, nextUrl)
    allData.push(...data)
    nextUrl = nextLink
    pageCount++

    if (nextLink) {
      console.log(`[Okta] Fetched page ${pageCount}, total records: ${allData.length}`)
    }
  }

  return allData
}

export async function listOktaUsersPaginated(
  config: OktaConfig,
  cursor?: string,
  limit = 200,
): Promise<OktaPaginatedResult<OktaUser>> {
  const { domain } = config
  const baseUrl = domain.startsWith("https://") ? domain : `https://${domain}`

  let url: string
  if (cursor) {
    url = cursor // cursor is the full URL from Link header
  } else {
    const urlObj = new URL(`${baseUrl}/api/v1/users`)
    urlObj.searchParams.set("limit", String(limit))
    url = urlObj.toString()
  }

  const { data, nextLink } = await oktaFetchWithRetry<OktaUser>(config, url)

  return {
    data,
    nextCursor: nextLink,
    hasMore: !!nextLink,
  }
}

export async function listOktaUsers(config: OktaConfig): Promise<OktaUser[]> {
  console.log("[Okta] Fetching users...")
  const users = await oktaFetchAll<OktaUser>(config, "/users", { limit: 200 })
  console.log(`[Okta] Fetched ${users.length} users`)
  return users
}

export async function listOktaApps(config: OktaConfig): Promise<OktaApp[]> {
  console.log("[Okta] Fetching applications...")
  const apps = await oktaFetchAll<OktaApp>(config, "/apps", { limit: 200 })
  console.log(`[Okta] Fetched ${apps.length} applications`)
  return apps
}

export async function listOktaAppUsers(config: OktaConfig, appId: string): Promise<OktaAppUser[]> {
  const users = await oktaFetchAll<OktaAppUser>(config, `/apps/${appId}/users`, { limit: 200 })
  return users
}
