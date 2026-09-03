export interface TelegramUser {
  id?: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isTelegram: boolean;
}

interface RawUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export function readTelegramUser(): TelegramUser {
  if (typeof window === 'undefined') {
    return { firstName: 'Гость', isTelegram: false };
  }
  const tg = window.Telegram?.WebApp;
  const raw = tg?.initDataUnsafe?.user as RawUser | undefined;
  if (!raw || !raw.first_name) {
    return { firstName: 'Гость', isTelegram: false };
  }
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    username: raw.username,
    photoUrl: raw.photo_url,
    isTelegram: true,
  };
}

export function displayName(u: TelegramUser): string {
  const last = u.lastName ? ` ${u.lastName}` : '';
  return `${u.firstName}${last}`.trim();
}

export function initials(u: TelegramUser): string {
  const first = (u.firstName || '?').trim()[0] || '?';
  const last = u.lastName?.trim()[0];
  return (first + (last ?? '')).toUpperCase();
}

const REG_KEY = 'playerok-otc:registered-at';

/** Returns the timestamp of the user's first session, persisted to localStorage. */
export function getRegisteredAt(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const raw = window.localStorage.getItem(REG_KEY);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
    const now = Date.now();
    window.localStorage.setItem(REG_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

const MONTH_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatRegistered(ts: number): string {
  const d = new Date(ts);
  return `с ${MONTH_GENITIVE[d.getMonth()]} ${d.getFullYear()}`;
}
