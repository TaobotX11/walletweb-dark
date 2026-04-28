import { useState, useCallback, useEffect } from 'react';
import {
  WalletData,
  createWallet,
  importWallet,
  unlockWallet,
  saveWallet,
  loadWallet,
  deleteWallet,
} from '../lib/wallet';
import { fetchBalance, type BalanceResponse } from '../lib/api';

export type WalletView =
  | 'landing'
  | 'create'
  | 'create-backup'
  | 'import'
  | 'unlock'
  | 'dashboard'
  | 'send'
  | 'receive'
  | 'history';

export interface WalletState {
  view: WalletView;
  walletData: WalletData | null;
  privateKey: Uint8Array | null;
  mnemonic: string | null;
  balance: BalanceResponse | null;
  loading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    view: 'landing',
    walletData: null,
    privateKey: null,
    mnemonic: null,
    balance: null,
    loading: false,
    error: null,
  });

  // Check for existing wallet on mount
  useEffect(() => {
    const existing = loadWallet();
    if (existing) {
      setState((s) => ({ ...s, walletData: existing, view: 'unlock' }));
    }
  }, []);

  const setView = useCallback((view: WalletView) => {
    setState((s) => ({ ...s, view, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  const handleCreate = useCallback(async (password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { walletData, mnemonic } = await createWallet(password);
      saveWallet(walletData);
      setState((s) => ({
        ...s,
        walletData,
        mnemonic,
        loading: false,
        view: 'create-backup',
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create wallet';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, []);

  const handleImport = useCallback(async (mnemonic: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const walletData = await importWallet(mnemonic, password);
      saveWallet(walletData);
      setState((s) => ({
        ...s,
        walletData,
        loading: false,
        view: 'unlock',
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import wallet';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, []);

  const handleUnlock = useCallback(
    async (password: string) => {
      if (!state.walletData) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { privateKey, mnemonic } = await unlockWallet(state.walletData, password);
        setState((s) => ({
          ...s,
          privateKey,
          mnemonic,
          loading: false,
          view: 'dashboard',
        }));
      } catch {
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Incorrect password',
        }));
      }
    },
    [state.walletData]
  );

  const handleLock = useCallback(() => {
    setState((s) => ({
      ...s,
      privateKey: null,
      mnemonic: null,
      balance: null,
      view: 'unlock',
    }));
  }, []);

  const handleLogout = useCallback(() => {
    deleteWallet();
    setState({
      view: 'landing',
      walletData: null,
      privateKey: null,
      mnemonic: null,
      balance: null,
      loading: false,
      error: null,
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.walletData) return;
    try {
      const balance = await fetchBalance(state.walletData.address);
      setState((s) => ({ ...s, balance }));
    } catch {
      // Silently fail balance refresh
    }
  }, [state.walletData]);

  return {
    ...state,
    setView,
    setError,
    handleCreate,
    handleImport,
    handleUnlock,
    handleLock,
    handleLogout,
    refreshBalance,
  };
}
