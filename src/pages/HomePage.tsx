import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchIcon,
  GridIcon,
  DonateIcon,
  SubscriptionIcon,
  SwordsIcon,
  MoonIcon,
  SunIcon,
  StarIcon,
  InfoIcon,
  ChevronRightIcon,
  UserIcon,
  CloseIcon,
} from '../components/Icon';
import { GameTile } from '../components/GameTile';
import { APPS, premiumProducts, searchProducts, formatProductPrice } from '../data/catalog';
import { searchDeals, useDeals } from '../data/deals';
import { useAdminStore } from '../state/AdminStore';
import { useTheme } from '../state/ThemeContext';
import { useLanguage } from '../state/LanguageContext';
import { useWallet } from '../state/WalletContext';
import { BrandIcon } from '../components/BrandIcon';
import { ResultSheet } from '../components/ResultSheet';
import { convertMoney, formatCurrencyAmount, formatCurrencyCodeAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

const CURRENCIES = [
  { id: 'rub', label: '₽', code: 'RUB' },
  { id: 'kzt', label: '₸', code: 'KZT' },
  { id: 'usdt', label: '₮', code: 'USDT' },
] as const;

const LANGUAGES = [
  { id: 'ru', label: 'RU', name: 'Русский' },
  { id: 'en', label: 'EN', name: 'English' },
] as const;

function formatCurrency(amountRub: number, currency: (typeof CURRENCIES)[number]['id']): string {
  const meta = CURRENCIES.find((c) => c.id === currency) ?? CURRENCIES[0];
  const code = meta.code as CurrencyCode;
  return formatCurrencyAmount(convertMoney(amountRub, 'RUB', code), code);
}

export default function HomePage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { currency: walletCurrency, setCurrency: setWalletCurrency } = useWallet();
  const [amount, setAmount] = useState(1000);
  const [steamLogin, setSteamLogin] = useState('');
  const [query, setQuery] = useState('');
  const [loginError, setLoginError] = useState(false);

  const totalRub = Math.round(amount * 1.05);
  const supportedSteamCurrency = CURRENCIES.find((c) => c.code === walletCurrency) ?? CURRENCIES[0];
  const currency = supportedSteamCurrency.id;
  const currencyCode = supportedSteamCurrency.code as CurrencyCode;
  const totalPay = convertMoney(totalRub, 'RUB', currencyCode);
  // Subscribe to the server-backed deal + admin caches so premium listings and
  // search results reflect items created on other devices once they sync in.
  const dealCache = useDeals(['public']);
  const storeVer = useAdminStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const premium = useMemo(() => premiumProducts(), [dealCache, storeVer]);
  const apps = APPS.filter((a) => a.id !== 'telegram' && a.id !== 'brawl');
  const mobile = APPS.filter((a) => a.id === 'brawl');
  const appsRow = APPS.filter((a) => a.id === 'telegram');

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return {
      products: searchProducts(q),
      deals: searchDeals(q),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dealCache]);

  // Reset query when navigating away (the search field clears on unmount).
  useEffect(() => () => setQuery(''), []);

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div className="brand">
          <span className="brand__name">Playerok OTC</span>
          <span className="brand__rating">
            <StarIcon className="star" size={14} />
            <span>5.0</span>
          <span className="count">{t.millionPlus}</span>
          </span>
        </div>
        <div className="home-actions">
          <div className="language-switch" aria-label={t.chooseLanguage}>
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                className={lang === item.id ? 'active' : ''}
                onClick={() => setLang(item.id)}
                title={item.name}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? t.enableLightTheme : t.enableDarkTheme}
          >
            <span className="theme-toggle__knob">
              {theme === 'dark' ? <MoonIcon size={14} /> : <SunIcon size={14} />}
            </span>
          </button>
        </div>
      </header>

      <img className="home-banner home-banner--top" src="/images/banner.jpg" alt="" aria-hidden="true" />

      <div className="search">
        <SearchIcon size={18} />
        <input
          placeholder={t.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label={t.clear} style={{ color: 'var(--text-secondary)' }}>
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {results ? (
        <SearchResults
          query={query}
          products={results.products}
          deals={results.deals}
          onPick={(id, isDeal) => navigate(isDeal ? `/deal/${id}` : `/product/${id}`)}
          labels={t}
        />
      ) : (
        <>
          <div className="chip-row">
            <div className="chip" onClick={() => navigate('/category/all')}>
              <GridIcon className="chip__icon" size={16} />
            </div>
            <div className="chip" onClick={() => navigate('/category/donate')}>
              <DonateIcon className="chip__icon" size={16} />
              <span>{t.donate}</span>
            </div>
            <div className="chip" onClick={() => navigate('/category/subscription')}>
              <SubscriptionIcon className="chip__icon" size={16} />
              <span>{t.subscriptions}</span>
            </div>
            <div className="chip" onClick={() => navigate('/category/items')}>
              <SwordsIcon className="chip__icon" size={16} />
              <span>{t.items}</span>
            </div>
            <div className="chip" onClick={() => navigate('/category/accounts')}>
              <UserIcon className="chip__icon" size={16} />
              <span>{t.accounts}</span>
            </div>
            <div className="chip" onClick={() => navigate('/category/nft')}>
              <span style={{ fontSize: 14 }}>🎁</span>
              <span>{t.nft}</span>
            </div>
            <div className="chip" onClick={() => navigate('/category/keys')}>
              <span style={{ fontSize: 14 }}>🔑</span>
              <span>{t.keys}</span>
            </div>
          </div>

          <section className="topup">
            <div className="topup__header">
              <div className="topup__title">
                <BrandIcon app="steam" size={28} rounded={8} />
                <span>{t.topupSteam}</span>
              </div>
              <div className="currency-switch">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.id}
                    className={currency === c.id ? 'active' : ''}
                    onClick={() => setWalletCurrency(c.code as CurrencyCode)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="topup__fields">
              <div className="topup__field">
                <div className="label">
                  {t.steamLoginLabel} <InfoIcon size={12} />
                </div>
                <input
                  className="value"
                  placeholder={t.steamLoginPlaceholder}
                  value={steamLogin}
                  onChange={(e) => setSteamLogin(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <div className="topup__field">
                <div className="label">{t.amountLabel}</div>
                <input
                  className="value"
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>
            <div className="topup__row">
              <span>
                {t.commission} <span className="badge badge--blue">5%</span>
              </span>
              <span className="muted">{formatCurrency(amount, currency)} + 5%</span>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => {
                if (!steamLogin.trim()) {
                  setLoginError(true);
                  return;
                }
                navigate(`/steam-payment?login=${encodeURIComponent(steamLogin.trim())}&amount=${totalPay}&currency=${currencyCode}`);
              }}
            >
              {t.pay} {formatCurrency(totalRub, currency)}
            </button>
          </section>

          <div className="section-title">
            <h2>{t.apps}</h2>
            <span className="meta">
              {appsRow.length} <ChevronRightIcon size={14} />
            </span>
          </div>
          <div className="tile-row">
            {appsRow.map((g) => (
              <GameTile key={g.id} app={g} onClick={() => navigate(`/app/${g.id}`)} />
            ))}
          </div>

          <div className="section-title">
            <h2>{t.games}</h2>
            <span className="meta">
              {apps.length} <ChevronRightIcon size={14} />
            </span>
          </div>
          <div className="tile-row">
            {apps.map((g) => (
              <GameTile key={g.id} app={g} onClick={() => navigate(`/app/${g.id}`)} />
            ))}
          </div>

          <div className="section-title">
            <h2>{t.mobileGames}</h2>
            <span className="meta">
              {mobile.length} <ChevronRightIcon size={14} />
            </span>
          </div>
          <div className="tile-row">
            {mobile.map((g) => (
              <GameTile key={g.id} app={g} onClick={() => navigate(`/app/${g.id}`)} />
            ))}
          </div>

          <div className="section-title">
            <h2>{t.premiumProducts}</h2>
          </div>
          <div className="grid-2">
            {premium.map((p) => (
              <div className="product-card" key={p.id} onClick={() => navigate(p.id.startsWith('deal-') ? `/buyer/${p.id.slice(5)}` : `/product/${p.id}`)}>
                <div className="product-card__head">
                  <BrandIcon app={p.app} size={22} rounded={6} />
                  <div>
                    <div className="game">{p.title.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="kind">{p.category}</div>
                  </div>
                </div>
                <div className="product-card__art">
                  {p.image ? <img src={p.image} alt={p.title} /> : <BrandIcon app={p.app} fill />}
                </div>
                <div className="product-card__body">
                  <div className="product-card__price">
                    <span className={`now ${p.priceColor === 'green' ? 'now--green' : 'now--pink'}`}>
                      {formatProductPrice(p.price, p.currency ?? 'RUB')}
                    </span>
                    {p.discount && <span className="badge badge--discount">-{p.discount}%</span>}
                    {p.oldPrice && <span className="old">{formatProductPrice(p.oldPrice, p.currency ?? 'RUB')}</span>}
                  </div>
                  <div className="product-card__title">{p.title}</div>
                  {p.id.startsWith('deal-') && <div className="product-card__id">ID {p.id.slice(5)}</div>}
                  <div className="product-card__rating">
                    <span className="seller-avatar">{p.seller.slice(0, 1).toUpperCase()}</span>
                    <span>{p.seller}</span>
                    <StarIcon className="star" size={12} />
                    <span>{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <ResultSheet
        open={loginError}
        variant="error"
        title={t.noLoginError}
        message=""
        primaryLabel={t.ok}
        onPrimary={() => setLoginError(false)}
      />
    </div>
  );
}

interface SearchResultsProps {
  query: string;
  products: ReturnType<typeof searchProducts>;
  deals: ReturnType<typeof searchDeals>;
  onPick: (id: string, isDeal: boolean) => void;
  labels: ReturnType<typeof useLanguage>['t'];
}

function SearchResults({ query, products, deals, onPick, labels }: SearchResultsProps) {
  const total = products.length + deals.length;
  return (
    <>
      <div className="section-title">
        <h2>{labels.searchResultsTitle}: {query}</h2>
        <span className="meta">{total} {plural(total, [labels.resultOne, labels.resultFew, labels.resultMany])}</span>
      </div>
      {total === 0 && (
        <div className="empty-state">
          <h4>{labels.nothingFound}</h4>
          <p>{labels.nothingFoundHint}</p>
        </div>
      )}

      {deals.length > 0 && (
        <>
          <div className="muted" style={{ marginLeft: 4 }}>{labels.userDeals}</div>
          <div className="grid-2 mt-12">
            {deals.map((d) => (
              <div className="product-card" key={`d-${d.id}`} onClick={() => onPick(d.id, true)}>
                <div className="product-card__head">
                  <span
                    className="logo"
                    style={{ background: 'var(--accent-violet)', color: '#fff' }}
                  >
                    U
                  </span>
                  <div>
                    <div className="game">{d.category}</div>
                    <div className="kind">{labels.fromUser}</div>
                  </div>
                </div>
                <div
                  className="product-card__art"
                  style={{ background: 'linear-gradient(135deg, #7a5cff, #2f6dff)' }}
                >
                  {d.photo ? (
                    <img
                      src={d.photo}
                      alt={d.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                      }}
                    >
                      {d.category[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </div>
                <div className="product-card__body">
                  <div className="product-card__price">
                    <span className="now">{formatCurrencyCodeAmount(d.price, d.currency as CurrencyCode)}</span>
                  </div>
                  <div className="product-card__title">{d.title}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {products.length > 0 && (
        <>
          <div className="muted mt-16" style={{ marginLeft: 4 }}>{labels.catalogTitle}</div>
          <div className="grid-2 mt-12">
            {products.map((p) => (
              <div className="product-card" key={`p-${p.id}`} onClick={() => p.id.startsWith('deal-') ? onPick(p.id.slice(5), true) : onPick(p.id, false)}>
                <div className="product-card__head">
                  <BrandIcon app={p.app} size={22} rounded={6} />
                  <div>
                    <div className="game">{p.category}</div>
                    <div className="kind">{p.subtitle}</div>
                  </div>
                </div>
                <div className="product-card__art">
                  {p.image ? <img src={p.image} alt={p.title} /> : <BrandIcon app={p.app} fill />}
                </div>
                <div className="product-card__body">
                  <div className="product-card__price">
                    <span className={`now ${p.priceColor === 'green' ? 'now--green' : 'now--pink'}`}>
                      {formatProductPrice(p.price, p.currency ?? 'RUB')}
                    </span>
                  </div>
                  <div className="product-card__title">{p.title}</div>
                  {p.id.startsWith('deal-') && <div className="product-card__id">ID {p.id.slice(5)}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}
