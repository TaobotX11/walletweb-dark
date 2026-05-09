import { useEffect } from 'react';
import { nusanToNux } from '../lib/transaction';
import type { BalanceResponse } from '../lib/api';

interface LegacyProps {
    address: string;
    balance: BalanceResponse | null;
    isBech32: boolean,
    onSend: () => void;
    onRefreshTwo: () => void;
    onHistory: () => void;
}

export function Legacy({ address, balance, onRefreshTwo, onSend, onHistory }: LegacyProps) {
    useEffect(() => {
        onRefreshTwo();
        const interval = setInterval(onRefreshTwo, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, [onRefreshTwo]);
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
                    <p className="text-2xl text-sm mt-2">
                        Total received: {nusanToNux(balance.received)} NUX
                    </p>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4">
                <button onClick={onSend} className="btn-legacy text-center py-4">
                    SWEEP
                </button>
            </div>

            {/* Address Info */}
            <div className="card">
                <p className="text-dark-400 text-sm mb-2">Legacy Address</p>
                <p className="font-mono text-sm break-all text-dark-200">{address}</p>
                <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="text-orange-400 text-sm mt-2 hover:text-orange-300 transition-colors"
                >
                    Copy address
                </button>
                <p></p>
                <button
                    onClick={onHistory}
                    className="text-orange-400 text-sm mt-2 hover:text-orange-300 transition-colors"
                >
                    History
                </button>
            </div>
        </div>
    );
}
