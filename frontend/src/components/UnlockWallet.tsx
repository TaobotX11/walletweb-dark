import React, { useState } from 'react';
import logo from '../assets/logo.png';

interface UnlockWalletProps {
  address: string;
  onUnlock: (password: string) => Promise<void>;
  onLogout: () => void;
  loading: boolean;
  error: string | null;
}

export function UnlockWallet({ address, onUnlock, onLogout, loading, error }: UnlockWalletProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) onUnlock(password);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <img src={logo} alt="Nusacoin" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-dark-400 mt-2 font-mono text-sm">
          {address.slice(0, 8)}...{address.slice(-6)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            className="input-field text-center"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <button type="submit" disabled={!password || loading} className="btn-primary w-full">
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>

      <div className="text-center">
        <button
          onClick={onLogout}
          className="text-sm text-dark-500 hover:text-red-400 transition-colors"
        >
          Delete wallet from this browser
        </button>
      </div>
    </div>
  );
}
