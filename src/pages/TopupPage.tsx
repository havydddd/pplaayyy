import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { WalletIcon, CheckIcon, CopyIcon, AlertIcon } from '../components/Icon';
import { useWallet } from '../state/WalletContext';
import { PaymentIcon, paymentMeta } from '../components/PaymentIcon';
import type { PaymentId } from '../components/PaymentIcon';
import {
  ADMIN_TON_WALLET,
  SBP_BANKS,
  SBP_HOLDERS,
  KASPI_PHONE,
  KASPI_HOLDER,
  METHOD_CURRENCY,
  generateCard,
  generateSbpPhone,
  loadRequests,
  saveRequest,
} from '../state/TopupRequests';
import type { TopupMethod, TopupRequest } from '../state/TopupRequests';
import { ResultSheet } from '../components/ResultSheet';
import { logEvent } from '../state/EventLog';
import { displayName, readTelegramUser } from '../state/TelegramUser';
import { createTopup, hasTelegramAuth, listTopups } from '../state/BotApi';
import { useLanguage } from '../state/LanguageContext';
import { formatCurrencyAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

/** Presets only exist for currencies that an actual payment method maps to
 * (see METHOD_CURRENCY). USD/CNY are intentionally absent from the UI. */
const PRESETS: Record<'RUB' | 'KZT' | 'TON' | 'USDT' | 'BTC' | 'ETH' | 'TRX', number[]> = {
  RUB: [500, 1000, 2000, 5000],
  KZT: [2500, 5000, 10000, 25000],
  TON: [1, 5, 10, 25],
  USDT: [5, 10, 25, 50],
  BTC: [0.0001, 0.00025, 0.0005, 0.001],
  ETH: [0.005, 0.01, 0.025, 0.05],
  TRX: [50, 100, 250, 500],
};

type Step = 'amount' | 'instructions' | 'done';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function instructionsFor(method: TopupMethod): {
  destination: string;
  copyable: string;
  network?: string;
  holder?: string;
  bank?: string;
} {
  switch (method) {
    case 'sbp': {
      const phone = generateSbpPhone();
      return {
        destination: phone,
        copyable: phone,
        bank: pickRandom(SBP_BANKS),
        holder: pickRandom(SBP_HOLDERS),
      };
    }
    case 'card': {
      const card = generateCard();
      return {
        destination: card,
        copyable: card.replace(/\s+/g, ''),
        bank: 'МИР · Сбербанк',
        holder: pickRandom(SBP_HOLDERS),
      };
    }
    case 'ton':
      return {
        destination: ADMIN_TON_WALLET,
        copyable: ADMIN_TON_WALLET,
        network: 'TON',
        holder: 'Playerok OTC Wallet',
      };
    case 'usdt':
      return {
        destination: ADMIN_TON_WALLET,
        copyable: ADMIN_TON_WALLET,
        network: 'TON (jUSDT) или TRC-20',
        holder: 'Playerok OTC Wallet',
      };
    case 'btc':
      return {
        destination: ADMIN_TON_WALLET,
        copyable: ADMIN_TON_WALLET,
        network: 'BTC через TON-обменник',
        holder: 'Playerok OTC Wallet',
      };
    case 'kaspi':
      return {
        destination: KASPI_PHONE,
        copyable: KASPI_PHONE,
        bank: 'Kaspi Bank · KZT',
        holder: KASPI_HOLDER,
      };
  }
}

export default function TopupPage() {
  const navigate = useNavigate();
  const { topUp, formatBalance, refresh } = useWallet();
  const { lang, t } = useLanguage();
  const [method, setMethod] = useState<PaymentId>('sbp');
  const payCurrency = METHOD_CURRENCY[method as TopupMethod];
  const [amount, setAmount] = useState(PRESETS[payCurrency][1] ?? PRESETS[payCurrency][0]);
  const [step, setStep] = useState<Step>('amount');
  const [current, setCurrent] = useState<TopupRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [remotePendingCount, setRemotePendingCount] = useState(0);
  const [sendError, setSendError] = useState('');

  const pending = useMemo(
    () => loadRequests().filter((r) => r.status === 'pending'),
    [step, showDone],
  );

  const isRemote = hasTelegramAuth();

  useEffect(() => {
    const presets = PRESETS[payCurrency];
    setAmount((currentAmount) => (presets.includes(currentAmount) ? currentAmount : presets[0]));
  }, [payCurrency]);

  useEffect(() => {
    if (!isRemote) return;
    listTopups()
      .then((items) => setRemotePendingCount(items.filter((r) => r.status === 'pending').length))
      .catch(() => setRemotePendingCount(0));
  }, [isRemote, step, showDone]);

  const pendingTotal = isRemote ? remotePendingCount : pending.length;

  const next = () => {
    if (amount <= 0) return;
    setSendError('');
    const info = instructionsFor(method as TopupMethod);
    const draft: TopupRequest = {
      id: 'tu-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      amount,
      currency: payCurrency,
      method: method as TopupMethod,
      destination: info.destination,
      status: 'pending',
      createdAt: Date.now(),
    };
    if (!isRemote) {
      saveRequest(draft);
      setCurrent(draft);
      setStep('instructions');
      return;
    }
    createTopup({
      amount,
      method: method as TopupMethod,
      destination: info.destination,
      currency: payCurrency,
    })
      .then((req) => {
        const localReq: TopupRequest = {
          id: req.id,
          amount: req.amount,
          currency: req.currency as CurrencyCode,
          method: req.method as TopupMethod,
          destination: req.destination,
          status: req.status,
          createdAt: Date.parse(req.createdAt) || Date.now(),
        };
        saveRequest(localReq);
        setCurrent(localReq);
        setStep('instructions');
      })
      .catch((err) => {
        const detail = err instanceof Error ? err.message : '';
        setSendError(detail ? `${t.requestSendError} (${detail})` : t.requestSendError);
      });
  };

  const confirm = () => {
    if (!current) return;
    if (!isRemote) {
      topUp(current.amount, `${t.topupBalance} ${paymentMeta(current.method, lang).name}`, current.currency);
    } else {
      refresh().catch(() => undefined);
    }
    const user = readTelegramUser();
    const userName = displayName(user);
    logEvent({
      type: 'topup',
      user: userName,
      userId: user.id,
      username: user.username,
      amount: current.amount,
      status: 'approved',
      message: `${userName} отправил заявку на пополнение ${formatCurrencyAmount(current.amount, current.currency)} через ${current.method.toUpperCase()}`,
    });
    setShowDone(true);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t.copyPrompt, text);
    }
  };

  return (
    <div className="page">
      <AppBar
        title={t.topupBalance}
        onClose={() => (step === 'amount' ? navigate('/profile') : setStep('amount'))}
      />

      <div className="balance-card">
        <div>
          <div className="label">{t.currentBalance}</div>
          <div className="amount">{formatBalance()}</div>
        </div>
        <div className="add-btn">
          <WalletIcon size={20} />
        </div>
      </div>

      {pendingTotal > 0 && step === 'amount' && (
        <div className="warning mt-12">
          <AlertIcon size={18} />
          <div>
            <b>{t.onReview}: {pendingTotal}</b>
            <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>
              {t.adminConfirms}
            </div>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <>
          <div className="section-title">
            <h2>{t.topupAmountLabel}</h2>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <input
              className="value"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              style={{
                fontSize: 26,
                fontWeight: 800,
                border: 'none',
                padding: 0,
                boxShadow: 'none',
                background: 'transparent',
              }}
            />
            <div className="currency-pills mt-12">
              {PRESETS[payCurrency].map((p) => (
                <button
                  key={p}
                  className={amount === p ? 'active' : ''}
                  onClick={() => setAmount(p)}
                >
                  {formatCurrencyAmount(p, payCurrency)}
                </button>
              ))}
            </div>
          </div>

          <div className="section-title">
            <h2>{t.paymentMethod}</h2>
          </div>

          <div className="method-list">
            {(['sbp', 'card', 'kaspi', 'ton', 'usdt', 'btc'] as PaymentId[]).map((m) => (
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
                <div
                  className={`checkbox ${method === m ? 'checked' : ''}`}
                  style={{ borderRadius: '50%' }}
                >
                  <CheckIcon size={14} />
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn--primary mt-20" disabled={amount <= 0} onClick={next}>
            {t.continueBtn}
          </button>
          {sendError && (
            <div className="warning mt-12">
              <AlertIcon size={18} />
              <span>{sendError}</span>
            </div>
          )}
          <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>
            {isRemote
              ? t.remoteNote
              : t.demoNote}
          </div>
        </>
      )}

      {step === 'instructions' && current && (
        <TopupInstructions
          req={current}
          copied={copied}
          onCopy={copy}
          onConfirm={confirm}
          labels={t}
          lang={lang}
        />
      )}

      <ResultSheet
        open={showDone}
        variant="success"
        title={t.successTitle}
        message={current ? `${t.topupPendingSent} ${formatCurrencyAmount(current.amount, current.currency)}.` : ''}
        primaryLabel={t.toProfile}
        onPrimary={() => {
          setShowDone(false);
          setStep('amount');
          setCurrent(null);
          navigate('/profile');
        }}
        secondaryLabel={t.toBuy}
        onSecondary={() => {
          setShowDone(false);
          setStep('amount');
          setCurrent(null);
          navigate('/');
        }}
      />
    </div>
  );
}

interface InstructionsProps {
  req: TopupRequest;
  copied: boolean;
  onCopy: (text: string) => void;
  onConfirm: () => void;
  labels: ReturnType<typeof useLanguage>['t'];
  lang: ReturnType<typeof useLanguage>['lang'];
}

function TopupInstructions({ req, copied, onCopy, onConfirm, labels, lang }: InstructionsProps) {
  const info = useMemo(() => instructionsFor(req.method), [req.method]);
  const isCrypto = req.method === 'ton' || req.method === 'usdt' || req.method === 'btc';
  const formattedAmount = formatCurrencyAmount(req.amount, req.currency);

  return (
    <>
      <div className="card mt-16">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PaymentIcon id={req.method} size={44} rounded={14} />
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 12 }}>{labels.requestNum} #{req.id}</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{formattedAmount}</div>
          </div>
          <span className="badge badge--blue">{paymentMeta(req.method, lang).name}</span>
        </div>

        <div className="divider" />

        {isCrypto ? (
          <>
            <div className="info-row">
              <span className="label">{labels.network}</span>
              <span className="value">{info.network ?? '—'}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.transferAmount}</span>
              <span className="value">{formattedAmount}</span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              {labels.walletHint}
            </div>
            <div className="link-box" style={{ marginTop: 6 }}>{req.destination}</div>
          </>
        ) : req.method === 'sbp' ? (
          <>
            <div className="info-row">
              <span className="label">{labels.phone}</span>
              <span className="value">{req.destination}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.receivingBank}</span>
              <span className="value">{info.bank}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.recipient}</span>
              <span className="value">{info.holder}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.amountLabel}</span>
              <span className="value">{formattedAmount}</span>
            </div>
          </>
        ) : (
          <>
            <div className="info-row">
              <span className="label">{req.method === 'kaspi' ? 'Kaspi' : labels.cardNumber}</span>
              <span className="value">{req.destination}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.bankLabel}</span>
              <span className="value">{info.bank}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.recipient}</span>
              <span className="value">{info.holder}</span>
            </div>
            <div className="info-row">
              <span className="label">{labels.amountLabel}</span>
              <span className="value">{formattedAmount}</span>
            </div>
          </>
        )}
      </div>

      <button
        className="btn btn--secondary mt-12"
        onClick={() => onCopy(info.copyable)}
      >
        <CopyIcon size={18} /> {copied ? labels.copied : labels.copyDetails}
      </button>

      <div className="warning mt-12">
        <AlertIcon size={18} />
        <div>
          <b>{labels.important}</b>{' '}
          {isCrypto
            ? labels.cryptoWarning
            : req.method === 'kaspi'
            ? labels.kaspiWarning
            : req.method === 'card'
            ? labels.cardWarning
            : labels.sbpWarning}
        </div>
      </div>

      <button className="btn btn--primary mt-12" onClick={onConfirm}>
        {isCrypto ? labels.iSent : labels.iTransferred}
      </button>
    </>
  );
}
