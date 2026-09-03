import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { BrandIcon } from '../components/BrandIcon';
import { StarIcon } from '../components/Icon';
import { allProducts, TAG_META, productsByTag, formatProductPrice } from '../data/catalog';
import type { Tag } from '../data/catalog';
import { useDeals } from '../data/deals';
import { useAdminStore } from '../state/AdminStore';

const TITLE_BY_TAG: Record<string, { title: string; emoji: string; tag: Tag | 'all' }> = {
  all: { title: 'Все товары', emoji: '🛍', tag: 'all' },
  donate: { title: 'Донат', emoji: '💎', tag: 'donate' },
  subscription: { title: 'Подписки', emoji: '⭐', tag: 'subscription' },
  items: { title: 'Предметы', emoji: '⚔️', tag: 'items' },
  accounts: { title: 'Аккаунты', emoji: '👤', tag: 'accounts' },
  keys: { title: 'Ключи', emoji: '🔑', tag: 'keys' },
  nft: { title: 'NFT-подарки', emoji: '🎁', tag: 'nft' },
};

export default function CategoryPage() {
  const { tag = 'all' } = useParams();
  const navigate = useNavigate();
  const meta = TITLE_BY_TAG[tag] ?? TITLE_BY_TAG.all;
  const dealCache = useDeals(['public']);
  const storeVer = useAdminStore();

  const list = useMemo(() => {
    if (meta.tag === 'all') return allProducts();
    return productsByTag(meta.tag as Tag);
  }, [meta.tag, dealCache, storeVer]);

  return (
    <div className="page">
      <AppBar title={`${meta.emoji} ${meta.title}`} />

      <div className="muted mt-12" style={{ marginLeft: 4 }}>
        {meta.tag === 'all'
          ? `Всего ${list.length} товаров в каталоге`
          : `${list.length} ${TAG_META[meta.tag as Tag].label.toLowerCase()}-${list.length === 1 ? 'товар' : 'товаров'} от проверенных продавцов`}
      </div>

      {list.length === 0 ? (
        <div className="empty-state mt-16">
          <h4>Пока пусто</h4>
          <p>В этой категории ещё нет товаров. Загляните позже.</p>
        </div>
      ) : (
        <div className="grid-2 mt-16">
          {list.map((p) => (
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
