import './loadEnv.js';
import { getConfig } from './config.js';
import { startHttpServer, startStdioServer } from './server.js';

async function bootstrap(): Promise<void> {
  const cfg = getConfig();

  if ((cfg.transport === 'stdio') || (cfg.transport === 'both')) {
    await startStdioServer();
  }

  if ((cfg.transport === 'http') || (cfg.transport === 'both')) {
    await startHttpServer();
  }
}

bootstrap().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
