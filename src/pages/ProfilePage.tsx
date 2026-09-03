import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StarIcon,
  ChevronRightIcon,
  WalletIcon,
} from '../components/Icon';
import { useDeals, formatPrice } from '../data/deals';
import type { Deal } from '../data/deals';
import { useWallet } from '../state/WalletContext';
import { useLanguage } from '../state/LanguageContext';
import {
  displayName,
  formatRegistered,
  getRegisteredAt,
  initials,
  readTelegramUser,
} from '../state/TelegramUser';

type MainTab = 'mine' | 'purchases' | 'sales';
type SubTab = 'active' | 'completed';

const AVATAR_COLORS = [
  '#0e8a6a',
  '#2f6dff',
  '#7a5cff',
  '#ff5d3a',
  '#ffb547',
  '#1f7ad8',
  '#c41818',
];

function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { formatBalance } = useWallet();
  const { t } = useLanguage();

  const user = useMemo(() => readTelegramUser(), []);
  const registeredAt = useMemo(() => getRegisteredAt(), []);
  const dealCache = useDeals(['mine']);
  const deals = useMemo(
    () => [...dealCache].sort((a, b) => b.createdAt - a.createdAt),
    [dealCache],
  );

  const [mainTab, setMainTab] = useState<MainTab>('mine');
  const [subTab, setSubTab] = useState<SubTab>('active');

  const visibleDeals = useMemo(() => {
    if (mainTab !== 'mine') return [];
    return deals.filter((d) => (subTab === 'active' ? d.status !== 'closed' : d.status === 'closed'));
  }, [deals, mainTab, subTab]);

  const fullName = displayName(user);
  const initial = initials(user)[0] ?? 'T';
  const avatarColor = pickAvatarColor(fullName);

  return (
    <div className="page">
      <div className="profile-topbar profile-topbar--centered">
        <div className="profile-topbar__title">
          {t.profileTitle} <span className="profile-topbar__name">{user.firstName}</span>
        </div>
      </div>

      <button className="wallet-pill" onClick={() => navigate('/balance')}>
        <span className="wallet-pill__icon">
          <WalletIcon size={20} />
        </span>
        <span className="wallet-pill__amount">{formatBalance()}</span>
        <ChevronRightIcon size={20} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} />
      </button>

      <div className="profile-identity">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            className="profile-identity__avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="profile-identity__avatar profile-identity__avatar--initial"
            style={{ background: avatarColor }}
          >
            {initial}
          </div>
        )}
        <div className="profile-identity__meta">
          <div className="profile-identity__name">{fullName}</div>
          <div className="profile-identity__rating">
            <StarsRow value={0} />
            <span className="muted">{t.noReviews}</span>
          </div>
          <div className="profile-identity__since muted">
            {t.onPlayerok} {formatRegistered(registeredAt)}
          </div>
        </div>
      </div>

      <div className="pill-tabs">
        <button
          className={`pill-tab ${mainTab === 'mine' ? 'active' : ''}`}
          onClick={() => setMainTab('mine')}
        >
          {t.myItems}
        </button>
        <button
          className={`pill-tab ${mainTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setMainTab('purchases')}
        >
          {t.purchases}
        </button>
        <button
          className={`pill-tab ${mainTab === 'sales' ? 'active' : ''}`}
          onClick={() => setMainTab('sales')}
        >
          {t.sales}
        </button>
      </div>

      {mainTab === 'mine' && (
        <div className="pill-tabs pill-tabs--sub">
          <button
            className={`pill-tab ${subTab === 'active' ? 'active' : ''}`}
            onClick={() => setSubTab('active')}
          >
            {t.active}
          </button>
          <button
            className={`pill-tab ${subTab === 'completed' ? 'active' : ''}`}
            onClick={() => setSubTab('completed')}
          >
            {t.completed}
          </button>
        </div>
      )}

      {mainTab === 'mine' && (
        visibleDeals.length === 0 ? (
          <div className="empty-block">
            <div className="empty-block__emoji">🙄</div>
            <h3 className="empty-block__title">{t.noItemsTitle}</h3>
            <p className="empty-block__sub">{t.noItemsSub}</p>
            <button className="btn btn--primary mt-16" onClick={() => navigate('/sell')}>
              {t.listItem}
            </button>
          </div>
        ) : (
          <DealList deals={visibleDeals} onPick={(id) => navigate(`/deal/${id}`)} />
        )
      )}

      {mainTab === 'purchases' && (
        <div className="empty-block">
          <div className="empty-block__emoji">🛒</div>
          <h3 className="empty-block__title">{t.noPurchasesTitle}</h3>
          <p className="empty-block__sub">{t.noPurchasesSub}</p>
          <button className="btn btn--primary mt-16" onClick={() => navigate('/')}>
            {t.goToShop}
          </button>
        </div>
      )}

      {mainTab === 'sales' && (
        <div className="empty-block">
          <div className="empty-block__emoji">📦</div>
          <h3 className="empty-block__title">{t.noSalesTitle}</h3>
          <p className="empty-block__sub">{t.noSalesSub}</p>
          <button className="btn btn--primary mt-16" onClick={() => navigate('/sell')}>
            {t.listItem}
          </button>
        </div>
      )}
    </div>
  );
}

function StarsRow({ value }: { value: number }) {
  const stars = [0, 1, 2, 3, 4];
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {stars.map((i) => (
        <StarIcon
          key={i}
          size={14}
          style={{
            color: i < value ? 'var(--accent-blue)' : 'var(--text-muted)',
            opacity: i < value ? 1 : 0.55,
          }}
        />
      ))}
    </span>
  );
}

function DealList({ deals, onPick }: { deals: Deal[]; onPick: (id: string) => void }) {
  return (
    <div className="deal-list mt-12">
      {deals.map((d) => (
        <div className="deal-row" key={d.id} onClick={() => onPick(d.id)}>
          <div className="deal-row__thumb">
            {d.photo ? <img src={d.photo} alt={d.title} /> : <span>{d.category[0]}</span>}
          </div>
          <div className="deal-row__body">
            <div className="title">{d.title}</div>
            <div className="sub">{d.category} · ID {d.id}</div>
            <div className="price">{formatPrice(d.price, d.currency)}</div>
          </div>
          <div className="deal-row__badges">
            <span className="badge badge--new">{d.status === 'active' ? 'Активна' : d.status}</span>
            <span className="badge badge--blue">Ссылка готова</span>
          </div>
        </div>
      ))}
    </div>
  );
}
