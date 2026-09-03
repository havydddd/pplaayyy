import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe, hasTelegramAuth, purchaseWithBalance, setApiCurrency } from './BotApi';
import {
  MONEY_META,
  SUPPORTED_CURRENCIES,
  amountFromRub,
  amountToRub,
  convertMoney,
  formatCurrencyAmount,
  formatCurrencyCodeAmount,
  formatCurrencyFromRub,
  normalizeCurrency,
  roundMoney,
} from '../utils/money';
import type { CurrencyCode } from '../utils/money';

export type WalletCurrency = CurrencyCode;
export type WalletTransactionType = 'topup' | 'purchase';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amountRub: number;
  currency: WalletCurrency;
  displayAmount: number;
  title: string;
  createdAt: number;
}

interface WalletCtx {
  balance: number;
  balanceRub: number;
  currency: WalletCurrency;
  transactions: WalletTransaction[];
  setCurrency: (currency: WalletCurrency) => void;
  refresh: () => Promise<void>;
  setRemoteBalance: (balance: number, currency?: string) => void;
  topUp: (amount: number, title?: string, amountCurrency?: WalletCurrency) => void;
  charge: (amount: number, title?: string, amountCurrency?: WalletCurrency, productId?: string) => Promise<'ok' | 'insufficient' | 'error'>;
  formatAmount: (amountRub: number) => string;
  formatBalance: () => string;
  convertToWallet: (amount: number, amountCurrency: WalletCurrency) => number;
}

const Ctx = createContext<WalletCtx | null>(null);
const STORAGE_KEY = 'playerok-otc:balance';
const CURRENCY_KEY = 'playerok-otc:currency';
const TX_KEY = 'playerok-otc:transactions';
const DEFAULT_BALANCE = 0;
const BACKEND_CURRENCIES: WalletCurrency[] = SUPPORTED_CURRENCIES;

export const CURRENCIES: Record<
  WalletCurrency,
  { label: WalletCurrency; symbol: string; fromRub: (rub: number) => number; toRub: (amount: number) => number }
> = {
  TON: { label: 'TON', symbol: MONEY_META.TON.symbol, fromRub: (rub) => amountFromRub(rub, 'TON'), toRub: (amount) => amountToRub(amount, 'TON') },
  USDT: { label: 'USDT', symbol: MONEY_META.USDT.symbol, fromRub: (rub) => amountFromRub(rub, 'USDT'), toRub: (amount) => amountToRub(amount, 'USDT') },
  BTC: { label: 'BTC', symbol: MONEY_META.BTC.symbol, fromRub: (rub) => amountFromRub(rub, 'BTC'), toRub: (amount) => amountToRub(amount, 'BTC') },
  ETH: { label: 'ETH', symbol: MONEY_META.ETH.symbol, fromRub: (rub) => amountFromRub(rub, 'ETH'), toRub: (amount) => amountToRub(amount, 'ETH') },
  TRX: { label: 'TRX', symbol: MONEY_META.TRX.symbol, fromRub: (rub) => amountFromRub(rub, 'TRX'), toRub: (amount) => amountToRub(amount, 'TRX') },
  CNY: { label: 'CNY', symbol: MONEY_META.CNY.symbol, fromRub: (rub) => amountFromRub(rub, 'CNY'), toRub: (amount) => amountToRub(amount, 'CNY') },
  RUB: { label: 'RUB', symbol: MONEY_META.RUB.symbol, fromRub: (rub) => amountFromRub(rub, 'RUB'), toRub: (amount) => amountToRub(amount, 'RUB') },
  KZT: { label: 'KZT', symbol: MONEY_META.KZT.symbol, fromRub: (rub) => amountFromRub(rub, 'KZT'), toRub: (amount) => amountToRub(amount, 'KZT') },
  USD: { label: 'USD', symbol: MONEY_META.USD.symbol, fromRub: (rub) => amountFromRub(rub, 'USD'), toRub: (amount) => amountToRub(amount, 'USD') },
};

