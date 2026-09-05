import { useEffect, useSyncExternalStore } from 'react';
import { formatCurrencyCodeAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';
import {
  apiListDeals,
  apiCreateDeal,
  apiUpdateDeal,
  apiModerateDeal,
  apiDeleteDeal,
  apiGetDeal,
  hasTelegramAuth,
} from '../state/BotApi';
import type { ApiDeal, DealScope } from '../state/BotApi';

export type PayoutMethod = 'sbp' | 'card' | 'crypto';

export interface PayoutDetails {
  method: PayoutMethod;
  /** Phone (sbp), card number (card) or wallet address (crypto). */
  destination: string;
  /** Bank name for SBP/card; coin (TON/USDT/BTC) for crypto. */
  bank?: string;
  /** Holder full name (sbp/card). */
  holder?: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Deal {
  id: string;
  category: string;
  categoryEmoji?: string;
  title: string;
  description: string;
  price: number;
  currency: 'RUB' | 'KZT' | 'USDT' | 'TON' | 'TRX' | 'BTC' | 'ETH' | 'USD' | 'STARS';
  commissionPercent: number;
  payout: number;
  payoutDetails?: PayoutDetails;
  photo?: string;
  status: 'active' | 'paid' | 'closed';
  /** Admin moderation status — only 'approved' deals show up publicly. */
  moderation: ModerationStatus;
  /** Display name of the seller (Telegram first name when available). */
  sellerName?: string;
  /** Optional admin note left at rejection time. */
  moderationNote?: string;
  createdAt: number;
}

const STORAGE_KEY = 'playerok-otc:deals';

/* ------------------------------------------------------------------ *
 * Server-backed deal store.
 *
 * The backend (bot.py, table `deals`) is the source of truth so listings
 * created on one device are visible everywhere. localStorage is kept only
 * as a *warm cache* so the very first paint has data before the network
 * round-trip completes. Reads stay synchronous (against the in-memory
 * cache); mutations update the cache optimistically and sync to the server.
 * ------------------------------------------------------------------ */

function readCache(): Deal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Deal[];
  } catch {
    return [];
  }
}

let cache: Deal[] = readCache();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* quota or privacy mode, ignore */
  }
}

function emit() {
  for (const l of listeners) l();
}

function setCache(next: Deal[]) {
  cache = next;
  persist();
  emit();
}

function upsertLocal(deal: Deal) {
  const idx = cache.findIndex((d) => d.id === deal.id);
  const next = idx >= 0 ? cache.map((d) => (d.id === deal.id ? deal : d)) : [...cache, deal];
  setCache(next);
}

/** Reconstruct a front-end Deal from a server row, preferring the stored
 * full payload but always trusting the server's authoritative fields. */
function fromApi(row: ApiDeal): Deal | null {
  const p = (row.payload || {}) as Partial<Deal>;
  const id = row.dealId;
  const title = p.title || row.description || id;
  const category = p.category || '';
  const price = typeof p.price === 'number' ? p.price : row.amount;
  if (!id) return null;
  return {
    id,
    category,
    categoryEmoji: p.categoryEmoji,
    title,
    description: p.description ?? row.description ?? '',
    price,
    currency: (p.currency as Deal['currency']) || (row.currency as Deal['currency']) || 'TON',
    commissionPercent: typeof p.commissionPercent === 'number' ? p.commissionPercent : 0,
    payout: typeof p.payout === 'number' ? p.payout : price,
    payoutDetails: p.payoutDetails,
    photo: row.photo || p.photo,
    status: (p.status as Deal['status']) || (row.status as Deal['status']) || 'active',
    moderation: row.moderation || p.moderation || 'pending',
    sellerName: row.sellerName || p.sellerName,
    moderationNote: p.moderationNote,
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
  };
}

function toPayload(deal: Deal): Record<string, unknown> {
  return { ...deal };
}

/** Merge freshly fetched server rows into the cache, replacing rows that
 * belong to the same scope so deletions on the server propagate. */
function mergeFromServer(rows: ApiDeal[]) {
  const incoming = rows.map(fromApi).filter(Boolean) as Deal[];
  const byId = new Map(cache.map((d) => [d.id, d]));
  for (const d of incoming) byId.set(d.id, d);
  setCache([...byId.values()]);
}

