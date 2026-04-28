import { useEffect, useState } from 'react';
import { fetchHistory, type HistoryTx } from '../lib/api';

interface HistoryProps {
  address: string;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return 'Pending';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function History({ address }: HistoryProps) {
  const [txs, setTxs] = useState<HistoryTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await fetchHistory(address);
        if (cancelled) return;
        setTxs(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (loading) {
    return (
      <div className="text-center py-12 text-dark-400">
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Transaction History</h2>

      {txs.length === 0 ? (
        <div className="card text-center py-12 text-dark-400">
          No transactions yet
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map((tx) => {
            const isReceived = tx.received > 0;
            const amount = isReceived ? tx.received : tx.sent;

            return (
              <div key={tx.txid} className="card flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isReceived
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                      }`}
                  >
                    {isReceived ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isReceived ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-dark-500 text-xs">
                      {formatTime(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono font-medium ${isReceived ? 'text-green-400' : 'text-red-400'
                      }`}
                  >
                    {isReceived ? '+' : '-'}
                    {amount.toFixed(8)}
                  </p>
                  <p className="text-dark-500 text-xs">NUX</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
