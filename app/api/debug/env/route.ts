export const runtime = "nodejs"

export async function GET() {
  return Response.json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.length),
    hasDatabaseUrlUnpooled: Boolean(process.env.DATABASE_URL_UNPOOLED?.length),
    hasNextPublicDatabaseEnabled: Boolean(process.env.NEXT_PUBLIC_DATABASE_ENABLED?.length),
    hasOktaDomain: Boolean(process.env.OKTA_DOMAIN?.length),
    hasOktaApiToken: Boolean(process.env.OKTA_API_TOKEN?.length),
    hasAuthEnabled: Boolean(process.env.AUTH_ENABLED?.length),
    timestamp: new Date().toISOString(),
  })
}