let refreshing = false;

/** Pull the latest listings from the server into the cache. Public listings
 * do not require Telegram auth; private/admin scopes do. */
export async function refreshDeals(scopes: DealScope[] = ['public', 'mine']): Promise<void> {
  if (typeof window === 'undefined' || refreshing) return;
  refreshing = true;
  try {
    const allowedScopes = hasTelegramAuth() ? scopes : scopes.filter((s) => s === 'public');
    if (!allowedScopes.length) return;
    const results = await Promise.allSettled(allowedScopes.map((s) => apiListDeals(s)));
    const rows: ApiDeal[] = [];
    for (const r of results) if (r.status === 'fulfilled') rows.push(...r.value);
    if (rows.length || results.some((r) => r.status === 'fulfilled')) {
      mergeFromServer(rows);
    }
  } catch {
    /* offline — keep cache */
  } finally {
    refreshing = false;
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Deal[] {
  return cache;
}

/** React hook: subscribe to the deal cache and trigger a server refresh on mount.
 * Pass scopes to also pull e.g. the admin moderation queue (['all']). */
export function useDeals(scopes: DealScope[] = ['public', 'mine']): Deal[] {
  const deals = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const key = scopes.join(',');
  useEffect(() => {
    void refreshDeals(scopes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return deals;
}

export function listDeals(): Deal[] {
  return [...cache].sort((a, b) => b.createdAt - a.createdAt);
}

export function listApprovedDeals(): Deal[] {
  return listDeals().filter((d) => d.moderation !== 'rejected' && d.status !== 'closed');
}

export function listPendingDeals(): Deal[] {
  return listDeals().filter((d) => d.moderation === 'pending');
}

export function approveDeal(id: string): void {
  const d = getDeal(id);
  if (d) upsertLocal({ ...d, moderation: 'approved', moderationNote: undefined });
  if (hasTelegramAuth()) apiModerateDeal(id, 'approve').then(() => refreshDeals(['all'])).catch(() => undefined);
}

export function rejectDeal(id: string, note?: string): void {
  const d = getDeal(id);
  if (d) upsertLocal({ ...d, moderation: 'rejected', moderationNote: note });
  if (hasTelegramAuth()) apiModerateDeal(id, 'reject', note).then(() => refreshDeals(['all'])).catch(() => undefined);
}

export function getDeal(id: string): Deal | undefined {
  const local = cache.find((d) => d.id === id);
  // Cross-device deep link to a deal not in the cache yet: fetch it in the
  // background so a re-render can pick it up.
  if (!local && hasTelegramAuth()) {
    apiGetDeal(id)
      .then((row) => {
        if (row) {
          const d = fromApi(row);
          if (d) upsertLocal(d);
        }
      })
      .catch(() => undefined);
  }
  return local;
}

export function saveDeal(deal: Deal): void {
  const existed = cache.some((d) => d.id === deal.id);
  upsertLocal(deal);
  if (!hasTelegramAuth()) return;
  const req = existed ? apiUpdateDeal(deal.id, toPayload(deal)) : apiCreateDeal(toPayload(deal));
  req.then(() => refreshDeals(['mine'])).catch(() => undefined);
}

export function deleteDeal(id: string): void {
  setCache(cache.filter((d) => d.id !== id));
  if (hasTelegramAuth()) apiDeleteDeal(id).catch(() => undefined);
}

export function createDealId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Search query over user-created deals — used by the global search to merge
 * curated catalog products with whatever the current user has published.
 * By default public-visible deals are returned; pass {includePending:true}
 * for admin contexts that need rejected/closed rows too.
 */
export function searchDeals(query: string, opts: { includePending?: boolean } = {}): Deal[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return listDeals().filter((d) => {
    if (!opts.includePending && (d.moderation === 'rejected' || d.status === 'closed')) return false;
    const hay = `${d.id} ${d.title} ${d.description} ${d.category}`.toLowerCase();
    return hay.includes(q);
  });
}

export function formatPrice(amount: number, currency: Deal['currency']): string {
  return formatCurrencyCodeAmount(amount, currency as CurrencyCode);
}
