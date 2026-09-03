/** Structured payload for a purchase notice, rendered as a rich card in the chat. */
export interface PurchaseNotice {
  /** Localized product title, e.g. "Аккаунт Steam с CS2". */
  productTitle: string;
  /** Pre-formatted amount string, e.g. "1500 ₽". */
  amountLabel?: string;
  /** Short deal id, e.g. "#A7F3B9". */
  dealId?: string;
}

export interface ChatMessage {
  id: string;
  /** 'notice' is a highlighted purchase notification (e.g. order paid). */
  role: 'user' | 'support' | 'notice';
  text: string;
  /** Structured purchase data, present on 'notice' messages. */
  purchase?: PurchaseNotice;
  /** Data-URL of an attached image, if any. */
  image?: string;
  ts: number;
}

/** Telegram handle of the official relayer items are handed over to. */
export const RELAYER_HANDLE = 'YOUR_SUPPORT_USERNAME';
export const RELAYER_LINK = `https://t.me/${RELAYER_HANDLE}`;

const STORAGE_KEY = 'playerok-otc:support-chat';

const INITIAL: ChatMessage[] = [
  {
    id: 'sys-1',
    role: 'support',
    text:
      'Здравствуйте! Это поддержка Playerok 👋\n' +
      'Мы на связи 24/7. Опишите, что случилось, прикрепите номер сделки или скриншот — поможем как можно быстрее.',
    ts: Date.now(),
  },
];

export function loadMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed : INITIAL;
  } catch {
    return INITIAL;
  }
}

export function saveMessages(msgs: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-200)));
  } catch {
    /* ignore */
  }
}

/** Append a highlighted purchase notice to the single support thread and persist it.
 * Used when an order is paid: we ask the seller to hand the item/service over to
 * the official relayer so it can be verified and passed on to the buyer. */
export function pushSupportNotice(text: string, purchase?: PurchaseNotice): void {
  const msgs = loadMessages();
  const notice: ChatMessage = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'notice',
    text,
    purchase,
    ts: Date.now(),
  };
  saveMessages([...msgs, notice]);
}

export function autoReply(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('баланс') || lower.includes('пополн')) {
    return 'Чтобы пополнить баланс, откройте раздел «Профиль» → «+» рядом с балансом. Принимаем СБП, карты и криптовалюты.';
  }
  if (lower.includes('отмен') || lower.includes('возврат')) {
    return 'Если товар ещё не выдан, средства можно вернуть. Пришлите ID сделки — оператор откроет диспут.';
  }
  if (lower.includes('не пришл') || lower.includes('не приш') || lower.includes('не зачисл')) {
    return 'Спасибо, разбираемся. Уточните, пожалуйста, ID сделки и время оплаты — оператор подключится в течение 5 минут.';
  }
  if (lower.includes('steam') || lower.includes('стим')) {
    return 'Для покупки в Steam укажите логин Steam на странице товара перед оплатой — зачисление произойдёт автоматически.';
  }
  if (lower.includes('привет') || lower.includes('здрав')) {
    return 'Здравствуйте! Чем можем помочь?';
  }
  return 'Принял ваше сообщение. Оператор подключится к чату в ближайшее время — обычно это занимает до 3 минут.';
}
