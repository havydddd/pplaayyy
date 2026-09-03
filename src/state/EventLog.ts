/**
 * Local event log — every important user action is recorded here so the
 * admin page can show a chronological feed. Once a real backend / Telegram
 * webhook is wired up, this same `logEvent` call can also POST to it.
 */

import { API_BASE, getTelegramUserId } from './BotApi';

export type EventType =
  | 'start'
  | 'create_deal'
  | 'pay_deal'
  | 'topup'
  | 'withdrawal'
  | 'approve_deal'
  | 'reject_deal';

export interface AppEvent {
  id: string;
  type: EventType;
  ts: number;
  user?: string;
  userId?: number;
  username?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'sent';
  dealId?: string;
  amount?: number;
  message: string;
}

const STORAGE_KEY = 'playerok-otc:event-log';
const SESSION_FLAG = 'playerok-otc:session-started';
const MAX = 500;

function read(): AppEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AppEvent[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list: AppEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* ignore */
  }
}

export function loadEvents(): AppEvent[] {
  return read().sort((a, b) => b.ts - a.ts);
}

export function logEvent(input: Omit<AppEvent, 'id' | 'ts'>): void {
  const ev: AppEvent = {
    ...input,
    id: 'ev-' + Math.random().toString(36).slice(2, 10),
    ts: Date.now(),
  };
  persist([...read(), ev]);
  void sendToLogChat(ev);
}

async function sendToLogChat(ev: AppEvent): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const initData = window.Telegram?.WebApp?.initData || '';
    // No backend configured → skip (avoids 404 against the static host).
    if (!API_BASE) return;
    let url = `${API_BASE}/api/log-event`;
    const userId = ev.userId || getTelegramUserId();
    if (userId) url += `?user_id=${encodeURIComponent(String(userId))}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
      },
      body: JSON.stringify({
        event: ev,
        text: formatLogMessage(ev),
      }),
    });
  } catch {
    /* A backend endpoint is required to call Telegram Bot API safely. */
  }
}

function formatLogMessage(ev: AppEvent): string {
  const when = new Date(ev.ts).toLocaleString('ru-RU');
  const who = [
    ev.user ?? 'Пользователь',
    ev.userId ? `user_id=${ev.userId}` : undefined,
    ev.username ? `@${ev.username}` : undefined,
  ].filter(Boolean).join(' · ');
  return [
    `Когда: ${when}`,
    `Кто: ${who}`,
    `Действие: ${ev.message}`,
    ev.amount ? `Сумма: ${ev.amount}` : undefined,
    ev.dealId ? `ID товара: ${ev.dealId}` : undefined,
    ev.status ? `Статус: ${ev.status}` : undefined,
  ].filter(Boolean).join('\n');
}

/** Logs the `start` event exactly once per browser session. */
export function logSessionStart(userName: string, userId?: number, username?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(SESSION_FLAG)) return;
    window.sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    /* ignore — still log */
  }
  logEvent({
    type: 'start',
    user: userName,
    userId,
    username,
    status: 'sent',
    message: `${userName} открыл Mini App`,
  });
}

export function clearEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const EVENT_META: Record<EventType, { emoji: string; color: string }> = {
  start: { emoji: '👋', color: '#2f6dff' },
  create_deal: { emoji: '📝', color: '#7a5cff' },
  pay_deal: { emoji: '💳', color: '#18c874' },
  topup: { emoji: '💰', color: '#ffb547' },
  withdrawal: { emoji: '🏦', color: '#2f6dff' },
  approve_deal: { emoji: '✅', color: '#18c874' },
  reject_deal: { emoji: '⛔', color: '#ff3f67' },
};
