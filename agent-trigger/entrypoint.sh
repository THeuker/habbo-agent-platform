#!/bin/sh
set -e

MCP_URL="${HABBO_MCP_URL:-http://habbo-mcp:3003/mcp}"
MCP_KEY="${MCP_API_KEY:-}"
PROJECT_DIR="${HABBO_PROJECT_DIR:-/project}"
MCP_JSON="$PROJECT_DIR/.mcp.json"

echo "[entrypoint] Writing MCP config → $MCP_JSON"
echo "[entrypoint] hotel-mcp URL: $MCP_URL"

cat > "$MCP_JSON" << EOF
{
  "mcpServers": {
    "hotel-mcp": {
      "type": "http",
      "url": "$MCP_URL",
      "headers": {
        "Authorization": "Bearer $MCP_KEY"
      }
    }
  }
}
EOF

echo "[entrypoint] MCP config written. Starting server..."
exec bun run /app/src/server.ts
