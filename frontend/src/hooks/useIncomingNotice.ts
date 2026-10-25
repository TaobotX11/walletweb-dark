import { useCallback, useEffect, useRef, useState } from 'react';
import type { AddressBalance } from '../lib/electrs';

// In-app incoming-coins notice for an open wallet tab. This is not a
// background push: it only runs while the tab is open, on top of the
// existing balance refresh (30s on the Wallet tab, 60s on Legacy).
//
// The watched total is confirmed + mempool. Using the total, rather
// than the spendable Available figure, matters in two ways: a
// mempool incoming coin is noticed before confirmation, and a
// mempool transaction confirming later does not re-notify, because
// confirmed rises by the same amount mempool falls. An outgoing
// send lowers the total and never notifies. The first balance seen
// for an address is the baseline and never notifies, and changing
// address resets the baseline, so switching wallets cannot produce
// a false notice from the previous wallet's total.

export function useIncomingNotice(
  address: string,
  balance: AddressBalance | null,
): { noticeNusan: number | null; dismissNotice: () => void } {
  const prevAddressRef = useRef<string | null>(null);
  const prevTotalRef = useRef<number | null>(null);
  const [noticeNusan, setNoticeNusan] = useState<number | null>(null);

  useEffect(() => {
    if (prevAddressRef.current !== address) {
      prevAddressRef.current = address;
      prevTotalRef.current = null;
      setNoticeNusan(null);
    }
    if (!balance) return;
    const total = balance.confirmed + balance.mempool;
    if (prevTotalRef.current === null) {
      prevTotalRef.current = total;
      return;
    }
    if (total > prevTotalRef.current) {
      const delta = total - prevTotalRef.current;
      setNoticeNusan((prev) => (prev ?? 0) + delta);
    }
    prevTotalRef.current = total;
  }, [address, balance]);

  const dismissNotice = useCallback(() => setNoticeNusan(null), []);

  return { noticeNusan, dismissNotice };
}
