import http from 'http';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** Load repo `.env` so `HABBO_PORTAL_PORT` matches docker-compose / setup (does not override existing env). */
function loadDotEnv() {
  const file = join(REPO_ROOT, '.env');
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

// Upstream = real portal (same host port as Docker `HABBO_PORTAL_PORT` → container 3000).
// Listen = optional dev proxy port (`HABBO_PORTAL_PROXY_PORT` or `PORT`, default 3091).
// Connect over IPv4 — "localhost" can resolve to ::1 while Docker binds IPv4 only.
const UPSTREAM_HOST = process.env.PORTAL_UPSTREAM_HOST || '127.0.0.1';
const UPSTREAM_PORT = Number(process.env.HABBO_PORTAL_PORT || 3090);
const LISTEN_PORT = Number(
  process.env.HABBO_PORTAL_PROXY_PORT || process.env.PORT || 3091
);

http.createServer((req, res) => {
  const opts = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  proxy.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(
      `Bad gateway: cannot reach portal at http://${UPSTREAM_HOST}:${UPSTREAM_PORT} (${e.code || e.message}). ` +
        `Start the portal (e.g. docker compose up agent-portal) and ensure HABBO_PORTAL_PORT in .env matches the published port.`
    );
  });
  req.pipe(proxy);
}).listen(LISTEN_PORT, () =>
  console.log(`Proxy on :${LISTEN_PORT} → http://${UPSTREAM_HOST}:${UPSTREAM_PORT} (HABBO_PORTAL_PORT)`)
);
