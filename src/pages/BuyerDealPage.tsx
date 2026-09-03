import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { AlertIcon, ShieldIcon, StarIcon, ChatIcon, WalletIcon } from '../components/Icon';
import { deleteDeal, getDeal, formatPrice, useDeals } from '../data/deals';
import { useWallet } from '../state/WalletContext';
import { ResultSheet } from '../components/ResultSheet';
import { pushSupportNotice } from '../state/ChatStore';
import { logEvent } from '../state/EventLog';
import { displayName, readTelegramUser } from '../state/TelegramUser';
import { isAdminId } from '../state/AdminAccess';
import { useLanguage } from '../state/LanguageContext';
import { convertMoney, formatCurrencyAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

type Result = { state: 'idle' } | { state: 'loading' } | { state: 'success' } | { state: 'error' } | { state: 'insufficient'; missing: number };

export default function BuyerDealPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  // Subscribe so a cross-device deep link re-renders once the deal is fetched.
  const dealCache = useDeals(['public', 'mine']);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deal = useMemo(() => getDeal(id), [id, dealCache]);
  const { balance, currency, charge, formatBalance } = useWallet();
  const { t } = useLanguage();
  const [result, setResult] = useState<Result>({ state: 'idle' });
  const isAdmin = isAdminId(readTelegramUser().id);

  if (!deal) {
    return (
      <div className="page">
        <AppBar title={t.dealTitle} onClose={() => navigate('/')} />
        <div className="empty-state mt-16">
          <h4>{t.dealNotFound}</h4>
          <p>{t.dealNotFoundMsg}</p>
        </div>
      </div>
    );
  }

  const dealCurrency = deal.currency as CurrencyCode;
  const blocked = deal.moderation !== 'approved';

  const pay = async () => {
    if (blocked) return;
    const user = readTelegramUser();
    const buyerName = displayName(user);
    setResult({ state: 'loading' });
    const outcome = await charge(deal.price, deal.title, dealCurrency, deal.id);
    if (outcome === 'insufficient') {
      const required = convertMoney(deal.price, dealCurrency, currency);
      setResult({ state: 'insufficient', missing: Math.max(0, required - balance) });
    } else if (outcome === 'error') {
      setResult({ state: 'error' });
    } else {
      pushSupportNotice(t.orderPaidNotice.replace('{title}', deal.title), {
        productTitle: deal.title,
        amountLabel: formatPrice(deal.price, deal.currency),
        dealId: `#${deal.id.slice(0, 6).toUpperCase()}`,
      });
      logEvent({
        type: 'pay_deal',
        user: buyerName,
        dealId: deal.id,
        amount: deal.price,
        message: `${buyerName} оплатил сделку #${deal.id} (${formatPrice(deal.price, deal.currency)}) — ждёт подтверждения`,
      });
      setResult({ state: 'success' });
    }
  };

  return (
    <div className="page">
      <AppBar title={t.buyerDealTitle} leading="none" onClose={() => navigate('/')} />

      <div className="deal-hero">
        {deal.photo ? <img src={deal.photo} alt={deal.title} /> : <span className="muted">{t.noPhoto}</span>}
      </div>

      <div className="card mt-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge badge--blue">{deal.category}</span>
          <span className="badge badge--new">
            <ShieldIcon size={12} /> OTC escrow
          </span>
        </div>
        <h2 style={{ margin: '10px 0 6px', fontSize: 19 }}>{deal.title}</h2>
        <p className="muted" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
          {deal.description}
        </p>

        <div className="divider" />

        <div className="profile-head" style={{ marginTop: 0 }}>
          <div className="avatar">PL</div>
          <div style={{ flex: 1 }}>
            <div className="name">Playerok Seller</div>
            <div className="sub">
              <StarIcon className="star" size={12} /> 5.0 · {deal.id}
            </div>
          </div>
          <button className="icon-btn" aria-label={t.contactSupport} onClick={() => navigate('/chats')}>
            <ChatIcon size={18} />
          </button>
        </div>

        <div className="divider" />

        <div className="info-row">
          <span className="label">{t.toPayLabel}</span>
          <span className="value" style={{ fontSize: 18 }}>
            {formatPrice(deal.price, deal.currency)}
          </span>
        </div>
        <div className="info-row">
          <span className="label">{t.escrowFee}</span>
          <span className="value">{deal.commissionPercent}%</span>
        </div>
        <div className="info-row">
          <span className="label">{t.yourBalance}</span>
          <span className="value" style={{ color: 'var(--accent-blue)' }}>
            <WalletIcon size={14} /> {formatBalance()}
          </span>
        </div>
      </div>

      {blocked ? (
        <div className="warning">
          <AlertIcon size={18} />
          <span>
            {deal.moderation === 'pending'
              ? t.dealPendingModeration
              : `${t.dealRejectedModeration}${deal.moderationNote ? ` ${deal.moderationNote}` : ''}`}
          </span>
        </div>
      ) : (
        <div className="warning">
          <AlertIcon size={18} />
          <span>
            {t.escrowWarning}
          </span>
        </div>
      )}

      <button
        className="btn btn--primary mt-12"
        onClick={pay}
        disabled={blocked || result.state === 'success' || result.state === 'loading'}
      >
        {result.state === 'success'
          ? t.paid
          : result.state === 'loading'
          ? t.payBtn
          : blocked
          ? t.paymentUnavailable
          : `${t.pay} ${formatPrice(deal.price, deal.currency)}`}
      </button>
      <button className="btn btn--ghost mt-12" onClick={() => navigate('/chats')}>
        <ChatIcon size={18} /> {t.contactSupport}
      </button>
      {isAdmin && (
        <button
          className="btn btn--danger mt-12"
          onClick={() => {
            deleteDeal(deal.id);
            navigate('/');
          }}
        >
          {t.deleteProduct}
        </button>
      )}

      <ResultSheet
        open={result.state === 'success'}
        variant="success"
        title={t.paymentAccepted}
        message={t.dealSuccessMsg}
        primaryLabel={t.openSupport}
        onPrimary={() => navigate('/chats')}
        secondaryLabel={t.close}
        onSecondary={() => setResult({ state: 'idle' })}
      />
      <ResultSheet
        open={result.state === 'insufficient'}
        variant="error"
        title={t.insufficientFunds}
        message={
          result.state === 'insufficient'
            ? `${t.missingFunds.replace('{amount}', formatCurrencyAmount(result.missing, currency))} ${t.topupBalanceFull}.`
            : ''
        }
        primaryLabel={t.topupBalanceFull}
        onPrimary={() => {
          setResult({ state: 'idle' });
          navigate('/topup');
        }}
        secondaryLabel={t.cancel}
        onSecondary={() => setResult({ state: 'idle' })}
      />
      <ResultSheet
        open={result.state === 'error'}
        variant="error"
        title={t.networkError}
        message={t.requestSendError}
        primaryLabel={t.close}
        onPrimary={() => setResult({ state: 'idle' })}
      />
    </div>
  );
}
