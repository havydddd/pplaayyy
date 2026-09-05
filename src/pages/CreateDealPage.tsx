import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { APPS } from '../data/catalog';
import { BrandIcon } from '../components/BrandIcon';
import { CameraIcon, AlertIcon } from '../components/Icon';
import { PaymentIcon } from '../components/PaymentIcon';
import { createDealId, formatPrice, saveDeal } from '../data/deals';
import type { Deal, PayoutDetails, PayoutMethod } from '../data/deals';
import { logEvent } from '../state/EventLog';
import { displayName, readTelegramUser } from '../state/TelegramUser';

const CURRENCIES: Deal['currency'][] = ['RUB', 'KZT', 'USDT', 'TON', 'TRX', 'STARS'];
const COMMISSION = 20;

const BANKS = [
  'Тинькофф',
  'Сбербанк',
  'Альфа-Банк',
  'ВТБ',
  'Райффайзен',
  'Газпромбанк',
  'Открытие',
  'Совкомбанк',
];

const CRYPTOS = [
  { id: 'TON', name: 'TON (Toncoin)', placeholder: 'UQ… или EQ…' },
  { id: 'USDT', name: 'USDT', placeholder: 'T… (TRC-20) / 0x… (ERC-20)' },
  { id: 'BTC', name: 'Bitcoin', placeholder: 'bc1… / 1… / 3…' },
  { id: 'STARS', name: 'Telegram Stars', placeholder: 'Telegram ID или @username' },
] as const;

type Step = 1 | 2 | 3 | 4;

