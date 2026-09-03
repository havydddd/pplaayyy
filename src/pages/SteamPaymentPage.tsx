import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { CheckIcon, CopyIcon, AlertIcon } from '../components/Icon';
import { ResultSheet } from '../components/ResultSheet';
import { PaymentIcon, paymentMeta } from '../components/PaymentIcon';
import type { PaymentId } from '../components/PaymentIcon';
import {
  ADMIN_TON_WALLET,
  KASPI_PHONE,
  KASPI_HOLDER,
  METHOD_CURRENCY,
  SBP_BANKS,
  SBP_HOLDERS,
  generateCard,
  generateSbpPhone,
} from '../state/TopupRequests';
import type { TopupMethod } from '../state/TopupRequests';
import { createTopup, hasTelegramAuth } from '../state/BotApi';
import { useLanguage } from '../state/LanguageContext';
import { convertMoney, formatCurrencyAmount, normalizeCurrency } from '../utils/money';

type Step = 'method' | 'requisites' | 'done';

const METHODS: PaymentId[] = ['sbp', 'card', 'kaspi', 'ton', 'usdt', 'btc'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Requisites {
  destination: string;
  copyable: string;
  network?: string;
  bank?: string;
  holder?: string;
}

function requisitesFor(method: PaymentId): Requisites {
  switch (method) {
    case 'sbp': {
      const phone = generateSbpPhone();
      return { destination: phone, copyable: phone, bank: pickRandom(SBP_BANKS), holder: pickRandom(SBP_HOLDERS) };
    }
    case 'card': {
      const card = generateCard();
      return { destination: card, copyable: card.replace(/\s+/g, ''), bank: 'МИР · Сбербанк', holder: pickRandom(SBP_HOLDERS) };
    }
    case 'kaspi':
      return { destination: KASPI_PHONE, copyable: KASPI_PHONE, bank: 'Kaspi Bank · KZT', holder: KASPI_HOLDER };
    case 'ton':
      return { destination: ADMIN_TON_WALLET, copyable: ADMIN_TON_WALLET, network: 'TON', holder: 'Playerok OTC Wallet' };
    case 'usdt':
      return { destination: ADMIN_TON_WALLET, copyable: ADMIN_TON_WALLET, network: 'TON (jUSDT) или TRC-20', holder: 'Playerok OTC Wallet' };
    case 'btc':
      return { destination: ADMIN_TON_WALLET, copyable: ADMIN_TON_WALLET, network: 'BTC через TON-обменник', holder: 'Playerok OTC Wallet' };
  }
}

export default function SteamPaymentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [method, setMethod] = useState<PaymentId>('sbp');
  const [step, setStep] = useState<Step>('method');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const { lang, t } = useLanguage();

  const amount = Number(params.get('amount') || 0);
  const currency = normalizeCurrency(params.get('currency'), 'RUB');
  const login = params.get('login') || '';
  const methodCurrency = METHOD_CURRENCY[method as TopupMethod];
  const payableAmount = useMemo(
    () => convertMoney(amount, currency, methodCurrency),
    [amount, currency, methodCurrency],
  );
  const displayAmount = useMemo(
    () => formatCurrencyAmount(payableAmount, methodCurrency),
    [methodCurrency, payableAmount],
  );

  const requisites = useMemo(() => requisitesFor(method), [method, step]);
  const isCrypto = method === 'ton' || method === 'usdt' || method === 'btc';

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t.copyPrompt, text);
    }
  };

  const submitPayment = () => {
    // Send the topup request to admin for manual confirmation (Steam top-ups
    // always go via support — same flow as the wallet topup page).
    if (hasTelegramAuth()) {
      createTopup({
        amount: payableAmount,
        method,
        currency: methodCurrency,
        destination: `STEAM:${login} · ${requisites.destination}`,
      }).catch(() => undefined);
    }
    setDone(true);
  };

  return (
    <div className="page">
      <AppBar
        title={t.steamPayment}
        onClose={() => (step === 'method' ? navigate('/') : setStep('method'))}
      />

      <div className="card mt-12">
        <div className="muted" style={{ fontSize: 12 }}>{t.steamLoginLabel}</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{login}</div>
        <div className="divider" />
        <div className="info-row">
          <span className="label">{t.toPay}</span>
          <span className="value">{displayAmount}</span>
        </div>
      </div>

      {step === 'method' && (
        <>
          <div className="section-title">
            <h2>{t.paymentMethodTitle}</h2>
          </div>
          <div className="method-list">
            {METHODS.map((m) => (
              <div
                key={m}
                className={`method-list__item ${method === m ? 'active' : ''}`}
                onClick={() => setMethod(m)}
              >
                <PaymentIcon id={m} size={44} rounded={14} />
                <div className="meta">
                  <div className="name">{paymentMeta(m, lang).name}</div>
                  <div className="sub">{paymentMeta(m, lang).sub}</div>
                </div>
                <div className={`checkbox ${method === m ? 'checked' : ''}`} style={{ borderRadius: '50%' }}>
                  <CheckIcon size={14} />
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn--primary mt-20" onClick={() => setStep('requisites')}>
            {t.continueBtn}
          </button>
        </>
      )}

      {step === 'requisites' && (
        <>
          <div className="card mt-16">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PaymentIcon id={method} size={44} rounded={14} />
              <div style={{ flex: 1 }}>
                <div className="muted" style={{ fontSize: 12 }}>{t.steamPayment}</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{displayAmount}</div>
              </div>
              <span className="badge badge--blue">{paymentMeta(method, lang).name}</span>
            </div>

            <div className="divider" />

            {isCrypto ? (
              <>
                <div className="info-row">
                  <span className="label">{t.network}</span>
                  <span className="value">{requisites.network ?? '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.transferAmount}</span>
                  <span className="value">{displayAmount}</span>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {t.walletHint}
                </div>
                <div className="link-box" style={{ marginTop: 6 }}>{requisites.destination}</div>
              </>
            ) : method === 'kaspi' ? (
              <>
                <div className="info-row">
                  <span className="label">{t.kaspiNumber}</span>
                  <span className="value">{requisites.destination}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.bankLabel}</span>
                  <span className="value">{requisites.bank}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.recipient}</span>
                  <span className="value">{requisites.holder}</span>
                </div>
              </>
            ) : method === 'sbp' ? (
              <>
                <div className="info-row">
                  <span className="label">{t.phone}</span>
                  <span className="value">{requisites.destination}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.receivingBank}</span>
                  <span className="value">{requisites.bank}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.recipient}</span>
                  <span className="value">{requisites.holder}</span>
                </div>
              </>
            ) : (
              <>
                <div className="info-row">
                  <span className="label">{t.cardNumber}</span>
                  <span className="value">{requisites.destination}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.bankLabel}</span>
                  <span className="value">{requisites.bank}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t.recipient}</span>
                  <span className="value">{requisites.holder}</span>
                </div>
              </>
            )}
          </div>

          <button className="btn btn--secondary mt-12" onClick={() => copy(requisites.copyable)}>
            <CopyIcon size={18} /> {copied ? t.copied : t.copyDetails}
          </button>

          <div className="warning mt-12">
            <AlertIcon size={18} />
            <div>
              <b>{t.important}</b> {t.steamNote}
            </div>
          </div>

          <button className="btn btn--primary mt-12" onClick={submitPayment}>
            {t.sendPayment}
          </button>
        </>
      )}

      <ResultSheet
        open={done}
        variant="success"
        title={t.waitingTitle}
        message={t.waitingMsg}
        primaryLabel={t.toHome}
        onPrimary={() => navigate('/')}
      />
    </div>
  );
}
