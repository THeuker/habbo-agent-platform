import * as net from 'net';
import { getConfig } from './config.js';

interface RconResponse {
  status: number;
  message: string;
}

export async function sendRconCommand(
  key: string,
  data: Record<string, unknown>
): Promise<RconResponse> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const payload = JSON.stringify({ key, data });
    let responseBuffer = '';

    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error('RCON connection timed out'));
    }, 5000);

    const { host, port } = getConfig().rcon;
    const startedAt = Date.now();
    client.connect(port, host, () => {
      client.write(payload);
    });

    client.on('data', (chunk) => {
      responseBuffer += chunk.toString();
    });

    client.on('close', () => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(responseBuffer) as RconResponse);
      } catch {
        const preview = responseBuffer.length > 300 ? `${responseBuffer.slice(0, 300)}...` : responseBuffer;
        const display = preview.trim().length > 0 ? preview : '<empty>';
        reject(
          new Error(
            `Invalid RCON response: ${display} (key=${key}, host=${host}, port=${port}, bytes=${responseBuffer.length}, elapsed_ms=${Date.now() - startedAt})`
          )
        );
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}
