import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { BrandIcon } from '../components/BrandIcon';
import {
  StarIcon,
  ShieldIcon,
  HeadsetIcon,
  AlertIcon,
  WalletIcon,
  InfoIcon,
} from '../components/Icon';
import { getProduct, formatProductPrice } from '../data/catalog';
import { useDeals } from '../data/deals';
import { useWallet } from '../state/WalletContext';
import { ResultSheet } from '../components/ResultSheet';
import { pushSupportNotice } from '../state/ChatStore';
import { deleteAdminProduct } from '../state/AdminStore';
import { useAdminStore } from '../state/AdminStore';
import { isAdminId } from '../state/AdminAccess';
import { readTelegramUser } from '../state/TelegramUser';
import { useLanguage } from '../state/LanguageContext';
import { convertMoney, formatCurrencyAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

type BuyResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success' }
  | { state: 'error' }
  | { state: 'insufficient'; missing: number };

export default function ProductPage() {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const dealCache = useDeals(['public']);
  const storeVer = useAdminStore();
  const product = useMemo(() => getProduct(productId), [productId, dealCache, storeVer]);
  const { balance, currency, charge, formatBalance } = useWallet();
  const { t } = useLanguage();
  const [steamLogin, setSteamLogin] = useState('');
  const [result, setResult] = useState<BuyResult>({ state: 'idle' });
  const isAdmin = isAdminId(readTelegramUser().id);

  if (!product) {
    return (
      <div className="page">
        <AppBar title={t.productTitle} />
        <div className="empty-state mt-16">
          <h4>{t.productNotFound}</h4>
          <p>{t.productRemoved}</p>
          <button className="btn btn--primary mt-16" onClick={() => navigate('/')}>
            {t.goHome}
          </button>
        </div>
      </div>
    );
  }

  const needsLogin = product.needsSteamLogin && steamLogin.trim().length < 3;
  const canBuy = !needsLogin;
  const productCurrency = (product.currency ?? 'RUB') as CurrencyCode;

  const handleBuy = async () => {
    if (!canBuy) return;
    setResult({ state: 'loading' });
    const outcome = await charge(product.price, product.title, productCurrency, product.id);
    if (outcome === 'insufficient') {
      const required = convertMoney(product.price, productCurrency, currency);
      setResult({ state: 'insufficient', missing: Math.max(0, required - balance) });
    } else if (outcome === 'error') {
      setResult({ state: 'error' });
    } else {
      pushSupportNotice(t.orderPaidNotice.replace('{title}', product.title), {
        productTitle: product.title,
        amountLabel: formatProductPrice(product.price, product.currency),
        dealId: `#${product.id.slice(0, 6).toUpperCase()}`,
      });
      setResult({ state: 'success' });
    }
  };

  return (
    <div className="page">
      <AppBar title={product.category} />

      <div className="product-hero" style={{ background: product.image ? 'var(--bg-card-2)' : product.artGradient }}>
        {product.image ? <img src={product.image} alt={product.title} /> : <span className="label">{product.artLabel}</span>}
      </div>

      <div className="product-meta">
        <BrandIcon app={product.app} size={22} rounded={6} />
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{product.category}</span>
        <span>·</span>
        <span>
          <StarIcon size={12} style={{ color: 'var(--accent-blue)' }} /> {product.rating.toFixed(1)}{' '}
          ({product.reviews.toLocaleString('ru-RU')})
        </span>
      </div>

      <h2 style={{ margin: '8px 0 0', fontSize: 20, letterSpacing: '-0.01em' }}>{product.title}</h2>
      <div className="muted" style={{ marginTop: 2, fontSize: 13 }}>{product.subtitle}</div>

      <div className="price-row">
        <span className="now">{formatProductPrice(product.price, product.currency ?? 'RUB')}</span>
        {product.oldPrice && <span className="old">{formatProductPrice(product.oldPrice, product.currency ?? 'RUB')}</span>}
        {product.discount && <span className="badge badge--discount">-{product.discount}%</span>}
      </div>

      <div className="seller-row">
        <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, borderRadius: 14 }}>
          {product.seller.slice(0, 2).toUpperCase()}
        </div>
        <div className="meta">
          <div className="name">{product.seller}</div>
          <div className="sub">
            {t.seller} · {t.sellerLevel} {product.sellerLevel} · {product.rating.toFixed(1)} ★
          </div>
        </div>
        <button className="icon-btn" onClick={() => navigate('/chats')} aria-label={t.sellerChat}>
          <HeadsetIcon size={18} />
        </button>
      </div>

      <div className="card mt-16">
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{t.details}</h3>
        <p className="muted" style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>
          {product.description}
        </p>

        <div className="divider" />

        <div className="info-row">
          <span className="label">{t.delivery}</span>
          <span className="value">{t.deliveryTime}</span>
        </div>
        <div className="info-row">
          <span className="label">{t.guarantee}</span>
          <span className="value" style={{ color: 'var(--accent-green)' }}>
            <ShieldIcon size={14} /> OTC escrow
          </span>
        </div>
        <div className="info-row">
          <span className="label">{t.paymentMethods}</span>
          <span className="value">{t.productPaymentMethodsValue}</span>
        </div>
      </div>

      {product.needsSteamLogin && (
        <div className="card mt-16">
          <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>
            <BrandIcon app="steam" size={20} rounded={5} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {t.steamLoginForCredit}
          </h3>
          <input
            placeholder={t.steamLoginPlaceholder}
            value={steamLogin}
            onChange={(e) => setSteamLogin(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 8, display: 'flex', gap: 6 }}>
            <InfoIcon size={14} />
            {t.steamLoginHint}
          </div>
        </div>
      )}

      <div className="card mt-16" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--bg-card-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
          }}
        >
          <WalletIcon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 12 }}>{t.balanceTitle}</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{formatBalance()}</div>
        </div>
        <button
          className="badge badge--blue"
          onClick={() => navigate('/topup')}
          style={{ padding: '6px 12px' }}
        >
          {t.deposit}
        </button>
      </div>

      <button className="btn btn--primary product-buy-btn mt-16" disabled={!canBuy || result.state === 'loading'} onClick={handleBuy}>
        {result.state === 'loading' ? t.payBtn : `${t.buy} ${formatProductPrice(product.price, product.currency ?? 'RUB')}`}
      </button>
      {needsLogin && (
        <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 8 }}>
          {t.enterSteamLoginToContinue}
        </div>
      )}

      {product.reviewItems && product.reviewItems.length > 0 && (
        <div className="card mt-16 reviews-card">
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{t.reviewsTitle}</h3>
          {product.reviewItems.map((review) => (
            <div className="review-row" key={review.id}>
              <div className="review-row__head">
                <b>{review.user}</b>
                <span>{review.date}</span>
              </div>
              <div className="review-row__stars">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>{review.text}</div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && product.source === 'admin' && (
        <button
          className="btn btn--danger mt-16"
          onClick={() => {
            deleteAdminProduct(product.id);
            navigate('/');
          }}
        >
          {t.deleteProduct}
        </button>
      )}

      <ResultSheet
        open={result.state === 'success'}
        variant="success"
        title={t.orderCreated}
        message={t.orderCreatedMsg}
        primaryLabel={t.openChat}
        onPrimary={() => navigate('/chats')}
        secondaryLabel={t.backToShop}
        onSecondary={() => {
          setResult({ state: 'idle' });
          navigate('/');
        }}
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
        icon={<AlertIcon size={28} />}
      />

      <ResultSheet
        open={result.state === 'error'}
        variant="error"
        title={t.networkError}
        message={t.requestSendError}
        primaryLabel={t.cancel}
        onPrimary={() => setResult({ state: 'idle' })}
        icon={<AlertIcon size={28} />}
      />
    </div>
  );
}
