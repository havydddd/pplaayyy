import { useEffect, useSyncExternalStore } from 'react';
import type { AppId, Product } from '../data/catalog';
import type { ProductCurrency } from '../data/catalog';
import type { Review } from '../data/reviews';
import { apiGetStore, apiSetStore, hasTelegramAuth } from './BotApi';

export interface AdminSeller {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  rating: number;
  reviews?: Review[];
}

export interface AdminProduct {
  id: string;
  app: AppId;
  category: string;
  title: string;
  description: string;
  price: number;
  currency?: ProductCurrency;
  image?: string;
  sellerId: string;
  createdAt: number;
}

const SELLERS_KEY = 'playerok-otc:admin-sellers';
const PRODUCTS_KEY = 'playerok-otc:admin-products';

export const DEFAULT_SELLERS: AdminSeller[] = [
  {
    id: 'seller-playerok',
    name: 'Playerok Seller',
    description: 'Проверенный продавец',
    rating: 5,
    reviews: [],
  },
];

/* ------------------------------------------------------------------ *
 * Server-backed admin store.
 *
 * Sellers and hand-picked products are admin-curated and global, so they live
 * in the backend (system_settings KV) and show up on every device. localStorage
 * is kept as a warm cache for instant first paint; reads stay synchronous and
 * writes push the whole collection to the server (admin-only on the backend).
 * ------------------------------------------------------------------ */

const STORE_KEY: Record<string, string> = {
  [SELLERS_KEY]: 'admin_sellers',
  [PRODUCTS_KEY]: 'admin_products',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

let sellersCache: AdminSeller[] = readJson<AdminSeller[]>(SELLERS_KEY, []);
let productsCache: AdminProduct[] = readJson<AdminProduct[]>(PRODUCTS_KEY, []);
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function setSellers(next: AdminSeller[], push: boolean) {
  sellersCache = next;
  persist(SELLERS_KEY, next);
  emit();
  if (push && hasTelegramAuth()) apiSetStore(STORE_KEY[SELLERS_KEY], next).catch(() => undefined);
}

function setProducts(next: AdminProduct[], push: boolean) {
  productsCache = next;
  persist(PRODUCTS_KEY, next);
  emit();
  if (push && hasTelegramAuth()) apiSetStore(STORE_KEY[PRODUCTS_KEY], next).catch(() => undefined);
}

/** Pull the latest admin collections from the server into the cache. */
export async function refreshAdminStore(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const [sellers, products] = await Promise.all([
      apiGetStore<AdminSeller[]>(STORE_KEY[SELLERS_KEY]),
      apiGetStore<AdminProduct[]>(STORE_KEY[PRODUCTS_KEY]),
    ]);
    if (Array.isArray(sellers)) setSellers(sellers, false);
    if (Array.isArray(products)) setProducts(products, false);
  } catch {
    /* offline — keep warm cache */
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let storeVersion = 0;
function bump() {
  storeVersion += 1;
}
listeners.add(bump);

/** React hook: subscribe to the admin store and refresh from the server on mount. */
export function useAdminStore(): number {
  const v = useSyncExternalStore(subscribe, () => storeVersion, () => storeVersion);
  useEffect(() => {
    void refreshAdminStore();
  }, []);
  return v;
}

export function listAdminSellers(): AdminSeller[] {
  return sellersCache.length ? sellersCache : DEFAULT_SELLERS;
}

export function saveAdminSeller(seller: AdminSeller): void {
  const base = sellersCache.length ? sellersCache : [];
  const idx = base.findIndex((s) => s.id === seller.id);
  const next = idx >= 0 ? base.map((s) => (s.id === seller.id ? seller : s)) : [...base, seller];
  setSellers(next, true);
}

export function deleteAdminSeller(id: string): void {
  setSellers(sellersCache.filter((s) => s.id !== id), true);
  setProducts(productsCache.filter((p) => p.sellerId !== id), true);
}

export function listAdminProducts(): AdminProduct[] {
  return [...productsCache].sort((a, b) => b.createdAt - a.createdAt);
}

export function saveAdminProduct(product: AdminProduct): void {
  const idx = productsCache.findIndex((p) => p.id === product.id);
  const next = idx >= 0
    ? productsCache.map((p) => (p.id === product.id ? product : p))
    : [product, ...productsCache];
  setProducts(next, true);
}

export function deleteAdminProduct(id: string): void {
  setProducts(productsCache.filter((p) => p.id !== id), true);
}

export function adminProductToCatalogProduct(product: AdminProduct): Product {
  const seller = listAdminSellers().find((s) => s.id === product.sellerId) ?? DEFAULT_SELLERS[0];
  return {
    id: product.id,
    app: product.app,
    category: product.category,
    title: product.title,
    subtitle: seller.description || product.category,
    description: product.description,
    price: product.price,
    currency: product.currency ?? 'RUB',
    artGradient: 'linear-gradient(135deg, #2a7de1, #37bbfe)',
    artLabel: product.title.slice(0, 18).toUpperCase(),
    rating: seller.rating,
    reviews: 0,
    seller: seller.name,
    sellerLevel: 'Pro',
    priceColor: 'green',
    tags: ['items'],
    image: product.image,
  } as Product;
}
