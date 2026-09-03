/**
 * Catalog of the 5 supported apps and a static "real-looking" product list
 * per app. The product list mimics what an OTC marketplace such as Playerok
 * would show. There is no public Playerok API; the data here is curated so
 * the UI feels populated without needing a backend.
 */
import { averageRating, generateReviews } from './reviews';
import type { Review } from './reviews';
import { listApprovedDeals } from './deals';
import { listAdminProducts, listAdminSellers } from '../state/AdminStore';
import { formatCurrencyCodeAmount } from '../utils/money';
import type { CurrencyCode } from '../utils/money';

export type AppId = 'steam' | 'minecraft' | 'telegram' | 'roblox' | 'brawl';

export interface AppInfo {
  id: AppId;
  name: string;
  short?: string;
  tagline: string;
  /** Background color used for fallback chips / hero gradients. */
  color: string;
  gradient: string;
  badge?: 'new';
  /** Default category for products of this app. */
  defaultCategory: string;
  categories: string[];
}

export const APPS: AppInfo[] = [
  {
    id: 'steam',
    name: 'Steam',
    tagline: 'Пополнение, ключи и аккаунты',
    color: '#1b2838',
    gradient: 'linear-gradient(135deg, #2a475e, #0b1a2c)',
    defaultCategory: 'Пополнение',
    categories: ['Пополнение', 'Ключи', 'Аккаунты', 'CS2', 'Dota 2'],
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    tagline: 'Аккаунты, Realms и ранги серверов',
    color: '#5ab747',
    gradient: 'linear-gradient(135deg, #6cc358, #335a26)',
    defaultCategory: 'Аккаунты',
    categories: ['Аккаунты', 'Realms', 'Hypixel', 'Скины', 'Donate'],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tagline: 'Premium, Stars, NFT-подарки и юзернеймы',
    color: '#2f6dff',
    gradient: 'linear-gradient(135deg, #37bbfe, #007dbb)',
    defaultCategory: 'Premium',
    categories: ['Premium', 'Stars', 'Юзернеймы', 'Boost канала', 'NFT-подарки'],
  },
  {
    id: 'roblox',
    name: 'Roblox',
    tagline: 'Робуксы, Premium и лимитки',
    color: '#2d5cff',
    gradient: 'linear-gradient(135deg, #4a78ff, #1a3fc7)',
    badge: 'new',
    defaultCategory: 'Робуксы',
    categories: ['Робуксы', 'Premium', 'Предметы', 'Game Pass', 'Аккаунты'],
  },
  {
    id: 'brawl',
    name: 'Brawl Stars',
    short: 'Brawl Stars',
    tagline: 'Гемы, Brawl Pass и аккаунты',
    color: '#ff5d3a',
    gradient: 'linear-gradient(135deg, #ff5d3a, #c41818)',
    badge: 'new',
    defaultCategory: 'Гемы',
    categories: ['Гемы', 'Brawl Pass', 'Аккаунты', 'Star Drop', 'Скины'],
  },
];

