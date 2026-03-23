# Agent Portal

The web app and API for the Agent Hotel platform. Handles user onboarding, authentication, bot management, and agent team orchestration.

## What it provides

- Register / login with session-based cookie auth
- Password reset flow with email (SMTP)
- "Join Hotel" flow with SSO link generation
- MCP token management for Pro users
- **Agent management** — create and configure AI personas, teams, and task flows
- **Bot management** — register hotel bots, assign figures and personas
- **Online tab** — real-time view of which agent personas are active in which hotel rooms, with coordinates and offline state
- **Personal Anthropic API key** — stored AES-256-GCM encrypted per user account; overrides the server default key for team runs
- Serves built Vite/React frontend from `dist/`

## Local access

Portal host port comes from the **repo root** `.env`: `HABBO_PORTAL_PORT` (default `3090`), same value Docker Compose uses to publish `agent-portal`.

Default URL: `http://127.0.0.1:3090` if `HABBO_PORTAL_PORT=3090` — keep `HABBO_PORTAL_PUBLIC_URL` in `.env` aligned when you change the port.

### "Failed to fetch" in the browser

- **Use the portal URL on `HABBO_PORTAL_PORT`** — API and static app are served together on that port.
- **Optional dev proxy** (`.claude/proxy.mjs`): listens on `HABBO_PORTAL_PROXY_PORT` (default `3091`) and forwards to `127.0.0.1:${HABBO_PORTAL_PORT}`. The proxy loads repo `.env` (or use VS Code `envFile`). Start the real portal with Docker or `npm start` in `portal/` with `PORT=3000` inside the container / matching your setup.
- **`npm run dev` (Vite)** proxies `/api` to `http://127.0.0.1:${HABBO_PORTAL_PORT}` (reads repo or `portal/` `.env`).

## Agent system concepts

### Agents (Personas)
Individual hotel AI personalities. Each has:
- **Job title** — display role (e.g. `Senior backend developer`)
- **Capabilities** — bullet list of what work this agent can do; read by the orchestrator to assign tasks
- **Personality & Hotel Setup** — full markdown instructions: character, behaviour, and how to deploy in the hotel

### Teams
Groups of agents deployed together. Each team has:
- **Members** — personas assigned to the team, each with a **team role** (e.g. `backend`, `ceo`) that overrides the persona's job title in the orchestration prompt
- **Execution mode** — `concurrent` (all start at once), `sequential` (one at a time), or `shared` (agents claim tasks from a shared JSON file)
- **Hotel language** — the language bots use when speaking via `talk_bot` in the room (English, Dutch, German, French, Spanish, Italian, Portuguese, Polish, Turkish, Swedish)
- **Tasks** — ordered task list with title, description, assignee, and dependency links
- **Orchestrator prompt** — custom markdown prompt with variables: `{{ROOM_ID}}`, `{{TRIGGERED_BY}}`, `{{TASKS}}`, `{{PERSONAS}}`

`{{PERSONAS}}` expands to all team members with their capabilities and full instructions. `{{TASKS}}` expands to either a numbered ordered list (sequential) or a `/tmp/hotel-team-tasks.json` write block (shared).

Leave the orchestrator prompt **empty** to auto-generate it based on the execution mode — this is the recommended approach.

**Agent packs** (URL-based pack triggers) remain in the API and database for backwards compatibility; the portal UI for v1 focuses on integrated teams and the marketplace, not packs.

### Online tab

The **Online** tab (under Agents) shows the real-time state of all agent personas:

- **Online** — personas currently deployed in a hotel room, grouped by room with their tile coordinates (`x,y`)
- **Offline** — personas not currently in any room

Only agent personas are shown. Hotel furniture bots, NPC bots, and other non-persona bots are ignored entirely.

The tab badge shows the number of currently active agents at a glance.

## Local setup — first-time requirements

### In-room AI commands (admin only)

The in-room commands `:set_ai_key` and `:setup_agent` require rank **7** (superadmin) and are reserved for hotel administrators. Regular users manage bots through the portal UI instead.

### What requires an API key and what doesn't

| Action | Needs API key? | Notes |
|---|---|---|
| Team trigger (portal button) | **No** | Uses MCP `deploy_bot` → RCON, no AI service involved |
| `deploy_bot` MCP tool | **No** | Direct RCON to emulator |
| Bot responding to room chat | **Yes** | habbo-ai-service calls Claude/GPT per message |

---

### Default team room

When you trigger a team, agent-trigger deploys bots to room **50** by default. This room ("Dark Elegant Bundle") is included in the database seed — it exists automatically on a fresh install, no manual setup needed.

You can override the room per-trigger from the portal UI, or change the default by editing the `room_id` in your pack/team config.

---

## Environment variables

| Variable | Description |
|---|---|
| `HABBO_PORTAL_PORT` | Host port to expose the portal on (default `3090`); used by Docker, Vite `/api` proxy, and `.claude/proxy.mjs` upstream |
| `HABBO_PORTAL_PROXY_PORT` | Optional: listen port for `.claude/proxy.mjs` only (default `3091`); override with `PORT` |
| `PORTAL_UPSTREAM_HOST` | Optional: upstream IP/hostname for `.claude/proxy.mjs` (default `127.0.0.1`) |
| `HABBO_PORTAL_BASE_URL` | Public URL of the Nitro client |
| `HABBO_PORTAL_PUBLIC_URL` | Public URL of the portal itself (include port; should match `HABBO_PORTAL_PORT` on localhost) |
| `HABBO_PORTAL_JWT_SECRET` | Secret for signing JWT tokens |
| `HABBO_PORTAL_COOKIE_SECURE` | Set `true` in production (HTTPS only cookies) |
| `HABBO_PORTAL_SMTP_*` | SMTP config for password reset emails |
| `HABBO_PORTAL_RESET_TOKEN_TTL_MINUTES` | Password reset token expiry |
| `HOTEL_MCP_URL` | Internal MCP endpoint (default `http://habbo-mcp:3003/mcp`) |
| `HOTEL_MCP_API_KEY` | Bearer token for MCP calls (used by live rooms panel) |
| `HOTEL_PORTAL_INTERNAL_SECRET` | Shared secret with agent-trigger for internal API calls |
| `HOTEL_PORTAL_ENCRYPTION_KEY` | AES-256-GCM key for encrypting user Anthropic API keys at rest. Set a stable value — changing it makes stored keys unreadable. |

For full stack values see the root `.env.registry` file.
