export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  text: string;
}

const PREFIXES = [
  'player', 'gamer', 'steam', 'trade', 'market', 'buyer', 'user', 'pro', 'fast', 'dark',
  'neo', 'cyber', 'pixel', 'shadow', 'prime', 'nova', 'lucky', 'orbit', 'flash', 'top',
  'king', 'epic', 'turbo', 'nitro', 'solid', 'cool', 'ultra', 'mega', 'hyper', 'super',
  'alpha', 'beta', 'delta', 'sigma', 'omega', 'storm', 'blaze', 'frost', 'thunder', 'iron',
  'blade', 'swift', 'void', 'neon', 'ghost', 'toxic', 'rebel', 'steel', 'flame', 'comet',
  'razor', 'raven', 'titan', 'viper', 'wolf', 'eagle', 'hawk', 'bear', 'lion', 'fox',
  'drift', 'boost', 'grind', 'rush', 'blast', 'surge', 'spike', 'pulse', 'force', 'edge',
];

const SUFFIXES = [
  'x', 'pro', 'hub', '77', '88', '99', 'ru', 'gg', 'shop', 'play',
  'wave', 'fox', 'one', 'max', 'zone', 'star', 'line', 'win', 'go', 'vip',
  'ace', 'top', 'hit', 'god', 'boss', 'king', 'lord', 'hero', 'ninja', 'sniper',
  'gg', 'ez', 'ok', 'yep', 'lol', 'kek', 'wow', 'omg', 'bruh', 'gg',
  'trader', 'seller', 'buyer', 'master', 'expert', 'legend', 'pro100', 'level',
];

const TEXTS = [
  'все супер', 'быстро', 'рекомендую', 'отлично', 'нормально', 'товар получил',
  'без проблем', 'хороший продавец', 'всё чётко', 'доволен покупкой',
  'оперативно', 'спасибо', 'пришло быстро', 'качество хорошее', 'повторю покупку',
];

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRand(n: number, mod: number): number {
  return ((n ^ (n >>> 16)) * 0x45d9f3b >>> 0) % mod;
}

function nickname(seed: string, index: number, used: Set<string>): string {
  for (let attempt = 0; attempt < 200; attempt++) {
    const n = hash(`${seed}\x00${index}\x00${attempt}`);
    const a = seededRand(n, PREFIXES.length);
    const b = seededRand(n ^ 0xdeadbeef, SUFFIXES.length);
    const num = 10 + seededRand(n ^ 0xcafe1234, 9990);
    const sep = seededRand(n ^ 0xabcd, 3);

    let name: string;
    const fmt = attempt % 6;
    if (fmt === 0) name = `${PREFIXES[a]}_${SUFFIXES[b]}`;
    else if (fmt === 1) name = `${PREFIXES[a]}${num}`;
    else if (fmt === 2) name = `${PREFIXES[a]}_${num}`;
    else if (fmt === 3) name = `${PREFIXES[a]}${sep === 0 ? '.' : sep === 1 ? '-' : '_'}${SUFFIXES[b]}${num % 100}`;
    else if (fmt === 4) name = `${PREFIXES[a]}${PREFIXES[b % PREFIXES.length]}`;
    else name = `${PREFIXES[a]}${num % 10 === 0 ? 'x' : ''}${SUFFIXES[b]}`;

    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `user_${hash(`${seed}\x00${index}`)}`;
  used.add(fallback);
  return fallback;
}

export function generateReviews(seed: string, count = 5, minRating = 3, maxRating = 5): Review[] {
  const safeCount = Math.max(1, Math.min(50, Math.round(count)));
  const min = Math.max(3, Math.min(5, Math.round(minRating)));
  const max = Math.max(min, Math.min(5, Math.round(maxRating)));
  const base = hash(seed);
  const usedNames = new Set<string>();

  return Array.from({ length: safeCount }, (_, i) => {
    const n = base ^ (i * 2654435761);
    const daysAgo = (seededRand(n, 30)) + 1;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return {
      id: `${seed}-${i}`,
      user: nickname(seed, i, usedNames),
      rating: min + (seededRand(n ^ 0x12345, max - min + 1)),
      date: date.toLocaleDateString('ru-RU'),
      text: TEXTS[seededRand(n ^ 0x67890, TEXTS.length)],
    };
  });
}

export function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 5;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return Math.round(avg * 10) / 10;
}
