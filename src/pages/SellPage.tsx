import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { GameTile } from '../components/GameTile';
import { APPS } from '../data/catalog';
import { TagIcon, SwapIcon } from '../components/Icon';
import { PaymentIcon, paymentMeta } from '../components/PaymentIcon';
import type { PaymentId } from '../components/PaymentIcon';
import { useLanguage } from '../state/LanguageContext';

const PAY_LIST: PaymentId[] = ['sbp', 'ton', 'usdt', 'btc', 'card'];

const TABS = [
  { id: 'games', label: 'Игры', num: 4 },
  { id: 'mobile', label: 'Мобильные игры', num: 1 },
] as const;

const POPULAR_CATS = [
  { id: 'nft', label: 'NFT', discount: '10%' },
  { id: 'donate', label: 'Донат', discount: '10%' },
  { id: 'accounts', label: 'Аккаунты' },
  { id: 'items', label: 'Предметы' },
];

const COMMISSION_PERCENT = 20;

export default function SellPage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('games');
  const [priceInput, setPriceInput] = useState('1000');
  const [commissionOn, setCommissionOn] = useState(true);
  const price = Number(priceInput) || 0;

  const payout = useMemo(() => {
    if (!commissionOn) return price;
    return Math.max(0, Math.round(price * (1 - COMMISSION_PERCENT / 100)));
  }, [price, commissionOn]);

  const apps = tab === 'mobile' ? APPS.filter((a) => a.id === 'brawl') : APPS.filter((a) => a.id !== 'brawl');

  return (
    <div className="page">
      <AppBar title={t.sellTitle} leading="none" />

      <img className="sell-banner-image" src="/images/banner2.jpg" alt="" aria-hidden="true" />

      <div className="section-title">
        <h2>{t.gamesAndApps}</h2>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            <span className="num">{t.num}</span>
          </button>
        ))}
      </div>
      <div className="tile-row mt-12">
        {apps.map((app) => (
          <GameTile key={app.id} app={app} onClick={() => navigate(`/create?app=${app.id}`)} />
        ))}
      </div>

      <div className="section-title">
        <h2>{t.popularCategories}</h2>
      </div>
      <div className="chip-row" style={{ margin: '0 -16px' }}>
        {POPULAR_CATS.map((c) => (
          <div key={c.id} className="chip">
            <span>{c.label}</span>
            {c.discount && (
              <span className="chip__pill" style={{ background: 'var(--accent-green)' }}>
                {c.discount}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">
        <h2>{t.lowerPaymentTitle}</h2>
      </div>
      <div className="muted" style={{ marginLeft: 4 }}>{t.priceCalculator}</div>

      <div className="calc">
        <div className="calc__field">
          <div className="label">{t.itemPrice}</div>
          <input
            className="value"
            type="number"
            inputMode="numeric"
            min="0"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
        </div>
        <div className="calc__arrow">
          <SwapIcon size={14} />
        </div>
        <div className="calc__field">
          <div className="label">{t.income}</div>
          <div className={`value ${commissionOn ? 'value--green' : ''}`}>
            {payout.toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      <div className="toggle-row">
        <span className="label">
          <span className="tag"><TagIcon size={12} /></span>
          {t.payoutFee.replace('{percent}', String(COMMISSION_PERCENT))}
        </span>
        <button
          className={`toggle ${commissionOn ? 'on' : ''}`}
          onClick={() => setCommissionOn((v) => !v)}
          aria-label={t.payoutFee.replace('{percent}', String(COMMISSION_PERCENT))}
        />
      </div>

      <div className="section-title">
        <h2>{t.payoutMethods}</h2>
      </div>
      <div className="muted" style={{ marginLeft: 4 }}>
        {t.payoutMethodsHint}
      </div>
      <div className="payouts">
        {PAY_LIST.map((id) => (
          <div
            key={id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PaymentIcon id={id} size={56} rounded={16} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              {paymentMeta(id, lang).name.replace(' (TON)', '').replace(' (BTC)', '')}
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn--primary sell-fixed-cta" onClick={() => navigate('/terms')}>
        {t.startSelling}
      </button>
    </div>
  );
}
