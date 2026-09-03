export type WithdrawalMethod = 'crypto' | 'card';

export interface WithdrawalRequest {
  id: string;
  method: WithdrawalMethod;
  amount: number;
  walletAddress?: string;
  network?: string;
  cardNumber?: string;
  holderName?: string;
  status: 'pending';
  createdAt: number;
}

const STORAGE_KEY = 'playerok-otc:withdrawals';

export function loadWithdrawals(): WithdrawalRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WithdrawalRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveWithdrawal(req: WithdrawalRequest): void {
  if (typeof window === 'undefined') return;
  const all = loadWithdrawals();
  all.unshift(req);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
