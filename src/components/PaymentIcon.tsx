import type { CSSProperties } from 'react';

export type PaymentId = 'sbp' | 'ton' | 'usdt' | 'btc' | 'card' | 'kaspi';

const ART: Record<PaymentId, { bg: string; mask: string; maskSize?: string }> = {
  sbp: {
    bg: 'conic-gradient(from 200deg at 50% 50%, #00bf6f, #00a651, #ff5a3a, #ff3f67, #6c63ff, #1f7ad8, #00bf6f)',
    mask: '/pay/sbp.svg',
    maskSize: '62%',
  },
  ton: {
    bg: 'linear-gradient(135deg, #37bbfe 0%, #0088cc 100%)',
    mask: '/pay/ton.svg',
    maskSize: '58%',
  },
  usdt: {
    bg: 'linear-gradient(135deg, #1ad77b 0%, #009688 70%, #00695c 100%)',
    mask: '/pay/tether.svg',
    maskSize: '62%',
  },
  btc: {
    bg: 'radial-gradient(120% 120% at 25% 20%, #ffc46d 0%, #f7931a 65%, #c46c00 100%)',
    mask: '/pay/bitcoin.svg',
    maskSize: '70%',
  },
  card: {
    bg: 'linear-gradient(135deg, #ff5b5b 0%, #d23131 55%, #1f4dd8 100%)',
    mask: '/pay/card.svg',
    maskSize: '64%',
  },
  kaspi: {
    bg: 'linear-gradient(135deg, #ff3a3a 0%, #c11616 100%)',
    mask: '/pay/card.svg',
    maskSize: '64%',
  },
};

interface Props {
  id: PaymentId;
  size?: number;
  rounded?: number;
  style?: CSSProperties;
}

export function PaymentIcon({ id, size = 44, rounded = 14, style }: Props) {
  const art = ART[id];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: art.bg,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#ffffff',
          WebkitMaskImage: `url(${art.mask})`,
          maskImage: `url(${art.mask})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: art.maskSize ?? '60%',
          maskSize: art.maskSize ?? '60%',
        }}
      />
    </div>
  );
}

export const PAYMENT_META: Record<PaymentId, { name: string; sub: string }> = {
  sbp: { name: 'СБП', sub: 'Все банки РФ · моментально' },
  ton: { name: 'Toncoin (TON)', sub: 'Telegram Wallet · TON Space' },
  usdt: { name: 'USDT', sub: 'TRC-20 · ERC-20' },
  btc: { name: 'Bitcoin (BTC)', sub: 'On-chain · 1 подтверждение' },
  card: { name: 'Банковская карта', sub: 'Visa · Mastercard · МИР' },
  kaspi: { name: 'Kaspi', sub: 'Банк Казахстана · KZT' },
};

const PAYMENT_META_EN: Record<PaymentId, { name: string; sub: string }> = {
  sbp: { name: 'SBP', sub: 'Russian banks · instant' },
  ton: { name: 'Toncoin (TON)', sub: 'Telegram Wallet · TON Space' },
  usdt: { name: 'USDT', sub: 'TRC-20 · ERC-20' },
  btc: { name: 'Bitcoin (BTC)', sub: 'On-chain · 1 confirmation' },
  card: { name: 'Bank card', sub: 'Visa · Mastercard · MIR' },
  kaspi: { name: 'Kaspi', sub: 'Kazakhstan bank · KZT' },
};

export function paymentMeta(id: PaymentId, lang: 'ru' | 'en' = 'ru'): { name: string; sub: string } {
  return (lang === 'en' ? PAYMENT_META_EN : PAYMENT_META)[id];
}
