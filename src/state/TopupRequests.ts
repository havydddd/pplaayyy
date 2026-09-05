export type TopupStatus = 'pending' | 'approved' | 'rejected';
import type { CurrencyCode } from '../utils/money';

export type TopupMethod = 'sbp' | 'ton' | 'usdt' | 'btc' | 'card' | 'kaspi' | 'stars';

/** Maps a topup method to the currency the user pays in. */
export const METHOD_CURRENCY: Record<TopupMethod, Extract<CurrencyCode, 'RUB' | 'KZT' | 'TON' | 'USDT' | 'BTC' | 'STARS'>> = {
  sbp: 'RUB',
  card: 'RUB',
  kaspi: 'KZT',
  ton: 'TON',
  usdt: 'USDT',
  btc: 'BTC',
  stars: 'STARS',
};

export const KASPI_PHONE = '+7 000 000 00 00';
export const KASPI_HOLDER = 'YOUR_KASPI_HOLDER';

export interface TopupRequest {
  id: string;
  amount: number;
  currency: CurrencyCode;
  method: TopupMethod;
  /** Destination shown to the user (random SBP number, crypto address, masked card). */
  destination: string;
  status: TopupStatus;
  createdAt: number;
  txid?: string;
}

const STORAGE_KEY = 'playerok-otc:topup-requests';

export function loadRequests(): TopupRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as TopupRequest[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list: TopupRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function saveRequest(req: TopupRequest): void {
  persist([req, ...loadRequests().filter((r) => r.id !== req.id)]);
}

export function pendingCount(): number {
  return loadRequests().filter((r) => r.status === 'pending').length;
}

export const SBP_BANKS = [
  'Тинькофф',
  'Сбербанк',
  'Альфа-Банк',
  'ВТБ',
  'Райффайзен',
  'Газпромбанк',
];

export const SBP_HOLDERS = [
  'Андрей К.',
  'Дмитрий П.',
  'Ольга С.',
  'Михаил Р.',
  'Наталья В.',
];

export function generateSbpPhone(): string {
  const groups = [
    Math.floor(900 + Math.random() * 100),
    Math.floor(100 + Math.random() * 900),
    Math.floor(10 + Math.random() * 90),
    Math.floor(10 + Math.random() * 90),
  ];
  return `+7 ${groups[0]} ${groups[1]}-${groups[2]}-${groups[3]}`;
}

export function generateCard(): string {
  // Common Mir card BIN-style mask, only the last 4 digits randomised so
  // it visually looks like a real card without any real account number.
  const part = () =>
    Math.floor(1000 + Math.random() * 9000).toString();
  return `2202 20XX XXXX ${part().slice(0, 4)}`;
}

/** Admin TON wallet that real crypto top-ups should be sent to. */
export const ADMIN_TON_WALLET = 'YOUR_TON_WALLET_ADDRESS';
