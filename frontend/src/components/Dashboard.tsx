import { useEffect } from 'react';
import { nusanToNux } from '../lib/transaction';
import type { BalanceResponse } from '../lib/api';

interface DashboardProps {
  address: string;
  balance: BalanceResponse | null;
  onRefresh: () => void;
  onSend: () => void;
  onReceive: () => void;
}

export function Dashboard({ address, balance, onRefresh, onSend, onReceive }: DashboardProps) {
  useEffect(() => {
    onRefresh();
    const interval = setInterval(onRefresh, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [onRefresh]);

  const balancenux = balance ? nusanToNux(balance.balance) : '---';

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="card text-center py-10">
        <p className="text-dark-400 text-sm mb-2">Total Balance</p>
        <h2 className="text-4xl font-bold tracking-tight">
          {balancenux}
          <span className="text-lg text-dark-400 ml-2">NUX</span>
        </h2>
        {balance && balance.received > 0 && (
          <p className="text-dark-500 text-sm mt-2">
            Total received: {nusanToNux(balance.received)} NUX
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onSend} className="btn-primary text-center py-4">
          Send
        </button>
        <button onClick={onReceive} className="btn-secondary text-center py-4">
          Receive
        </button>
      </div>

      {/* Address Info */}
      <div className="card">
        <p className="text-dark-400 text-sm mb-2">Your Address</p>
        <p className="font-mono text-sm break-all text-dark-200">{address}</p>
        <button
          onClick={() => navigator.clipboard.writeText(address)}
          className="text-nux-400 text-sm mt-2 hover:text-nux-300 transition-colors"
        >
          Copy address
        </button>
      </div>
    </div>
  );
}
