import http from 'http';

const RPC_USER = process.env.RPC_USER || 'nux_rpc';
const RPC_PASS = process.env.RPC_PASS || '';
const RPC_HOST = process.env.RPC_HOST || '127.0.0.1';
const RPC_PORT = parseInt(process.env.RPC_PORT || '8332', 8332);

let requestId = 0;

export async function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
  const id = ++requestId;
  const body = JSON.stringify({ jsonrpc: '1.0', id, method, params });

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: RPC_HOST,
        port: RPC_PORT,
        method: 'POST',
        path: '/',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization:
            'Basic ' + Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64'),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'RPC error'));
            } else {
              resolve(parsed.result);
            }
          } catch {
            reject(new Error('Invalid JSON from RPC'));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('RPC timeout'));
    });
    req.write(body);
    req.end();
  });
}
