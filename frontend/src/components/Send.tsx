import React, { useState } from 'react';
import { buildTransaction, nuxToNusan, nusanToNux } from '../lib/transaction';
import { broadcastTx } from '../lib/api';
import { COIN } from '../lib/network';
import type { BalanceBech32Response, BalanceResponse } from '../lib/api';

interface SendProps {
  address: string;
  bech32address: string;
  privateKey: Uint8Array;
  privateKeyBech32: Uint8Array;
  isBech32: boolean,
  balance: BalanceResponse | null;
  balanceBech32: BalanceBech32Response | null;
  onDone: () => void;
}

type SendStep = 'form' | 'confirm' | 'sending' | 'success';

export function Send({ address, bech32address, privateKey, privateKeyBech32, balance, balanceBech32, isBech32, onDone }: SendProps) {
  const [step, setStep] = useState<SendStep>('form');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txid: string; fee: number } | null>(null);

  const maxAmount = balance ? balance.balance / COIN : 0;
  const maxAmountBech32 = balanceBech32 ? balanceBech32.balance / COIN : 0;
  const ADDRESS_RE = /^[NX][1-9A-HJ-NP-Za-km-z]{25,34}$/;
  const ADDRESS_BECH = /\bnu1[qQ][a-zA-HJ-NP-Z0-9]{25,39}\b/

  const isValidForm =
    (ADDRESS_RE.test(toAddress) || ADDRESS_BECH.test(toAddress)) &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= maxAmount;

  const handleConfirm = async () => {
    setStep('sending');
    setError(null);

    try {
      const amountNusan = nuxToNusan(amount);
      const tx = await buildTransaction({
        fromAddress: address,
        fromBech32: bech32address,
        toAddress,
        amountNusan,
        privateKey,
        privateKeyBech32,
        isBech32
      });

      const result = await broadcastTx(tx.hex);
      if (result.result !== null) {
        setTxResult({ txid: result.result, fee: tx.fee });
        setStep('success');
      } else {
        setError(result.error.message);
        setStep('confirm');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      setError(msg);
      setStep('confirm');
    }
  };

  if (step === 'success' && txResult) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Sent!</h2>
        <div className="card text-left space-y-3">
          <div>
            <p className="text-dark-400 text-xs">Amount</p>
            <p className="font-mono">{isBech32 ? amount : maxAmount - parseFloat(nusanToNux(txResult.fee))} NUX</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Fee</p>
            <p className="font-mono text-sm">{nusanToNux(txResult.fee)} NUX</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Transaction ID</p>
            <p className="font-mono text-xs break-all text-nux-400">{txResult.txid}</p>
          </div>
        </div>
        <button onClick={onDone} className="btn-primary w-full">
          Done
        </button>
      </div>
    );
  }

  if (step === 'confirm' || step === 'sending') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Confirm Transaction</h2>

        <div className="card space-y-4">
          <div>
            <p className="text-dark-400 text-xs">To</p>
            <p className="font-mono text-sm break-all">{toAddress}</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Amount</p>
            <p className="text-xl font-bold">{amount} NUX</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="btn-secondary flex-1"
            disabled={step === 'sending'}
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary flex-1"
            disabled={step === 'sending'}
          >
            {step === 'sending' ? 'Sending...' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Send NUX</h2>
      <p className="text-dark-400 text-xl mb-2">{isBech32 ? bech32address : address}</p>

      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (isValidForm) setStep('confirm');
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            className="input-field font-mono text-sm"
            placeholder="N/X/nu1q..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value.trim())}
            autoFocus
          />
          {toAddress && !ADDRESS_RE.test(toAddress) && !ADDRESS_BECH.test(toAddress) && (
            <p className="text-red-400 text-sm mt-1">Invalid Nusacoin address</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Amount (NUX)
          </label>
          <div className="relative">
            <input
              type="number"
              className="input-field pr-16"
              placeholder="0.00"
              value={isBech32 ? amount : maxAmount.toFixed(8)}
              readOnly={!isBech32}
              onChange={(e) => setAmount(e.target.value)}
              step="0.00000001"
              min="0.00000001"
              max={isBech32 ? maxAmountBech32 : maxAmount}
            />
            <button
              type="button"
              onClick={() => setAmount(isBech32 ? maxAmountBech32.toFixed(8) : maxAmount.toFixed(8))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-nux-400 hover:text-nux-300"
            >
              MAX
            </button>
          </div>
          <p className="text-dark-500 text-xs mt-1">
            Available: {isBech32 ? maxAmountBech32.toFixed(8) : maxAmount.toFixed(8)} NUX
          </p>
        </div>
        <button type="submit" disabled={!isValidForm} className="btn-primary w-full">
          Continue
        </button>
      </form>
    </div>
  );
}
