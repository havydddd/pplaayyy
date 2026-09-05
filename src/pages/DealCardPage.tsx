import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { PaymentIcon } from '../components/PaymentIcon';
import { getDeal, formatPrice, useDeals } from '../data/deals';
import type { PayoutDetails } from '../data/deals';

export default function DealCardPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  // Subscribe so a cross-device deep link re-renders once the deal is fetched.
  const dealCache = useDeals(['public', 'mine']);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deal = useMemo(() => getDeal(id), [id, dealCache]);

  if (!deal) {
    return (
      <div className="page">
        <AppBar title="Сделка не найдена" />
        <div className="empty-state mt-16">
          <h4>Эта сделка не найдена</h4>
          <p>Возможно, она была удалена или хранится в другом устройстве.</p>
          <button className="btn btn--primary mt-16" onClick={() => navigate('/profile')}>
            К моим сделкам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AppBar title="Сделка" onClose={() => navigate('/profile')} />

      <div className="deal-hero">
        {deal.photo ? <img src={deal.photo} alt={deal.title} /> : <span className="muted">Без фото</span>}
      </div>

      <div className="card mt-16">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge badge--blue">{deal.category}</span>
          <ModerationBadge deal={deal} />
        </div>
        <h2 style={{ margin: '10px 0 6px', fontSize: 19 }}>{deal.title}</h2>
        <p className="muted" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
          {deal.description}
        </p>

        <div className="divider" />

        <div className="info-row">
          <span className="label">Цена</span>
          <span className="value">{formatPrice(deal.price, deal.currency)}</span>
        </div>
        <div className="info-row">
          <span className="label">Комиссия гаранта</span>
          <span className="value" style={{ color: 'var(--accent-pink)' }}>{deal.commissionPercent}%</span>
        </div>
        <div className="info-row">
          <span className="label">Вы получите</span>
          <span className="value" style={{ color: 'var(--accent-green)' }}>
            {formatPrice(deal.payout, deal.currency)}
          </span>
        </div>
        <div className="info-row">
          <span className="label">ID товара для поиска</span>
          <span className="value">#{deal.id}</span>
        </div>
      </div>

      {deal.payoutDetails && (
        <>
          <div className="section-title">
            <h2>Реквизиты для выплаты</h2>
          </div>
          <PayoutCard details={deal.payoutDetails} />
        </>
      )}

      <div className="card mt-16">
        <div className="muted" style={{ fontSize: 12 }}>Покупатель найдёт товар через поиск по ID</div>
        <div style={{ fontWeight: 900, fontSize: 22, marginTop: 4 }}>#{deal.id}</div>
      </div>
    </div>
  );
}

function ModerationBadge({ deal }: { deal: { moderation: 'pending' | 'approved' | 'rejected'; status: string } }) {
  if (deal.moderation === 'pending') {
    return <span className="badge" style={{ background: '#ffb547', color: '#3a2400' }}>На модерации</span>;
  }
  if (deal.moderation === 'rejected') {
    return <span className="badge badge--discount">Отклонена</span>;
  }
  return <span className="badge badge--new">{deal.status === 'active' ? 'Активна' : deal.status}</span>;
}

function PayoutCard({ details }: { details: PayoutDetails }) {
  const iconId =
    details.method === 'sbp'
      ? 'sbp'
      : details.method === 'card'
      ? 'card'
      : details.bank === 'USDT'
      ? 'usdt'
      : details.bank === 'BTC'
      ? 'btc'
      : details.bank === 'STARS'
      ? 'stars'
      : 'ton';

  const heading =
    details.method === 'sbp'
      ? 'СБП'
      : details.method === 'card'
      ? 'Банковская карта'
      : details.bank === 'STARS'
      ? 'Telegram Stars ⭐'
      : `Крипто-кошелёк · ${details.bank ?? ''}`;

  const masked = (() => {
    const v = details.destination.replace(/\s+/g, '');
    if (details.method === 'card' && v.length >= 8) {
      return `•••• ${v.slice(-4)}`;
    }
    if (details.method === 'crypto' && v.length > 14) {
      return `${v.slice(0, 6)}…${v.slice(-6)}`;
    }
    return details.destination;
  })();

  return (
    <div
      className="card"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}
    >
      <PaymentIcon id={iconId} size={48} rounded={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{heading}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>
          {masked}
          {details.bank && details.method !== 'crypto' ? ` · ${details.bank}` : ''}
          {details.holder ? ` · ${details.holder}` : ''}
        </div>
      </div>
    </div>
  );
}
