export type CurrencyCode = 'TON' | 'USDT' | 'BTC' | 'ETH' | 'TRX' | 'CNY' | 'RUB' | 'KZT' | 'USD';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'TON',
  'USDT',
  'BTC',
  'ETH',
  'TRX',
  'CNY',
  'RUB',
  'KZT',
  'USD',
];

export const MONEY_META: Record<
  CurrencyCode,
  { label: CurrencyCode; symbol: string; rubRate: number; precision: number }
> = {
  TON: { label: 'TON', symbol: '💎', rubRate: 150, precision: 2 },
  USDT: { label: 'USDT', symbol: '₮', rubRate: 105, precision: 2 },
  BTC: { label: 'BTC', symbol: '₿', rubRate: 6_000_000, precision: 6 },
  ETH: { label: 'ETH', symbol: 'Ξ', rubRate: 330_000, precision: 5 },
  TRX: { label: 'TRX', symbol: 'TRX', rubRate: 30, precision: 2 },
  CNY: { label: 'CNY', symbol: '¥', rubRate: 12, precision: 2 },
  RUB: { label: 'RUB', symbol: '₽', rubRate: 1, precision: 0 },
  KZT: { label: 'KZT', symbol: '₸', rubRate: 1 / 5.5, precision: 0 },
  USD: { label: 'USD', symbol: '$', rubRate: 100, precision: 2 },
};

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value.toUpperCase() as CurrencyCode);
}

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = 'TON'): CurrencyCode {
  return isCurrency(value) ? (value.toUpperCase() as CurrencyCode) : fallback;
}

export function roundMoney(amount: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((Number(amount) || 0) * factor) / factor;
}

export function convertMoney(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return roundMoney(amount, MONEY_META[to].precision);
  const rub = (Number(amount) || 0) * MONEY_META[from].rubRate;
  return roundMoney(rub / MONEY_META[to].rubRate, MONEY_META[to].precision);
}

export function amountToRub(amount: number, currency: CurrencyCode): number {
  return convertMoney(amount, currency, 'RUB');
}

export function amountFromRub(amountRub: number, currency: CurrencyCode): number {
  return convertMoney(amountRub, 'RUB', currency);
}

export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
  opts: { withSymbol?: boolean; withCode?: boolean; locale?: string } = {},
): string {
  const { withSymbol = true, withCode = false, locale = 'ru-RU' } = opts;
  const meta = MONEY_META[currency];
  const precision = meta.precision;
  const rounded = roundMoney(amount, precision);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: rounded % 1 === 0 ? 0 : precision,
    minimumFractionDigits: precision > 0 && rounded % 1 !== 0 ? Math.min(2, precision) : 0,
  }).format(rounded);
  if (currency === 'USD' && withSymbol && !withCode) return `${meta.symbol}${formatted}`;
  const suffix = withCode ? currency : meta.symbol;
  return withSymbol ? `${formatted} ${suffix}` : formatted;
}

export function formatCurrencyCodeAmount(amount: number, currency: CurrencyCode): string {
  return formatCurrencyAmount(amount, currency, { withCode: true });
}

export function formatCurrencyFromRub(amountRub: number, currency: CurrencyCode): string {
  return formatCurrencyAmount(amountFromRub(amountRub, currency), currency);
}
