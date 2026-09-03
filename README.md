# Playerok OTC — Telegram Mini App & Bot

Premium-looking **OTC escrow marketplace** Telegram Mini App
(Playerok-inspired) with a light/dark theme and a Python Telegram bot that
opens it.

> ⚠️ Project name is `Playerok OTC` for branding/style only. This repository
> is an independent demo / template and is **not** affiliated with or
> endorsed by the official Playerok service.

```
.
├── miniapp/   # Vite + React + TypeScript Mini App
├── bot/       # python-telegram-bot launcher
└── README.md
```

## Supported apps (only five)

The whole app is built around exactly these five marketplaces:

- **Steam** — пополнение, ключи, аккаунты (CS2 / Dota 2)
- **Minecraft** — аккаунты, Realms, Hypixel-ранги, Minecoins
- **Telegram** — Premium, Stars, юзернеймы, бусты каналов
- **Roblox** — робуксы, Premium, лимитированные предметы, game pass
- **Brawl Stars** — гемы, Brawl Pass, аккаунты, скины

Brand icons are rendered as inline SVG so they stay crisp at any DPR and don't
depend on external image hosts.

### Use your own icons (no code changes required)

Each app tile auto-detects a custom raster file at one of:

- `miniapp/public/apps/steam.png` (or `.jpg`, `.jpeg`, `.webp`)
- `miniapp/public/apps/minecraft.png`
- `miniapp/public/apps/telegram.png`
- `miniapp/public/apps/roblox.png`
- `miniapp/public/apps/brawl.png`

If a file with one of those names exists, it is used as the tile artwork
instead of the bundled SVG. To upload via GitHub web:

1. Open the repo → `miniapp/public/apps/`.
2. Press **Add file → Upload files**.
3. Drag your PNG/JPG. **Rename it before uploading** so the filename matches
   exactly (e.g. `brawl.png`).
4. Commit. Vercel rebuilds automatically; the tile picks up the new image
   on the next load.

Recommended: square images 256×256 or larger, transparent background or
already coloured the way you want — they're rendered with `object-fit: cover`
inside a rounded tile.

## Screens (separate routes — not one long page)

| Route                | Screen                                                                                  |
|----------------------|-----------------------------------------------------------------------------------------|
| `/`                  | Главная: лого, поиск, чипы категорий, Steam top-up с логином, игры, премиум-сетка       |
| `/app/:appId`        | Страница приложения: hero, табы по категориям, сетка товаров                            |
| `/product/:id`       | Карточка товара: hero, описание, продавец, баланс, поле Steam-логина, кнопка «Купить»   |
| `/sell`              | Продать: баннер, табы, калькулятор комиссии, способы выплаты                            |
| `/terms`             | Условия продажи: чек-листы и gated кнопка                                               |
| `/create`            | 3-шаговый wizard: приложение → название/фото → цена/описание                            |
| `/profile`           | Профиль: статы, баланс с «+», быстрые действия, мои сделки                              |
| `/topup`             | Пополнение баланса: пресеты сумм + 6 способов (СБП, карта, TON, USDT, BTC, YooMoney)    |
| `/chats`             | Один чат — поддержка с реальным вводом, авто-ответами и persistence                     |
| `/deal/:id`          | Карточка созданной сделки (для продавца) + buyer-ссылка                                 |
| `/buyer/:id`         | Покупательский экран с оплатой через баланс                                             |

## Theme

- **Светлая тема включена по умолчанию.**
- Переключатель в правом верхнем углу главной (солнышко ↔ луна) меняет тему
  и сохраняет выбор в `localStorage`. Toggle также пробрасывает цвет хедера в
  Telegram через `Telegram.WebApp.setHeaderColor`.
- Тема — это набор CSS-переменных под `:root[data-theme="light|dark"]`, без
  пересборки и без сторонних UI-китов.

## Покупки и баланс

- Кошелёк хранится в `localStorage` под ключом `playerok-otc:balance`.
- На странице товара кнопка «Купить»:
  - если хватает баланса → списываем и показываем «Заказ оформлен, ожидайте
    подтверждения администратора», ведём в чат поддержки;
  - если не хватает → bottom-sheet «Недостаточно средств. Пополните баланс»
    с кнопкой, ведущей на `/topup`;
  - для товаров Steam ниже формы есть отдельный блок «Логин Steam для
    зачисления» — без него кнопка покупки disabled.
- `/topup` позволяет ввести произвольную сумму или выбрать пресет (500 / 1 000
  / 2 000 / 5 000 ₽) и метод (СБП / карта / TON / USDT / BTC / YooMoney).

## Чат поддержки

- Один диалог в разделе «Чаты» — поддержка.
- Реальный input, авто-ответы со словарём (баланс, отмена, Steam, привет и т.д.),
  индикатор онлайн, сохранение истории в `localStorage`.

## Design tokens

- Светлая база: `#f3f4f8`, карточки `#ffffff`, текст `#0f1119/#6b6f80`.
- Тёмная база: `#101116/#111219`, карточки `#1f2029/#252633`, текст
  `#f4f6ff/#8f919d`.
- Акценты: `#2f6dff` синий, градиент `linear-gradient(135deg, #2f6dff, #12c8ef)`,
  `#18c874` зелёный, `#ff3f67` розовый, `#ffb547` жёлтый.
- Скругления 12–32 px, glass bottom-nav с `backdrop-filter: blur(22px) saturate(160%)`.

## Запуск Mini App локально

```bash
cd miniapp
npm install
npm run dev          # http://localhost:5173

# или production-сборка
npm run build
npm run preview      # http://localhost:4173
```

Открывается как обычный SPA в браузере. Внутри Telegram автоматически
подхватывает `window.Telegram.WebApp` для expand и цвета хедера.

## Запуск бота

```bash
cd bot
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # вписать BOT_TOKEN и HTTPS MINI_APP_URL
python bot.py
```

`/start` показывает приветствие с кнопками:

- 🚀 **Открыть Mini App** (открывает `MINI_APP_URL` как `web_app`)
- 🧾 **Создать сделку** (`MINI_APP_URL/#/sell`)
- 💬 **Поддержка** (использует `SUPPORT_USERNAME`)

## Деплой Mini App

- Любой статический хост с HTTPS: Vercel, Netlify, Cloudflare Pages.
- Для Vercel: Import Git Repository → **Root Directory = `miniapp`** →
  framework `Vite` определится автоматически.
- Локально для теста в Telegram: `npm run preview` + туннель
  (`ngrok http 4173` или `cloudflared tunnel --url http://localhost:4173`).

### Синхронизация с бэкендом (важно!)

Mini App получает баланс, валюту, заявки на пополнение и т.д. через API
бэкенда (`bot.py` Flask). Чтобы связать их:

1. Задать переменную `VITE_BOT_API_URL` = URL твоего Flask-бэкенда
   (например `https://playerok-bot.onrender.com`).
2. На Vercel: **Settings → Environment Variables →** добавить
   `VITE_BOT_API_URL` = тот же URL → Redeploy.
3. Локально: скопировать `.env.example` в `.env` и вписать URL.

Без этой переменной мини-апп работает только на `localStorage` и не
синхронизируется с ботом.

## License

MIT — делайте что хотите, но не выдавайте за официальный Playerok.
