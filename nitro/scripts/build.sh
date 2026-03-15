#!/bin/bash

set -e

supervisord -c /app/supervisor/supervisord.conf

cp /app/configuration/nitro-converter/configuration.json /app/nitro-converter/configuration.json
cd /app/nitro-converter
yarn install

ASSET_MARKER="/app/nitro-assets/gamedata/external_variables.txt"

if [ "${NITRO_AUTO_EXTRACT_ASSETS:-true}" = "true" ] && [ ! -f "$ASSET_MARKER" ]; then
  echo "Nitro assets not found, converting assets from SWF (first run can take a while)..."

  # Converter reads SWF/gamedata from the local SWF server on :8081.
  supervisorctl start swf-http-server
  until wget -qO- http://127.0.0.1:8081/ >/dev/null 2>&1; do
    sleep 1
  done

  yarn build
  node ./dist/Main.js

  if [ ! -d /app/nitro-converter/assets ]; then
    echo "Nitro converter did not produce /app/nitro-converter/assets"
    exit 1
  fi

  echo "Syncing converted assets into /app/nitro-assets..."
  rsync -r /app/nitro-converter/assets/ /app/nitro-assets/
fi

cp /app/configuration/nitro-react/public/* /app/nitro-react/public/
cd /app/nitro-react
yarn install

# Some Nitro builds reference this file unconditionally during bootstrap.
if [ ! -f /app/nitro-assets/gamedata/ExternalTextsOverride.json ]; then
  echo "{}" > /app/nitro-assets/gamedata/ExternalTextsOverride.json
fi

supervisorctl start assets-http-server
supervisorctl start nitro-dev-server

tail -f /dev/null