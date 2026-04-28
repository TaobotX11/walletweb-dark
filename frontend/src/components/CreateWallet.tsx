import React, { useState } from 'react';

interface CreateWalletProps {
  onSubmit: (password: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function CreateWallet({ onSubmit, onBack, loading, error }: CreateWalletProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const passwordsMatch = password === confirm;
  const isValid = password.length >= 8 && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSubmit(password);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Wallet</h1>
        <p className="text-dark-400 mt-2">
          Choose a strong password to protect your wallet. This password encrypts
          your keys locally in this browser.
        </p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4 text-sm space-y-2">
        <p className="text-yellow-300 font-semibold">Important — Read carefully:</p>
        <ul className="text-yellow-200/80 space-y-1 text-xs list-disc pl-4">
          <li>This is a <strong className="text-white">self-custody wallet</strong>. We do NOT store your keys or password on any server.</li>
          <li>After creating your wallet, you will receive a <strong className="text-white">12-word recovery phrase</strong>. This is the ONLY way to recover your wallet.</li>
          <li>If you lose your recovery phrase and forget your password, <strong className="text-red-300">your funds will be permanently lost</strong>. No one can help you recover them.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Password
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {confirm && !passwordsMatch && (
            <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            Back
          </button>
          <button type="submit" disabled={!isValid || loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      </form>
    </div>
  );
}