export default function CreateDealPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedApp = APPS.find((app) => app.id === searchParams.get('app'));
  const [step, setStep] = useState<Step>(selectedApp ? 2 : 1);
  const [category, setCategory] = useState<string>(selectedApp?.name ?? '');
  const [photo, setPhoto] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('1000');
  const [currency, setCurrency] = useState<Deal['currency']>('RUB');

  // Payout step
  const [payMethod, setPayMethod] = useState<PayoutMethod>('sbp');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState(BANKS[0]);
  const [holder, setHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cryptoCoin, setCryptoCoin] = useState<(typeof CRYPTOS)[number]['id']>('TON');
  const [cryptoAddress, setCryptoAddress] = useState('');

  const price = Number(priceInput) || 0;

  const payout = useMemo(
    () => Math.max(0, Math.round(price * (1 - COMMISSION / 100) * 100) / 100),
    [price],
  );

  // Restrict payout methods to whatever makes sense for the chosen currency.
  // Fiat → bank rails. Crypto → crypto wallet.
  const allowedMethods = useMemo<PayoutMethod[]>(
    () => (currency === 'RUB' || currency === 'KZT' ? ['sbp', 'card'] : ['crypto']),
    [currency],
  );

  // For STARS, show stars-specific hint
  const isStars = currency === 'STARS';

  // If the current selection is no longer allowed (e.g. user went back and
  // switched currency from RUB to USDT), snap to the first allowed method.
  if (!allowedMethods.includes(payMethod)) {
    setPayMethod(allowedMethods[0]);
  }

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : undefined);
    reader.readAsDataURL(file);
  };

  const next = () => {
    if (step === 1 && category) setStep(2);
    else if (step === 2 && title.trim()) setStep(3);
    else if (step === 3 && price > 0 && description.trim()) setStep(4);
  };

  const payoutValid = useMemo(() => {
    if (payMethod === 'sbp') {
      return phone.replace(/\D/g, '').length >= 10 && !!bank && holder.trim().length >= 2;
    }
    if (payMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      return digits.length >= 12 && digits.length <= 19 && !!bank && holder.trim().length >= 2;
    }
    return cryptoAddress.trim().length >= 8;
  }, [payMethod, phone, bank, holder, cardNumber, cryptoAddress]);

  const buildPayoutDetails = (): PayoutDetails => {
    if (payMethod === 'sbp') {
      return { method: 'sbp', destination: phone.trim(), bank, holder: holder.trim() };
    }
    if (payMethod === 'card') {
      return {
        method: 'card',
        destination: cardNumber.replace(/\s+/g, ''),
        bank,
        holder: holder.trim(),
      };
    }
    return { method: 'crypto', destination: cryptoAddress.trim(), bank: cryptoCoin };
  };

  const submit = () => {
    if (!payoutValid) return;
    const id = createDealId();
    const user = readTelegramUser();
    const sellerName = displayName(user);
    const deal: Deal = {
      id,
      category,
      title: title.trim(),
      description: description.trim(),
      price,
      currency,
      commissionPercent: COMMISSION,
      payout,
      payoutDetails: buildPayoutDetails(),
      photo,
      status: 'active',
      moderation: 'approved',
      sellerName,
      createdAt: Date.now(),
    };
    saveDeal(deal);
    logEvent({
      type: 'create_deal',
      user: sellerName,
      userId: user.id,
      username: user.username,
      dealId: id,
      amount: price,
      status: 'pending',
      message: `${sellerName} создал сделку «${deal.title}» — ждёт модерации`,
    });
    navigate(`/deal/${id}`, { replace: true });
  };

  const titleByStep: Record<Step, string> = {
    1: 'Что продаём?',
    2: 'Карточка товара',
    3: 'Цена и описание',
    4: 'Куда переводить деньги',
  };

  return (
    <div className="page">
      <AppBar
        title={titleByStep[step]}
        onClose={() => navigate('/sell')}
      />

      <div className="wizard-progress">
        <span className={step >= 1 ? 'done' : ''} />
        <span className={step >= 2 ? 'done' : ''} />
        <span className={step >= 3 ? 'done' : ''} />
        <span className={step >= 4 ? 'done' : ''} />
      </div>

      {step === 1 && (
        <>
          <div className="muted mt-12" style={{ marginLeft: 4 }}>
            Выберите раздел, в котором продаёте товар.
          </div>
          <div className="select-row mt-16">
            {APPS.map((app) => (
              <div
                key={app.id}
                className={`select-row__item ${category === app.name ? 'active' : ''}`}
                onClick={() => setCategory(app.name)}
              >
                <BrandIcon app={app.id} size={44} rounded={12} />
                <div>
                  <div style={{ fontWeight: 700 }}>{app.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>OTC через гаранта</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn--primary mt-24" disabled={!category} onClick={next}>
            Продолжить
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="field mt-12">
            <div className="label">Фото товара</div>
            <label className="photo-picker">
              {photo ? (
                <img src={photo} alt="превью" />
              ) : (
                <>
                  <CameraIcon size={28} />
                  <span>Добавить фото</span>
                  <small style={{ color: 'var(--text-muted)' }}>JPG/PNG, до 5 МБ</small>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </label>
          </div>

          <div className="field">
            <div className="label">Название</div>
            <input
              placeholder="Например: Telegram Premium аккаунт"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>

          <button className="btn btn--primary mt-20" disabled={!title.trim()} onClick={next}>
            Подтвердить
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="row-2 mt-12">
            <div className="field" style={{ margin: 0 }}>
              <div className="label">Цена</div>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <div className="label">Валюта</div>
              <div className="currency-pills">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    className={currency === c ? 'active' : ''}
                    onClick={() => setCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="payout-info">
            <div>
              <div className="label">Вы получите</div>
              <div className="muted" style={{ fontSize: 11 }}>
                Комиссия гаранта {COMMISSION}%
              </div>
            </div>
            <div className="amount">{formatPrice(payout, currency)}</div>
          </div>

          <div className="field">
            <div className="label">Описание</div>
            <textarea
              rows={5}
              placeholder="Опишите товар, условия передачи, сроки и что именно получает покупатель."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <button
            className="btn btn--primary mt-20"
            disabled={!price || !description.trim()}
            onClick={next}
          >
            Далее: реквизиты
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <div className="muted mt-12" style={{ marginLeft: 4 }}>
            Куда отправлять выплату после успешной сделки. Реквизиты видит
            только гарант — покупателю они не показываются.
          </div>

          <div
            className="tabs mt-12"
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${allowedMethods.length}, 1fr)`,
            }}
          >
            {allowedMethods.includes('sbp') && (
              <button
                className={payMethod === 'sbp' ? 'active' : ''}
                onClick={() => setPayMethod('sbp')}
              >
                СБП
              </button>
            )}
            {allowedMethods.includes('card') && (
              <button
                className={payMethod === 'card' ? 'active' : ''}
                onClick={() => setPayMethod('card')}
              >
                Карта
              </button>
            )}
            {allowedMethods.includes('crypto') && (
              <button
                className={payMethod === 'crypto' ? 'active' : ''}
                onClick={() => setPayMethod('crypto')}
              >
                Крипта
              </button>
            )}
          </div>

          <div className="muted mt-8" style={{ marginLeft: 4, fontSize: 12 }}>
            {currency === 'RUB' || currency === 'KZT'
              ? 'Для цены в фиате доступны только СБП и банковская карта.'
              : isStars
              ? 'Для валюты Stars выплата производится на крипто-кошелёк (TON/USDT).'
              : `Для валюты ${currency} доступна только крипто-выплата.`}
          </div>

          <div
            className="card mt-16"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}
          >
            <PaymentIcon
              id={payMethod === 'sbp' ? 'sbp' : payMethod === 'card' ? 'card' : 'ton'}
              size={48}
              rounded={14}
            />
            <div>
              <div style={{ fontWeight: 700 }}>
                {payMethod === 'sbp'
                  ? 'Система быстрых платежей'
                  : payMethod === 'card'
                  ? 'Банковская карта'
                  : 'Крипто-кошелёк'}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {payMethod === 'sbp'
                  ? 'Номер телефона, привязанный к банку'
                  : payMethod === 'card'
                  ? 'Visa / Mastercard / МИР'
                  : 'TON, USDT (TRC-20/ERC-20) или Bitcoin'}
              </div>
            </div>
          </div>

          {payMethod === 'sbp' && (
            <>
              <div className="field">
                <div className="label">Номер телефона</div>
                <input
                  placeholder="+7 999 000 00 00"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <div className="label">Банк</div>
                <BankSelect value={bank} onChange={setBank} />
              </div>
              <div className="field">
                <div className="label">Имя владельца</div>
                <input
                  placeholder="Иван Иванов"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </>
          )}

          {payMethod === 'card' && (
            <>
              <div className="field">
                <div className="label">Номер карты</div>
                <input
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  maxLength={23}
                  autoComplete="cc-number"
                />
              </div>
              <div className="field">
                <div className="label">Банк-эмитент</div>
                <BankSelect value={bank} onChange={setBank} />
              </div>
              <div className="field">
                <div className="label">Имя владельца</div>
                <input
                  placeholder="IVAN IVANOV"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  autoComplete="cc-name"
                />
              </div>
            </>
          )}

          {payMethod === 'crypto' && (
            <>
              <div className="field">
                <div className="label">Монета</div>
                <div className="currency-pills">
                  {CRYPTOS.map((c) => (
                    <button
                      key={c.id}
                      className={cryptoCoin === c.id ? 'active' : ''}
                      onClick={() => setCryptoCoin(c.id)}
                    >
                      {c.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <div className="label">Адрес кошелька</div>
                <input
                  placeholder={CRYPTOS.find((c) => c.id === cryptoCoin)?.placeholder}
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
              <div className="warning mt-12">
                <AlertIcon size={16} />
                <span>
                  Проверьте сеть и адрес. Перевод на неправильный адрес восстановить нельзя.
                </span>
              </div>
            </>
          )}

          <button
            className="btn btn--primary mt-20"
            disabled={!payoutValid}
            onClick={submit}
          >
            Создать сделку
          </button>
        </>
      )}
    </div>
  );
}

interface BankSelectProps {
  value: string;
  onChange: (v: string) => void;
}

function BankSelect({ value, onChange }: BankSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-soft)',
        fontWeight: 600,
        appearance: 'none',
      }}
    >
      {BANKS.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </select>
  );
}

function formatCard(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
