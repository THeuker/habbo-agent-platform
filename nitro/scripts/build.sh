#!/bin/bash

set -e

supervisord -c /app/supervisor/supervisord.conf

cp /app/configuration/nitro-converter/configuration.json /app/nitro-converter/configuration.json
cd /app/nitro-converter
yarn install

ASSET_MARKER="/app/nitro-assets/gamedata/external_variables.txt"

if [ "${NITRO_AUTO_EXTRACT_ASSETS:-true}" = "true" ] && [ ! -f "$ASSET_MARKER" ]; then
  echo "Nitro assets not found, converting assets from SWF (first run can take a while)..."
  yarn ts-node-dev --transpile-only src/Main.ts

  echo "Syncing converted assets into /app/nitro-assets..."
  rsync -r /app/nitro-converter/assets/ /app/nitro-assets/
fi

cp /app/configuration/nitro-react/public/* /app/nitro-react/public/
cd /app/nitro-react
yarn install

supervisorctl start swf-http-server
supervisorctl start assets-http-server
supervisorctl start nitro-dev-server

tail -f /dev/null