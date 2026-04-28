import { API_BASE, COIN } from './network';
import type { UTXO, ExplorerUTXO } from './transaction';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }

  return data as T;
}

export interface BalanceResponse {
  balance: number;   // in nusan
  received: number;  // in nusan
  sent: number;      // in nusan
}

export async function fetchBalance(address: string): Promise<BalanceResponse> {
  return apiFetch<BalanceResponse>(`/balance/${address}`);
}

export async function fetchUtxos(address: string): Promise<UTXO[]> {
  const raw = await apiFetch<ExplorerUTXO[]>(`/utxos/${address}`);
  // Normalize explorer UTXOs to internal format
  return raw.map((u) => ({
    txid: u.txid,
    outputIndex: u.vout,
    satoshis: Math.round(u.amount * COIN),
    script: u.scriptPubKey,
  }));
}

export interface HistoryTx {
  txid: string;
  sent: number;      // coins sent TO this address
  received: number;   // coins received FROM this address
  balance: number;    // running balance
  timestamp: number;
}

export async function fetchHistory(address: string): Promise<HistoryTx[]> {
  return apiFetch<HistoryTx[]>(`/history/${address}`);
}

export async function broadcastTx(hex: string): Promise<{ txid: string }> {
  return apiFetch<{ txid: string }>('/broadcast', {
    method: 'POST',
    body: JSON.stringify({ hex }),
  });
}

export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
}

export async function fetchInfo(): Promise<BlockchainInfo> {
  return apiFetch<BlockchainInfo>('/info');
}
