import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';

type TunnelConfig = {
  host: string;
  port: number;
  user: string;
  keyPath?: string;
  strictHostKeyChecking: string;
  connectTimeoutSec: number;
  localRconPort: number;
  remoteRconHost: string;
  remoteRconPort: number;
  localDbPort: number;
  remoteDbHost: string;
  remoteDbPort: number;
};

function toInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid integer for ${name}: ${value}`);
  }
  return parsed;
}

function loadConfig(): TunnelConfig {
  return {
    host: process.env.SSH_TUNNEL_HOST || '',
    port: toInt('SSH_TUNNEL_PORT', 22),
    user: process.env.SSH_TUNNEL_USER || '',
    keyPath: process.env.SSH_TUNNEL_KEY_PATH || undefined,
    strictHostKeyChecking: process.env.SSH_TUNNEL_STRICT_HOST_KEY_CHECKING || 'accept-new',
    connectTimeoutSec: toInt('SSH_TUNNEL_CONNECT_TIMEOUT_SEC', 10),
    localRconPort: toInt('SSH_TUNNEL_LOCAL_RCON_PORT', 43001),
    remoteRconHost: process.env.SSH_TUNNEL_REMOTE_RCON_HOST || '127.0.0.1',
    remoteRconPort: toInt('SSH_TUNNEL_REMOTE_RCON_PORT', 13001),
    localDbPort: toInt('SSH_TUNNEL_LOCAL_DB_PORT', 43306),
    remoteDbHost: process.env.SSH_TUNNEL_REMOTE_DB_HOST || '127.0.0.1',
    remoteDbPort: toInt('SSH_TUNNEL_REMOTE_DB_PORT', 13306),
  };
}

function waitForLocalPort(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`Timed out waiting for local forwarded port ${port}`));
          return;
        }
        setTimeout(tryConnect, 250);
      });
    };
    tryConnect();
  });
}

function applyLocalEnv(cfg: TunnelConfig): void {
  process.env.RCON_HOST = '127.0.0.1';
  process.env.RCON_PORT = String(cfg.localRconPort);
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(cfg.localDbPort);
}

export async function startSshTunnelIfEnabled(): Promise<ChildProcess | null> {
  if (process.env.SSH_TUNNEL_ENABLED !== 'true') {
    return null;
  }

  const cfg = loadConfig();
  if (!cfg.host || !cfg.user) {
    throw new Error('SSH_TUNNEL_ENABLED=true requires SSH_TUNNEL_HOST and SSH_TUNNEL_USER');
  }

  const args: string[] = [
    '-N',
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    `StrictHostKeyChecking=${cfg.strictHostKeyChecking}`,
    '-o',
    `ConnectTimeout=${cfg.connectTimeoutSec}`,
    '-L',
    `${cfg.localRconPort}:${cfg.remoteRconHost}:${cfg.remoteRconPort}`,
    '-L',
    `${cfg.localDbPort}:${cfg.remoteDbHost}:${cfg.remoteDbPort}`,
  ];

  if (cfg.keyPath) {
    args.push('-i', cfg.keyPath);
  }

  args.push(`${cfg.user}@${cfg.host}`);

  const proc = spawn('ssh', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout?.on('data', (chunk) => {
    process.stderr.write(`[ssh-tunnel] ${String(chunk)}`);
  });
  proc.stderr?.on('data', (chunk) => {
    process.stderr.write(`[ssh-tunnel] ${String(chunk)}`);
  });

  proc.once('error', (err) => {
    process.stderr.write(`[ssh-tunnel] failed to start: ${err.message}\n`);
  });

  const timeoutMs = toInt('SSH_TUNNEL_START_TIMEOUT_MS', 30000);
  await Promise.all([
    waitForLocalPort(cfg.localRconPort, timeoutMs),
    waitForLocalPort(cfg.localDbPort, timeoutMs),
  ]);

  applyLocalEnv(cfg);
  process.stderr.write(
    `[ssh-tunnel] ready (RCON 127.0.0.1:${cfg.localRconPort}, DB 127.0.0.1:${cfg.localDbPort})\n`
  );

  return proc;
}
