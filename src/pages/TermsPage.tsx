import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { CheckIcon } from '../components/Icon';

const REQUIREMENTS = [
  'Заполнить достоверную информацию о товаре',
  'Обработать заказ в течение 24 часов после оплаты',
  'Общаться только через чат и поддержку',
  'Передавать товар только через гаранта',
];

const FORBIDDEN = [
  'Продавать товары, полученные нелегальным путём',
  'Получать оплату на прямые реквизиты',
  'Передавать товар напрямую покупателю',
  'Обходить гаранта после оплаты',
];

export default function TermsPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const total = REQUIREMENTS.length + FORBIDDEN.length;
  const checkedCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const allChecked = checkedCount === total;

  const toggle = (key: string) => setChecked((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="page">
      <AppBar title="Условия продажи" leading="none" onClose={() => navigate('/sell')} />

      <div className="terms-card">
        <h3>
          <span style={{ fontSize: 18 }}>✅</span> Требования
        </h3>
        {REQUIREMENTS.map((text) => {
          const key = `req:${text}`;
          const isChecked = !!checked[key];
          return (
            <div className="terms-item" key={key}>
              <span className="dot dot--good" />
              <span className="text">{text}</span>
              <button
                className={`checkbox ${isChecked ? 'checked' : ''}`}
                onClick={() => toggle(key)}
                aria-pressed={isChecked}
                aria-label="Принять пункт"
              >
                <CheckIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="terms-card">
        <h3>
          <span style={{ fontSize: 18 }}>❌</span> Запрещено
        </h3>
        {FORBIDDEN.map((text) => {
          const key = `forb:${text}`;
          const isChecked = !!checked[key];
          return (
            <div className="terms-item" key={key}>
              <span className="dot dot--bad" />
              <span className="text">{text}</span>
              <button
                className={`checkbox ${isChecked ? 'checked' : ''}`}
                onClick={() => toggle(key)}
                aria-pressed={isChecked}
                aria-label="Принять пункт"
              >
                <CheckIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="btn btn--primary mt-20"
        disabled={!allChecked}
        onClick={() => allChecked && navigate('/create')}
      >
        Я принимаю {!allChecked && `(${checkedCount}/${total})`}
      </button>
    </div>
  );
}
