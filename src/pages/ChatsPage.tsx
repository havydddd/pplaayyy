import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AppBar } from '../components/AppBar';
import { HeadsetIcon, SendIcon, CameraIcon } from '../components/Icon';
import { autoReply, loadMessages, saveMessages, RELAYER_LINK } from '../state/ChatStore';
import type { ChatMessage } from '../state/ChatStore';
import { useLanguage } from '../state/LanguageContext';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatNoticeDate(ts: number, locale: string): string {
  const d = new Date(ts);
  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Open a chat with the official relayer directly in Telegram (not inside the
 * mini app) when possible, falling back to a normal link the user can tap. */
function openRelayerChat(): void {
  const tg = window.Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(RELAYER_LINK);
    return;
  }
  window.open(RELAYER_LINK, '_blank', 'noopener');
}

export default function ChatsPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [draft, setDraft] = useState('');
  const [pendingImage, setPendingImage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveMessages(messages);
    threadEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text && !pendingImage) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      image: pendingImage,
      ts: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setPendingImage(undefined);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `s-${Date.now()}`,
        role: 'support',
        text: pendingImage ? t.screenshotThanks : autoReply(text || 'screenshot'),
        ts: Date.now(),
      };
      setMessages((m) => [...m, reply]);
    }, 700 + Math.min(1200, (text.length || 5) * 20));
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPendingImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="page">
      <AppBar title={t.navChat} leading="none" trailing="none" />

      <div className="chat-header-card">
        <div
          className="avatar"
          style={{ width: 44, height: 44, borderRadius: 14, fontSize: 16 }}
        >
          <HeadsetIcon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{t.supportTitle}</div>
          <div className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse" /> {t.supportOnline}
          </div>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-thread">
          {messages.map((m) =>
            m.role === 'notice' ? (
              <div key={m.id} className="notice-card">
                <div className="notice-card__head">
                  <span className="notice-card__icon">🛒</span>
                  <span className="notice-card__title">
                    {t.noticePurchaseLabel}:{' '}
                    <strong>«{m.purchase?.productTitle ?? ''}»</strong>
                  </span>
                </div>

                {m.purchase?.amountLabel && (
                  <div className="notice-card__row">
                    💰 {t.noticeAmountLabel}: <strong>{m.purchase.amountLabel}</strong>
                  </div>
                )}
                {m.purchase?.dealId && (
                  <div className="notice-card__row notice-card__muted">
                    🆔 {t.noticeDealLabel}: {m.purchase.dealId}
                  </div>
                )}
                <div className="notice-card__row notice-card__muted">
                  📅 {formatNoticeDate(m.ts, lang === 'en' ? 'en-US' : 'ru-RU')}
                </div>

                <div className="notice-card__body">{t.noticePaidBody}</div>

                <button
                  type="button"
                  className="notice-card__btn"
                  onClick={openRelayerChat}
                >
                  💬 {t.contactRelayer}
                </button>
              </div>
            ) : (
              <div
                key={m.id}
                className={`bubble ${m.role === 'user' ? 'bubble--out' : 'bubble--in'}`}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt={t.screenshotAlt}
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      borderRadius: 12,
                      marginBottom: m.text ? 8 : 0,
                    }}
                  />
                )}
                {m.text}
                <span className="meta">{formatTime(m.ts)}</span>
              </div>
            ),
          )}
          <div ref={threadEnd} />
        </div>

        {pendingImage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderRadius: 12,
              background: 'var(--bg-card-2)',
              border: '1px solid var(--border-soft)',
              marginBottom: 8,
            }}
          >
            <img
              src={pendingImage}
              alt={t.screenshotAlt}
              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
            />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>
              {t.attachmentReady}
            </span>
            <button
              onClick={() => setPendingImage(undefined)}
              className="icon-btn"
              aria-label={t.removeAttachment}
              style={{ width: 28, height: 28 }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="chat-input">
          <button
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t.attachScreenshot}
            style={{ width: 38, height: 38, borderRadius: '50%' }}
          >
            <CameraIcon size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            style={{ display: 'none' }}
          />
          <input
            placeholder={pendingImage ? t.captionPlaceholder : t.messagePlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
          />
          <button
            className="send"
            onClick={send}
            disabled={!draft.trim() && !pendingImage}
            aria-label={t.send}
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