export function getApp(id: AppId): AppInfo {
  const a = APPS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown app: ${id}`);
  return a;
}

export type Tag = 'donate' | 'subscription' | 'items' | 'accounts' | 'keys' | 'nft';

export type ProductCurrency = 'RUB' | 'TON' | 'USDT' | 'KZT' | 'USD';

export interface Product {
  id: string;
  app: AppId;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  /** Native currency this product is priced in. Defaults to RUB. */
  currency?: ProductCurrency;
  oldPrice?: number;
  discount?: number;
  artGradient: string;
  artLabel: string;
  rating: number;
  reviews: number;
  seller: string;
  sellerLevel: 'Pro' | 'Top' | 'New';
  image?: string;
  source?: 'seed' | 'admin' | 'deal';
  sellerId?: string;
  reviewItems?: Review[];
  /** Whether to show this product in the home "Премиум товары" grid. */
  premium?: boolean;
  /** Whether checkout needs a Steam login from the buyer. */
  needsSteamLogin?: boolean;
  priceColor?: 'green' | 'pink';
  tags: Tag[];
}

export const CURRENCY_SYMBOLS: Record<ProductCurrency, string> = {
  RUB: '₽',
  TON: '💎',
  USDT: '₮',
  KZT: '₸',
  USD: '$',
};

export function formatProductPrice(price: number, currency: ProductCurrency = 'RUB'): string {
  return formatCurrencyCodeAmount(price, currency as CurrencyCode);
}

export const TAG_META: Record<Tag, { label: string }> = {
  donate: { label: 'Донат' },
  subscription: { label: 'Подписки' },
  items: { label: 'Предметы' },
  accounts: { label: 'Аккаунты' },
  keys: { label: 'Ключи' },
  nft: { label: 'NFT' },
};

type ProductSeed = Omit<Product, 'tags'>;

// Compact factory helpers keep the seed list readable.
const grad = (a: string, b: string) => `linear-gradient(135deg, ${a}, ${b})`;

const STEAM: ProductSeed[] = [
  ...[100, 300, 500, 1000, 1500, 2000, 3000, 5000, 10000].map((amount, i): ProductSeed => {
    const oldPrice = Math.round(amount * 1.1);
    const price = Math.round(amount * (i < 3 ? 1.05 : i < 6 ? 1.04 : 1.02));
    return {
      id: `steam-topup-${amount}`,
      app: 'steam',
      category: 'Пополнение',
      title: `Пополнение Steam ${amount.toLocaleString('ru-RU')} ₽`,
      subtitle:
        amount === 1000 ? 'Самое популярное' :
        amount >= 5000 ? 'Скидка для крупных сумм' :
        'Зачисление 5–15 минут',
      description:
        `Моментальное пополнение кошелька Steam на ${amount.toLocaleString('ru-RU')} рублей.` +
        ` Работает на аккаунтах любого региона. Зачисление через официальный платёжный интерфейс Steam.`,
      price,
      oldPrice: i > 0 ? oldPrice : undefined,
      discount: i > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined,
      artGradient: grad('#1b2838', '#2a475e'),
      artLabel: `${amount.toLocaleString('ru-RU')} ₽`,
      rating: 5.0,
      reviews: 1200 + i * 800,
      seller: 'SteamWallet.Pro',
      sellerLevel: 'Top',
      premium: amount === 1000 || amount === 500,
      needsSteamLogin: true,
      priceColor: 'green',
    };
  }),
  {
    id: 'steam-cs2-prime',
    app: 'steam',
    category: 'CS2',
    title: 'CS2 Prime аккаунт',
    subtitle: 'Без VAC · регион RU',
    description: 'Новый аккаунт CS2 с Prime-статусом, без банов и привязок, полная почта. Передача через гаранта в течение 1 часа.',
    price: 1499, oldPrice: 1899, discount: 21,
    artGradient: grad('#d4a017', '#2a475e'), artLabel: 'CS2 PRIME',
    rating: 5.0, reviews: 644, seller: 'AccountsHub', sellerLevel: 'Pro', premium: true,
    priceColor: 'pink',
  },
  {
    id: 'steam-cs2-supreme',
    app: 'steam',
    category: 'CS2',
    title: 'CS2 аккаунт Supreme Master',
    subtitle: '12 000 часов · 18 игр',
    description: 'Высокоранговый аккаунт CS2 с Supreme Master First Class, чистой историей и инвентарём на 8 000 ₽. Полная передача через смену почты.',
    price: 12999, oldPrice: 17999, discount: 28,
    artGradient: grad('#3a1f4d', '#0b1a2c'), artLabel: 'SUPREME M.',
    rating: 4.9, reviews: 88, seller: 'CSAccounts', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'steam-cs2-knife',
    app: 'steam',
    category: 'CS2',
    title: 'CS2 нож · M9 Bayonet Slaughter',
    subtitle: 'Field-Tested · StatTrak',
    description: 'Передача предмета через торг внутри Steam. Срок — до 8 дней, помощь гаранта при трейде.',
    price: 24999, oldPrice: 29999, discount: 17,
    artGradient: grad('#7a1414', '#2a0707'), artLabel: 'M9 BAYONET',
    rating: 5.0, reviews: 32, seller: 'CSAccounts', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'steam-case-pack',
    app: 'steam',
    category: 'CS2',
    title: '50 кейсов CS2 · ассорти',
    subtitle: 'Снайперский, Revolution, Recoil',
    description: 'Пак из 50 актуальных кейсов с открытием на ваш аккаунт. Среднее ожидаемое содержимое — на 8–10 €.',
    price: 1799,
    artGradient: grad('#ffcf3a', '#2a475e'), artLabel: '50 КЕЙСОВ',
    rating: 4.8, reviews: 412, seller: 'CSAccounts', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  ...[
    { id: 'cyberpunk', name: 'Cyberpunk 2077', price: 999, old: 1599, region: 'RU/CIS', grad: ['#ffd23a', '#c41818'] },
    { id: 'rdr2', name: 'Red Dead Redemption 2', price: 1299, old: 2199, region: 'RU/CIS', grad: ['#5a1006', '#0e0606'] },
    { id: 'gtav', name: 'Grand Theft Auto V Premium', price: 599, old: 999, region: 'RU/CIS', grad: ['#0e8a55', '#063322'] },
    { id: 'witcher3', name: 'The Witcher 3: Complete', price: 549, old: 899, region: 'RU/CIS', grad: ['#3a1a06', '#7a3500'] },
    { id: 'hogwarts', name: 'Hogwarts Legacy', price: 1499, old: 2499, region: 'RU/CIS', grad: ['#3a1a55', '#7a2a00'] },
    { id: 'eldenring', name: 'Elden Ring', price: 1699, old: 2799, region: 'RU/CIS', grad: ['#3a3a5a', '#8c7338'] },
    { id: 'bg3', name: "Baldur's Gate 3", price: 1599, old: 2199, region: 'RU/CIS', grad: ['#5a1414', '#2a0a0a'] },
    { id: 'hades', name: 'Hades II Early Access', price: 599, old: 799, region: 'RU/CIS', grad: ['#7a2a55', '#2a0a3a'] },
    { id: 'stardew', name: 'Stardew Valley', price: 149, old: 299, region: 'RU/CIS', grad: ['#4ea83a', '#2a5a1a'] },
    { id: 'hollow', name: 'Hollow Knight', price: 149, old: 299, region: 'RU/CIS', grad: ['#1f1f3a', '#0a0a1a'] },
  ].map((g): ProductSeed => ({
    id: `steam-key-${g.id}`,
    app: 'steam',
    category: 'Ключи',
    title: `${g.name} — Steam Key`,
    subtitle: `Регион ${g.region}`,
    description: `Ключ активации ${g.name} в Steam. Активируется в регионе ${g.region}. Игра остаётся на вашем аккаунте навсегда.`,
    price: g.price, oldPrice: g.old, discount: Math.round(((g.old - g.price) / g.old) * 100),
    artGradient: grad(g.grad[0], g.grad[1]), artLabel: g.name.toUpperCase().slice(0, 18),
    rating: 5.0, reviews: 300 + Math.floor(Math.random() * 4000),
    seller: 'KeyMarket', sellerLevel: 'Top',
    priceColor: 'pink',
  })),
  {
    id: 'steam-dota-battle',
    app: 'steam',
    category: 'Dota 2',
    title: 'Dota 2 Battle Pass 2026',
    subtitle: 'Уровень 100',
    description: 'Прокачка Battle Pass до 100 уровня. Все награды, аркана и реликвии. Срок выполнения — 24 часа.',
    price: 2199,
    artGradient: grad('#a02323', '#4b1a1a'), artLabel: 'BATTLE PASS',
    rating: 4.9, reviews: 412, seller: 'DotaBoost', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  {
    id: 'steam-dota-rank',
    app: 'steam',
    category: 'Dota 2',
    title: 'Буст Dota 2: +1000 MMR',
    subtitle: 'Срок 7 дней',
    description: 'Профессиональный буст +1000 MMR на ваш аккаунт. Включаем VPN, стрим по запросу.',
    price: 5499, oldPrice: 6999, discount: 21,
    artGradient: grad('#a02323', '#251010'), artLabel: '+1000 MMR',
    rating: 4.9, reviews: 124, seller: 'DotaBoost', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'steam-acc-bundle',
    app: 'steam',
    category: 'Аккаунты',
    title: 'Steam аккаунт · 50+ игр',
    subtitle: 'Доступ к ААА-играм',
    description: 'Аккаунт с библиотекой 50+ игр (включая GTA V, RDR2, Witcher 3, Hollow Knight). Передача через смену почты, без бана.',
    price: 3499,
    artGradient: grad('#2a475e', '#66c0f4'), artLabel: '50+ GAMES',
    rating: 5.0, reviews: 56, seller: 'AccountsHub', sellerLevel: 'Pro',
    priceColor: 'green',
  },
];

const MINECRAFT: ProductSeed[] = [
  {
    id: 'mc-premium-account',
    app: 'minecraft',
    category: 'Аккаунты',
    title: 'Premium Minecraft аккаунт',
    subtitle: 'Java + Bedrock',
    description: 'Premium-аккаунт Minecraft Java + Bedrock. Доступ к серверам Hypixel и Mineplex. Полная привязка к почте, можно сменить ник и скин.',
    price: 549, oldPrice: 799, discount: 31,
    artGradient: grad('#5ab747', '#335a26'), artLabel: 'PREMIUM ACC',
    rating: 5.0, reviews: 3210, seller: 'MCStore', sellerLevel: 'Top', premium: true,
    priceColor: 'green',
  },
  {
    id: 'mc-bedrock-acc',
    app: 'minecraft',
    category: 'Аккаунты',
    title: 'Minecraft Bedrock аккаунт',
    subtitle: 'Только Bedrock',
    description: 'Bedrock-аккаунт со всеми DLC. Подходит для Xbox, PlayStation, Switch и Windows.',
    price: 449,
    artGradient: grad('#7a4f29', '#2a1808'), artLabel: 'BEDROCK',
    rating: 4.9, reviews: 421, seller: 'MCStore', sellerLevel: 'Top',
    priceColor: 'green',
  },
  {
    id: 'mc-acc-bundle',
    app: 'minecraft',
    category: 'Аккаунты',
    title: 'Bundle: Java + Bedrock + Migrator Cape',
    subtitle: 'Полный пакет',
    description: 'Лучшая комплектация: Java, Bedrock и эксклюзивный Migrator Cape. Полная передача владения.',
    price: 1099, oldPrice: 1499, discount: 27,
    artGradient: grad('#4b1a8c', '#5ab747'), artLabel: 'FULL BUNDLE',
    rating: 5.0, reviews: 264, seller: 'MCStore', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  ...[
    { d: 30, price: 299, label: 'REALMS 30D' },
    { d: 90, price: 749, label: 'REALMS 90D' },
    { d: 365, price: 2499, label: 'REALMS 1Y' },
  ].map((r): ProductSeed => ({
    id: `mc-realms-${r.d}`,
    app: 'minecraft',
    category: 'Realms',
    title: `Minecraft Realms — ${r.d === 365 ? '1 год' : `${r.d} дней`}`,
    subtitle: 'До 10 игроков',
    description: 'Постоянный сервер Minecraft Realms. Бэкапы каждые 24 часа, без необходимости держать ПК включённым.',
    price: r.price,
    artGradient: grad('#6cc358', '#2a8c2a'), artLabel: r.label,
    rating: 4.9, reviews: 200 + r.d, seller: 'MCStore', sellerLevel: 'Top',
    priceColor: 'green',
  })),
  ...[
    { rank: 'VIP', price: 599, old: 799 },
    { rank: 'VIP+', price: 999, old: 1399 },
    { rank: 'MVP', price: 1499, old: 1999 },
    { rank: 'MVP+', price: 1899, old: 2499 },
    { rank: 'MVP++', price: 2999, old: 3999 },
  ].map((r): ProductSeed => ({
    id: `mc-hypixel-${r.rank.toLowerCase().replace(/\+/g, 'plus')}`,
    app: 'minecraft',
    category: 'Hypixel',
    title: `Hypixel ${r.rank} ранг`,
    subtitle: r.rank === 'MVP++' ? '1 месяц' : 'Навсегда',
    description: `Ранг ${r.rank} на сервере Hypixel. Все косметические эффекты, бонусный опыт, доступ к закрытым лобби.`,
    price: r.price, oldPrice: r.old, discount: Math.round(((r.old - r.price) / r.old) * 100),
    artGradient: grad('#ffb547', '#c46c00'), artLabel: r.rank,
    rating: 5.0, reviews: 100 + Math.floor(Math.random() * 200),
    seller: 'HypixelRanks', sellerLevel: 'Pro',
    priceColor: r.rank === 'MVP+' ? 'pink' : 'green',
    premium: r.rank === 'MVP+',
  })),
  ...[320, 1020, 1720, 3500, 8000].map((amount): ProductSeed => ({
    id: `mc-coins-${amount}`,
    app: 'minecraft',
    category: 'Donate',
    title: `${amount.toLocaleString('ru-RU')} Minecoins`,
    subtitle: 'Bedrock Edition',
    description: 'Внутриигровая валюта Minecoins. Тратится в Marketplace на скины, миры, карты и текстур-паки.',
    price: Math.round(amount * 0.45),
    artGradient: grad('#ffd23a', '#c46c00'), artLabel: `${amount} COINS`,
    rating: 4.8, reviews: 150 + amount % 400, seller: 'MCStore', sellerLevel: 'Top',
    priceColor: 'green',
  })),
  {
    id: 'mc-skin-cape',
    app: 'minecraft',
    category: 'Скины',
    title: 'Migrator Cape + Skin pack',
    subtitle: 'Эксклюзивный плащ',
    description: 'Лимитированный Migrator Cape и набор из 5 премиальных скинов. Передача через смену почты.',
    price: 599,
    artGradient: grad('#4b1a8c', '#ff3f67'), artLabel: 'MIGRATOR CAPE',
    rating: 5.0, reviews: 162, seller: 'MCStore', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'mc-marketplace-bundle',
    app: 'minecraft',
    category: 'Скины',
    title: 'Marketplace pack · 10 миров',
    subtitle: 'Адвенчуры и мини-игры',
    description: 'Набор из 10 топовых миров с Marketplace: квесты, паркур, PvP-арены, моды.',
    price: 899,
    artGradient: grad('#3e8b2e', '#1a3a14'), artLabel: '10 WORLDS',
    rating: 4.7, reviews: 88, seller: 'MCStore', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  {
    id: 'mc-modpack-rlcraft',
    app: 'minecraft',
    category: 'Donate',
    title: 'Установка RLCraft + сервер 7 дней',
    subtitle: 'Сложный mod-pack',
    description: 'Установим RLCraft на ваш ПК, поднимем приватный сервер на 7 дней (до 6 игроков).',
    price: 1299,
    artGradient: grad('#6e4523', '#3a2210'), artLabel: 'RLCRAFT 7D',
    rating: 5.0, reviews: 41, seller: 'MCStore', sellerLevel: 'Pro',
    priceColor: 'green',
  },
];

const TELEGRAM: ProductSeed[] = [
  ...[
    { m: 1, price: 299, old: 449 },
    { m: 3, price: 699, old: 999 },
    { m: 6, price: 1299, old: 1899 },
    { m: 12, price: 2199, old: 3299 },
    { m: 24, price: 3999, old: 5999 },
  ].map((p): ProductSeed => ({
    id: `tg-premium-${p.m}`,
    app: 'telegram',
    category: 'Premium',
    title: `Telegram Premium · ${p.m === 1 ? '1 месяц' : p.m === 24 ? '2 года' : `${p.m} месяцев`}`,
    subtitle: p.m === 12 ? 'Лучшее предложение' : p.m === 24 ? 'Максимальная экономия' : 'Через подарок',
    description: `Подписка Telegram Premium на ${p.m} ${p.m === 1 ? 'месяц' : p.m < 5 ? 'месяца' : 'месяцев'}. Активация через официальный gift-механизм, без передачи аккаунта.`,
    price: p.price, oldPrice: p.old, discount: Math.round(((p.old - p.price) / p.old) * 100),
    artGradient: grad('#37bbfe', '#007dbb'), artLabel: `PREMIUM ${p.m}M`,
    rating: 5.0, reviews: 800 + p.m * 220,
    seller: 'TGShop', sellerLevel: 'Top',
    premium: p.m === 3 || p.m === 12,
    priceColor: 'green',
  })),
  ...[100, 500, 1000, 2500, 5000, 10000].map((n): ProductSeed => ({
    id: `tg-stars-${n}`,
    app: 'telegram',
    category: 'Stars',
    title: `${n.toLocaleString('ru-RU')} Telegram Stars`,
    subtitle: 'Зачисление за 5 минут',
    description: 'Внутренняя валюта Stars в Telegram. Тратится на цифровые товары, подписки и контент в Mini Apps.',
    price: Math.round(n * 1.15),
    artGradient: grad('#ffd23a', '#ff8e1a'), artLabel: `${n} ⭐`,
    rating: 5.0, reviews: 200 + n / 5, seller: 'StarsShop', sellerLevel: 'Pro',
    priceColor: 'green',
    premium: n === 1000,
  })),
  ...[
    { id: 'cobra', name: '@cobra', len: 5, price: 165, currency: 'TON' as ProductCurrency },
    { id: 'play', name: '@play', len: 4, price: 330, currency: 'TON' as ProductCurrency },
    { id: 'nft', name: '@nft', len: 3, price: 1000, currency: 'TON' as ProductCurrency },
    { id: 'shadow', name: '@shadow', len: 6, price: 60, currency: 'TON' as ProductCurrency },
    { id: 'kira', name: '@kira', len: 4, price: 265, currency: 'TON' as ProductCurrency },
    { id: 'mythic', name: '@mythic', len: 6, price: 45, currency: 'TON' as ProductCurrency },
  ].map((u): ProductSeed => ({
    id: `tg-username-${u.id}`,
    app: 'telegram',
    category: 'Юзернеймы',
    title: `Юзернейм ${u.name}`,
    subtitle: `${u.len} букв · Fragment`,
    description: 'Редкий юзернейм через Fragment. Полная передача владения, оплата по эскроу. Перевод 24 часа.',
    price: u.price,
    currency: u.currency,
    artGradient: grad('#1a1a2a', '#2f6dff'), artLabel: u.name,
    rating: 5.0, reviews: 4 + Math.floor(Math.random() * 30),
    seller: 'FragmentDealer', sellerLevel: 'Pro',
    premium: true,
    priceColor: 'pink',
  })),
  ...[50, 100, 500].map((n): ProductSeed => ({
    id: `tg-boost-${n}`,
    app: 'telegram',
    category: 'Boost канала',
    title: `Boost канала ×${n}`,
    subtitle: 'Любой канал · 1 год',
    description: `${n} бустов от уникальных аккаунтов на 1 год. Канал моментально откроет Premium-функции.`,
    price: n * 49, oldPrice: n * 65, discount: 25,
    artGradient: grad('#7a5cff', '#2f6dff'), artLabel: `BOOST ×${n}`,
    rating: 4.9, reviews: 80 + n / 2,
    seller: 'BoostHub', sellerLevel: 'Pro',
    priceColor: 'pink',
  })),
  ...[
    { id: 'plushpepe', name: 'Plush Pepe', price: 120, old: 165, rarity: 'Mythic', grad: ['#5ab747', '#2a8c2a'] },
    { id: 'durovscap', name: "Durov's Cap", price: 85, old: 120, rarity: 'Legendary', grad: ['#1a1a3a', '#2f6dff'] },
    { id: 'lolpop', name: 'Lol Pop', price: 10, old: 15, rarity: 'Rare', grad: ['#ff66cc', '#6a0e7a'] },
    { id: 'crystalball', name: 'Crystal Ball', price: 17, old: 23, rarity: 'Rare', grad: ['#7a5cff', '#3a1a8c'] },
    { id: 'magicpotion', name: 'Magic Potion', price: 13, old: 20, rarity: 'Rare', grad: ['#9b2aff', '#3a0a55'] },
    { id: 'heartlocket', name: 'Heart Locket', price: 30, old: 40, rarity: 'Epic', grad: ['#ff3f67', '#7a0a2a'] },
    { id: 'cookieheart', name: 'Cookie Heart', price: 6, old: 9, rarity: 'Common', grad: ['#c46c00', '#7a3a00'] },
    { id: 'bunny', name: 'Bunny Muffin', price: 9, old: 12, rarity: 'Rare', grad: ['#ffb547', '#c46c00'] },
  ].map((n): ProductSeed => ({
    id: `tg-nft-${n.id}`,
    app: 'telegram',
    category: 'NFT-подарки',
    title: `NFT · ${n.name}`,
    subtitle: `${n.rarity} · Fragment`,
    description: `NFT-подарок ${n.name} из коллекции Telegram. Передача через Fragment, эскроу на TON.`,
    price: n.price, oldPrice: n.old, discount: Math.round(((n.old - n.price) / n.old) * 100),
    currency: 'TON',
    artGradient: grad(n.grad[0], n.grad[1]), artLabel: n.name.toUpperCase(),
    rating: 5.0, reviews: 10 + Math.floor(Math.random() * 80),
    seller: 'FragmentDealer', sellerLevel: 'Pro',
    premium: true,
    priceColor: 'pink',
  })),
  {
    id: 'tg-gift-bundle',
    app: 'telegram',
    category: 'NFT-подарки',
    title: 'Подарочный набор · 5 NFT',
    subtitle: 'Случайные Rare+',
    description: 'Случайный набор из 5 NFT-подарков уровня Rare и выше. Шанс получить Epic — 30%.',
    price: 6999, oldPrice: 9999, discount: 30,
    artGradient: grad('#7a5cff', '#ff3f67'), artLabel: 'GIFT BOX ×5',
    rating: 4.9, reviews: 142, seller: 'FragmentDealer', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
];

const ROBLOX: ProductSeed[] = [
  ...[100, 400, 800, 1700, 4500, 10000].map((n): ProductSeed => ({
    id: `rb-robux-${n}`,
    app: 'roblox',
    category: 'Робуксы',
    title: `${n.toLocaleString('ru-RU')} Robux`,
    subtitle: n === 1700 ? 'Самый популярный пак' : n >= 4500 ? 'Большой пак' : 'Через GamePass',
    description: `Зачисление ${n} Robux через GamePass. Без передачи логина — нужен только ваш ник в Roblox.`,
    price: Math.round(n * 0.6),
    oldPrice: Math.round(n * 0.85),
    discount: 28,
    artGradient: grad('#2d5cff', '#1a3fc7'), artLabel: `${n} R$`,
    rating: 5.0, reviews: 500 + n,
    seller: 'RobuxStore', sellerLevel: 'Top',
    premium: n === 1700 || n === 400,
    priceColor: n === 1700 ? 'pink' : 'green',
  })),
  ...[450, 1000, 2200].map((tier): ProductSeed => ({
    id: `rb-premium-${tier}`,
    app: 'roblox',
    category: 'Premium',
    title: `Roblox Premium ${tier}`,
    subtitle: 'Месяц подписки',
    description: `Активация Roblox Premium ${tier} на ваш аккаунт. Подписка 30 дней + ${tier} Robux в подарок.`,
    price: Math.round(tier * 1.2),
    artGradient: grad('#2d5cff', '#00aaff'), artLabel: `PREMIUM ${tier}`,
    rating: 4.9, reviews: 400 + tier / 3, seller: 'RobuxStore', sellerLevel: 'Top',
    priceColor: 'green',
  })),
  ...[
    { id: 'unicorn', name: 'Mythic Unicorn Pet', game: 'Adopt Me', price: 3, old: 5 },
    { id: 'shadow-dragon', name: 'Shadow Dragon Pet', game: 'Adopt Me', price: 8, old: 12 },
    { id: 'frost-dragon', name: 'Frost Dragon Pet', game: 'Adopt Me', price: 6, old: 10 },
    { id: 'queen-bee', name: 'Queen Bee Pet', game: 'Adopt Me', price: 4, old: 6 },
    { id: 'evil-unicorn', name: 'Evil Unicorn Pet', game: 'Adopt Me', price: 9, old: 14 },
  ].map((p): ProductSeed => ({
    id: `rb-${p.id}`,
    app: 'roblox',
    category: 'Предметы',
    title: p.name,
    subtitle: `${p.game} · Mythic`,
    description: `Мифический питомец ${p.name} для ${p.game}. Передача через торг внутри игры, помощь гаранта 24/7.`,
    price: p.price, oldPrice: p.old, discount: Math.round(((p.old - p.price) / p.old) * 100),
    currency: 'USDT',
    artGradient: grad('#5a1aff', '#b51aff'), artLabel: p.name.toUpperCase().slice(0, 18),
    rating: 5.0, reviews: 500 + Math.floor(Math.random() * 6000),
    seller: 'AdoptMeTrade', sellerLevel: 'Pro',
    premium: true,
    priceColor: 'pink',
  })),
  ...[
    { id: 'leopard', name: 'Leopard', price: 1499 },
    { id: 'dragon', name: 'Dragon', price: 1299 },
    { id: 'buddha', name: 'Buddha', price: 899 },
    { id: 'dough', name: 'Dough', price: 1199 },
  ].map((f): ProductSeed => ({
    id: `rb-bloxfruits-${f.id}`,
    app: 'roblox',
    category: 'Game Pass',
    title: `Blox Fruits — ${f.name}`,
    subtitle: 'Permanent Fruit',
    description: `Перманентный фрукт ${f.name} для Blox Fruits. Передача через торговое меню внутри игры.`,
    price: f.price,
    artGradient: grad('#ffb547', '#c46c00'), artLabel: f.name.toUpperCase(),
    rating: 4.9, reviews: 200 + Math.floor(Math.random() * 600),
    seller: 'BFTrader', sellerLevel: 'Pro',
    priceColor: 'green',
  })),
  {
    id: 'rb-petsim-gems',
    app: 'roblox',
    category: 'Donate',
    title: '5 000 Diamonds · Pet Simulator',
    subtitle: 'Мгновенная выдача',
    description: 'Внутриигровые алмазы Pet Simulator 99. Зачисление через торг.',
    price: 599,
    artGradient: grad('#37bbfe', '#1a3fc7'), artLabel: '5K DIAMONDS',
    rating: 4.8, reviews: 188, seller: 'BFTrader', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  {
    id: 'rb-jailbreak-cash',
    app: 'roblox',
    category: 'Donate',
    title: '5 000 000 Cash · Jailbreak',
    subtitle: 'Самая выгодная пачка',
    description: 'Зачисление 5 миллионов игровой валюты в Roblox Jailbreak. Без передачи аккаунта.',
    price: 449,
    artGradient: grad('#1f7ad8', '#0e2a55'), artLabel: '5M CASH',
    rating: 4.7, reviews: 121, seller: 'BFTrader', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  {
    id: 'rb-acc-rich',
    app: 'roblox',
    category: 'Аккаунты',
    title: 'Roblox аккаунт с лимитками',
    subtitle: 'Dominus + Valkyrie',
    description: 'Аккаунт с редкими лимитированными предметами (Dominus, Valkyrie Helm). Полная привязка к новой почте.',
    price: 19999, oldPrice: 29999, discount: 33,
    artGradient: grad('#3a0a55', '#0a0a1a'), artLabel: 'LIMITED ACC',
    rating: 5.0, reviews: 18, seller: 'AccountsHub', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
];

const BRAWL: ProductSeed[] = [
  ...[30, 80, 170, 360, 950, 2000].map((n): ProductSeed => ({
    id: `bs-gems-${n}`,
    app: 'brawl',
    category: 'Гемы',
    title: `${n} гемов`,
    subtitle: n === 360 ? 'Хит продаж' : n === 30 ? 'Стартовый набор' : n >= 950 ? 'Большой пак' : 'Популярный',
    description: `Зачисление ${n} гемов на ваш Supercell ID. Скорость 5–15 минут, без передачи аккаунта.`,
    price: Math.round(n * 3.2 + 80),
    oldPrice: n >= 170 ? Math.round(n * 4.5) : undefined,
    discount: n >= 170 ? 28 : undefined,
    artGradient: grad('#ff5d3a', '#c41818'), artLabel: `${n} GEMS`,
    rating: 5.0, reviews: 500 + n * 8,
    seller: 'BrawlShop', sellerLevel: 'Top',
    premium: n === 360 || n === 950,
    priceColor: n === 360 ? 'pink' : 'green',
  })),
  {
    id: 'bs-pass',
    app: 'brawl',
    category: 'Brawl Pass',
    title: 'Brawl Pass · текущий сезон',
    subtitle: 'Все награды сезона',
    description: 'Активация Brawl Pass с эксклюзивным скином, гемами и пинами. Передача через Supercell ID.',
    price: 449,
    artGradient: grad('#7a5cff', '#ff5d3a'), artLabel: 'BRAWL PASS',
    rating: 5.0, reviews: 2310, seller: 'BrawlShop', sellerLevel: 'Top', premium: true,
    priceColor: 'green',
  },
  {
    id: 'bs-pass-plus',
    app: 'brawl',
    category: 'Brawl Pass',
    title: 'Brawl Pass+',
    subtitle: 'Премиум-трек',
    description: 'Brawl Pass+ — двойные гемы, эксклюзивные пины, повышенный кредит-кэп.',
    price: 899, oldPrice: 1199, discount: 25,
    artGradient: grad('#ffd23a', '#ff5d3a'), artLabel: 'PASS+',
    rating: 5.0, reviews: 644, seller: 'BrawlShop', sellerLevel: 'Top',
    priceColor: 'pink',
  },
  {
    id: 'bs-stardrop-mini',
    app: 'brawl',
    category: 'Star Drop',
    title: '5 Star Drop · Rare+',
    subtitle: 'Гарантия Rare',
    description: '5 Star Drop с гарантированным выпадением минимум Rare. Шанс Mythic — 15%.',
    price: 599,
    artGradient: grad('#ffb547', '#c46c00'), artLabel: '5× STAR DROP',
    rating: 4.8, reviews: 322, seller: 'BrawlShop', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  {
    id: 'bs-stardrop-mega',
    app: 'brawl',
    category: 'Star Drop',
    title: '20 Star Drop · Mega Pack',
    subtitle: 'Гарантия Mythic',
    description: '20 Star Drop с гарантированным минимум Mythic в наборе. Шанс Legendary — 40%.',
    price: 2199, oldPrice: 2999, discount: 27,
    artGradient: grad('#7a5cff', '#ff3f67'), artLabel: '20× MEGA',
    rating: 5.0, reviews: 188, seller: 'BrawlShop', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'bs-coins-5000',
    app: 'brawl',
    category: 'Гемы',
    title: '5 000 монет',
    subtitle: 'Прокачка бойцов',
    description: 'Внутриигровые монеты для прокачки бойцов. Зачисление за 10 минут.',
    price: 449,
    artGradient: grad('#ffd23a', '#c46c00'), artLabel: '5K COINS',
    rating: 4.8, reviews: 188, seller: 'BrawlShop', sellerLevel: 'Top',
    priceColor: 'green',
  },
  {
    id: 'bs-power-points',
    app: 'brawl',
    category: 'Гемы',
    title: '2 000 Power Points',
    subtitle: 'Бустер прокачки',
    description: 'Очки силы для прокачки конкретного бойца. Зачисление через подарок.',
    price: 349,
    artGradient: grad('#ff5d3a', '#7a0a0a'), artLabel: '2K POWER',
    rating: 4.7, reviews: 144, seller: 'BrawlShop', sellerLevel: 'Pro',
    priceColor: 'green',
  },
  ...[
    { trophies: 5000, price: 8200, old: 12100 },
    { trophies: 15000, price: 19200, old: 27500 },
    { trophies: 30000, price: 35700, old: 49500 },
    { trophies: 50000, price: 82500, old: 110000 },
  ].map((a): ProductSeed => ({
    id: `bs-acc-${a.trophies / 1000}k`,
    app: 'brawl',
    category: 'Аккаунты',
    title: `Аккаунт · ${a.trophies.toLocaleString('ru-RU')} трофеев`,
    subtitle: a.trophies >= 30000 ? 'Все бойцы открыты' : 'С набором легендарных',
    description: `Прокачанный аккаунт Brawl Stars: ${a.trophies.toLocaleString('ru-RU')} трофеев, открыто большинство бойцов, полная привязка к новой почте.`,
    price: a.price, oldPrice: a.old, discount: Math.round(((a.old - a.price) / a.old) * 100),
    currency: 'KZT',
    artGradient: grad('#ffd23a', '#c41818'), artLabel: `${a.trophies / 1000}K TROPH`,
    rating: 5.0, reviews: 30 + a.trophies / 1000,
    seller: 'AccountsHub', sellerLevel: 'Pro',
    premium: true,
    priceColor: 'pink',
  })),
  {
    id: 'bs-legendary-stu',
    app: 'brawl',
    category: 'Скины',
    title: 'Открытие легендарного бойца Stu',
    subtitle: 'Гарантия выпадения',
    description: 'Открываем легендарного бойца Stu (или Chester / Sandy) на ваш аккаунт через Star Drop-фарм.',
    price: 1799, oldPrice: 2499, discount: 28,
    artGradient: grad('#7a5cff', '#3a0a55'), artLabel: 'LEGENDARY',
    rating: 4.9, reviews: 88, seller: 'BrawlShop', sellerLevel: 'Pro',
    priceColor: 'pink',
  },
  {
    id: 'bs-skin-pack',
    app: 'brawl',
    category: 'Скины',
    title: 'Пакет 5 скинов на выбор',
    subtitle: 'Эпические и редкие',
    description: 'Любые 5 скинов из каталога Brawl Stars (включая эпические). Зачисление 1–2 дня.',
    price: 1999,
    artGradient: grad('#ff66cc', '#c41818'), artLabel: '5 SKINS',
    rating: 5.0, reviews: 132, seller: 'BrawlShop', sellerLevel: 'Pro',
    priceColor: 'green',
  },
];

// Default tags inferred from category — products can still override.
function defaultTagsFor(p: ProductSeed): Tag[] {
  const cat = p.category.toLowerCase();
  if (cat.includes('nft')) return ['nft', 'items'];
  if (cat === 'аккаунты') return ['accounts'];
  if (cat === 'ключи') return ['keys'];
  if (cat === 'premium' || cat === 'realms' || cat === 'brawl pass' || cat === 'hypixel') return ['subscription'];
  if (cat === 'предметы' || cat === 'скины' || cat === 'юзернеймы') return ['items'];
  return ['donate'];
}

const TAG_OVERRIDES: Record<string, Tag[]> = {
  'steam-dota-battle': ['donate', 'subscription'],
  'tg-username-cobra': ['items'],
  'tg-username-play': ['items'],
  'tg-username-nft': ['items', 'nft'],
};

const SEED: ProductSeed[] = [
  ...STEAM,
  ...MINECRAFT,
  ...TELEGRAM,
  ...ROBLOX,
  ...BRAWL,
];

export const PRODUCTS: Product[] = SEED.map((p) => ({
  ...p,
  tags: TAG_OVERRIDES[p.id] ?? defaultTagsFor(p),
}));

export function productsByApp(app: AppId): Product[] {
  return allProducts().filter((p) => p.app === app);
}

export function productsByTag(tag: Tag): Product[] {
  if (tag === 'nft') return [];
  return allProducts().filter((p) => p.tags.includes(tag));
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allProducts().filter((p) => {
    const hay = `${p.id} ${p.title} ${p.subtitle} ${p.description} ${p.category} ${p.app}`.toLowerCase();
    return hay.includes(q);
  });
}

export function getProduct(id: string): Product | undefined {
  const product = allProducts().find((p) => p.id === id);
  if (!product) return undefined;
  if (product.reviewItems?.length) return product;
  const reviewItems = generateReviews(product.id, 3 + (product.id.length % 3), 3, 5);
  return {
    ...product,
    reviewItems,
    rating: averageRating(reviewItems),
    reviews: reviewItems.length,
  };
}

export function premiumProducts(): Product[] {
  const products = allProducts();
  const marketplace = products.filter((p) => p.source === 'deal' || p.source === 'admin');
  const seedPremium = products.filter((p) => p.premium && p.source !== 'deal' && p.source !== 'admin');
  return [...marketplace, ...seedPremium].slice(0, 24);
}

export function allProducts(): Product[] {
  if (typeof window === 'undefined') return PRODUCTS.filter((p) => !p.tags.includes('nft'));
  try {
    // Admin-curated products/sellers come from the shared (server-backed) cache
    // so they appear on every device, not only where they were created.
    const adminProducts = listAdminProducts();
    const sellers = listAdminSellers();
    const mapped = adminProducts.map((p: any): Product => {
      const seller = sellers.find((s: any) => s.id === p.sellerId);
      const reviewItems = seller?.reviews?.length ? seller.reviews : generateReviews(p.sellerId || p.id, 5, 3, 5);
      const rating = averageRating(reviewItems);
      return {
        id: p.id,
        app: p.app,
        category: p.category,
        title: p.title,
        subtitle: seller?.description || p.category,
        description: p.description,
        price: p.price,
        currency: p.currency ?? 'RUB',
        artGradient: 'linear-gradient(135deg, #2a7de1, #37bbfe)',
        artLabel: String(p.title).slice(0, 18).toUpperCase(),
        rating,
        reviews: reviewItems.length,
        seller: seller?.name || 'Playerok Seller',
        sellerLevel: 'Pro',
        premium: true,
        priceColor: 'green',
        tags: ['items'],
        image: p.image,
        source: 'admin',
        sellerId: p.sellerId,
        reviewItems,
      };
    });
    // Marketplace listings come from the shared (server-backed) deal cache so
    // they show up across devices, not just where they were created.
    const deals = listApprovedDeals();
    const dealProducts = deals
      .filter((d) => d.status !== 'closed')
      .map((d): Product | null => {
        const app = APPS.find((a) => a.name === d.category || a.defaultCategory === d.category);
        if (!app) return null;
        const reviewItems = generateReviews(d.id, 3 + (d.id.charCodeAt(0) % 3), 3, 5);
        return {
          id: `deal-${d.id}`,
          app: app.id,
          category: d.category,
          title: d.title,
          subtitle: d.sellerName ? `от ${d.sellerName}` : app.name,
          description: d.description,
          price: d.price,
          currency: d.currency as ProductCurrency,
          artGradient: app.gradient,
          artLabel: String(d.title).slice(0, 18).toUpperCase(),
          rating: averageRating(reviewItems),
          reviews: reviewItems.length,
          seller: d.sellerName || 'Playerok Seller',
          sellerLevel: 'New',
          premium: true,
          priceColor: 'green',
          tags: ['items'],
          image: d.photo,
          source: 'deal',
          reviewItems,
        };
      })
      .filter(Boolean) as Product[];
    return [...dealProducts, ...mapped, ...PRODUCTS.filter((p) => !p.tags.includes('nft'))];
  } catch {
    return PRODUCTS.filter((p) => !p.tags.includes('nft'));
  }
}

export const PAYOUT_METHODS = ['sbp', 'ton', 'usdt', 'btc', 'card'] as const;
export type PayoutId = (typeof PAYOUT_METHODS)[number];
