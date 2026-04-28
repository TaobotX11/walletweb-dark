// Client for the eIquidus explorer API (runs locally on the VPS)
const EXPLORER_URL = process.env.EXPLORER_URL || 'http://127.0.0.1:8332';

async function explorerFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${EXPLORER_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Explorer API error: ${res.status}`);
  }
  const data = await res.json();
  return data as T;
}

export interface ExplorerAddress {
  a_id: string;
  balance: number;
  received: number;
  sent: number;
  last_txs: Array<{
    addresses: string;
    type: string;
  }>;
}

export interface ExplorerUtxo {
  txid: string;
  vout: number;
  amount: number;
  scriptPubKey: string;
  height: number;
}

// Get balance for address (returns balance in coins, we convert to nusan)
export async function getBalance(address: string): Promise<{
  balance: number;
  received: number;
  sent: number;
}> {
  // getbalance returns just the number as a string
  const balanceStr = await explorerFetch<string | number>(`/ext/getbalance/${address}`);
  const balance = typeof balanceStr === 'string' ? parseFloat(balanceStr) : balanceStr;

  if (isNaN(balance)) {
    // Address not found in explorer, assume 0 balance
    return { balance: 0, received: 0, sent: 0 };
  }

  // Also try to get full address info
  try {
    const addrInfo = await explorerFetch<ExplorerAddress | { error: string }>(
      `/ext/getaddress/${address}`
    );
    if ('error' in addrInfo) {
      return { balance: Math.round(balance * 1e8), received: 0, sent: 0 };
    }
    return {
      balance: Math.round(addrInfo.balance * 1e8),
      received: Math.round(addrInfo.received * 1e8),
      sent: Math.round(addrInfo.sent * 1e8),
    };
  } catch {
    return { balance: Math.round(balance * 1e8), received: 0, sent: 0 };
  }
}

// Get UTXOs for address via explorer API
export async function getUtxos(address: string): Promise<ExplorerUtxo[]> {
  try {
    const data = await explorerFetch<ExplorerUtxo[] | { error: string }>(
      `/ext/getutxos/${address}`
    );
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch {
    return [];
  }
}

export interface ExplorerTx {
  txid: string;
  sent: number;     // coins sent TO this address in this tx
  received: number;  // coins received FROM this address in this tx
  balance: number;   // running balance after this tx
  timestamp: number;
}

// Get address transaction history
export async function getAddressTxs(
  address: string,
  start = 0,
  length = 50
): Promise<ExplorerTx[]> {
  try {
    const data = await explorerFetch<ExplorerTx[] | { error: string }>(
      `/ext/getaddresstxs/${address}/${start}/${length}`
    );
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch {
    return [];
  }
}

// Get last transactions from explorer
export async function getLastTxs(count = 50): Promise<
  Array<{
    blockindex: number;
    txid: string;
    recipients: number;
    amount: number;
    timestamp: number;
  }>
> {
  try {
    const data = await explorerFetch<unknown[]>(`/ext/getlasttxs/${count}/0`);
    return data as Array<{
      blockindex: number;
      txid: string;
      recipients: number;
      amount: number;
      timestamp: number;
    }>;
  } catch {
    return [];
  }
}
