import { Router, Request, Response } from 'express';
import { rpcCall } from './rpc';
import { getRawHex, getBalance, getAddressTxs, ExplorerAddress } from './explorer';

// Build UTXOs by: explorer last_txs → getrawtransaction → gettxout
async function buildUtxos(address: string): Promise<Array<{
  txid: string;
  vout: number;
  amount: number;
  scriptPubKey: string;
}>> {
  // 1. Get address info from explorer to find all txids involving this address
  const res = await fetch(`${process.env.EXPLORER_URL || 'http://127.0.0.1:8332'}/ext/getaddress/${address}`);
  if (!res.ok) return [];
  const addrInfo = await res.json() as ExplorerAddress | { error: string };
  if ('error' in addrInfo) return [];

  // 2. Get txids where we received funds (vout type)
  const voutTxids = addrInfo.last_txs
    .filter((tx) => tx.type === 'vout')
    .map((tx) => tx.addresses);

  // 3. For each tx, find outputs to our address and check if still unspent
  const utxos: Array<{ txid: string; vout: number; amount: number; scriptPubKey: string }> = [];

  for (const txid of voutTxids) {
    try {
      const rawTx = await rpcCall('getrawtransaction', [txid, true]) as {
        vout: Array<{
          value: number;
          n: number;
          scriptPubKey: { hex: string; address?: string; addresses?: string[] };
        }>;
      };

      for (const vout of rawTx.vout) {
        const addrs = vout.scriptPubKey.addresses || (vout.scriptPubKey.address ? [vout.scriptPubKey.address] : []);
        if (!addrs.includes(address)) continue;

        // Check if this output is still unspent
        const txout = await rpcCall('gettxout', [txid, vout.n]);
        if (txout) {
          utxos.push({
            txid,
            vout: vout.n,
            amount: vout.value,
            scriptPubKey: vout.scriptPubKey.hex,
          });
        }
      }
    } catch {
      // Skip failed txids
    }
  }

  return utxos;
}

const router = Router();

// Validate Nusacoin address format (starts with N or X, base58)
const ADDRESS_RE = /^[N][1-9A-HJ-NP-Za-km-z]{25,34}$/;
const ADDRESS_BECH = /\bnu1[qQ][a-zA-HJ-NP-Z0-9]{25,39}\b/;
const TXID_RE = /^[0-9a-fA-F]{64}$/;

function isValidAddress(addr: string): boolean {
  return ADDRESS_RE.test(addr);
}

function isValidTxid(txid: string): boolean {
  return TXID_RE.test(txid);
}

function isValidBech32(addr: string): boolean {
  return ADDRESS_BECH.test(addr);
}

// GET /api/balance/:address - uses explorer API
router.get('/balance/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address) && !isValidBech32(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const result = await getBalance(address);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/utxos/:address - builds UTXOs from explorer + RPC
router.get('/utxos/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const result = await buildUtxos(address);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/history/:address - uses explorer API directly
router.get('/history/:address', async (req: Request<{ address: string }>, res: Response) => {
  const address = req.params.address;
  if (!isValidAddress(address)) {
    res.status(400).json({ error: 'Invalid address' });
    return;
  }
  try {
    const txs = await getAddressTxs(address, 0, 50);
    res.json(txs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/tx/:txid - uses RPC (verbose/decoded)
router.get('/tx/:txid', async (req: Request<{ txid: string }>, res: Response) => {
  const txid = req.params.txid;
  if (!isValidTxid(txid)) {
    res.status(400).json({ error: 'Invalid txid' });
    return;
  }
  try {
    const result = await rpcCall('getrawtransaction', [txid, true]);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/rawtx/:txid - raw hex for signing (nonWitnessUtxo)
router.get('/rpcrawtx/:txid', async (req: Request<{ txid: string }>, res: Response) => {
  const txid = req.params.txid;
  if (!isValidTxid(txid)) {
    res.status(400).json({ error: 'Invalid txid' });
    return;
  }
  try {
    const hex = await rpcCall('getrawtransaction', [txid, false]);
    res.json({ hex });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/rawtx/:txid', async (req: Request<{ txid: string }>, res: Response) => {
  const txid = req.params.txid;
  if (!isValidTxid(txid)) {
    res.status(400).json({ error: 'Invalid txid' });
    return;
  }
  try {
    const hex = await getRawHex(txid);
    res.json(hex);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/broadcast  { hex: "..." } - uses RPC
router.post('/broadcast', async (req: Request, res: Response) => {
  const { hex } = req.body;
  if (!hex || typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex)) {
    res.status(400).json({ error: 'Invalid transaction hex' });
    return;
  }
  try {
    const txid = await rpcCall('sendrawtransaction', [hex]);
    res.json({ txid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/info - uses RPC
router.get('/info', async (_req: Request, res: Response) => {
  try {
    const result = await rpcCall('getblockchaininfo');
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
