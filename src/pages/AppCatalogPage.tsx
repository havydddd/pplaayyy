import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { BrandIcon } from '../components/BrandIcon';
import { StarIcon } from '../components/Icon';
import { APPS, productsByApp, formatProductPrice } from '../data/catalog';
import type { AppId } from '../data/catalog';
import { useDeals } from '../data/deals';
import { useAdminStore } from '../state/AdminStore';

export default function AppCatalogPage() {
  const { appId } = useParams<{ appId: AppId }>();
  const navigate = useNavigate();
  const app = APPS.find((a) => a.id === appId);
  const [cat, setCat] = useState<string>('all');
  const dealCache = useDeals(['public']);
  const storeVer = useAdminStore();

  const products = useMemo(() => (app ? productsByApp(app.id) : []), [app, dealCache, storeVer]);
  const filtered = useMemo(
    () => (cat === 'all' ? products : products.filter((p) => p.category === cat)),
    [products, cat],
  );

  if (!app) {
    return (
      <div className="page">
        <AppBar title="Приложение" />
        <div className="empty-state mt-16">
          <h4>Приложение не найдено</h4>
          <p>Этот раздел пока недоступен. Откройте главное меню и выберите другое приложение.</p>
          <button className="btn btn--primary mt-16" onClick={() => navigate('/')}>На главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AppBar title={app.name} />

      <div className="app-hero">
        <div className="app-hero__inner">
          <div className="app-hero__art" style={{ background: app.gradient }}>
            <BrandIcon app={app.id} size={72} rounded={18} />
          </div>
          <div>
            <h1>{app.name}</h1>
            <div className="sub">{app.tagline}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge--blue">{products.length} товаров</span>
              <span className="brand__rating">
                <StarIcon className="star" size={12} /> 5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="cat-pills">
        <button className={cat === 'all' ? 'active' : ''} onClick={() => setCat('all')}>
          Все
        </button>
        {app.categories.map((c) => (
          <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h4>Тут пока пусто</h4>
          <p>В этой категории ещё нет товаров. Загляните позже.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((p) => (
            <div className="product-card" key={p.id} onClick={() => navigate(p.id.startsWith('deal-') ? `/buyer/${p.id.slice(5)}` : `/product/${p.id}`)}>
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
      )}
    </div>
  );
}
