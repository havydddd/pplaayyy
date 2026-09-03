import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { ChevronRightIcon, WalletIcon } from '../components/Icon';
import { useWallet } from '../state/WalletContext';
import { useLanguage } from '../state/LanguageContext';
import { loadWithdrawals } from '../state/Withdrawals';
import { formatCurrencyCodeAmount } from '../utils/money';

export default function BalancePage() {
  const navigate = useNavigate();
  const { currency, formatBalance } = useWallet();
  const { t } = useLanguage();
  const withdrawals = loadWithdrawals();

  return (
    <div className="page">
      <AppBar title={t.balanceTitle} onClose={() => navigate('/profile')} />

      <div className="balance-card">
        <div>
          <div className="label">{t.available}</div>
          <div className="amount">{formatBalance()}</div>
        </div>
        <div className="add-btn">
          <WalletIcon size={20} />
        </div>
      </div>

      <div className="row-2 mt-16">
        <button className="btn btn--primary" onClick={() => navigate('/topup')}>
          {t.topUp}
        </button>
        <button className="btn btn--secondary" onClick={() => navigate('/withdraw')}>
          {t.withdraw}
        </button>
      </div>

      <div className="section-title">
        <h2>{t.withdrawHistory}</h2>
      </div>
      {withdrawals.length === 0 ? (
        <div className="empty-state">
          <h4>{t.noWithdrawals}</h4>
          <p>{t.afterRequest}</p>
        </div>
      ) : (
        <div className="deal-list">
          {withdrawals.map((w) => (
            <div className="deal-row" key={w.id}>
              <div className="deal-row__thumb">
                <WalletIcon size={22} />
              </div>
              <div className="deal-row__body">
                <div className="title">{w.method === 'crypto' ? t.cryptoLabel : t.bankCard}</div>
                <div className="sub">#{w.id} · {t.pendingLabel}</div>
                <div className="price">{formatCurrencyCodeAmount(w.amount, currency)}</div>
              </div>
              <ChevronRightIcon size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
