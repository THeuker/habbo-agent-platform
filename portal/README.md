# Agent Portal Bundle

`portal/` is the web app/API for user onboarding to the Agent Hotel.

## What it provides

- Register/login for users
- Session handling (cookie auth)
- Password reset flow
- "Join Hotel" flow with SSO link generation
- Hosted access entrypoint for MCP token onboarding

## Local access

- Default URL: `http://127.0.0.1:3090`

## Common environment variables

- `HABBO_PORTAL_PORT`
- `HABBO_PORTAL_BASE_URL`
- `HABBO_PORTAL_PUBLIC_URL`
- `HABBO_PORTAL_JWT_SECRET`
- `HABBO_PORTAL_COOKIE_SECURE`
- `HABBO_PORTAL_SMTP_*`
- `HABBO_PORTAL_RESET_TOKEN_TTL_MINUTES`

For complete stack-level values, use the root compose env files.
