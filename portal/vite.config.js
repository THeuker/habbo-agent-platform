import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createRequire } from 'module'
import { writeFileSync } from 'fs'

const require = createRequire(import.meta.url)
const { version: appVersion } = require('./package.json')

// Writes dist/version.json after every production build so the volume-mounted
// dist/ always reflects the deployed version without needing package.json mounted.
function versionJsonPlugin() {
  return {
    name: 'version-json',
    closeBundle() {
      writeFileSync('./dist/version.json', JSON.stringify({ version: appVersion }))
    },
  }
}

export default defineConfig(({ mode }) => {
  const repoRoot = path.resolve(__dirname, '..')
  const portalRoot = __dirname
  const env = { ...loadEnv(mode, repoRoot, ''), ...loadEnv(mode, portalRoot, '') }
  const portalPort = env.HABBO_PORTAL_PORT || process.env.HABBO_PORTAL_PORT || '3090'

  // Unique per `vite build` / dev server start — proves the browser loaded this bundle
  const uiBuildStamp = `ui-${Date.now()}`

  return {
    define: {
      'import.meta.env.VITE_UI_BUILD_STAMP': JSON.stringify(uiBuildStamp),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    plugins: [react(), tailwindcss(), versionJsonPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: './dist',
      emptyOutDir: true,
    },
    // `npm run dev` — `/api` → Express on host port from `.env` (`HABBO_PORTAL_PORT`, same as Docker).
    server: {
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${portalPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
