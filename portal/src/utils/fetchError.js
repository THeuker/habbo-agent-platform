/**
 * Turns the browser's generic "Failed to fetch" into actionable copy.
 * Usually means: portal not running, wrong port/origin, or dev proxy target down.
 */
export function friendlyFetchError(err) {
  const m = err?.message || String(err)
  if (/failed to fetch|load failed|networkerror/i.test(m)) {
    return (
      'Cannot reach the portal API. Start the server (e.g. docker compose up agent-portal), ' +
      'open the app on the host port in HABBO_PORTAL_PORT (.env), and if you use Vite dev ' +
      '(npm run dev) keep the API on that same port.'
    )
  }
  return m
}
