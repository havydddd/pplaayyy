export interface ApiMe {
  userId: number;
  username: string;
  balance: number;
  currency: string;
  lang: string;
  bought: number;
  sold: number;
  volume: number;
}

export interface ApiTopup {
  id: string;
  userId: number;
  username: string;
  amount: number;
  currency: string;
  creditAmount: number;
  creditCurrency: string;
  method: string;
  destination: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: number | null;
  approvedAt?: string | null;
  rejectedBy?: number | null;
  rejectedAt?: string | null;
}

export interface ApiPurchaseResult {
  ok: boolean;
  error?: 'insufficient' | 'invalid' | string;
  balance: number;
  currency: string;
  debited?: number;
  missing?: number;
}

const DEFAULT_API_BASE = 'https://example.com';

export const API_BASE = (import.meta.env.VITE_BOT_API_URL || DEFAULT_API_BASE).replace(/\/$/, '');

export function telegramInitData(): string {
  const data = window.Telegram?.WebApp?.initData || '';
  if (import.meta.env.DEV) {
    console.log('[BotApi] initData exists:', !!data, 'length:', data.length);
  }
  return data;
}

export function getTelegramUserId(): number | undefined {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
}

export function hasTelegramAuth(): boolean {
  return telegramInitData().length > 0 || !!getTelegramUserId();
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const initData = telegramInitData();
  let url = `${API_BASE}${path}`;

  // Всегда добавляем user_id как параметр, если знаем его
  const userId = getTelegramUserId();
  if (userId) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}user_id=${userId}`;
  }

  if (initData) {
    headers.set('X-Telegram-Init-Data', initData);
  } else if (import.meta.env.DEV) {
    console.warn('[BotApi] No initData, but user_id will be passed as query param');
  }

  if (import.meta.env.DEV) {
    console.log('[BotApi] Request URL:', url);
    console.log('[BotApi] Headers:', Object.fromEntries(headers.entries()));
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || '';
    } catch {
      /* non-JSON error body */
    }
    const errMsg = detail ? `API ${res.status}: ${detail}` : `API ${res.status}`;
    console.error('[BotApi] Error:', errMsg);
    throw new Error(errMsg);
  }
  return res.json() as Promise<T>;
}

export function fetchMe(): Promise<ApiMe> {
  return apiFetch<ApiMe>('/api/me');
}

export function createTopup(input: {
  amount: number;
  method: string;
  destination: string;
  currency?: string;
}): Promise<ApiTopup> {
  return apiFetch<ApiTopup>('/api/topups', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listTopups(scope?: 'all'): Promise<ApiTopup[]> {
  return apiFetch<ApiTopup[]>(scope === 'all' ? '/api/topups?scope=all' : '/api/topups');
}

export function approveTopup(id: string): Promise<{ ok: boolean; topup: ApiTopup; error?: string }> {
  return apiFetch<{ ok: boolean; topup: ApiTopup; error?: string }>(`/api/topups/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function rejectTopup(id: string): Promise<{ ok: boolean; topup: ApiTopup; error?: string }> {
  return apiFetch<{ ok: boolean; topup: ApiTopup; error?: string }>(`/api/topups/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function changeAdminBalance(input: {
  userId?: number;
  amount: number;
  mode: 'add' | 'set';
}): Promise<{ ok: boolean; userId: number; balance: number; currency: string }> {
  return apiFetch<{ ok: boolean; userId: number; balance: number; currency: string }>('/api/admin/balance', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setApiCurrency(currency: string): Promise<{ ok: boolean; currency: string; balance: number }> {
  return apiFetch<{ ok: boolean; currency: string; balance: number }>('/api/currency', {
    method: 'POST',
    body: JSON.stringify({ currency }),
  });
}

export function setApiLanguage(lang: 'ru' | 'en'): Promise<{ ok: boolean; lang: string }> {
  return apiFetch<{ ok: boolean; lang: string }>('/api/lang', {
    method: 'POST',
    body: JSON.stringify({ lang }),
  });
}

export function purchaseWithBalance(input: {
  amount: number;
  currency: string;
  title?: string;
  productId?: string;
}): Promise<ApiPurchaseResult> {
  return apiFetch<ApiPurchaseResult>('/api/purchase', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Raw deal row as returned by the backend. `payload` carries the full
 * front-end Deal object for mini-app marketplace listings. */
export interface ApiDeal {
  dealId: string;
  amount: number;
  description: string;
  sellerId: number;
  sellerName: string;
  buyerId: number | null;
  status: string;
  currency: string;
  photo: string;
  moderation: 'pending' | 'approved' | 'rejected';
  payload: Record<string, unknown> | null;
}

export type DealScope = 'public' | 'mine' | 'pending' | 'all';

export function apiListDeals(scope: DealScope = 'public'): Promise<ApiDeal[]> {
  return apiFetch<ApiDeal[]>(`/api/deals?scope=${scope}`);
}

export function apiGetDeal(id: string): Promise<ApiDeal | null> {
  return apiFetch<ApiDeal | null>(`/api/deals/${encodeURIComponent(id)}`);
}

export function apiCreateDeal(payload: Record<string, unknown>): Promise<ApiDeal> {
  return apiFetch<ApiDeal>('/api/deals', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  });
}

export function apiUpdateDeal(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/deals/${encodeURIComponent(id)}/update`, {
    method: 'POST',
    body: JSON.stringify({ payload }),
  });
}

export function apiModerateDeal(
  id: string,
  action: 'approve' | 'reject',
  note?: string,
): Promise<{ ok: boolean; moderation: string }> {
  return apiFetch<{ ok: boolean; moderation: string }>(`/api/deals/${encodeURIComponent(id)}/moderate`, {
    method: 'POST',
    body: JSON.stringify({ action, note }),
  });
}

export function apiDeleteDeal(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/deals/${encodeURIComponent(id)}/delete`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Global admin-curated collections (sellers, hand-picked products) shared by
 * all devices. GET is public; POST is admin-only. */
export function apiGetStore<T>(key: string): Promise<T | null> {
  return apiFetch<T | null>(`/api/store/${encodeURIComponent(key)}`);
}

export function apiSetStore<T>(key: string, value: T): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/store/${encodeURIComponent(key)}`, {
    method: 'POST',
    body: JSON.stringify(value),
  });
}

export function createWithdrawal(input: {
  amount: number;
  method: 'crypto' | 'card';
  walletAddress?: string;
  network?: string;
  cardNumber?: string;
  holderName?: string;
}): Promise<{ ok: boolean; error?: string; balance?: number; currency?: string }> {
  return apiFetch<{ ok: boolean; error?: string; balance?: number; currency?: string }>('/api/withdraw', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
