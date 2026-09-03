import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AppBar } from '../components/AppBar';
import { CheckIcon, CloseIcon, ShieldIcon } from '../components/Icon';
import { APPS } from '../data/catalog';
import type { AppId, ProductCurrency } from '../data/catalog';
import { approveDeal, formatPrice, useDeals, rejectDeal } from '../data/deals';
import type { Deal } from '../data/deals';
import {
  deleteAdminProduct,
  deleteAdminSeller,
  listAdminProducts,
  listAdminSellers,
  saveAdminProduct,
  saveAdminSeller,
  useAdminStore,
} from '../state/AdminStore';
import { loadEvents } from '../state/EventLog';
import type { AppEvent } from '../state/EventLog';
import { readTelegramUser } from '../state/TelegramUser';
import { averageRating, generateReviews } from '../data/reviews';
import { approveTopup, changeAdminBalance, listTopups, rejectTopup, type ApiTopup } from '../state/BotApi';
import { formatCurrencyAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

export default function AdminPage() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((v) => v + 1);

  const user = useMemo(() => readTelegramUser(), []);
  const isAdmin = true; // открыто для всех
  const storeVer = useAdminStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sellers = useMemo(() => listAdminSellers(), [tick, storeVer]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const products = useMemo(() => listAdminProducts(), [tick, storeVer]);
  const dealCache = useDeals(['all']);
  const pendingDeals = useMemo(
    () => dealCache.filter((d) => d.moderation === 'pending'),
    [dealCache],
  );
  const [topups, setTopups] = useState<ApiTopup[]>([]);
  const events = useMemo<AppEvent[]>(() => loadEvents(), [tick]);

  const [sellerName, setSellerName] = useState('');
  const [sellerAvatar, setSellerAvatar] = useState('');
  const [sellerDescription, setSellerDescription] = useState('');
  const [sellerReviewCount, setSellerReviewCount] = useState(5);
  const [sellerMinStars, setSellerMinStars] = useState(3);
  const [sellerMaxStars, setSellerMaxStars] = useState(5);
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState(1000);
  const [productCurrency, setProductCurrency] = useState<ProductCurrency>('RUB');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productApp, setProductApp] = useState<AppId>('steam');
  const [productSeller, setProductSeller] = useState('');
  const [balanceUserId, setBalanceUserId] = useState('');
  const [balanceAmount, setBalanceAmount] = useState(100);
  const [balanceMode, setBalanceMode] = useState<'add' | 'set'>('add');
  const [balanceResult, setBalanceResult] = useState('');

  useEffect(() => {
    listTopups('all')
      .then(setTopups)
      .catch(() => setTopups([]));
  }, [isAdmin, tick]);

  const readImage = (e: ChangeEvent<HTMLInputElement>, cb: (value: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const addSeller = () => {
    if (!sellerName.trim()) return;
    const id = 'seller-' + Math.random().toString(36).slice(2, 8);
    const reviews = generateReviews(id, sellerReviewCount, sellerMinStars, sellerMaxStars);
    saveAdminSeller({
      id,
      name: sellerName.trim(),
      avatar: sellerAvatar || undefined,
      description: sellerDescription.trim(),
      rating: averageRating(reviews),
      reviews,
    });
    setSellerName('');
    setSellerAvatar('');
    setSellerDescription('');
    refresh();
  };

  const addProduct = () => {
    const sellerId = productSeller || sellers[0]?.id;
    if (!productTitle.trim() || !sellerId || productPrice <= 0) return;
    const app = APPS.find((a) => a.id === productApp) ?? APPS[0];
    saveAdminProduct({
      id: 'admin-' + Math.random().toString(36).slice(2, 8),
      app: productApp,
      category: app.defaultCategory,
      title: productTitle.trim(),
      description: productDescription.trim(),
      price: productPrice,
      currency: productCurrency,
      image: productImage || undefined,
      sellerId,
      createdAt: Date.now(),
    });
    setProductTitle('');
    setProductDescription('');
    setProductImage('');
    setProductPrice(1000);
    setProductCurrency('RUB');
    refresh();
  };

  const handleApprove = (deal: Deal) => {
    approveDeal(deal.id);
    refresh();
  };

  const handleReject = (deal: Deal) => {
    rejectDeal(deal.id, window.prompt('Причина отклонения:') || undefined);
    refresh();
  };

  const handleApproveTopup = async (id: string) => {
    await approveTopup(id);
    refresh();
  };

  const handleRejectTopup = async (id: string) => {
    await rejectTopup(id);
    refresh();
  };

  const handleChangeBalance = async () => {
    setBalanceResult('');
    const res = await changeAdminBalance({
      userId: balanceUserId.trim() ? Number(balanceUserId) : undefined,
      amount: balanceAmount,
      mode: balanceMode,
    });
    setBalanceResult(`Баланс user_id=${res.userId}: ${res.balance.toLocaleString('ru-RU')} ${res.currency}`);
  };

  return (
    <div className="page">
      <AppBar title="Админ-панель" leading="none" trailing="none" />

      <div className="card mt-12" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="wallet-pill__icon">
          <ShieldIcon size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>Скрытый раздел</div>
          <div className="muted" style={{ fontSize: 12 }}>Доступ разрешён только администратору.</div>
        </div>
      </div>

      <Section title="Лог-чат" />
      <div className="deal-list">
        {events.slice(0, 20).map((ev) => (
          <div className="deal-row" key={ev.id}>
            <div className="deal-row__thumb"><ShieldIcon size={18} /></div>
            <div className="deal-row__body">
              <div className="title">{ev.message}</div>
              <div className="sub">
                {new Date(ev.ts).toLocaleString('ru-RU')}
                {ev.userId ? ` · user_id=${ev.userId}` : ''}
                {ev.username ? ` · @${ev.username}` : ''}
                {ev.status ? ` · ${ev.status}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Section title="Баланс" />
      <div className="card">
        <Field label="User ID">
          <input
            value={balanceUserId}
            onChange={(e) => setBalanceUserId(e.target.value.replace(/\D/g, ''))}
            placeholder={user.id ? String(user.id) : 'Оставьте пустым для себя'}
          />
        </Field>
        <div className="row-2 mt-12">
          <Field label="Сумма">
            <input
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Режим">
            <select value={balanceMode} onChange={(e) => setBalanceMode(e.target.value as 'add' | 'set')}>
              <option value="add">Добавить</option>
              <option value="set">Установить</option>
            </select>
          </Field>
        </div>
        <button className="btn btn--primary mt-16" onClick={handleChangeBalance}>
          Изменить баланс
        </button>
        {balanceResult && <div className="muted mt-12" style={{ fontSize: 13 }}>{balanceResult}</div>}
      </div>

      <Section title="Управление продавцами" />
      <div className="card">
        <Field label="Имя"><input value={sellerName} onChange={(e) => setSellerName(e.target.value)} /></Field>
        <Field label="Аватар"><input type="file" accept="image/*" onChange={(e) => readImage(e, setSellerAvatar)} /></Field>
        <Field label="Описание"><input value={sellerDescription} onChange={(e) => setSellerDescription(e.target.value)} /></Field>
        <div className="row-2 mt-12">
          <Field label="Количество отзывов">
            <input
              type="number"
              min={1}
              max={50}
              value={sellerReviewCount}
              onChange={(e) => setSellerReviewCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
          </Field>
          <Field label="Разброс звёзд">
            <div className="row-2">
              <input
                type="number"
                min={3}
                max={5}
                value={sellerMinStars}
                onChange={(e) => setSellerMinStars(Math.max(3, Math.min(5, Number(e.target.value) || 3)))}
              />
              <input
                type="number"
                min={3}
                max={5}
                value={sellerMaxStars}
                onChange={(e) => setSellerMaxStars(Math.max(3, Math.min(5, Number(e.target.value) || 5)))}
              />
            </div>
          </Field>
        </div>
        <button className="btn btn--primary mt-16" onClick={addSeller} disabled={!sellerName.trim()}>Добавить</button>
      </div>
      <div className="deal-list mt-12">
        {sellers.map((s) => (
          <div className="deal-row" key={s.id}>
            <div className="deal-row__thumb">{s.avatar ? <img src={s.avatar} alt={s.name} /> : <span>{s.name[0]}</span>}</div>
            <div className="deal-row__body">
              <div className="title">{s.name}</div>
              <div className="sub">{s.description || 'Без описания'} · {s.rating.toFixed(1)} · {s.reviews?.length ?? 0} отзывов</div>
            </div>
            <button className="icon-btn" onClick={() => { deleteAdminSeller(s.id); refresh(); }}><CloseIcon size={16} /></button>
          </div>
        ))}
      </div>

      <Section title="Управление товарами" />
      <div className="card">
        <Field label="Название"><input value={productTitle} onChange={(e) => setProductTitle(e.target.value)} /></Field>
        <div className="row-2 mt-12">
          <Field label="Цена"><input type="number" value={productPrice} onChange={(e) => setProductPrice(Math.max(0, Number(e.target.value) || 0))} /></Field>
          <Field label="Валюта">
            <select value={productCurrency} onChange={(e) => setProductCurrency(e.target.value as ProductCurrency)}>
              {(['RUB', 'TON', 'USDT', 'KZT'] as ProductCurrency[]).map((c) => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="row-2 mt-12">
          <Field label="Приложение">
            <select value={productApp} onChange={(e) => setProductApp(e.target.value as AppId)}>
              {APPS.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Продавец">
          <select value={productSeller || sellers[0]?.id || ''} onChange={(e) => setProductSeller(e.target.value)}>
            {sellers.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Описание"><textarea rows={4} value={productDescription} onChange={(e) => setProductDescription(e.target.value)} /></Field>
        <Field label="Картинка"><input type="file" accept="image/*" onChange={(e) => readImage(e, setProductImage)} /></Field>
        <button className="btn btn--primary mt-16" onClick={addProduct} disabled={!productTitle.trim() || !sellers.length}>Добавить товар</button>
      </div>
      <div className="deal-list mt-12">
        {products.map((p) => (
          <div className="deal-row" key={p.id}>
            <div className="deal-row__thumb">{p.image ? <img src={p.image} alt={p.title} /> : <span>{p.title[0]}</span>}</div>
            <div className="deal-row__body">
              <div className="title">{p.title}</div>
              <div className="sub">{APPS.find((a) => a.id === p.app)?.name} · {sellers.find((s) => s.id === p.sellerId)?.name}</div>
              <div className="price">{formatCurrencyAmount(p.price, (p.currency ?? 'RUB') as CurrencyCode, { withCode: true })}</div>
            </div>
            <button className="icon-btn" onClick={() => { deleteAdminProduct(p.id); refresh(); }}><CloseIcon size={16} /></button>
          </div>
        ))}
      </div>

      <Section title="На модерации" />
      {pendingDeals.length === 0 ? (
        <div className="empty-state"><h4>Заявок нет</h4><p>Новые товары продавцов появятся здесь.</p></div>
      ) : (
        <div className="deal-list">
          {pendingDeals.map((d) => (
            <div className="card" key={d.id}>
              <div style={{ fontWeight: 800 }}>{d.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{d.category} · {formatPrice(d.price, d.currency)}</div>
              <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{d.description}</p>
              <div className="row-2">
                <button className="btn btn--danger" onClick={() => handleReject(d)}><CloseIcon size={16} />Отклонить</button>
                <button className="btn btn--primary" onClick={() => handleApprove(d)}><CheckIcon size={16} />Одобрить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Section title="Заявки на пополнение" />
      <div className="deal-list">
        {topups.length === 0 ? (
          <div className="empty-state"><h4>Нет заявок на пополнение</h4><p>Здесь появятся новые платежи пользователей.</p></div>
        ) : (
          topups.map((t) => (
            <div className="card" key={t.id}>
              <div style={{ fontWeight: 800 }}>#{t.id}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                user_id={t.userId} · @{t.username || '—'} · {t.method.toUpperCase()}
              </div>
              <div className="price">{formatCurrencyAmount(t.amount, t.currency as CurrencyCode, { withCode: true })}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Статус: {statusLabel(t.status)}
                {t.creditCurrency && t.creditAmount !== t.amount
                  ? ` · к зачислению ${formatCurrencyAmount(t.creditAmount, t.creditCurrency as CurrencyCode, { withCode: true })}`
                  : ''}
              </div>
              {t.status === 'pending' && (
                <div className="row-2 mt-12">
                  <button className="btn btn--danger" onClick={() => handleRejectTopup(t.id)}>
                    <CloseIcon size={16} /> Отклонить
                  </button>
                  <button className="btn btn--primary" onClick={() => handleApproveTopup(t.id)}>
                  <CheckIcon size={16} /> Одобрить
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <div className="section-title"><h2>{title}</h2></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><div className="label">{label}</div>{children}</div>;
}

function statusLabel(status: ApiTopup['status']): string {
  switch (status) {
    case 'approved':
      return 'одобрено';
    case 'rejected':
      return 'отклонено';
    default:
      return 'ожидает';
  }
}