function readBalance(): number {
  if (typeof window === 'undefined') return DEFAULT_BALANCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_BALANCE;
    const n = Number(raw);
    return Number.isFinite(n) ? n : DEFAULT_BALANCE;
  } catch {
    return DEFAULT_BALANCE;
  }
}

function readCurrency(): WalletCurrency {
  if (typeof window === 'undefined') return 'TON';
  try {
    const raw = window.localStorage.getItem(CURRENCY_KEY);
    if (BACKEND_CURRENCIES.includes(raw as WalletCurrency)) return raw as WalletCurrency;
  } catch {
    /* ignore */
  }
  return 'TON';
}

function readTransactions(): WalletTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((tx): tx is WalletTransaction => {
        return (
          tx &&
          typeof tx.id === 'string' &&
          (tx.type === 'topup' || tx.type === 'purchase') &&
          typeof tx.amountRub === 'number' &&
          typeof tx.displayAmount === 'number' &&
          typeof tx.title === 'string' &&
          typeof tx.createdAt === 'number' &&
          BACKEND_CURRENCIES.includes(tx.currency)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function makeTxId(): string {
  return 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

export function convertFromRub(amountRub: number, currency: WalletCurrency): number {
  return roundMoney(CURRENCIES[currency].fromRub(amountRub), MONEY_META[currency].precision);
}

export function convertToRub(amount: number, currency: WalletCurrency): number {
  return roundMoney(CURRENCIES[currency].toRub(amount), MONEY_META.RUB.precision);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balanceRub, setBalanceRub] = useState<number>(readBalance);
  const [currency, setCurrencyState] = useState<WalletCurrency>(readCurrency);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(readTransactions);
  const [backendBalance, setBackendBalance] = useState<number | null>(null);

  const applyMe = useCallback((balance: number, nextCurrency: string) => {
    const cur = normalizeCurrency(nextCurrency);
    setCurrencyState(cur);
    setBackendBalance(roundMoney(balance, MONEY_META[cur].precision));
    setBalanceRub(roundMoney(CURRENCIES[cur].toRub(balance)));
  }, []);

  const refresh = useCallback(async () => {
    if (!hasTelegramAuth()) return;
    const me = await fetchMe();
    applyMe(Number(me.balance) || 0, me.currency);
  }, [applyMe]);

  useEffect(() => {
    if (!hasTelegramAuth()) return;
    const sync = () => {
      refresh().catch(() => undefined);
    };
    sync();
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refresh]);

  useEffect(() => {
    if (!hasTelegramAuth()) return;
    refresh().catch(() => {
      /* browser fallback keeps local balance */
    });
    const id = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(balanceRub));
    } catch {
      /* ignore */
    }
  }, [balanceRub]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CURRENCY_KEY, currency);
    } catch {
      /* ignore */
    }
  }, [currency]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TX_KEY, JSON.stringify(transactions));
    } catch {
      /* ignore */
    }
  }, [transactions]);

  const setCurrency = useCallback((next: WalletCurrency) => {
    const previousCurrency = currency;
    const previousBalance = backendBalance ?? convertFromRub(balanceRub, previousCurrency);
    const converted = convertMoney(previousBalance, previousCurrency, next);
    setCurrencyState(next);
    if (backendBalance != null) {
      setBackendBalance(converted);
    }
    setBalanceRub(roundMoney(CURRENCIES[next].toRub(converted)));
    if (hasTelegramAuth()) {
      setApiCurrency(next)
        .then((res) => applyMe(Number(res.balance) || 0, res.currency))
        .catch(() => refresh().catch(() => undefined));
    }
  }, [applyMe, backendBalance, balanceRub, currency, refresh]);

  const setRemoteBalance = useCallback((balance: number, nextCurrency?: string) => {
    applyMe(balance, nextCurrency || currency);
  }, [applyMe, currency]);

  const displayedBalance = backendBalance ?? convertFromRub(balanceRub, currency);

  const topUp = useCallback<WalletCtx['topUp']>((amount, title = 'Пополнение баланса', amountCurrency = currency) => {
    if (hasTelegramAuth()) {
      refresh().catch(() => undefined);
      return;
    }
    const amountRub = convertToRub(amount, amountCurrency);
    if (amountRub <= 0) return;
    const displayAmount = amountCurrency === currency ? amount : convertMoney(amount, amountCurrency, currency);
    setBalanceRub((b) => Math.max(0, roundMoney(b + amountRub)));
    setTransactions((items) => [
      {
        id: makeTxId(),
        type: 'topup',
        amountRub,
        currency,
        displayAmount: roundMoney(displayAmount, MONEY_META[currency].precision),
        title,
        createdAt: Date.now(),
      },
      ...items,
    ]);
  }, [currency, refresh]);

  const charge = useCallback<WalletCtx['charge']>(async (amount, title = 'Покупка товара', amountCurrency = 'RUB', productId) => {
    const amountRub = convertToRub(amount, amountCurrency);
    if (hasTelegramAuth()) {
      // The backend converts the product price (amountCurrency) into the user's
      // settlement currency and debits authoritatively — no local pre-check, so
      // a TON wallet can buy a RUB-priced item once the price is converted.
      try {
        const res = await purchaseWithBalance({
          amount,
          currency: amountCurrency,
          title,
          productId,
        });
        setRemoteBalance(Number(res.balance) || 0, res.currency);
        if (!res.ok) return 'insufficient';
      } catch {
        // Network/server failure — do NOT report as "insufficient funds".
        await refresh().catch(() => undefined);
        return 'error';
      }
      return 'ok';
    }
    let result: 'ok' | 'insufficient' = 'ok';
    setBalanceRub((b) => {
      if (b < amountRub) {
        result = 'insufficient';
        return b;
      }
      return roundMoney(b - amountRub);
    });
    if (result === 'ok') {
      setTransactions((items) => [
        {
          id: makeTxId(),
          type: 'purchase',
          amountRub,
          currency,
          displayAmount: convertFromRub(amountRub, currency),
          title,
          createdAt: Date.now(),
        },
        ...items,
      ]);
    }
    return result;
  }, [backendBalance, currency, setRemoteBalance]);

  const formatAmount = useCallback((amountRub: number) => formatMoney(amountRub, currency), [currency]);
  const formatBalance = useCallback(() => formatCurrencyCodeAmount(displayedBalance, currency), [currency, displayedBalance]);
  const convertToWallet = useCallback(
    (amount: number, amountCurrency: WalletCurrency) => convertMoney(amount, amountCurrency, currency),
    [currency],
  );
  const balance = displayedBalance;
  const syncedBalanceRub = CURRENCIES[currency].toRub(balance);

  const value = useMemo(
    () => ({
      balance,
      balanceRub: syncedBalanceRub,
      currency,
      transactions,
      setCurrency,
      refresh,
      setRemoteBalance,
      topUp,
      charge,
      formatAmount,
      formatBalance,
      convertToWallet,
    }),
    [balance, syncedBalanceRub, currency, transactions, setCurrency, refresh, setRemoteBalance, topUp, charge, formatAmount, formatBalance, convertToWallet],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useWallet must be used within WalletProvider');
  return v;
}

export function formatMoney(amountRub: number, currency: WalletCurrency = 'RUB'): string {
  return formatCurrencyFromRub(amountRub, currency);
}

export function formatTransactionAmount(tx: WalletTransaction): string {
  const formatted = formatCurrencyAmount(tx.displayAmount, tx.currency);
  return `${tx.type === 'purchase' ? '-' : '+'}${formatted}`;
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount) + ' ₽';
}
