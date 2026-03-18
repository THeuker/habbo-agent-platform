import express from 'express';
import { config } from './config.js';
import { runMigrations } from './migrate.js';
import { setApiKeyHandler } from './routes/setApiKey.js';
import { initSessionHandler } from './routes/initSession.js';
import { chatMessageHandler } from './routes/chatMessage.js';
import { createProvider } from './providers/index.js';
import { initSession } from './sessions.js';
import { pool } from './db.js';

const app = express();
app.use(express.json());

app.post('/api/set-api-key', setApiKeyHandler);
app.post('/api/init-session', initSessionHandler);
app.post('/api/chat', chatMessageHandler);

app.get('/health', (_req, res) => res.json({ ok: true }));

async function restoreSessionsOnStartup(): Promise<void> {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT a.bot_id, a.persona, a.user_id, k.api_key, k.provider
       FROM ai_agent_configs a
       JOIN ai_api_keys k ON k.user_id = a.user_id AND k.verified = 1
       WHERE a.active = 1 AND a.bot_id IS NOT NULL AND a.persona IS NOT NULL`
    );
    for (const row of rows) {
      try {
        const provider = createProvider(row.provider || 'anthropic', row.api_key);
        initSession(row.bot_id, provider, row.persona);
        console.log(`[startup] Restored session for bot_id ${row.bot_id}`);
      } catch (e) {
        console.warn(`[startup] Failed to restore session for bot_id ${row.bot_id}:`, (e as Error).message);
      }
    }
  } catch (e) {
    console.warn('[startup] Could not restore sessions:', (e as Error).message);
  }
}

runMigrations()
  .then(() => restoreSessionsOnStartup())
  .then(() => {
    app.listen(config.port, () => {
      console.log(`habbo-ai-service listening on port ${config.port}`);
    });
  })
  .catch(err => {
    console.error('[migrate] Fatal migration error:', err);
    process.exit(1);
  });
