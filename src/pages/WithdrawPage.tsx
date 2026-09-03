import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { ResultSheet } from '../components/ResultSheet';
import { logEvent } from '../state/EventLog';
import { displayName, readTelegramUser } from '../state/TelegramUser';
import { saveWithdrawal } from '../state/Withdrawals';
import type { WithdrawalMethod, WithdrawalRequest } from '../state/Withdrawals';
import { useWallet } from '../state/WalletContext';
import { formatCurrencyCodeAmount } from '../utils/money';
import { useLanguage } from '../state/LanguageContext';
import { createWithdrawal, hasTelegramAuth } from '../state/BotApi';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { currency, refresh } = useWallet();
  const { t } = useLanguage();
  const [method, setMethod] = useState<WithdrawalMethod>('crypto');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('TON');
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [amount, setAmount] = useState(1000);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid =
    amount > 0 &&
    (method === 'crypto'
      ? walletAddress.trim().length >= 8 && network.trim().length >= 2
      : cardNumber.replace(/\D/g, '').length >= 12 && holderName.trim().length >= 2);

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    const req: WithdrawalRequest = {
      id: 'wd-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      method,
      amount,
      walletAddress: method === 'crypto' ? walletAddress.trim() : undefined,
      network: method === 'crypto' ? network.trim() : undefined,
      cardNumber: method === 'card' ? cardNumber.replace(/\s+/g, '') : undefined,
      holderName: method === 'card' ? holderName.trim() : undefined,
      status: 'pending',
      createdAt: Date.now(),
    };
    try {
      if (hasTelegramAuth()) {
        const res = await createWithdrawal({
          amount,
          method,
          walletAddress: req.walletAddress,
          network: req.network,
          cardNumber: req.cardNumber,
          holderName: req.holderName,
        });
        if (!res.ok) {
          setSubmitting(false);
          return;
        }
        await refresh().catch(() => undefined);
      }
      saveWithdrawal(req);
    } catch {
      setSubmitting(false);
      return;
    }
    const user = readTelegramUser();
    const userName = displayName(user);
    logEvent({
      type: 'withdrawal',
      user: userName,
      userId: user.id,
      username: user.username,
      amount,
      status: 'pending',
      message: `${userName} отправил заявку на вывод ${formatCurrencyCodeAmount(amount, currency)} через ${method === 'crypto' ? 'криптовалюту' : 'банковскую карту'}`,
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="page">
      <AppBar title={t.withdrawTitle} onClose={() => navigate('/balance')} />

      <div className="tabs mt-12" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <button className={method === 'crypto' ? 'active' : ''} onClick={() => setMethod('crypto')}>
          {t.cryptoLabel}
        </button>
        <button className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}>
          {t.bankCard}
        </button>
      </div>

      {method === 'crypto' ? (
        <>
          <div className="field">
            <div className="label">{t.walletAddress}</div>
            <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="UQ... или 0x..." />
          </div>
          <div className="field">
            <div className="label">{t.network}</div>
            <input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="TON / TRC-20 / ERC-20" />
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <div className="label">{t.cardNumber}</div>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={23}
            />
          </div>
          <div className="field">
            <div className="label">{t.ownerName}</div>
            <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="IVAN IVANOV" />
          </div>
        </>
      )}

      <div className="field">
        <div className="label">{t.amountLabel}</div>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
        />
      </div>

      <button className="btn btn--primary mt-20" disabled={!valid || submitting} onClick={submit}>
        {t.withdrawSubmit}
      </button>

      <ResultSheet
        open={done}
        variant="success"
        title={t.withdrawalSubmitted}
        message={t.withdrawalHistoryUpdated}
        primaryLabel={t.toBalance}
        onPrimary={() => navigate('/balance')}
      />
    </div>
  );
}

function formatCard(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
