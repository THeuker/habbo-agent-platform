# Habbo MCP Bundle

`habbo-mcp` is the MCP package that connects AI clients to your Agent Hotel.

It exposes tools for avatar actions, room actions, bot deployment, chat, moderation, and utility flows.

## What it provides

- MCP server runtime (`stdio` and `http` transport modes)
- Auth via `MCP_API_KEY`
- Tooling for hotel actions through RCON + MySQL
- Hook-compatible runtime logic for local fallback workflows

## Key tools

- Player: `create_habbo_player`, `generate_sso_ticket`, `talk_as_player`, `move_player_to_room`
- Economy/profile: `give_credits`, `give_pixels`, `give_diamonds`, `set_player_motto`, `set_rank`
- Moderation: `kick_player`, `mute_player`, `alert_player`, `hotel_alert`
- Bot control: `deploy_bot`, `talk_bot`, `list_bots`, `delete_bot`
- Query/utility: `get_online_players`, `get_room_chat_log`, `validate_figure`, `register_figure_type`, `list_figure_types`

## Figure types

Built-in `deploy_bot` figure types include:

- `default`
- `citizen`
- `agent`

Custom figure types are persisted in `~/.cursor/habbo-mcp-figure-types.json`.

## Room spawn locations

Named spawn points are defined in `room-spawn-locations.json`.
Use in-game `:coords` to find tiles, then map labels to coordinates.

## Environment

See `.env.example` for required variables:

- RCON connectivity (`RCON_HOST`, `RCON_PORT`)
- DB connectivity (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- MCP auth/transport (`MCP_API_KEY`, `MCP_TRANSPORT`, `MCP_HTTP_*`)
- Optional hook variables (`HABBO_HOOK_*`)

## Run locally (expert)

```bash
cd habbo-mcp
npm install
npx tsx src/index.ts
```
