# Authentication Configuration

SaaS Control Center uses Okta OIDC for authentication with a production kill switch.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_ENABLED` | No | Set to `"true"` to enforce authentication. Default: `"false"` |
| `OKTA_ISSUER` | When AUTH_ENABLED=true | Your Okta domain (e.g., `https://your-domain.okta.com`) |
| `OKTA_CLIENT_ID` | When AUTH_ENABLED=true | Okta application client ID |
| `OKTA_CLIENT_SECRET` | When AUTH_ENABLED=true | Okta application client secret |
| `NEXTAUTH_URL` | When AUTH_ENABLED=true | Your app URL (e.g., `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | When AUTH_ENABLED=true | Random secret for JWT encryption. Generate with: `openssl rand -base64 32` |

## Modes

### Demo Mode (AUTH_ENABLED=false, default)
- No authentication required
- Users can access all pages without signing in
- Sign-in page shows "Continue as Demo User" button
- Ideal for local development and demos

### Production Mode (AUTH_ENABLED=true)
- Okta OIDC authentication required
- All dashboard routes are protected
- Users redirected to `/auth/sign-in` if not authenticated
- Requires all Okta environment variables to be set

## Okta Configuration

1. Create a new Web Application in Okta Admin Console
2. Set **Sign-in redirect URI**: `https://your-app.vercel.app/api/auth/callback/okta`
3. Set **Sign-out redirect URI**: `https://your-app.vercel.app`
4. Enable "Authorization Code" grant type
5. Copy the Client ID and Client Secret to your environment variables

## Enabling Authentication in Vercel

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - `AUTH_ENABLED` = `true`
   - `OKTA_ISSUER` = `https://your-domain.okta.com`
   - `OKTA_CLIENT_ID` = your client ID
   - `OKTA_CLIENT_SECRET` = your client secret
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET` = generated secret
4. Redeploy your application

## Troubleshooting

- **"Configuration Error" on sign-in**: AUTH_ENABLED=true but Okta vars are missing
- **OAuth callback errors**: Check redirect URIs match exactly in Okta
- **Session not persisting**: Ensure NEXTAUTH_SECRET is set and consistent
