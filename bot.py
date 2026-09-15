import os
import sys
import uuid
import json
import html
import sqlite3
import logging
import asyncio
import traceback
from datetime import datetime
from typing import List, Dict, Any

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto, InputMediaAnimation, WebAppInfo
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    filters, CallbackQueryHandler, ContextTypes,
)

from flask import Flask, request, jsonify
import threading
import hmac
import hashlib
from urllib.parse import parse_qsl

# ════════════════════════════════════════════════════════════════
#  КОНФИГУРАЦИЯ
# ════════════════════════════════════════════════════════════════

# Перед запуском замените плейсхолдеры на свои значения или задайте env-переменные.
BOT_TOKEN   = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN")
ADMIN_ID_1  = int(os.environ.get("ADMIN_ID_1", "123456789"))
ADMIN_ID_2  = int(os.environ.get("ADMIN_ID_2", "987654321"))
ADMIN_IDS   = [ADMIN_ID_1, ADMIN_ID_2]
SUPPORT_LINK = os.environ.get("SUPPORT_LINK", "https://t.me/PlayerokOperator")
MINI_APP_URL = os.environ.get("MINI_APP_URL", "https://example.com")
DB_NAME      = os.environ.get("DB_NAME", "escrow.db")
LOG_CHAT_ID  = int(os.environ.get("LOG_CHAT_ID", "-1001234567890"))
BOT_USERNAME = os.environ.get("BOT_USERNAME", "YOUR_BOT_USERNAME")

# Premium emoji IDs (все 24, как в списке)
E1   = "5118861066981344121"  # 1) главное меню Playerok Escrow · Official OTC Platform
E2   = "5116414868357907335"  # 2) раздел пайментс возле надписи о методе
E3   = "5134438483867206614"  # 3) на кнопке валюта
E4   = "5974127250482664684"  # 4) заголовок "Сделка завершена"
E5   = "5944970130554359187"  # 5) заголовок раздела рефералов
E6   = "5105268517691720533"  # 6) на кнопке языки
E7   = "5931409969613116639"  # 7) в главном меню "Why choose us?"
E8   = "5447639215762338499"  # 8) в разделе валюты на кнопке биткоин
E9   = "5447256718859857516"  # 9) в том же разделе на кнопке эфириум
E10  = "5447347943965223543"  # 10) на кнопке юсдт
E11  = "5447281075619394817"  # 11) на кнопке пайментс
E12  = "4956479975701086972"  # 12) на кнопке отмена
E13  = "4958798308853154790"  # 13) на кнопке назад
E14  = "6032594876506312598"  # 14) на кнопке рефералы
E15  = "5776023601941582822"  # 15) в разделе валюта на кнопке тон
E16  = "5172893417717367746"  # 16) на кнопке поддержка/саппорт
E17  = "4904882772637648609"  # 17) Please wait for processing
E18  = "5935913431801532272"  # 18) в разделе баланс возле надписи рейтинг
E19  = "6028338546736107668"  # 19) в разделе баланс возле надписи ранк
E20  = "4904848288345228262"  # 20) в разделе баланс возле надписи Профиль
E21  = "5963213811597970978"  # 21) на кнопке создать сделку
E22  = "5811989245761426317"  # 22) на кнопке баланс
E23  = "5891243564309942507"  # 23) поддержка/саппорт в тексте
E24  = "5121007227779416740"  # 24) не указано

# Дополнительные emoji ID
E25  = "5902206159095339799"  # 25) профиль: строка баланса
E26  = "5931472654660800739"  # 26) профиль: кол-во сделок
E27  = "5967390100357648692"  # 27) профиль: всего потрачено / сумма в deal_card
E28  = "6032636795387121097"  # 28) профиль: комиссия
E29  = "5807465992363710697"  # 29) кошелёк: строка адреса
E30  = "5778423822940114949"  # 30) сделка: ID
E31  = "5967456680940671207"  # 31) сделка: описание / забрать товар
E32  = "5769126056262898415"  # 32) сделка: сумма / списание средств
E33  = "4916086774649848789"  # 33) ссылка покупателя/реферала
E34  = "5956561916573782596"  # 34) отправить ссылку / товар доставлен
E35  = "5123163417326126159"  # 35) оплата успешна / подтверждено
E36  = "5832546462478635761"  # 36) Escrow Deal заголовок / ожидание
E37  = "6034923938486684992"  # 37) Seller rank
E38  = "6034962180875490251"  # 38) Funds will be locked
E39  = "5447349090721494272"  # 39) на кнопке TRX/TRC20
E40  = "5927169041595634481"  # 40) на кнопке CNY
E41  = "6030848053177486888"  # 41) на кнопке FAQ
E42  = "5445175979003639136"  # 42) на кнопке Litecoin
E43  = "5447420464488018543"  # 43) на кнопке Solana
E44  = "5776233299424843260"  # 44) заголовок "Добро пожаловать"
E45  = "6037083366438737901"  # 45) "Безопасный гарант-бот"
E46  = "5983580310292402968"  # 46) "Поддержка 24/7"
E47  = "5938492039971737551"  # 47) "Как происходит сделка"
E48  = "5904630315946611415"  # 48) заголовок профиля
E49  = "6048390817033228573"  # 49) attach_prompt (фото/видео к сделке)
E50  = "5879841310902324730"  # 50) enter_description (описание сделки)
E51  = "5307693646361939359"  # 51) кнопка «Пропустить»

E52  = "5201923178980460315"  # 52) premium emoji на кнопку RUB
E53  = "5204381416397222912"  # 53) premium emoji на кнопку KZT

E_CARD = "5424976816530014958"  # premium emoji на кнопку «Банковская карта»

# Медиа-файлы для разделов
MENU_PHOTO_ID      = os.environ.get("MENU_PHOTO_ID",      "YOUR_MENU_PHOTO_OR_ANIMATION_FILE_ID")
# Premium emoji shown on the "Playerok App" mini-app button.
MINI_APP_EMOJI_ID  = "5931415565955503486"
PROFILE_PHOTO_ID   = os.environ.get("PROFILE_PHOTO_ID",   "YOUR_PROFILE_PHOTO_FILE_ID")
LANG_PHOTO_ID      = os.environ.get("LANG_PHOTO_ID",      "YOUR_LANG_PHOTO_FILE_ID")
FAQ_PHOTO_ID       = os.environ.get("FAQ_PHOTO_ID",       "YOUR_FAQ_PHOTO_FILE_ID")
CURRENCY_PHOTO_ID  = os.environ.get("CURRENCY_PHOTO_ID",  "YOUR_CURRENCY_PHOTO_FILE_ID")
REFERRAL_PHOTO_ID  = os.environ.get("REFERRAL_PHOTO_ID",  "YOUR_REFERRAL_PHOTO_FILE_ID")
# Раздел «Кошелёк» и «Вывести» используют разные фото.
WALLET_PHOTO_ID    = os.environ.get("WALLET_PHOTO_ID",    "YOUR_WALLET_PHOTO_FILE_ID")
WITHDRAW_PHOTO_ID  = os.environ.get("WITHDRAW_PHOTO_ID",  "YOUR_WITHDRAW_PHOTO_FILE_ID")
# Фото для шагов создания сделки и экрана «нет реквизитов».
NO_REQ_PHOTO_ID       = os.environ.get("NO_REQ_PHOTO_ID",       "YOUR_NO_REQUISITES_PHOTO_FILE_ID")
AMOUNT_PHOTO_ID       = os.environ.get("AMOUNT_PHOTO_ID",       "YOUR_AMOUNT_PHOTO_FILE_ID")
ATTACH_PHOTO_ID       = os.environ.get("ATTACH_PHOTO_ID",       "YOUR_ATTACH_PHOTO_FILE_ID")
DESC_PHOTO_ID         = os.environ.get("DESC_PHOTO_ID",         "YOUR_DESCRIPTION_PHOTO_FILE_ID")
DEAL_CREATED_PHOTO_ID = os.environ.get("DEAL_CREATED_PHOTO_ID", "YOUR_DEAL_CREATED_PHOTO_FILE_ID")

CURRENCIES = {
    "TON":  {"name": "TON",       "symbol": "💎", "emoji": E15},
    "USDT": {"name": "USDT",      "symbol": "💵", "emoji": E10},
    "BTC":  {"name": "BTC",       "symbol": "🟠", "emoji": E8},
    "ETH":  {"name": "ETH",       "symbol": "🔷", "emoji": E9},
    "TRX":  {"name": "TRX (TRON)", "symbol": "🔺", "emoji": E39},
    "CNY":  {"name": "CNY",       "symbol": "💴", "emoji": E40},
    "RUB":  {"name": "RUB",       "symbol": "₽", "fallback": "💰", "emoji": E52},
    "KZT":  {"name": "KZT",       "symbol": "₸", "fallback": "💰", "emoji": E53},
    "USD":  {"name": "USD",       "symbol": "$", "emoji": None},
    "STARS": {"name": "Stars",    "symbol": "⭐", "fallback": "⭐", "emoji": None},
}

def currency_icon(currency: str) -> str:
    cur = (currency or "TON").upper()
    return CURRENCIES.get(cur, CURRENCIES["TON"]).get("emoji")

def currency_plain(currency: str) -> str:
    cur = (currency or "TON").upper()
    return CURRENCIES.get(cur, {"name": cur})["name"]

def currency_label(currency: str, *, bold: bool = False) -> str:
    """HTML label with the same premium emoji used on the currency button."""
    cur = (currency or "TON").upper()
    data = CURRENCIES.get(cur, {"name": cur, "symbol": "💱", "emoji": None})
    name = data["name"]
    emoji_id = data.get("emoji")
    fallback = data.get("fallback") or data["symbol"]
    icon = f'<tg-emoji emoji-id="{emoji_id}">{fallback}</tg-emoji>' if emoji_id else data["symbol"]
    return f"{icon} <b>{name}</b>" if bold else f"{icon} {name}"


def normalize_currency(currency: str, default: str = "TON") -> str:
    cur = (currency or default).upper()
    return cur if cur in CURRENCIES else default

RATES = {
    # Internal conversion base is RUB. The exact values are static project
    # rates; the important part is that bot.py and the mini-app use one model.
    "RUB":  1.0,
    "TON":  150.0,
    "USDT": 105.0,
    "BTC":  6_000_000.0,
    "ETH":  330_000.0,
    "TRX":  30.0,
    "CNY":  12.0,
    "KZT":  1 / 5.5,
    "USD":  100.0,
    "STARS": 1.5,
}

# ── Wallet networks ──────────────────────────────────────────────
WALLET_NETWORKS = {
    "TON":      "TON",
    "TRC20":    "TRC20 (TRON)",
    "BEP20":    "BEP20 (BSC)",
    "ERC20":    "ERC20 (ETH)",
    "BTC":      "Bitcoin",
    "SOL":      "Solana",
    "LTC":      "Litecoin",
    "telegram": "Telegram Stars ⭐",
}

# Currencies that use a bank card (card number + holder name) instead of a
# crypto wallet. Everything else uses a per-network crypto wallet.
BANK_CURRENCIES = {"RUB", "KZT"}

# Which network each currency uses for wallet lookup
CURRENCY_NETWORK = {
    "TON":  "TON",
    "USDT": "TRC20",   # default for USDT; user can pick any
    "BTC":  "BTC",
    "ETH":  "ERC20",
    "TRX":  "TRC20",
    "CNY":  "TRC20",   # fiat без карты → крипто-реквизит (по умолчанию USDT/TRC20)
    "RUB":  "bank",
    "KZT":  "bank",
    "USD":  "TRC20",
    "STARS": "telegram",
}

# Networks that are acceptable for a given currency's crypto requisite.
# USDT is multi-chain, so any of these satisfies a USDT deal/withdrawal.
CURRENCY_NETWORKS_OK = {
    "USDT": {"TRC20", "BEP20", "ERC20"},
}

def networks_for_currency(currency: str) -> set:
    cur = normalize_currency(currency)
    if cur in CURRENCY_NETWORKS_OK:
        return CURRENCY_NETWORKS_OK[cur]
    net = CURRENCY_NETWORK.get(cur)
    return {net} if net else set()

def convert(amount: float, from_cur: str, to_cur: str) -> float:
    from_cur = (from_cur or "TON").upper()
    to_cur = (to_cur or "TON").upper()
    if from_cur == to_cur:
        return amount
    return amount * RATES[from_cur] / RATES[to_cur]

TOPUP_METHOD_CURRENCY = {
    "sbp": "RUB",
    "card": "RUB",
    "kaspi": "KZT",
    "ton": "TON",
    "usdt": "USDT",
    "btc": "BTC",
    "stars": "STARS",
}

# ════════════════════════════════════════════════════════════════
#  ЛОКАЛИЗАЦИЯ (с эмодзи в тексте, без f-строк)
# ════════════════════════════════════════════════════════════════

DEFAULT_LANG = "ru"

LOC = {
    "ru": {
        "name": "🇷🇺 Русский",
        "start_text": (
            f'<tg-emoji emoji-id="{E44}">🏦</tg-emoji> <b>Playerok · официальная платформа безопасных сделок</b>\n\n'
            f'<tg-emoji emoji-id="{E45}">🛡</tg-emoji> <b>Гарантия защиты · средства под охраной</b>\n'
            f'<tg-emoji emoji-id="{E32}">⚡</tg-emoji> <b>Быстрые выплаты · удобный вывод</b>\n'
            f'<tg-emoji emoji-id="{E46}">🕐</tg-emoji> <b>Поддержка 24/7</b>\n\n'
            f'<tg-emoji emoji-id="{E47}">📋</tg-emoji> <b>Как проходит сделка</b>\n'
            "<blockquote>· Продавец создаёт сделку и отправляет ссылку покупателю\n"
            "· Покупатель оплачивает — средства резервируются платформой\n"
            "· Продавец передаёт товар официальному посреднику для проверки\n"
            "· Покупатель получает товар после подтверждения</blockquote>"
        ),
        "create_deal_btn": "Создать сделку",
        "mini_app_btn": "Playerok App",
        "profile_btn": "Профиль",
        "balance_btn": "Баланс: {balance:.2f} {currency}",
        "wallet_btn": "Кошелёк",
        "currency_btn": "Валюта",
        "referral_btn": "Рефералы",
        "faq_btn": "FAQ",
        "lang_btn": "Язык",
        "history_btn": "История",
        "support_btn": "Поддержка",
        "back_btn": "Назад",
        "cancel_btn": "Отмена",
        "withdraw_btn": "Вывести",
        "add_requisites_btn": "Добавить кошелёк",
        "add_bank_card_btn": "Добавить карту",
        "main_menu_btn": "Главное меню",
        "pay_btn": "Подтвердить оплату",
        "profile_text": (
            f'<tg-emoji emoji-id="{E48}">👤</tg-emoji> <b>Профиль</b> · @{{username}}\n\n'
            f'<tg-emoji emoji-id="{E25}">💰</tg-emoji> <b>Баланс:</b> {{balance:.2f}} {{currency}}\n'
            f'<tg-emoji emoji-id="{E26}">📊</tg-emoji> <b>Успешных сделок:</b> {{deals}}\n'
            f'<tg-emoji emoji-id="{E19}">🏅</tg-emoji> <b>Ранг:</b> {{rank}}  '
            f'<tg-emoji emoji-id="{E18}">⭐</tg-emoji> <b>{{rating:.1f}}</b>/5\n\n'
            "<b>Выберите действие:</b>"
        ),
        "wallet_text": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Способ оплаты</b>\n\n'
            f'<tg-emoji emoji-id="{E29}">💎</tg-emoji> {{currency}} кошелёк:\n'
            "<code>{address}</code>"
        ),
        "wallet_text_bank": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Банковская карта</b>\n\n'
            "Карта: <code>{card_number}</code>\n"
            "Имя: {card_name}"
        ),
        "no_requisites_text": (
            "⚠️ <b>Способ оплаты не указан</b>\n\n"
            "Сначала добавьте адрес кошелька,\n"
            "чтобы создавать сделки или выводить средства."
        ),
        "no_requisites_text_bank": (
            "⚠️ <b>Банковская карта не привязана</b>\n\n"
            "Сначала добавьте банковскую карту,\n"
            "чтобы создавать сделки или выводить средства."
        ),
        "blocked_text": "⛔ Аккаунт ограничен\nСвязь с поддержкой: @PlayerokOperator",
        "deal_not_found": "❌ Сделка не найдена",
        "deal_not_active": "⚠ Сделка уже не активна",
        "cannot_pay_own": "⚠ Нельзя оплатить собственную сделку",
        "insufficient_funds": "⚠ Недостаточно средств",
        "payment_ok": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Оплата прошла успешно</b>\n\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Средства списаны с баланса и заблокированы в гаранте.\n'
            f'<tg-emoji emoji-id="{E36}">🔒</tg-emoji> <b>Дальше:</b> администратор проверит оплату и уведомит продавца.\n\n'
            f'<tg-emoji emoji-id="{E34}">📋</tg-emoji> После подтверждения продавец передаёт товар в <b>@PlayerokOperator</b> для выдачи.\n'
            f'<tg-emoji emoji-id="{E17}">⏳</tg-emoji> Оставайтесь на связи до завершения обработки.'
        ),
        "admin_panel": "⚙ <b>Панель администратора</b>\n\nВыберите действие:",
        "admin_active_deals": "📂 Активные сделки",
        "admin_completed_deals": "✅ Завершённые",
        "admin_change_balance": "💰 Изменить баланс",
        "admin_change_stats": "📊 Изменить статистику",
        "admin_change_rating": "⭐ Изменить рейтинг",
        "admin_block_user": "🚫 Заблокировать",
        "admin_unblock_user": "✅ Разблокировать",
        "admin_user_menu": "👤 Меню пользователя",
        "admin_broadcast_btn": "📢 Рассылка",
        "admin_confirm_btn": "✅ Подтвердить",
        "admin_cancel_btn": "❌ Отменить",
        "enter_amount": (
            f'<tg-emoji emoji-id="{E27}">💰</tg-emoji> <b>Введите сумму сделки</b>\n'
            "<b>Текущая валюта расчётов:</b> {currency}"
        ),
        "enter_description": (
            f'<tg-emoji emoji-id="{E50}">📝</tg-emoji> <b>Опишите товар или услугу</b>\n'
            "<b>Укажите название, количество, способ передачи и важные условия.</b>"
        ),
        "enter_crypto": "💎 Введите адрес кошелька {network}:",
        "enter_stars_username": (
            "⭐ <b>Telegram Stars — получатель выплаты</b>\n\n"
            "Введите ваш Telegram username (без @), на который будут зачисляться Stars после успешной сделки.\n\n"
            "<i>Пример: ivan_ivanov</i>"
        ),
        "invalid_stars_username": (
            "❌ <b>Некорректный username</b>\n\n"
            "Username может содержать только буквы, цифры и знак «_», длина от 5 до 32 символов.\n"
            "Вводите без @ — просто сам username.\n\n"
            "<i>Попробуйте ещё раз:</i>"
        ),
        "stars_username_saved": "⭐ Username для Stars сохранён — именно на него придут выплаты после сделки.",
        "choose_network": "🔗 Выберите сеть кошелька:",
        "wallet_multi_text": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Адреса кошельков</b>\n\n'
            "{wallets_display}"
        ),
        "no_wallets_text": (
            "⚠️ <b>Адреса кошельков не указаны</b>\n\n"
            "Сначала добавьте адрес кошелька."
        ),
        "enter_bank_card": "🏦 Введите номер банковской карты:",
        "enter_bank_name": "👤 Введите имя держателя карты:",
        "enter_withdraw": "📤 <b>Вывод</b>\n\nВведите сумму вывода\n💰 Доступно: <b>{balance:.2f} {currency}</b>",
        "choose_lang": f'<tg-emoji emoji-id="{E6}">🌐</tg-emoji> <b>Выберите язык</b>',
        "choose_currency": f'<tg-emoji emoji-id="{E3}">💱</tg-emoji> <b>Выберите валюту расчётов</b>\n<b>Баланс будет пересчитан автоматически.</b>',
        "lang_updated": "✅ <b>Язык обновлён</b>",
        "currency_changed": "✅ Валюта изменена на {currency}",
        "currency_changed_with_convert": (
            "✅ <b>Валюта изменена</b>\n\n"
            "💱 {old_cur} → {new_cur}\n"
            "💰 {old_balance:.2f} → {new_balance:.2f}"
        ),
        "referral_text": (
            f'<tg-emoji emoji-id="{E5}">👥</tg-emoji> <b>Реферальная программа</b>\n\n'
            "Приглашайте друзей и получайте награды.\n\n"
            f'<tg-emoji emoji-id="{E33}">🔗</tg-emoji> Ваша ссылка:\n'
            "<code>{ref_link}</code>"
        ),
        "deal_created": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Сделка создана</b>\n\n'
            f'<tg-emoji emoji-id="{E30}">🆔</tg-emoji> ID сделки: <code>#{{deal_id}}</code>\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> Описание: {{description}}\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Сумма: <b>{{amount:.2f}} {{currency}}</b>\n\n'
            f'<tg-emoji emoji-id="{E33}">🔗</tg-emoji> Ссылка для покупателя:\n'
            "<code>{link}</code>\n\n"
            f'<tg-emoji emoji-id="{E34}">📋</tg-emoji> <b>Отправьте ссылку покупателю</b>, чтобы он оплатил сделку.\n'
            "<i>Не передавайте товар напрямую до подтверждения поддержки.</i>"
        ),
        "deal_card": (
            f'<tg-emoji emoji-id="{E36}">🔒</tg-emoji> <b>Гарант-сделка</b>\n\n'
            f'<tg-emoji emoji-id="{E30}">🆔</tg-emoji> ID: <code>#{{deal_id}}</code>\n\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> <b>Товар/услуга:</b>\n'
            "{description}\n\n"
            f'<tg-emoji emoji-id="{E37}">⭐</tg-emoji> Ранг продавца: {{rank}}\n'
            f'<tg-emoji emoji-id="{E18}">⭐</tg-emoji> Рейтинг: {{stars}} {{rating:.1f}}/5 ({{reviews}})\n\n'
            f'<tg-emoji emoji-id="{E27}">💰</tg-emoji> Сумма: <b>{{amount:.2f}} {{currency}}</b>\n\n'
            f'<tg-emoji emoji-id="{E38}">🔐</tg-emoji> После оплаты средства будут заблокированы в гаранте.\n'
            "<i>Продавец передаёт товар в поддержку, после чего он выдаётся покупателю.</i>"
        ),
        "seller_confirm_text": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Сделка #{{deal_id}} подтверждена</b>\n\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Зачислено: <b>{{amount:.2f}} {{currency}}</b>\n'
            "Комиссия: <code>{fee}%</code>\n\n"
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> <b>Теперь передайте товар в поддержку:</b> @PlayerokOperator\n'
            "<blockquote>В сообщении укажите:\n"
            "• ID сделки\n"
            "• сам товар, аккаунт или услугу\n"
            "• инструкции, пароли или важные примечания</blockquote>\n\n"
            "⚠️ <b>Безопасность:</b>\n"
            "<blockquote>Если покупатель просит передать товар напрямую и обойти поддержку, "
            "считайте это попыткой обмана. Передавайте товар только через @PlayerokOperator, "
            "чтобы платформа могла подтвердить передачу и решить спор.</blockquote>\n"
            "<i>Поддержка проверит передачу и выдаст товар покупателю.</i>"
        ),
        "deal_completed_buyer": (
            f'<tg-emoji emoji-id="{E4}">🎉</tg-emoji> <b>Сделка #{{deal_id}} завершена</b>\n\n'
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> Администратор подтвердил передачу\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> Получите товар через @PlayerokOperator\n\n'
            f'<tg-emoji emoji-id="{E23}">💬</tg-emoji> По вопросам обращайтесь в поддержку'
        ),
        "deal_cancelled": "❌ Сделка #{deal_id} отменена\n💰 Средства возвращены",
        "admin_deal_paid": (
            "🔔 <b>Новая оплата</b>\n\n"
            "🆔 Сделка: <code>#{deal_id}</code>\n"
            "💰 Сумма: {amount:.2f} {currency}\n"
            "👤 Покупатель: <code>{buyer_id}</code>\n"
            "👤 Продавец: <code>{seller_id}</code>\n\n"
            "⚠ Требуется подтверждение"
        ),
        "admin_deal_info": (
            "📋 Сделка <b>#{deal_id}</b>\n\n"
            "📦 Описание: {description}\n"
            "💰 Сумма: {amount:.2f} {currency}\n"
            "👤 Продавец: {seller_id}\n"
            "👤 Покупатель: {buyer_id}\n"
            "📊 Статус: {status}"
        ),
        "admin_deal_list_item": "#{deal_id} — {amount:.2f} {currency} ({status})",
        "withdraw_request": (
            "📤 <b>Запрос на вывод</b>\n\n"
            "👤 Пользователь: {user_id} (@{username})\n"
            "💰 Сумма: {amount:.2f} {currency}\n\n"
            "💳 Адреса кошельков:\n{address}"
        ),
        "withdraw_sent": (
            "✅ <b>Запрос на вывод отправлен</b>\n\n"
            "📋 Запрос передан администратору\n"
            "⏳ Обновления придут через бота или поддержку\n\n"
            f'<tg-emoji emoji-id="{E23}">💬</tg-emoji> Поддержка: @PlayerokOperator'
        ),
        "crypto_saved": "✅ Адрес кошелька сохранён",
        "bank_card_saved": "✅ Карта привязана",
        "invalid_crypto": "❌ Некорректный адрес {currency}\nВведите заново:",
        "invalid_bank_card": "❌ Некорректный номер карты\nВведите 16-19 цифр:",
        "invalid_amount": "⚠ Введите корректную сумму больше 0:",
        "error_amount_not_set": "❌ Сумма не задана. Начните заново.",
        "no_access": "⛔ Нет доступа",
        "user_blocked": "✅ Пользователь {user_id} заблокирован",
        "user_unblocked": "✅ Пользователь {user_id} разблокирован",
        "balance_changed": "✅ Баланс пользователя {user_id}: {amount:+.2f}",
        "stats_changed": "✅ Статистика пользователя {user_id} обновлена",
        "rating_changed": "✅ Рейтинг пользователя {user_id} → {rating:.1f} ({reviews})",
        "deal_confirmed": "✅ Сделка #{deal_id} подтверждена",
        "deal_cancelled_admin": "❌ Сделка #{deal_id} отменена",
        "deal_already_processed": "⚠ Сделка уже обработана",
        "no_active_deals": "📭 Активных сделок нет",
        "active_deals_title": "📂 <b>Активные сделки</b>",
        "completed_deals_title": "✅ <b>Завершённые сделки</b>\n\n",
        "completed_deals_empty": "📭 Пусто",
        "enter_block_id": "🚫 Введите ID пользователя:",
        "enter_unblock_id": "✅ Введите ID пользователя:",
        "enter_balance_format": "Введите: <b>ID пользователя</b> и <b>сумму</b>\n\nПример: <code>12345 100</code>\n\n(положительное число — пополнить, отрицательное — списать)",
        "enter_stats_format": "Введите: <b>ID пользователя</b> и <b>кол-во сделок</b>\n\nПример: <code>12345 50</code>",
        "enter_rating_format": "Введите: <b>ID пользователя</b> и <b>рейтинг</b> (от 0 до 5)\n\nПример: <code>12345 4.5</code>",
        "invalid_id": "❌ Некорректный ID",
        "invalid_format": "⚠ Формат: <user_id> <сумма>",
        "invalid_format_stats": "⚠ Формат: <user_id> <кол-во сделок>",
        "invalid_format_rating": "⚠ Формат: <user_id> <рейтинг> (0-5)",
        "health_ok": "✅ Работает",
        "complain_received": "✅ Жалоба отправлена администратору",
        "attach_prompt": (
            f'<tg-emoji emoji-id="{E49}">📷</tg-emoji> <b>Прикрепить изображение?</b>\n'
            "<b>Отправьте изображение или нажмите «Пропустить».</b>"
        ),
        "skip_btn": "Пропустить",
        "rate_deal": "⭐ Оцените сделку от 1 до 5:",
        "rate_thanks": "✅ Спасибо за оценку",
        "your_rank": "Ранг",
        "fee": "Комиссия",
        "tnuve_success": "✅ Баланс +{amount} {currency}\nТекущий: {new_balance:.2f} {currency}",
        "topup_rejected": "❌ Заявка на пополнение #{request_id} отклонена.\nЕсли платёж был отправлен, обратитесь в поддержку: @PlayerokOperator",
        "tnuve_usage": "Использование: /tnuve <сумма>",
        "broadcast_prompt": "📢 Введите текст рассылки\nПоддерживается HTML:",
        "broadcast_confirm": (
            "📢 <b>Подтверждение рассылки</b>\n\n"
            "👥 Получатели: {count}\n\n"
            "<b>Предпросмотр:</b>\n"
            "{preview}\n\n"
            "Отправить?"
        ),
        "broadcast_sending": "📤 Отправка... {sent}/{total}",
        "broadcast_done": (
            "✅ <b>Рассылка завершена</b>\n\n"
            "📤 Отправлено: {sent}\n"
            "❌ Ошибки: {failed}\n"
            "📊 Всего: {total}"
        ),
        "broadcast_cancelled": "❌ Рассылка отменена",
        "broadcast_confirm_btn": "✅ Отправить",
        "broadcast_cancel_btn": "❌ Отмена",
        "history_title": "📋 <b>История сделок</b>\n",
        "history_empty": "\n📭 Сделок пока нет",
        "history_item_sell": "\n📤 <b>#{deal_id}</b>  Продажа  {amount:.2f} {currency}  {status_label}",
        "history_item_buy":  "\n📥 <b>#{deal_id}</b>  Покупка  {amount:.2f} {currency}  {status_label}",
        "status_active": "🟢 Активна",
        "status_pending": "🟡 Ожидает подтверждения",
        "status_completed": "✅ Завершена",
        "status_cancelled": "🔴 Отменена",
        "faq_text": (
            f'<tg-emoji emoji-id="{E7}">✅</tg-emoji> <b>FAQ · как безопасно провести сделку</b>\n\n'
            "<b>1. Что делает продавец?</b>\n"
            "Создаёт сделку, указывает сумму и описание, затем отправляет ссылку покупателю.\n\n"
            "<b>2. Что происходит после оплаты?</b>\n"
            "Средства блокируются в гаранте до проверки администратором.\n\n"
            "<b>3. Кому передавать товар?</b>\n"
            "Продавец передаёт товар, аккаунт или данные услуги только в <b>@PlayerokOperator</b>, не напрямую покупателю.\n\n"
            "<b>4. Что если покупатель просит прямую передачу?</b>\n"
            "Откажитесь и обратитесь в поддержку. Передача в обход поддержки усложняет проверку споров.\n\n"
            "<b>5. Что делать при споре?</b>\n"
            "Сохраните переписку и платёжные данные, затем обратитесь в поддержку."
        ),
    },
    "en": {
        "name": "🇬🇧 English",
        "start_text": (
            f'<tg-emoji emoji-id="{E44}">🏦</tg-emoji> <b>Playerok · Official Secure Deals Platform</b>\n\n'
            f'<tg-emoji emoji-id="{E45}">🛡</tg-emoji> <b>Protection Guarantee · Funds Secured</b>\n'
            f'<tg-emoji emoji-id="{E32}">⚡</tg-emoji> <b>Instant Payouts · Fast Withdrawals</b>\n'
            f'<tg-emoji emoji-id="{E46}">🕐</tg-emoji> <b>24/7 Live Support</b>\n\n'
            f'<tg-emoji emoji-id="{E47}">📋</tg-emoji> <b>How It Works</b>\n'
            "<blockquote>· Seller creates a deal and sends the buyer link\n"
            "· Buyer pays — funds are reserved by the platform\n"
            "· Seller hands the item to our official relayer for verification\n"
            "· Buyer receives the item after confirmation</blockquote>"
        ),
        "create_deal_btn": "Deal",
        "mini_app_btn": "Playerok App",
        "profile_btn": "Profile",
        "balance_btn": "Balance: {balance:.2f} {currency}",
        "wallet_btn": "Wallet",
        "currency_btn": "Currency",
        "referral_btn": "Referral",
        "faq_btn": "FAQ",
        "lang_btn": "Language",
        "history_btn": "History",
        "support_btn": "Support",
        "back_btn": "Back",
        "cancel_btn": "Cancel",
        "withdraw_btn": "Withdraw",
        "add_requisites_btn": "Add Wallet",
        "add_bank_card_btn": "Add Bank Card",
        "main_menu_btn": "Main Menu",
        "pay_btn": "Confirm Payment",
        "profile_text": (
            f'<tg-emoji emoji-id="{E48}">👤</tg-emoji> <b>Profile</b> · @{{username}}\n\n'
            f'<tg-emoji emoji-id="{E25}">💰</tg-emoji> <b>Balance:</b> {{balance:.2f}} {{currency}}\n'
            f'<tg-emoji emoji-id="{E26}">📊</tg-emoji> <b>Deals:</b> {{deals}}\n'
            f'<tg-emoji emoji-id="{E19}">🏅</tg-emoji> <b>Rank:</b> {{rank}}  '
            f'<tg-emoji emoji-id="{E18}">⭐</tg-emoji> <b>{{rating:.1f}}</b>/5\n\n'
            "<b>Choose an action:</b>"
        ),
        "wallet_text": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Payment Method</b>\n\n'
            f'<tg-emoji emoji-id="{E29}">💎</tg-emoji> {{currency}} wallet address:\n'
            "<code>{address}</code>"
        ),
        "wallet_text_bank": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Bank Card Info</b>\n\n'
            "Card: <code>{card_number}</code>\n"
            "Name: {card_name}"
        ),
        "no_requisites_text": (
            "⚠️ <b>No payment method set</b>\n\n"
            "Please add a wallet address\n"
            "before creating deals or withdrawing"
        ),
        "no_requisites_text_bank": (
            "⚠️ <b>No bank card linked</b>\n\n"
            "Please link your bank card\n"
            "before creating deals or withdrawing"
        ),
        "blocked_text": "⛔ Account restricted\nContact: @PlayerokOperator",
        "deal_not_found": "❌ Deal not found",
        "deal_not_active": "⚠ Deal is no longer active",
        "cannot_pay_own": "⚠ Cannot pay for your own deal",
        "insufficient_funds": "⚠ Insufficient balance",
        "payment_ok": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Payment Successful</b>\n\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Funds were deducted from your balance and locked in escrow.\n'
            f'<tg-emoji emoji-id="{E36}">🔒</tg-emoji> <b>Next step:</b> an admin will verify the payment and notify the seller.\n\n'
            f'<tg-emoji emoji-id="{E34}">📋</tg-emoji> After confirmation, the seller must hand the item to <b>@PlayerokOperator</b> for delivery.\n'
            f'<tg-emoji emoji-id="{E17}">⏳</tg-emoji> Please stay available while the deal is processed.'
        ),
        "admin_panel": "⚙ <b>Admin Panel</b>\n\nChoose action:",
        "admin_active_deals": "📂 Active Deals",
        "admin_completed_deals": "✅ Completed",
        "admin_change_balance": "💰 Change Balance",
        "admin_change_stats": "📊 Change Stats",
        "admin_change_rating": "⭐ Change Rating",
        "admin_block_user": "🚫 Block User",
        "admin_unblock_user": "✅ Unblock User",
        "admin_user_menu": "👤 User Menu",
        "admin_broadcast_btn": "📢 Broadcast",
        "admin_confirm_btn": "✅ Confirm",
        "admin_cancel_btn": "❌ Cancel",
        "enter_amount": (
            f'<tg-emoji emoji-id="{E27}">💰</tg-emoji> <b>Enter the deal amount</b>\n'
            "<b>Current settlement currency:</b> {currency}"
        ),
        "enter_description": (
            f'<tg-emoji emoji-id="{E50}">📝</tg-emoji> <b>Describe the product or service</b>\n'
            "<b>Include name, quantity, delivery method, and any important conditions</b>"
        ),
        "enter_crypto": "💎 Enter your {network} wallet address:",
        "enter_stars_username": (
            "⭐ <b>Telegram Stars — payout recipient</b>\n\n"
            "Enter your Telegram username (without @) where Stars will be sent after a successful deal.\n\n"
            "<i>Example: ivan_ivanov</i>"
        ),
        "invalid_stars_username": (
            "❌ <b>Invalid username</b>\n\n"
            "Username can only contain letters, digits and underscores, 5–32 characters long.\n"
            "Enter it without @ — just the username itself.\n\n"
            "<i>Please try again:</i>"
        ),
        "stars_username_saved": "⭐ Stars username saved — payouts will be sent there after each deal.",
        "choose_network": "🔗 Choose wallet network:",
        "wallet_multi_text": (
            f'<tg-emoji emoji-id="{E2}">💳</tg-emoji> <b>Wallet Addresses</b>\n\n'
            "{wallets_display}"
        ),
        "no_wallets_text": (
            "⚠️ <b>No wallet addresses set</b>\n\n"
            "Please add a wallet address first"
        ),
        "enter_bank_card": "🏦 Enter your bank card number:",
        "enter_bank_name": "👤 Enter cardholder name:",
        "enter_withdraw": "📤 <b>Withdrawal</b>\n\nEnter withdrawal amount\n💰 Available: <b>{balance:.2f} {currency}</b>",
        "choose_lang": f'<tg-emoji emoji-id="{E6}">🌐</tg-emoji> <b>Choose Language</b>',
        "choose_currency": f'<tg-emoji emoji-id="{E3}">💱</tg-emoji> <b>Choose Settlement Currency</b>\n<b>Your balance will be converted automatically</b>',
        "lang_updated": "✅ <b>Language updated</b>",
        "currency_changed": "✅ Currency changed to {currency}",
        "currency_changed_with_convert": (
            "✅ <b>Currency Changed</b>\n\n"
            "💱 {old_cur} → {new_cur}\n"
            "💰 {old_balance:.2f} → {new_balance:.2f}"
        ),
        "referral_text": (
            f'<tg-emoji emoji-id="{E5}">👥</tg-emoji> <b>Referral Program</b>\n\n'
            "Invite friends to earn rewards\n\n"
            f'<tg-emoji emoji-id="{E33}">🔗</tg-emoji> Your link:\n'
            "<code>{ref_link}</code>"
        ),
        "deal_created": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Deal Created Successfully</b>\n\n'
            f'<tg-emoji emoji-id="{E30}">🆔</tg-emoji> Deal ID: <code>#{{deal_id}}</code>\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> Description: {{description}}\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Amount: <b>{{amount:.2f}} {{currency}}</b>\n\n'
            f'<tg-emoji emoji-id="{E33}">🔗</tg-emoji> Buyer link:\n'
            "<code>{link}</code>\n\n"
            f'<tg-emoji emoji-id="{E34}">📋</tg-emoji> <b>Send this link to the buyer</b> so they can pay.\n'
            "<i>Do not deliver the item directly before support confirmation.</i>"
        ),
        "deal_card": (
            f'<tg-emoji emoji-id="{E36}">🔒</tg-emoji> <b>Escrow Deal</b>\n\n'
            f'<tg-emoji emoji-id="{E30}">🆔</tg-emoji> ID: <code>#{{deal_id}}</code>\n\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> <b>Item/Service:</b>\n'
            "{description}\n\n"
            f'<tg-emoji emoji-id="{E37}">⭐</tg-emoji> Seller rank: {{rank}}\n'
            f'<tg-emoji emoji-id="{E18}">⭐</tg-emoji> Rating: {{stars}} {{rating:.1f}}/5 ({{reviews}})\n\n'
            f'<tg-emoji emoji-id="{E27}">💰</tg-emoji> Amount: <b>{{amount:.2f}} {{currency}}</b>\n\n'
            f'<tg-emoji emoji-id="{E38}">🔐</tg-emoji> Funds are locked in escrow after payment.\n'
            "<i>The seller hands the item to support before buyer delivery.</i>"
        ),
        "seller_confirm_text": (
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> <b>Deal #{{deal_id}} Confirmed</b>\n\n'
            f'<tg-emoji emoji-id="{E32}">💰</tg-emoji> Credited: <b>{{amount:.2f}} {{currency}}</b>\n'
            "Fee: <code>{fee}%</code>\n\n"
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> <b>Now hand the item to support:</b> @PlayerokOperator\n'
            "<blockquote>Please include:\n"
            "• Deal ID\n"
            "• The item/account/service itself\n"
            "• Delivery notes, passwords, or required details</blockquote>\n\n"
            "⚠️ <b>Security warning:</b>\n"
            "<blockquote>If the buyer asks you to send the item directly and bypass support, "
            "treat it as a scam attempt. Only hand items to @PlayerokOperator so the platform "
            "can verify delivery and resolve disputes.</blockquote>\n"
            "<i>Support will verify the handoff and deliver it to the buyer.</i>"
        ),
        "deal_completed_buyer": (
            f'<tg-emoji emoji-id="{E4}">🎉</tg-emoji> <b>Deal #{{deal_id}} Completed</b>\n\n'
            f'<tg-emoji emoji-id="{E35}">✅</tg-emoji> Admin confirmed delivery\n'
            f'<tg-emoji emoji-id="{E31}">📦</tg-emoji> Collect item from @PlayerokOperator\n\n'
            f'<tg-emoji emoji-id="{E23}">💬</tg-emoji> Contact support for any issues'
        ),
        "deal_cancelled": "❌ Deal #{deal_id} cancelled\n💰 Funds returned",
        "admin_deal_paid": (
            "🔔 <b>New Payment</b>\n\n"
            "🆔 Deal: <code>#{deal_id}</code>\n"
            "💰 Amount: {amount:.2f} {currency}\n"
            "👤 Buyer: <code>{buyer_id}</code>\n"
            "👤 Seller: <code>{seller_id}</code>\n\n"
            "⚠ Confirmation required"
        ),
        "admin_deal_info": (
            "📋 Deal <b>#{deal_id}</b>\n\n"
            "📦 Description: {description}\n"
            "💰 Amount: {amount:.2f} {currency}\n"
            "👤 Seller: {seller_id}\n"
            "👤 Buyer: {buyer_id}\n"
            "📊 Status: {status}"
        ),
        "admin_deal_list_item": "#{deal_id} — {amount:.2f} {currency} ({status})",
        "withdraw_request": (
            "📤 <b>Withdrawal Request</b>\n\n"
            "👤 User: {user_id} (@{username})\n"
            "💰 Amount: {amount:.2f} {currency}\n\n"
            "💳 Wallet addresses:\n{address}"
        ),
        "withdraw_sent": (
            "✅ <b>Withdrawal Submitted</b>\n\n"
            "📋 Request sent to admin\n"
            "⏳ Updates will arrive through the bot or support\n\n"
            f'<tg-emoji emoji-id="{E23}">💬</tg-emoji> Support: @PlayerokOperator'
        ),
        "crypto_saved": "✅ Wallet address saved",
        "bank_card_saved": "✅ Bank card linked",
        "invalid_crypto": "❌ Invalid {currency} address\nPlease retry:",
        "invalid_bank_card": "❌ Invalid card number\nEnter 16-19 digits:",
        "invalid_amount": "⚠ Enter a valid amount (> 0):",
        "error_amount_not_set": "❌ Amount not set. Please start over.",
        "no_access": "⛔ No access",
        "user_blocked": "✅ User {user_id} blocked",
        "user_unblocked": "✅ User {user_id} unblocked",
        "balance_changed": "✅ User {user_id} balance {amount:+.2f}",
        "stats_changed": "✅ User {user_id} stats updated",
        "rating_changed": "✅ User {user_id} rating → {rating:.1f} ({reviews})",
        "deal_confirmed": "✅ Deal #{deal_id} confirmed",
        "deal_cancelled_admin": "❌ Deal #{deal_id} cancelled",
        "deal_already_processed": "⚠ Deal already processed",
        "no_active_deals": "📭 No active deals",
        "active_deals_title": "📂 <b>Active Deals</b>",
        "completed_deals_title": "✅ <b>Completed Deals</b>\n\n",
        "completed_deals_empty": "📭 None",
        "enter_block_id": "🚫 Enter user ID:",
        "enter_unblock_id": "✅ Enter user ID:",
        "enter_balance_format": "Enter: <b>user ID</b> and <b>amount</b>\n\nExample: <code>12345 100</code>\n\n(positive — add, negative — deduct)",
        "enter_stats_format": "Enter: <b>user ID</b> and <b>deals count</b>\n\nExample: <code>12345 50</code>",
        "enter_rating_format": "Enter: <b>user ID</b> and <b>rating</b> (0 to 5)\n\nExample: <code>12345 4.5</code>",
        "invalid_id": "❌ Invalid ID",
        "invalid_format": "⚠ Format: <user_id> <amount>",
        "invalid_format_stats": "⚠ Format: <user_id> <deals_count>",
        "invalid_format_rating": "⚠ Format: <user_id> <rating> (0-5)",
        "health_ok": "✅ Running",
        "complain_received": "✅ Complaint sent to admin",
        "attach_prompt": (
            f'<tg-emoji emoji-id="{E49}">📷</tg-emoji> <b>Attach an image?</b>\n'
            "<b>Send image or click Skip</b>"
        ),
        "skip_btn": "Skip",
        "rate_deal": "⭐ Rate this deal (1-5):",
        "rate_thanks": "✅ Thanks for your rating",
        "your_rank": "Rank",
        "fee": "Fee",
        "tnuve_success": "✅ Balance +{amount} {currency}\nCurrent: {new_balance:.2f} {currency}",
        "topup_rejected": "❌ Top-up request #{request_id} was rejected.\nIf you already paid, contact support: @PlayerokOperator",
        "tnuve_usage": "Usage: /tnuve <amount>",
        "broadcast_prompt": "📢 Enter broadcast message\nHTML formatting supported:",
        "broadcast_confirm": (
            "📢 <b>Confirm Broadcast</b>\n\n"
            "👥 Recipients: {count} users\n\n"
            "<b>Preview:</b>\n"
            "{preview}\n\n"
            "Send?"
        ),
        "broadcast_sending": "📤 Sending... {sent}/{total}",
        "broadcast_done": (
            "✅ <b>Broadcast Complete</b>\n\n"
            "📤 Sent: {sent}\n"
            "❌ Failed: {failed}\n"
            "📊 Total: {total}"
        ),
        "broadcast_cancelled": "❌ Broadcast cancelled",
        "broadcast_confirm_btn": "✅ Send",
        "broadcast_cancel_btn": "❌ Cancel",
        "history_title": "📋 <b>Deal History</b>\n",
        "history_empty": "\n📭 No deals yet",
        "history_item_sell": "\n📤 <b>#{deal_id}</b>  Sold  {amount:.2f} {currency}  {status_label}",
        "history_item_buy":  "\n📥 <b>#{deal_id}</b>  Bought  {amount:.2f} {currency}  {status_label}",
        "status_active": "🟢 Active",
        "status_pending": "🟡 Pending",
        "status_completed": "✅ Done",
        "status_cancelled": "🔴 Cancelled",
        "faq_text": (
            f'<tg-emoji emoji-id="{E7}">✅</tg-emoji> <b>FAQ · How to complete a safe deal</b>\n\n'
            "<b>1. What does the seller do?</b>\n"
            "Create a deal, enter the amount and description, then send the buyer link.\n\n"
            "<b>2. What happens after buyer payment?</b>\n"
            "Funds are locked in escrow until an admin verifies the payment.\n\n"
            "<b>3. Who receives the item?</b>\n"
            "The seller must send the item, account, or service details to <b>@PlayerokOperator</b>, not directly to the buyer.\n\n"
            "<b>4. What if the buyer asks for direct delivery?</b>\n"
            "Refuse and contact support. Bypassing support can make disputes impossible to verify.\n\n"
            "<b>5. What if there is a dispute?</b>\n"
            "Keep chat logs and payment details, then contact support for review."
        ),
    }
}

# Админская локализация (русская) — без изменений
ADMIN_LOC = {
    "admin_panel": "⚙ <b>Панель администратора</b>\n\nВыберите действие:",
    "admin_active_deals": "📂 Активные сделки",
    "admin_completed_deals": "✅ Завершённые",
    "admin_change_balance": "💰 Изменить баланс",
    "admin_change_stats": "📊 Изменить статистику",
    "admin_change_rating": "⭐ Изменить рейтинг",
    "admin_block_user": "🚫 Заблокировать",
    "admin_unblock_user": "✅ Разблокировать",
    "admin_user_menu": "👤 Меню пользователя",
    "admin_broadcast_btn": "📢 Рассылка",
    "admin_confirm_btn": "✅ Подтвердить",
    "admin_cancel_btn": "❌ Отменить",
    "admin_deal_paid": (
        "🔔 <b>Новая оплата</b>\n\n"
        "🆔 Сделка: <code>#{deal_id}</code>\n"
        "💰 Сумма: {amount:.2f} {currency}\n"
        "👤 Покупатель: <code>{buyer_id}</code>\n"
        "👤 Продавец: <code>{seller_id}</code>\n\n"
        "⚠ Требуется подтверждение"
    ),
    "admin_deal_info": (
        "📋 Сделка <b>#{deal_id}</b>\n\n"
        "📦 Описание: {description}\n"
        "💰 Сумма: {amount:.2f} {currency}\n"
        "👤 Продавец: {seller_id}\n"
        "👤 Покупатель: {buyer_id}\n"
        "📊 Статус: {status}"
    ),
    "admin_deal_list_item": "#{deal_id} — {amount:.2f} {currency} ({status})",
    "enter_block_id": "🚫 Введите ID пользователя:",
    "enter_unblock_id": "✅ Введите ID пользователя:",
    "enter_balance_format": "Введите: <b>ID пользователя</b> и <b>сумму</b>\n\nПример: <code>12345 100</code>\n\n(положительное — пополнить, отрицательное — списать)",
    "enter_stats_format": "Введите: <b>ID пользователя</b> и <b>кол-во сделок</b>\n\nПример: <code>12345 50</code>",
    "enter_rating_format": "Введите: <b>ID пользователя</b> и <b>рейтинг</b> (от 0 до 5)\n\nПример: <code>12345 4.5</code>",
    "invalid_id": "❌ Неверный ID",
    "invalid_format": "⚠ Формат: <ID> <сумма>",
    "invalid_format_stats": "⚠ Формат: <ID> <кол-во сделок>",
    "invalid_format_rating": "⚠ Формат: <ID> <рейтинг> (0-5)",
    "user_blocked": "✅ Пользователь {user_id} заблокирован",
    "user_unblocked": "✅ Пользователь {user_id} разблокирован",
    "balance_changed": "✅ Пользователь {user_id} баланс {amount:+.2f}",
    "stats_changed": "✅ Пользователь {user_id} статистика обновлена",
    "rating_changed": "✅ Пользователь {user_id} рейтинг → {rating:.1f} ({reviews})",
    "deal_confirmed": "✅ Сделка #{deal_id} подтверждена",
    "deal_cancelled_admin": "❌ Сделка #{deal_id} отменена",
    "deal_already_processed": "⚠ Эта сделка уже обработана",
    "no_active_deals": "📭 Нет активных сделок",
    "active_deals_title": "📂 <b>Активные сделки</b>",
    "completed_deals_title": "✅ <b>Завершённые сделки</b>\n\n",
    "completed_deals_empty": "📭 Пусто",
    "broadcast_prompt": "📢 Введите текст рассылки\nПоддерживается HTML:",
    "broadcast_confirm": (
        "📢 <b>Подтверждение рассылки</b>\n\n"
        "👥 Получатели: {count} пользователей\n\n"
        "<b>Предпросмотр:</b>\n"
        "{preview}\n\n"
        "Отправить?"
    ),
    "broadcast_sending": "📤 Отправка... {sent}/{total}",
    "broadcast_done": (
        "✅ <b>Рассылка завершена</b>\n\n"
        "📤 Отправлено: {sent}\n"
        "❌ Ошибки: {failed}\n"
        "📊 Всего: {total}"
    ),
    "broadcast_cancelled": "❌ Рассылка отменена",
    "broadcast_confirm_btn": "✅ Отправить",
    "broadcast_cancel_btn": "❌ Отмена",
    "withdraw_request": (
        "📤 <b>Запрос на вывод</b>\n\n"
        "👤 Пользователь: {user_id} (@{username})\n"
        "💰 Сумма: {amount:.2f} {currency}\n"
        "💳 Кошелёк:\n{address}"
    ),
    "complaint_admin": "⚠️ Жалоба от пользователя {user_id} по сделке #{deal_id}",
    "health_ok": "✅ Работает",
    "tnuve_success": "✅ Баланс +{amount} {currency}\nТекущий: {new_balance:.2f} {currency}",
    "tnuve_usage": "Использование: /tnuve <сумма>",
    "no_broadcast_text": "❌ Текст рассылки не задан",
}

def get_text(lang: str, key: str, **kwargs) -> str:
    if key in ADMIN_LOC:
        text = ADMIN_LOC[key]
    else:
        texts = LOC.get(lang, LOC[DEFAULT_LANG])
        text = texts.get(key, LOC[DEFAULT_LANG].get(key, key))
    if kwargs:
        try:
            text = text.format(**kwargs)
        except Exception:
            pass
    return text

def h(value: Any) -> str:
    """Escape user-controlled text before inserting it into Telegram HTML."""
    return html.escape("" if value is None else str(value), quote=False)

def make_stars(rating: float) -> str:
    full = int(round(rating))
    return "★" * full + "☆" * (5 - full)

# ════════════════════════════════════════════════════════════════
#  ЛОГИРОВАНИЕ
# ════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("PlayerokEscrow")

# ════════════════════════════════════════════════════════════════
#  БАЗА ДАННЫХ (полностью из GGsel, добавлены поля для карт)
# ════════════════════════════════════════════════════════════════

def db_execute(query: str, params: tuple = ()) -> List[tuple]:
    with sqlite3.connect(DB_NAME, timeout=30.0, check_same_thread=False) as conn:
        conn.execute("PRAGMA busy_timeout=30000")
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.fetchall()

def init_db_sync():
    with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=30000")
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT DEFAULT '',
                wallet_crypto TEXT DEFAULT '',
                balance REAL DEFAULT 0.0,
                successful_deals INTEGER DEFAULT 0,
                lang TEXT DEFAULT '',
                total_spent REAL DEFAULT 0.0,
                currency TEXT DEFAULT 'TON',
                blocked INTEGER DEFAULT 0,
                rank TEXT DEFAULT 'Новичок',
                rating REAL DEFAULT 0,
                review_count INTEGER DEFAULT 0,
                verified_withdraw INTEGER DEFAULT 0,
                fee REAL DEFAULT 5.0,
                bank_card_number TEXT DEFAULT '',
                bank_card_name TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS deals (
                deal_id TEXT PRIMARY KEY,
                amount REAL,
                description TEXT,
                seller_id INTEGER,
                buyer_id INTEGER,
                status TEXT DEFAULT 'active',
                currency TEXT DEFAULT 'TON',
                created_at TIMESTAMP,
                attachment_file_id TEXT DEFAULT '',
                photo_url TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id TEXT,
                seller_id INTEGER,
                buyer_id INTEGER,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS topup_requests (
                request_id TEXT PRIMARY KEY,
                user_id INTEGER,
                username TEXT DEFAULT '',
                amount REAL,
                currency TEXT DEFAULT 'TON',
                credit_amount REAL DEFAULT 0,
                credit_currency TEXT DEFAULT 'TON',
                method TEXT DEFAULT '',
                destination TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP,
                approved_by INTEGER DEFAULT 0,
                approved_at TIMESTAMP,
                rejected_by INTEGER DEFAULT 0,
                rejected_at TIMESTAMP
            );
            INSERT OR IGNORE INTO system_settings (key, value) VALUES ('valute', 'TON');
        """)
    logger.info("DB initialized")
    _migrate_db()

# Expected columns → DDL type/default. CREATE TABLE IF NOT EXISTS never alters an
# existing table, so on a persistent disk an older DB can be missing newer columns
# (which makes INSERT/SELECT raise). Add any missing ones idempotently at startup.
_EXPECTED_COLS = {
    "deals": {
        "buyer_id": "INTEGER",
        "status": "TEXT DEFAULT 'active'",
        "currency": "TEXT DEFAULT 'TON'",
        "created_at": "TIMESTAMP",
        "attachment_file_id": "TEXT DEFAULT ''",
        "photo_url": "TEXT DEFAULT ''",
        # Marketplace-listing fields (mini-app). Bot escrow deals leave these empty;
        # listings created in the mini-app carry the full Deal JSON in `payload`.
        "payload": "TEXT DEFAULT ''",
        "moderation": "TEXT DEFAULT 'approved'",
    },
    "users": {
        "username": "TEXT DEFAULT ''",
        "wallet_crypto": "TEXT DEFAULT ''",
        "balance": "REAL DEFAULT 0.0",
        "successful_deals": "INTEGER DEFAULT 0",
        "lang": "TEXT DEFAULT ''",
        "total_spent": "REAL DEFAULT 0.0",
        "currency": "TEXT DEFAULT 'TON'",
        "blocked": "INTEGER DEFAULT 0",
        "rank": "TEXT DEFAULT 'Новичок'",
        "rating": "REAL DEFAULT 0",
        "review_count": "INTEGER DEFAULT 0",
        "verified_withdraw": "INTEGER DEFAULT 0",
        "fee": "REAL DEFAULT 5.0",
        "bank_card_number": "TEXT DEFAULT ''",
        "bank_card_name": "TEXT DEFAULT ''",
        "total_spent": "REAL DEFAULT 0.0",
    },
    "topup_requests": {
        "user_id": "INTEGER",
        "username": "TEXT DEFAULT ''",
        "amount": "REAL",
        "currency": "TEXT DEFAULT 'TON'",
        "credit_amount": "REAL DEFAULT 0",
        "credit_currency": "TEXT DEFAULT 'TON'",
        "method": "TEXT DEFAULT ''",
        "destination": "TEXT DEFAULT ''",
        "status": "TEXT DEFAULT 'pending'",
        "created_at": "TIMESTAMP",
        "approved_by": "INTEGER DEFAULT 0",
        "approved_at": "TIMESTAMP",
        "rejected_by": "INTEGER DEFAULT 0",
        "rejected_at": "TIMESTAMP",
    },
}

def _migrate_db():
    try:
        with sqlite3.connect(DB_NAME, check_same_thread=False) as conn:
            for table, cols in _EXPECTED_COLS.items():
                have = {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
                for col, ddl in cols.items():
                    if col not in have:
                        conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}")
                        logger.info("migrated: added %s.%s", table, col)
            conn.execute("UPDATE users SET lang='' WHERE lang NOT IN ('', 'ru', 'en')")
            conn.commit()
    except Exception as e:
        logger.warning("migration skipped: %s", e)

def update_user_rank(user_id: int):
    deals = db_execute("SELECT successful_deals FROM users WHERE user_id=?", (user_id,))
    if not deals:
        return
    d = deals[0][0]
    if d >= 50:
        rank, fee = "VIP", 2.5
    elif d >= 20:
        rank, fee = "Мастер", 3.0
    elif d >= 5:
        rank, fee = "Опытный", 4.0
    else:
        rank, fee = "Новичок", 5.0
    db_execute("UPDATE users SET rank=?, fee=? WHERE user_id=?", (rank, fee, user_id))

_USER_COLS = [
    "user_id", "username", "wallet_crypto", "balance",
    "successful_deals", "lang", "total_spent", "currency",
    "blocked", "rank", "rating", "review_count",
    "verified_withdraw", "fee", "bank_card_number", "bank_card_name",
]

def _ensure_user_sync(user_id: int, username: str = "") -> Dict[str, Any]:
    user_select = (
        "SELECT user_id, username, wallet_crypto, balance, successful_deals, lang, "
        "total_spent, currency, blocked, rank, rating, review_count, verified_withdraw, "
        "fee, bank_card_number, bank_card_name FROM users WHERE user_id=?"
    )
    res = db_execute(user_select, (user_id,))
    if not res:
        db_execute("INSERT INTO users (user_id, username, lang) VALUES (?,?,?)", (user_id, username, ""))
        update_user_rank(user_id)
        return {
            "user_id": user_id, "username": username,
            "wallet_crypto": "", "balance": 0.0,
            "successful_deals": 0, "lang": "",
            "total_spent": 0.0, "currency": "TON",
            "blocked": 0, "rank": "Новичок", "rating": 0,
            "review_count": 0, "verified_withdraw": 0,
            "fee": 5.0, "bank_card_number": "", "bank_card_name": "",
            "_is_new": True,
        }
    r = res[0]
    user = {col: r[i] for i, col in enumerate(_USER_COLS)}
    user["_is_new"] = False
    rank_map = {"\u65b0\u624b": "Новичок", "\u8d44\u6df1": "Опытный", "\u5927\u5e08": "Мастер"}
    if user.get("rank") in rank_map:
        user["rank"] = rank_map[user["rank"]]
        db_execute("UPDATE users SET rank=? WHERE user_id=?", (user["rank"], user_id))
    if username and user["username"] != username:
        db_execute("UPDATE users SET username=? WHERE user_id=?", (username, user_id))
    return user

async def get_user(user_id: int, username: str = "") -> Dict[str, Any]:
    return await asyncio.to_thread(_ensure_user_sync, user_id, username)

def is_user_blocked(user_id: int) -> bool:
    res = db_execute("SELECT blocked FROM users WHERE user_id=?", (user_id,))
    return res and res[0][0] == 1

def _parse_wallets(raw: str) -> dict:
    """Parse wallet_crypto field: JSON dict or legacy plain string → {network: addr}."""
    if not raw or not raw.strip():
        return {}
    raw = raw.strip()
    if raw.startswith("{"):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}
    # Legacy: plain address string → treat as TON
    return {"TON": raw}

def has_requisites(user_id: int, currency: str) -> bool:
    currency = normalize_currency(currency)
    if currency in BANK_CURRENCIES:
        res = db_execute("SELECT bank_card_number FROM users WHERE user_id=?", (user_id,))
        return bool(res and res[0][0] and res[0][0].strip())
    else:
        res = db_execute("SELECT wallet_crypto FROM users WHERE user_id=?", (user_id,))
        if not res:
            return False
        wallets = _parse_wallets(res[0][0] or "")
        # Каждая валюта требует свой кошелёк нужной сети, а не «любой».
        ok_nets = networks_for_currency(currency)
        return any(net in wallets and (wallets[net] or "").strip() for net in ok_nets)

def get_wallet_address(user: Dict[str, Any]) -> str:
    """Return the wallet/requisite for the user's current currency.

    Strictly per-currency: a deal in a given currency uses the requisite of
    that currency only. If the matching requisite is missing, returns "" so the
    flow forces the user to add the correct one (no fallback to a foreign wallet)."""
    currency = (user.get("currency") or "TON").upper()
    if currency in BANK_CURRENCIES:
        card = user.get("bank_card_number", "")
        name = user.get("bank_card_name", "")
        if card:
            return f"{card} ({name})" if name else card
        return ""
    wallets = _parse_wallets(user.get("wallet_crypto", ""))
    if not wallets:
        return ""
    # Only the network(s) that match this currency — preferred default first.
    default_net = CURRENCY_NETWORK.get(currency, "")
    if default_net in wallets and (wallets[default_net] or "").strip():
        return wallets[default_net]
    for net in networks_for_currency(currency):
        if net in wallets and (wallets[net] or "").strip():
            return wallets[net]
    return ""

def get_all_wallets(user: Dict[str, Any]) -> dict:
    """Return {network: address} dict of all saved wallets."""
    return _parse_wallets(user.get("wallet_crypto", ""))

def network_label(net: str) -> str:
    network_emoji = {
        "SOL": (E43, "🟣"),
        "LTC": (E42, "⚪"),
    }
    if net in network_emoji:
        emoji_id, symbol = network_emoji[net]
        name = WALLET_NETWORKS.get(net, net)
        return f'<tg-emoji emoji-id="{emoji_id}">{symbol}</tg-emoji> <b>{name}</b>'
    currency_by_network = {
        "TON": "TON",
        "TRC20": "TRX",
        "BEP20": "USDT",
        "ERC20": "ETH",
        "BTC": "BTC",
    }
    cur = currency_by_network.get(net)
    if cur:
        return currency_label(cur, bold=True)
    return f"<b>{WALLET_NETWORKS.get(net, net)}</b>"

def network_title(net: str) -> str:
    label = network_label(net)
    network_name = WALLET_NETWORKS.get(net, net)
    return label if network_name in label else f"{label} <i>{network_name}</i>"

def format_wallets_display(wallets: dict) -> str:
    """Format all wallets for display in HTML."""
    if not wallets:
        return ""
    lines = []
    for net, addr in wallets.items():
        if net == "telegram":
            lines.append(f"⭐ <b>Telegram Stars</b>:\n<code>@{h(addr)}</code>")
        else:
            lines.append(f"{network_title(net)}:\n<code>{h(addr)}</code>")
    return "\n\n".join(lines)

async def send_log(context, text: str):
    try:
        await context.bot.send_message(LOG_CHAT_ID, text, parse_mode="HTML")
    except Exception as e:
        logger.error("Failed to send log to %s: %s", LOG_CHAT_ID, e)

def get_all_user_ids() -> List[int]:
    rows = db_execute("SELECT user_id FROM users WHERE blocked=0")
    return [r[0] for r in rows]

def get_user_deals(user_id: int, limit: int = 15) -> List[Dict]:
    rows = db_execute(
        """SELECT deal_id, amount, seller_id, buyer_id, status, currency, created_at
           FROM deals
           WHERE seller_id=? OR buyer_id=?
           ORDER BY created_at DESC LIMIT ?""",
        (user_id, user_id, limit),
    )
    result = []
    for r in rows:
        result.append({
            "deal_id": r[0], "amount": r[1], "seller_id": r[2],
            "buyer_id": r[3], "status": r[4], "currency": r[5] or "TON",
            "created_at": r[6],
        })
    return result

# ════════════════════════════════════════════════════════════════
#  КЛАВИАТУРЫ (с эмодзи в кнопках, как в GGsel)
# ════════════════════════════════════════════════════════════════

def btn(text: str, *, callback_data: str = None, url: str = None, web_app: str = None,
        style: str = None, icon: str = None) -> InlineKeyboardButton:
    kwargs = {"text": text}
    if callback_data:
        kwargs["callback_data"] = callback_data
    if url:
        kwargs["url"] = url
    if web_app:
        kwargs["web_app"] = WebAppInfo(url=web_app)
    extra = {}
    if style:
        extra["style"] = style
    if icon:
        extra["icon_custom_emoji_id"] = icon
    if extra:
        kwargs["api_kwargs"] = extra
    return InlineKeyboardButton(**kwargs)

def kb_main_menu(balance: float, currency: str, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "create_deal_btn"), callback_data="create_deal", style="primary", icon=E21)],
        [btn(get_text(lang, "mini_app_btn"), web_app=MINI_APP_URL, style="primary", icon=MINI_APP_EMOJI_ID)],
        [btn(get_text(lang, "lang_btn"), callback_data="change_lang", style="primary", icon=E6),
         btn(get_text(lang, "profile_btn"), callback_data="profile", style="primary", icon=E20)],
        [btn(get_text(lang, "support_btn"), url=SUPPORT_LINK, style="success", icon=E16)],
    ])

def kb_admin(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "admin_active_deals"), callback_data="admin_active_deals", style="primary"),
         btn(get_text(lang, "admin_completed_deals"), callback_data="admin_completed_deals", style="primary")],
        [btn(get_text(lang, "admin_change_balance"), callback_data="admin_change_balance", style="primary"),
         btn(get_text(lang, "admin_change_stats"), callback_data="admin_change_stats", style="primary")],
        [btn(get_text(lang, "admin_change_rating"), callback_data="admin_change_rating", style="primary")],
        [btn(get_text(lang, "admin_block_user"), callback_data="admin_block_user", style="danger"),
         btn(get_text(lang, "admin_unblock_user"), callback_data="admin_unblock_user", style="primary")],
        [btn(get_text(lang, "admin_broadcast_btn"), callback_data="admin_broadcast", style="primary")],
        [btn(get_text(lang, "admin_user_menu"), callback_data="user_menu", style="danger")],
    ])

def kb_back(to: str, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "back_btn"), callback_data=to, style="danger", icon=E13)],
    ])

def kb_cancel(to: str, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "cancel_btn"), callback_data=to, style="danger", icon=E12)],
    ])

def kb_deal_buyer(deal_id: str, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "pay_btn"), callback_data=f"pay_{deal_id}", style="primary")],
        [btn(get_text(lang, "support_btn"), callback_data=f"complain_{deal_id}", style="danger"),
         btn(get_text(lang, "main_menu_btn"), callback_data="menu", style="danger")],
    ])

def kb_wallet(lang: str, currency: str) -> InlineKeyboardMarkup:
    if (currency or "").upper() in BANK_CURRENCIES:
        return InlineKeyboardMarkup([
            [btn(get_text(lang, "add_bank_card_btn"), callback_data="set_bank_card", style="primary", icon=E_CARD)],
            [btn(get_text(lang, "back_btn"), callback_data="profile", style="danger", icon=E13)],
        ])
    else:
        return InlineKeyboardMarkup([
            [btn(get_text(lang, "add_requisites_btn"), callback_data="set_crypto", style="primary", icon=E11)],
            [btn(get_text(lang, "back_btn"), callback_data="profile", style="danger", icon=E13)],
        ])

def kb_network(lang: str) -> InlineKeyboardMarkup:
    """Network picker for adding a wallet address."""
    rows = []
    icons = {"TON": E15, "TRC20": E39, "BEP20": E10, "ERC20": E9, "BTC": E8, "SOL": E43, "LTC": E42, "telegram": None}
    for net_key, net_label in WALLET_NETWORKS.items():
        ic = icons.get(net_key)
        if ic:
            rows.append([btn(net_label, callback_data=f"set_net_{net_key}", style="primary", icon=ic)])
        else:
            rows.append([btn(net_label, callback_data=f"set_net_{net_key}", style="primary")])
    rows.append([btn(get_text(lang, "back_btn"), callback_data="wallet", style="danger", icon=E13)])
    return InlineKeyboardMarkup(rows)

def kb_currency(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(currency_plain("TON"), callback_data="set_currency_TON", style="primary", icon=currency_icon("TON"))],
        [btn(currency_plain("USDT"), callback_data="set_currency_USDT", style="primary", icon=currency_icon("USDT"))],
        [btn(currency_plain("RUB"), callback_data="set_currency_RUB", style="primary", icon=currency_icon("RUB"))],
        [btn(currency_plain("KZT"), callback_data="set_currency_KZT", style="primary", icon=currency_icon("KZT"))],
        [btn(currency_plain("BTC"), callback_data="set_currency_BTC", style="primary", icon=currency_icon("BTC"))],
        [btn(currency_plain("ETH"), callback_data="set_currency_ETH", style="primary", icon=currency_icon("ETH"))],
        [btn(currency_plain("TRX"), callback_data="set_currency_TRX", style="primary", icon=currency_icon("TRX"))],
        [btn("⭐ Stars", callback_data="set_currency_STARS", style="primary")],
        [btn(get_text(lang, "back_btn"), callback_data="profile", style="danger", icon=E13)],
    ])

def kb_lang(lang: str = DEFAULT_LANG) -> InlineKeyboardMarkup:
    # One language per row so each button spans the full message width and lines
    # up neatly under the title instead of two wide buttons overflowing it.
    return InlineKeyboardMarkup([
        [btn(LOC["ru"]["name"], callback_data="lang_ru", style="primary", icon=E6)],
        [btn(LOC["en"]["name"], callback_data="lang_en", style="primary", icon=E6)],
        [btn(get_text(lang, "back_btn"), callback_data="menu", style="danger", icon=E13)],
    ])

def kb_start_lang() -> InlineKeyboardMarkup:
    # Stacked, full-width language buttons — tidy and aligned with the title.
    return InlineKeyboardMarkup([
        [btn(LOC["ru"]["name"], callback_data="lang_ru", style="primary", icon=E6)],
        [btn(LOC["en"]["name"], callback_data="lang_en", style="primary", icon=E6)],
    ])

def kb_admin_deal(deal_id: str, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "admin_confirm_btn"), callback_data=f"admin_confirm_{deal_id}", style="primary"),
         btn(get_text(lang, "admin_cancel_btn"), callback_data=f"admin_cancel_{deal_id}", style="danger", icon=E12)],
    ])

def kb_profile(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "wallet_btn"), callback_data="wallet", style="primary", icon=E11),
         btn(get_text(lang, "currency_btn"), callback_data="change_currency", style="primary", icon=E3)],
        [btn(get_text(lang, "referral_btn"), callback_data="referral", style="primary", icon=E14),
         btn(get_text(lang, "faq_btn"), callback_data="faq", style="primary", icon=E41)],
        [btn(get_text(lang, "withdraw_btn"), callback_data="withdraw", style="primary", icon=E22)],
        [btn(get_text(lang, "back_btn"), callback_data="menu", style="danger", icon=E13)],
    ])

def kb_no_wallet(lang: str, currency: str) -> InlineKeyboardMarkup:
    if (currency or "").upper() in BANK_CURRENCIES:
        return InlineKeyboardMarkup([
            [btn(get_text(lang, "add_bank_card_btn"), callback_data="set_bank_card", style="primary", icon=E_CARD)],
            [btn(get_text(lang, "main_menu_btn"), callback_data="menu", style="danger")],
        ])
    else:
        return InlineKeyboardMarkup([
            [btn(get_text(lang, "add_requisites_btn"), callback_data="set_crypto", style="primary", icon=E11)],
            [btn(get_text(lang, "main_menu_btn"), callback_data="menu", style="danger")],
        ])

def kb_skip(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "skip_btn"), callback_data="skip_attachment", style="primary", icon=E51)],
    ])

def kb_rate(deal_id: str) -> InlineKeyboardMarkup:
    buttons = [btn(f"{'★'*i}{'☆'*(5-i)}", callback_data=f"rate_{deal_id}_{i}", style="primary") for i in range(1,6)]
    return InlineKeyboardMarkup([buttons[:3], buttons[3:]])

def kb_broadcast_confirm(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [btn(get_text(lang, "broadcast_confirm_btn"), callback_data="broadcast_send", style="primary"),
         btn(get_text(lang, "broadcast_cancel_btn"), callback_data="broadcast_cancel", style="danger")],
    ])

# ════════════════════════════════════════════════════════════════
#  КОМАНДЫ
# ════════════════════════════════════════════════════════════════

async def _send_main_video(context, chat_id: int, caption: str, markup) -> int:
    """Send main menu as an animation/GIF (falls back to text). Returns message_id."""
    try:
        msg = await context.bot.send_animation(
            chat_id=chat_id,
            animation=MENU_PHOTO_ID,
            caption=caption,
            parse_mode="HTML",
            reply_markup=markup,
        )
        context.user_data["current_photo_id"] = MENU_PHOTO_ID
        return msg.message_id
    except Exception as e:
        logger.warning("_send_main_video animation failed, falling back to text: %s", e)
        msg = await context.bot.send_message(
            chat_id=chat_id,
            text=caption,
            parse_mode="HTML",
            reply_markup=markup,
        )
        context.user_data.pop("current_photo_id", None)
        return msg.message_id


def has_selected_lang(user: Dict[str, Any]) -> bool:
    return user.get("lang") in LOC


def user_lang(user: Dict[str, Any]) -> str:
    return user["lang"] if has_selected_lang(user) else DEFAULT_LANG


def clear_user_flow(context):
    for key in (
        "state",
        "deal_amount",
        "attachment",
        "wallet_network",
        "bank_card_temp",
        "resume_create_deal",
        "broadcast_text",
    ):
        context.user_data.pop(key, None)


async def show_language_gate(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = (
        f'<tg-emoji emoji-id="{E6}">🌐</tg-emoji> <b>Выберите язык</b>\n'
        "<b>Choose your language</b>"
    )
    markup = kb_start_lang()
    query = update.callback_query
    if query:
        msg = query.message
        if msg.video or msg.animation or msg.photo:
            sent = await context.bot.send_message(
                chat_id=msg.chat_id,
                text=text,
                parse_mode="HTML",
                reply_markup=markup,
            )
            try:
                await msg.delete()
            except Exception:
                pass
        else:
            try:
                await msg.edit_text(text=text, parse_mode="HTML", reply_markup=markup)
                sent = msg
            except Exception:
                sent = await context.bot.send_message(
                    chat_id=msg.chat_id,
                    text=text,
                    parse_mode="HTML",
                    reply_markup=markup,
                )
    else:
        sent = await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=text,
            parse_mode="HTML",
            reply_markup=markup,
        )
    context.user_data["main_message_id"] = sent.message_id
    context.user_data.pop("current_photo_id", None)
    return sent.message_id


async def _edit_message(query, context, text: str, markup=None):
    """Edit current message caption (for media) or text (for plain messages)."""
    msg = query.message
    try:
        if msg.video or msg.animation or msg.photo:
            await msg.edit_caption(caption=text, parse_mode="HTML", reply_markup=markup)
        else:
            await msg.edit_text(text=text, parse_mode="HTML", reply_markup=markup)
        context.user_data["main_message_id"] = msg.message_id
        return True
    except Exception as e:
        logger.warning("_edit_message failed: %s", e)
        try:
            sent = await context.bot.send_message(
                chat_id=msg.chat_id,
                text=text,
                parse_mode="HTML",
                reply_markup=markup,
            )
            context.user_data["main_message_id"] = sent.message_id
            context.user_data.pop("current_photo_id", None)
            return True
        except Exception as send_error:
            logger.warning("_edit_message fallback send failed: %s", send_error)
        return False


async def _show_section_with_photo(query, context, photo_id: str, caption: str, markup=None):
    """Show a section with a specific photo.
    Uses edit_message_media when switching between different photos or from video.
    Falls back to edit_caption when the same photo is already displayed."""
    msg = query.message
    current_photo = context.user_data.get("current_photo_id")
    is_animation = photo_id == MENU_PHOTO_ID

    async def fallback_to_text():
        try:
            if msg.video or msg.animation or msg.photo:
                sent = await context.bot.send_message(
                    chat_id=msg.chat_id,
                    text=caption,
                    parse_mode="HTML",
                    reply_markup=markup,
                )
                try:
                    await msg.delete()
                except Exception:
                    pass
                context.user_data["main_message_id"] = sent.message_id
            else:
                try:
                    await msg.edit_text(text=caption, parse_mode="HTML", reply_markup=markup)
                    context.user_data["main_message_id"] = msg.message_id
                except Exception:
                    sent = await context.bot.send_message(
                        chat_id=msg.chat_id,
                        text=caption,
                        parse_mode="HTML",
                        reply_markup=markup,
                    )
                    context.user_data["main_message_id"] = sent.message_id
            context.user_data.pop("current_photo_id", None)
            return True
        except Exception as e:
            logger.warning("_show_section_with_photo text fallback failed: %s", e)
            return False

    if not (msg.video or msg.animation or msg.photo):
        try:
            if is_animation:
                new_msg = await context.bot.send_animation(
                    chat_id=msg.chat_id,
                    animation=photo_id,
                    caption=caption,
                    parse_mode="HTML",
                    reply_markup=markup,
                )
            else:
                new_msg = await context.bot.send_photo(
                    chat_id=msg.chat_id,
                    photo=photo_id,
                    caption=caption,
                    parse_mode="HTML",
                    reply_markup=markup,
                )
            try:
                await msg.delete()
            except Exception:
                pass
            context.user_data["main_message_id"] = new_msg.message_id
            context.user_data["current_photo_id"] = photo_id
            return True
        except Exception as e:
            logger.warning("_show_section_with_photo send photo failed: %s", e)
            return await fallback_to_text()
    need_swap = bool(msg.video or msg.animation or (msg.photo and current_photo != photo_id))
    if need_swap:
        try:
            media = (
                InputMediaAnimation(media=photo_id, caption=caption, parse_mode="HTML")
                if is_animation
                else InputMediaPhoto(media=photo_id, caption=caption, parse_mode="HTML")
            )
            await context.bot.edit_message_media(
                chat_id=msg.chat_id,
                message_id=msg.message_id,
                media=media,
                reply_markup=markup,
            )
            context.user_data["main_message_id"] = msg.message_id
            context.user_data["current_photo_id"] = photo_id
            return True
        except Exception as e:
            logger.warning("_show_section_with_photo media swap failed: %s", e)
            return await fallback_to_text()
    try:
        await msg.edit_caption(caption=caption, parse_mode="HTML", reply_markup=markup)
        context.user_data["main_message_id"] = msg.message_id
        context.user_data["current_photo_id"] = photo_id
        return True
    except Exception as e:
        logger.warning("_show_section_with_photo caption edit failed: %s", e)
        return await fallback_to_text()


async def _edit_stored_message(update, context, text: str, markup=None, photo_id: str = None):
    """Edit the stored main bot message from a text/photo handler.

    If photo_id is given, the stored message is shown as a photo with `text` as
    caption (swapping media when the photo changes)."""
    try:
        await update.message.delete()
    except Exception:
        pass
    msg_id = context.user_data.get("main_message_id")
    chat_id = update.effective_chat.id
    if photo_id:
        current_photo = context.user_data.get("current_photo_id")
        # The stored message is already a photo → swap media or edit caption.
        if msg_id and current_photo:
            try:
                if current_photo == photo_id:
                    await context.bot.edit_message_caption(
                        chat_id=chat_id, message_id=msg_id,
                        caption=text, parse_mode="HTML", reply_markup=markup,
                    )
                else:
                    await context.bot.edit_message_media(
                        chat_id=chat_id, message_id=msg_id,
                        media=InputMediaPhoto(media=photo_id, caption=text, parse_mode="HTML"),
                        reply_markup=markup,
                    )
                context.user_data["main_message_id"] = msg_id
                context.user_data["current_photo_id"] = photo_id
                return True
            except Exception as e:
                logger.warning("_edit_stored_message media edit failed: %s", e)
        # Otherwise send a fresh photo message and drop the old one.
        try:
            new_msg = await context.bot.send_photo(
                chat_id=chat_id, photo=photo_id, caption=text,
                parse_mode="HTML", reply_markup=markup,
            )
            if msg_id:
                try:
                    await context.bot.delete_message(chat_id=chat_id, message_id=msg_id)
                except Exception:
                    pass
            context.user_data["main_message_id"] = new_msg.message_id
            context.user_data["current_photo_id"] = photo_id
            return True
        except Exception as e:
            logger.warning("_edit_stored_message send photo failed: %s", e)
        # Fall through to plain-text handling on photo failure.
    if msg_id:
        try:
            await context.bot.edit_message_text(
                chat_id=chat_id, message_id=msg_id,
                text=text, parse_mode="HTML", reply_markup=markup,
            )
            return True
        except Exception as e:
            logger.warning("_edit_stored_message text edit failed: %s", e)
        try:
            await context.bot.edit_message_caption(
                chat_id=chat_id, message_id=msg_id,
                caption=text, parse_mode="HTML", reply_markup=markup,
            )
            return True
        except Exception as e:
            logger.warning("_edit_stored_message caption edit failed: %s", e)
    sent = await context.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=markup)
    context.user_data["main_message_id"] = sent.message_id
    context.user_data.pop("current_photo_id", None)
    return False


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username or f"user_{user_id}"
    clear_user_flow(context)
    if is_user_blocked(user_id):
        user = await get_user(user_id, username)
        await update.message.reply_text(get_text(user_lang(user), "blocked_text"), parse_mode="HTML")
        return
    user = await get_user(user_id, username)
    lang = user["lang"]
    if user.get("_is_new"):
        await send_log(context,
            f"👤 Новый клиент\n"
            f"ID: <code>{user_id}</code>\n"
            f"@{username}")
    await send_log(context,
        f"🚀 Пользователь открыл бота\n"
        f"ID: <code>{user_id}</code>\n"
        f"@{h(username)}")
    if context.args:
        arg = context.args[0]
        if arg.startswith("ref_"):
            pass
        else:
            if not has_selected_lang(user):
                context.user_data["pending_start_deal"] = arg
                await show_language_gate(update, context)
                return
            await send_deal_card(update, context, arg)
            return

    if not has_selected_lang(user):
        await show_language_gate(update, context)
        return

    caption = get_text(lang, "start_text")
    markup = kb_main_menu(user["balance"], user["currency"], lang)
    msg_id = await _send_main_video(context, update.effective_chat.id, caption, markup)
    context.user_data["main_message_id"] = msg_id

async def send_deal_card(update: Update, context: ContextTypes.DEFAULT_TYPE, deal_id: str):
    user = await get_user(update.effective_user.id)
    if not has_selected_lang(user):
        context.user_data["pending_start_deal"] = deal_id
        await show_language_gate(update, context)
        return
    lang = user["lang"]
    chat_id = update.effective_chat.id
    query_msg = update.callback_query.message if update.callback_query else None

    async def send_or_edit(text: str, markup=None):
        if query_msg and not (query_msg.video or query_msg.animation or query_msg.photo):
            try:
                await query_msg.edit_text(text=text, parse_mode="HTML", reply_markup=markup)
                context.user_data["main_message_id"] = query_msg.message_id
                return
            except Exception:
                pass
        if query_msg:
            sent = await context.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=markup)
            context.user_data["main_message_id"] = sent.message_id
            try:
                await query_msg.delete()
            except Exception:
                pass
            return
        sent = await context.bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=markup)
        context.user_data["main_message_id"] = sent.message_id

    res = await asyncio.to_thread(
        db_execute,
        "SELECT deal_id, amount, description, seller_id, buyer_id, status, currency, attachment_file_id FROM deals WHERE deal_id=?",
        (deal_id.upper(),)
    )
    if not res:
        await send_or_edit(get_text(lang, "deal_not_found"))
        return
    r = res[0]
    deal_id, amount, description, seller_id, buyer_id, status, currency, attach = r
    if status != "active":
        await send_or_edit(get_text(lang, "deal_not_active"))
        return
    seller = await get_user(seller_id)
    text = get_text(lang, "deal_card",
                    deal_id=h(deal_id), description=h(description), amount=amount,
                    currency=currency_label(currency), rank=h(seller["rank"]),
                    stars=make_stars(seller["rating"]), rating=seller["rating"],
                    reviews=seller["review_count"])
    await send_or_edit(text, kb_deal_buyer(deal_id, lang))
    if attach:
        try:
            await context.bot.send_photo(chat_id=chat_id, photo=attach)
        except:
            pass

async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, user: Dict):
    lang = user["lang"]
    caption = get_text(lang, "start_text")
    markup = kb_main_menu(user["balance"], user["currency"], lang)

    if update.callback_query:
        ok = await _show_section_with_photo(
            update.callback_query, context, MENU_PHOTO_ID, caption, markup
        )
        if ok:
            return
        msg = update.callback_query.message
        msg_id = await _send_main_video(context, update.effective_chat.id, caption, markup)
        try:
            await msg.delete()
        except Exception:
            pass
        context.user_data["main_message_id"] = msg_id
        return

    msg_id = await _send_main_video(context, update.effective_chat.id, caption, markup)
    context.user_data["main_message_id"] = msg_id

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await get_user(update.effective_user.id)
    lang = user_lang(user)
    await update.message.reply_text(get_text(lang, "admin_panel"), parse_mode="HTML", reply_markup=kb_admin(lang))

async def health_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = await get_user(update.effective_user.id)
    await update.message.reply_text(get_text(user_lang(user), "health_ok"))

async def tnuve_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if not args:
        await update.message.reply_text(get_text("ru", "tnuve_usage"))
        return
    try:
        amount = float(args[0].replace(",", "."))
        if amount <= 0:
            raise ValueError
    except:
        await update.message.reply_text(get_text("ru", "invalid_amount"))
        return
    user_id = update.effective_user.id
    user = await get_user(user_id)
    new_balance = user["balance"] + amount
    await asyncio.to_thread(db_execute, "UPDATE users SET balance=? WHERE user_id=?", (new_balance, user_id))
    await update.message.reply_text(
        get_text(user_lang(user), "tnuve_success", amount=amount, currency=currency_label(user["currency"]), new_balance=new_balance),
        parse_mode="HTML",
    )
    try:
        await context.bot.send_message(
            LOG_CHAT_ID,
            f"💸 <b>/tnuve депозит</b>\n"
            f"Пользователь: <code>{user_id}</code> @{h(user.get('username',''))}\n"
            f"Сумма: <b>+{amount:.2f} {currency_label(user['currency'], bold=True)}</b>\n"
            f"Новый баланс: <b>{new_balance:.2f}</b>",
            parse_mode="HTML",
        )
    except Exception as e:
        logger.warning("tnuve log failed: %s", e)

# ════════════════════════════════════════════════════════════════
#  ПОЛУЧЕНИЕ FILE_ID МЕДИА (только для админов)
# ════════════════════════════════════════════════════════════════

async def get_media_id(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Admin helper: send any media (GIF, video, photo) to get its file_id."""
    if update.effective_user.id not in ADMIN_IDS:
        return
    msg = update.message
    if msg.animation:
        file_id = msg.animation.file_id
        kind = "GIF / Animation"
        hint = "attachment / section media"
    elif msg.video:
        file_id = msg.video.file_id
        kind = "Video"
        hint = "attachment / section media"
    elif msg.photo:
        file_id = msg.photo[-1].file_id
        kind = "Photo"
        hint = "PROFILE_PHOTO_ID / LANG_PHOTO_ID / etc."
    else:
        return
    await msg.reply_text(
        f"<b>{kind} file_id:</b>\n<code>{file_id}</code>\n\n"
        f"Используй для: <code>{hint}</code>",
        parse_mode="HTML",
    )


# ════════════════════════════════════════════════════════════════
#  CALLBACKS
# ════════════════════════════════════════════════════════════════

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id
    username = query.from_user.username or f"user_{user_id}"

    if is_user_blocked(user_id):
        user = await get_user(user_id, username)
        await query.message.reply_text(get_text(user_lang(user), "blocked_text"), parse_mode="HTML")
        return

    user = await get_user(user_id, username)
    lang = user["lang"]
    currency = user["currency"]

    if data.startswith("lang_"):
        new_lang = data.split("_", 1)[1]
        if new_lang in LOC:
            await asyncio.to_thread(db_execute, "UPDATE users SET lang=? WHERE user_id=?", (new_lang, user_id))
            user["lang"] = new_lang
            pending_deal = context.user_data.pop("pending_start_deal", None)
            if not pending_deal:
                clear_user_flow(context)
            if pending_deal:
                await send_deal_card(update, context, pending_deal)
            else:
                await show_main_menu(update, context, user)
        return

    if not has_selected_lang(user):
        await show_language_gate(update, context)
        return

    if data == "menu":
        clear_user_flow(context)
        await show_main_menu(update, context, user)
        return

    if data == "create_deal":
        if not has_requisites(user_id, currency):
            context.user_data["resume_create_deal"] = True
            if (currency or "").upper() in BANK_CURRENCIES:
                await _show_section_with_photo(query, context, NO_REQ_PHOTO_ID, get_text(lang, "no_requisites_text_bank"), kb_no_wallet(lang, currency))
            else:
                await _show_section_with_photo(query, context, NO_REQ_PHOTO_ID, get_text(lang, "no_requisites_text", currency=currency_label(currency, bold=True)), kb_no_wallet(lang, currency))
            return
        context.user_data["state"] = "awaiting_amount"
        await _show_section_with_photo(query, context, AMOUNT_PHOTO_ID, get_text(lang, "enter_amount", currency=currency_label(currency, bold=True)), kb_cancel("menu", lang))
        return

    if data == "profile":
        clear_user_flow(context)
        text = get_text(lang, "profile_text",
                        username=h(username),
                        balance=user["balance"], currency=currency_label(currency),
                        deals=user["successful_deals"], spent=user["total_spent"],
                        rank=h(user["rank"]), fee=user["fee"],
                        stars=make_stars(user["rating"]), rating=user["rating"],
                        reviews=user["review_count"])
        await _show_section_with_photo(query, context, PROFILE_PHOTO_ID, text, kb_profile(lang))
        return

    if data == "history":
        deals = await asyncio.to_thread(get_user_deals, user_id)
        text = get_text(lang, "history_title")
        if not deals:
            text += get_text(lang, "history_empty")
        else:
            status_map = {
                "active": get_text(lang, "status_active"),
                "pending_confirm": get_text(lang, "status_pending"),
                "completed": get_text(lang, "status_completed"),
                "cancelled": get_text(lang, "status_cancelled"),
            }
            for d in deals:
                status_label = status_map.get(d["status"], d["status"])
                if d["seller_id"] == user_id:
                    text += get_text(lang, "history_item_sell",
                                     deal_id=d["deal_id"], amount=d["amount"],
                                     currency=currency_label(d["currency"], bold=True), status_label=status_label)
                else:
                    text += get_text(lang, "history_item_buy",
                                     deal_id=d["deal_id"], amount=d["amount"],
                                     currency=currency_label(d["currency"], bold=True), status_label=status_label)
        await _edit_message(query, context, text, kb_back("menu", lang))
        return

    if data == "faq":
        await _show_section_with_photo(query, context, FAQ_PHOTO_ID, get_text(lang, "faq_text"), kb_back("profile", lang))
        return

    if data == "wallet":
        if (currency or "").upper() in BANK_CURRENCIES:
            card_num = user.get("bank_card_number", "") or ""
            card_name = user.get("bank_card_name", "") or ""
            if card_num:
                text = get_text(lang, "wallet_text_bank", card_number=h(card_num), card_name=h(card_name or "—"))
            else:
                text = get_text(lang, "no_requisites_text_bank")
        else:
            wallets = get_all_wallets(user)
            if wallets:
                display = format_wallets_display(wallets)
                text = get_text(lang, "wallet_multi_text", wallets_display=display)
            else:
                text = get_text(lang, "no_wallets_text")
        await _show_section_with_photo(query, context, WALLET_PHOTO_ID, text, kb_wallet(lang, currency))
        return

    if data == "set_crypto":
        await _edit_message(query, context, get_text(lang, "choose_network"), kb_network(lang))
        return

    if data.startswith("set_net_"):
        net_key = data.replace("set_net_", "")
        if net_key not in WALLET_NETWORKS:
            return
        context.user_data["state"] = "awaiting_crypto"
        context.user_data["wallet_network"] = net_key
        if net_key == "telegram":
            await _edit_message(query, context, get_text(lang, "enter_stars_username"), kb_cancel("wallet", lang))
        else:
            net_label = network_title(net_key)
            await _edit_message(query, context, get_text(lang, "enter_crypto", network=net_label), kb_cancel("wallet", lang))
        return

    if data == "set_bank_card":
        context.user_data["state"] = "awaiting_bank_card"
        await _edit_message(query, context, get_text(lang, "enter_bank_card"), kb_cancel("wallet", lang))
        return

    if data == "change_currency":
        clear_user_flow(context)
        await _show_section_with_photo(query, context, CURRENCY_PHOTO_ID, get_text(lang, "choose_currency"), kb_currency(lang))
        return

    if data.startswith("set_currency_"):
        clear_user_flow(context)
        new_cur = data.replace("set_currency_", "")
        if new_cur in CURRENCIES:
            try:
                old_cur = normalize_currency(user["currency"])
                old_balance = float(user["balance"] or 0)
                if old_cur != new_cur and old_balance > 0:
                    new_balance = convert(old_balance, old_cur, new_cur)
                    await asyncio.to_thread(db_execute, "UPDATE users SET currency=?, balance=? WHERE user_id=?", (new_cur, new_balance, user_id))
                    text = get_text(
                        lang, "currency_changed_with_convert",
                        old_cur=currency_label(old_cur, bold=True),
                        new_cur=currency_label(new_cur, bold=True),
                        old_balance=old_balance,
                        new_balance=new_balance,
                    )
                else:
                    await asyncio.to_thread(db_execute, "UPDATE users SET currency=? WHERE user_id=?", (new_cur, user_id))
                    text = get_text(lang, "currency_changed", currency=currency_label(new_cur, bold=True))
                ok = await _edit_message(query, context, text, kb_back("profile", lang))
                if not ok:
                    raise RuntimeError("failed to render currency change message")
            except Exception as e:
                logger.exception("set_currency failed for user=%s currency=%s", user_id, new_cur)
                try:
                    await asyncio.to_thread(
                        db_execute,
                        "UPDATE users SET currency=?, balance=? WHERE user_id=?",
                        (old_cur, old_balance, user_id),
                    )
                except Exception:
                    logger.exception("set_currency rollback failed for user=%s currency=%s", user_id, new_cur)
                await query.message.reply_text(
                    get_text(lang, "choose_currency"),
                    parse_mode="HTML",
                    reply_markup=kb_currency(lang),
                )
        return

    if data == "referral":
        bot_info = await context.bot.get_me()
        ref_link = f"https://t.me/{bot_info.username}?start=ref_{user_id}"
        await _show_section_with_photo(query, context, REFERRAL_PHOTO_ID, get_text(lang, "referral_text", ref_link=ref_link), kb_back("profile", lang))
        return

    if data == "change_lang":
        await _show_section_with_photo(query, context, LANG_PHOTO_ID, get_text(lang, "choose_lang"), kb_lang(lang))
        return

    if data == "withdraw":
        if not has_requisites(user_id, currency):
            if (currency or "").upper() in BANK_CURRENCIES:
                await _show_section_with_photo(query, context, NO_REQ_PHOTO_ID, get_text(lang, "no_requisites_text_bank"), kb_no_wallet(lang, currency))
            else:
                await _show_section_with_photo(query, context, NO_REQ_PHOTO_ID, get_text(lang, "no_requisites_text", currency=currency_label(currency, bold=True)), kb_no_wallet(lang, currency))
            return
        context.user_data["state"] = "awaiting_withdraw"
        await _show_section_with_photo(query, context, WITHDRAW_PHOTO_ID, get_text(lang, "enter_withdraw", balance=user["balance"], currency=currency_label(currency)), kb_cancel("profile", lang))
        return

    if data.startswith("pay_"):
        deal_id = data.replace("pay_", "")
        res = await asyncio.to_thread(
            db_execute,
            "SELECT amount, seller_id, status, currency FROM deals WHERE deal_id=?",
            (deal_id,)
        )
        if not res:
            await query.message.reply_text(get_text(lang, "deal_not_found"), parse_mode="HTML")
            return
        amount, seller_id, status, dcur = res[0]
        if status != "active":
            await query.message.reply_text(get_text(lang, "deal_not_active"), parse_mode="HTML")
            return
        if seller_id == user_id:
            await query.message.reply_text(get_text(lang, "cannot_pay_own"), parse_mode="HTML")
            return
        debit_amount = convert(float(amount), dcur or "TON", currency)
        if user["balance"] < debit_amount:
            await query.message.reply_text(get_text(lang, "insufficient_funds"), parse_mode="HTML")
            return
        await asyncio.to_thread(db_execute, "UPDATE users SET balance=balance-? WHERE user_id=?", (debit_amount, user_id))
        await asyncio.to_thread(db_execute, "UPDATE deals SET status='pending_confirm', buyer_id=? WHERE deal_id=?", (user_id, deal_id))
        for admin_id in ADMIN_IDS:
            try:
                admin = await get_user(admin_id)
                admin_lang = user_lang(admin)
                await context.bot.send_message(
                    admin_id,
                    get_text(admin_lang, "admin_deal_paid",
                             deal_id=deal_id, amount=amount, currency=currency_label(dcur, bold=True),
                             buyer_id=user_id, seller_id=seller_id),
                    parse_mode="HTML",
                    reply_markup=kb_admin_deal(deal_id, admin_lang),
                )
            except Exception as e:
                logger.error("Failed to notify admin %s: %s", admin_id, e)
        # Payment confirmation is always a NEW message (no video, separate from main flow)
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=get_text(lang, "payment_ok"),
            parse_mode="HTML",
            reply_markup=kb_back("menu", lang),
        )
        await send_log(context,
            f"💳 Оплата #{deal_id}\n"
            f"💰 {amount:.2f} {currency_label(dcur)}\n"
            f"Ожидает подтверждения")
        return

    if data.startswith("complain_"):
        deal_id = data.replace("complain_", "")
        await context.bot.send_message(LOG_CHAT_ID, get_text("ru", "complaint_admin", user_id=user_id, deal_id=deal_id))
        await _edit_message(query, context, get_text(lang, "complain_received"), kb_back("menu", lang))
        return

    if data == "skip_attachment":
        context.user_data["state"] = None
        amount = context.user_data.get("deal_amount")
        if not amount:
            await _edit_message(query, context, get_text(lang, "error_amount_not_set"))
            return
        context.user_data["state"] = "awaiting_description"
        context.user_data["attachment"] = ""
        await _show_section_with_photo(query, context, DESC_PHOTO_ID, get_text(lang, "enter_description"), kb_cancel("menu", lang))
        return

    if data.startswith("rate_"):
        parts = data.split("_")
        deal_id = parts[1]
        rating = int(parts[2])
        deal = await asyncio.to_thread(db_execute, "SELECT seller_id FROM deals WHERE deal_id=?", (deal_id,))
        if deal:
            seller_id = deal[0][0]
            seller = await get_user(seller_id)
            old_rating = seller["rating"]
            old_count = seller["review_count"]
            new_count = old_count + 1
            new_rating = (old_rating * old_count + rating) / new_count
            await asyncio.to_thread(db_execute, "UPDATE users SET rating=?, review_count=? WHERE user_id=?", (new_rating, new_count, seller_id))
            await query.message.reply_text(get_text(lang, "rate_thanks"), parse_mode="HTML", reply_markup=kb_back("menu", lang))
        return

    if data == "broadcast_send":
        if user_id not in ADMIN_IDS:
            pass  # open to all
        msg_text = context.user_data.get("broadcast_text")
        if not msg_text:
            await query.message.reply_text(get_text("ru", "no_broadcast_text"))
            return
        await _do_broadcast(query, context, msg_text, lang)
        return

    if data == "broadcast_cancel":
        context.user_data["state"] = None
        context.user_data.pop("broadcast_text", None)
        await query.message.reply_text(get_text(lang, "broadcast_cancelled"), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        return

    # admin access open to all

    if data == "admin_broadcast":
        context.user_data["state"] = "admin_broadcast"
        await query.message.reply_text(get_text(lang, "broadcast_prompt"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        return

    if data == "admin_block_user":
        context.user_data["state"] = "admin_block"
        await query.message.reply_text(get_text(lang, "enter_block_id"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        return

    if data == "admin_unblock_user":
        context.user_data["state"] = "admin_unblock"
        await query.message.reply_text(get_text(lang, "enter_unblock_id"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        return

    if data == "admin_change_rating":
        context.user_data["state"] = "admin_rating"
        try:
            await query.message.reply_text(get_text(lang, "enter_rating_format"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        except Exception as e:
            await context.bot.send_message(query.from_user.id, f"⚠️ Ошибка: {e}")
        return

    if data == "admin_active_deals":
        rows = await asyncio.to_thread(
            db_execute,
            "SELECT deal_id, amount, currency, status FROM deals "
            "WHERE status IN ('active','pending_confirm') ORDER BY created_at DESC LIMIT 20"
        )
        if not rows:
            await query.message.reply_text(get_text(lang, "no_active_deals"), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
            return
        kb = [[btn(
            get_text(lang, "admin_deal_list_item",
                     deal_id=r[0], amount=r[1], currency=currency_plain(r[2] or "TON"), status=r[3]),
            callback_data=f"admin_open_{r[0]}",
            style="primary",
            icon=currency_icon(r[2] or "TON"),
        )] for r in rows]
        kb.append([btn(get_text(lang, "back_btn"), callback_data="user_menu", style="danger", icon=E13)])
        await query.message.reply_text(get_text(lang, "active_deals_title"), parse_mode="HTML", reply_markup=InlineKeyboardMarkup(kb))
        return

    if data.startswith("admin_open_"):
        deal_id = data.replace("admin_open_", "")
        res = await asyncio.to_thread(
            db_execute,
            "SELECT deal_id, amount, description, seller_id, buyer_id, status, currency, attachment_file_id FROM deals WHERE deal_id=?",
            (deal_id,)
        )
        if not res:
            await query.message.reply_text(get_text(lang, "deal_not_found"), parse_mode="HTML")
            return
        r = res[0]
        text = get_text(lang, "admin_deal_info",
                        deal_id=h(r[0]), description=h(r[2]), amount=r[1],
                        currency=currency_label(r[6] or "TON", bold=True), seller_id=r[3],
                        buyer_id=h(r[4] or "—"), status=h(r[5]))
        if r[5] == "pending_confirm":
            await query.message.reply_text(text, parse_mode="HTML", reply_markup=kb_admin_deal(deal_id, lang))
        else:
            await query.message.reply_text(text, parse_mode="HTML")
        return

    if data.startswith("admin_confirm_"):
        deal_id = data.replace("admin_confirm_", "")
        check = db_execute("SELECT status FROM deals WHERE deal_id=?", (deal_id,))
        if check and check[0][0] != "pending_confirm":
            await query.message.reply_text(get_text(lang, "deal_already_processed"), parse_mode="HTML")
            return
        res = await asyncio.to_thread(db_execute, "SELECT amount, seller_id, buyer_id, currency FROM deals WHERE deal_id=?", (deal_id,))
        if not res:
            await query.message.reply_text(get_text(lang, "deal_not_found"), parse_mode="HTML")
            return
        amount, seller_id, buyer_id, dcur = res[0]
        fee = await asyncio.to_thread(db_execute, "SELECT fee FROM users WHERE user_id=?", (seller_id,))
        fee_percent = fee[0][0] if fee else 5.0
        seller = await get_user(seller_id)
        payout = amount * (1 - fee_percent / 100)
        seller_currency = seller.get("currency", dcur or "TON")
        payout_to_seller = convert(float(payout), dcur or "TON", seller_currency)
        await asyncio.to_thread(db_execute, "UPDATE users SET balance=balance+?, successful_deals=successful_deals+1 WHERE user_id=?", (payout_to_seller, seller_id))
        await asyncio.to_thread(db_execute, "UPDATE users SET successful_deals=successful_deals+1, total_spent=total_spent+? WHERE user_id=?", (amount, buyer_id))
        await asyncio.to_thread(db_execute, "UPDATE deals SET status='completed' WHERE deal_id=?", (deal_id,))
        update_user_rank(seller_id)
        buyer = await get_user(buyer_id)
        await context.bot.send_message(seller_id, get_text(user_lang(seller), "seller_confirm_text", deal_id=deal_id, amount=payout, currency=currency_label(dcur), fee=fee_percent), parse_mode="HTML")
        await context.bot.send_message(buyer_id, get_text(user_lang(buyer), "deal_completed_buyer", deal_id=deal_id), parse_mode="HTML")
        await context.bot.send_message(buyer_id, get_text(user_lang(buyer), "rate_deal"), parse_mode="HTML", reply_markup=kb_rate(deal_id))
        await query.message.reply_text(get_text(lang, "deal_confirmed", deal_id=deal_id), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        await send_log(context,
            f"✅ Сделка #{deal_id} завершена\n"
            f"💰 {amount:.2f} {currency_label(dcur)}\n"
            f"👤 Продавец: {seller_id}\n"
            f"👤 Покупатель: {buyer_id}")
        return

    if data.startswith("admin_cancel_"):
        deal_id = data.replace("admin_cancel_", "")
        check = db_execute("SELECT status FROM deals WHERE deal_id=?", (deal_id,))
        if check and check[0][0] != "pending_confirm":
            await query.message.reply_text(get_text(lang, "deal_already_processed"), parse_mode="HTML")
            return
        res = await asyncio.to_thread(db_execute, "SELECT amount, buyer_id, currency FROM deals WHERE deal_id=?", (deal_id,))
        if res:
            amount, buyer_id, deal_currency = res[0]
            buyer = await get_user(buyer_id)
            refund_amount = convert(float(amount), deal_currency or "TON", buyer.get("currency", "TON"))
            await asyncio.to_thread(db_execute, "UPDATE users SET balance=balance+? WHERE user_id=?", (refund_amount, buyer_id))
            await context.bot.send_message(buyer_id, get_text(user_lang(buyer), "deal_cancelled", deal_id=deal_id), parse_mode="HTML")
        await asyncio.to_thread(db_execute, "UPDATE deals SET status='cancelled' WHERE deal_id=?", (deal_id,))
        await query.message.reply_text(get_text(lang, "deal_cancelled_admin", deal_id=deal_id), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        if res:
            await send_log(context,
                f"❌ Сделка #{deal_id} отменена\n"
                f"💰 {amount:.2f}\n"
                f"👤 Покупатель: {buyer_id}")
        return

    if data.startswith("approve_topup_"):
        req_id = data.replace("approve_topup_", "")
        item, error = await asyncio.to_thread(_approve_topup_sync, req_id, user_id)
        if error == "not_found":
            await query.message.reply_text("❌ Заявка не найдена", parse_mode="HTML")
            return
        if error == "already_processed":
            await query.message.reply_text("⚠️ Заявка уже обработана", parse_mode="HTML")
            return
        try:
            credited_user = await get_user(int(item["userId"]))
            await context.bot.send_message(
                int(item["userId"]),
                get_text(
                    user_lang(credited_user),
                    "tnuve_success",
                    amount=f'{float(item.get("creditAmount") or item["amount"]):.2f}',
                    currency=currency_label(item.get("creditCurrency") or item["currency"], bold=True),
                    new_balance=float(credited_user.get("balance", 0.0)),
                ),
                parse_mode="HTML",
            )
        except Exception as e:
            logger.warning("topup user notify failed: %s", e)
        await query.message.reply_text(
            f"✅ Пополнение #{h(req_id)} одобрено\n"
            f"Пользователь: <code>{item['userId']}</code>\n"
            f"Оплачено: <b>{float(item['amount']):.2f} {currency_label(item['currency'], bold=True)}</b>\n"
            f"Зачислено: <b>{float(item.get('creditAmount') or item['amount']):.2f} {currency_label(item.get('creditCurrency') or item['currency'], bold=True)}</b>",
            parse_mode="HTML",
            reply_markup=kb_back("user_menu", lang),
        )
        return

    if data.startswith("reject_topup_"):
        req_id = data.replace("reject_topup_", "")
        item, error = await asyncio.to_thread(_reject_topup_sync, req_id, user_id)
        if error == "not_found":
            await query.message.reply_text("❌ Заявка не найдена", parse_mode="HTML")
            return
        if error == "already_processed":
            await query.message.reply_text("⚠️ Заявка уже обработана", parse_mode="HTML")
            return
        try:
            target_user = await get_user(int(item["userId"]))
            await context.bot.send_message(
                int(item["userId"]),
                get_text(user_lang(target_user), "topup_rejected", request_id=h(req_id)),
                parse_mode="HTML",
            )
        except Exception as e:
            logger.warning("topup reject notify failed: %s", e)
        await query.message.reply_text(
            f"❌ Пополнение #{h(req_id)} отклонено\n"
            f"Пользователь: <code>{item['userId']}</code>",
            parse_mode="HTML",
            reply_markup=kb_back("user_menu", lang),
        )
        return

    if data == "admin_completed_deals":
        rows = await asyncio.to_thread(db_execute, "SELECT deal_id, amount, currency FROM deals WHERE status='completed' ORDER BY created_at DESC LIMIT 20")
        text = get_text(lang, "completed_deals_title")
        text += "\n".join(
            get_text(lang, "admin_deal_list_item",
                     deal_id=r[0], amount=r[1], currency=currency_label(r[2] or "TON", bold=True), status="completed")
            for r in rows
        ) if rows else get_text(lang, "completed_deals_empty")
        await query.message.reply_text(text, parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        return

    if data == "admin_change_balance":
        context.user_data["state"] = "admin_balance"
        try:
            await query.message.reply_text(get_text(lang, "enter_balance_format"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        except Exception as e:
            await context.bot.send_message(query.from_user.id, f"⚠️ Ошибка: {e}")
        return

    if data == "admin_change_stats":
        context.user_data["state"] = "admin_stats"
        try:
            await query.message.reply_text(get_text(lang, "enter_stats_format"), parse_mode="HTML", reply_markup=kb_cancel("user_menu", lang))
        except Exception as e:
            await context.bot.send_message(query.from_user.id, f"⚠️ Ошибка: {e}")
        return

    if data == "user_menu":
        await show_main_menu(update, context, user)
        return

async def _do_broadcast(query, context, msg_text: str, lang: str):
    user_ids = await asyncio.to_thread(get_all_user_ids)
    total = len(user_ids)
    sent = 0
    failed = 0
    progress_msg = await query.message.reply_text(
        get_text(lang, "broadcast_sending", sent=0, total=total),
        parse_mode="HTML",
    )
    for i, uid in enumerate(user_ids):
        try:
            await context.bot.send_message(uid, msg_text, parse_mode="HTML")
            sent += 1
        except Exception:
            failed += 1
        if (i+1) % 20 == 0 or i == total-1:
            try:
                await progress_msg.edit_text(
                    get_text(lang, "broadcast_sending", sent=sent+failed, total=total),
                    parse_mode="HTML",
                )
            except:
                pass
        await asyncio.sleep(0.05)
    context.user_data["state"] = None
    context.user_data.pop("broadcast_text", None)
    await progress_msg.edit_text(
        get_text(lang, "broadcast_done", sent=sent, failed=failed, total=total),
        parse_mode="HTML",
        reply_markup=kb_back("user_menu", lang),
    )

# ════════════════════════════════════════════════════════════════
#  ТЕКСТОВЫЕ СООБЩЕНИЯ
# ════════════════════════════════════════════════════════════════

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    username = update.effective_user.username or f"user_{user_id}"
    if is_user_blocked(user_id):
        user = await get_user(user_id, username)
        await update.message.reply_text(get_text(user_lang(user), "blocked_text"), parse_mode="HTML")
        return
    user = await get_user(user_id, username)
    lang = user["lang"]
    currency = user["currency"]
    state = context.user_data.get("state")
    text = update.message.text.strip() if update.message.text else None

    if not has_selected_lang(user):
        await show_language_gate(update, context)
        return

    if state == "admin_broadcast":
        all_ids = await asyncio.to_thread(get_all_user_ids)
        context.user_data["broadcast_text"] = text
        preview = h(text[:200] + ("…" if len(text) > 200 else ""))
        await update.message.reply_text(
            get_text(lang, "broadcast_confirm", count=len(all_ids), preview=preview),
            parse_mode="HTML",
            reply_markup=kb_broadcast_confirm(lang),
        )
        return

    if state == "admin_block":
        try:
            target = int(text)
            await asyncio.to_thread(db_execute, "UPDATE users SET blocked=1 WHERE user_id=?", (target,))
            context.user_data["state"] = None
            await update.message.reply_text(get_text(lang, "user_blocked", user_id=target), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        except:
            await update.message.reply_text(get_text(lang, "invalid_id"), parse_mode="HTML")
        return

    if state == "admin_unblock":
        try:
            target = int(text)
            await asyncio.to_thread(db_execute, "UPDATE users SET blocked=0 WHERE user_id=?", (target,))
            context.user_data["state"] = None
            await update.message.reply_text(get_text(lang, "user_unblocked", user_id=target), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        except:
            await update.message.reply_text(get_text(lang, "invalid_id"), parse_mode="HTML")
        return

    if state == "admin_balance":
        try:
            parts = text.split()
            target = int(parts[0])
            amount = float(parts[1])
            await asyncio.to_thread(db_execute, "UPDATE users SET balance=balance+? WHERE user_id=?", (amount, target))
            context.user_data["state"] = None
            await update.message.reply_text(get_text(lang, "balance_changed", user_id=target, amount=amount), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        except:
            await update.message.reply_text(get_text(lang, "invalid_format"), parse_mode="HTML")
        return

    if state == "admin_stats":
        try:
            parts = text.split()
            target = int(parts[0])
            deals = int(parts[1])
            await asyncio.to_thread(db_execute, "UPDATE users SET successful_deals=? WHERE user_id=?", (deals, target))
            update_user_rank(target)
            context.user_data["state"] = None
            await update.message.reply_text(get_text(lang, "stats_changed", user_id=target), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        except:
            await update.message.reply_text(get_text(lang, "invalid_format_stats"), parse_mode="HTML")
        return

    if state == "admin_rating":
        try:
            parts = text.split()
            target = int(parts[0])
            new_rating = float(parts[1])
            if new_rating < 0 or new_rating > 5:
                raise ValueError
            await asyncio.to_thread(db_execute, "UPDATE users SET rating=? WHERE user_id=?", (new_rating, target))
            target_user = await get_user(target)
            context.user_data["state"] = None
            await update.message.reply_text(get_text(lang, "rating_changed", user_id=target, rating=new_rating, reviews=target_user["review_count"]), parse_mode="HTML", reply_markup=kb_back("user_menu", lang))
        except:
            await update.message.reply_text(get_text(lang, "invalid_format_rating"), parse_mode="HTML")
        return

    if state == "awaiting_amount":
        try:
            amount = float(text.replace(",", "."))
            if amount <= 0:
                raise ValueError
        except:
            await _edit_stored_message(update, context, get_text(lang, "invalid_amount"), kb_cancel("menu", lang))
            return
        context.user_data["deal_amount"] = amount
        context.user_data["state"] = "awaiting_attachment"
        await _edit_stored_message(update, context, get_text(lang, "attach_prompt"), kb_skip(lang), photo_id=ATTACH_PHOTO_ID)
        return

    if state == "awaiting_attachment":
        if update.message.photo:
            file_id = update.message.photo[-1].file_id
            context.user_data["attachment"] = file_id
        else:
            context.user_data["attachment"] = ""
        context.user_data["state"] = "awaiting_description"
        await _edit_stored_message(update, context, get_text(lang, "enter_description"), kb_cancel("menu", lang), photo_id=DESC_PHOTO_ID)
        return

    if state == "awaiting_description":
        amount = context.user_data.get("deal_amount", 0)
        if amount <= 0:
            context.user_data["state"] = None
            await _edit_stored_message(update, context, get_text(lang, "error_amount_not_set"), kb_back("menu", lang))
            return
        description = text
        deal_id = str(uuid.uuid4())[:8].upper()
        attach = context.user_data.get("attachment", "")
        await asyncio.to_thread(
            db_execute,
            "INSERT INTO deals (deal_id, amount, description, seller_id, status, currency, created_at, attachment_file_id) VALUES (?,?,?,?,?,?,?,?)",
            (deal_id, amount, description, user_id, "active", user["currency"], datetime.now().isoformat(), attach),
        )
        context.user_data["state"] = None
        context.user_data.pop("deal_amount", None)
        context.user_data.pop("attachment", None)
        bot_info = await context.bot.get_me()
        deal_link = f"https://t.me/{bot_info.username}?start={deal_id}"
        msg = get_text(lang, "deal_created", deal_id=h(deal_id), description=h(description), amount=amount, currency=currency_label(currency), link=h(deal_link))
        await _edit_stored_message(update, context, msg, kb_back("menu", lang), photo_id=DEAL_CREATED_PHOTO_ID)
        await send_log(context,
            f"📦 Создана сделка #{deal_id}\n"
            f"💰 {amount:.2f} {currency_label(currency)}\n"
            f"👤 Продавец: {user_id}")
        return

    if state == "awaiting_crypto":
        net_key = context.user_data.get("wallet_network", "TON")
        addr = text.strip().lstrip("@")  # strip @ if user typed it

        # ── Stars: validate Telegram username ──────────────────────
        if net_key == "telegram":
            import re
            if not re.match(r'^[a-zA-Z0-9_]{5,32}$', addr):
                await _edit_stored_message(update, context, get_text(lang, "invalid_stars_username"), kb_cancel("wallet", lang))
                return
            res = await asyncio.to_thread(db_execute, "SELECT wallet_crypto FROM users WHERE user_id=?", (user_id,))
            wallets = _parse_wallets(res[0][0] if res else "")
            wallets["telegram"] = addr
            await asyncio.to_thread(db_execute, "UPDATE users SET wallet_crypto=? WHERE user_id=?", (json.dumps(wallets), user_id))
            context.user_data["state"] = None
            context.user_data.pop("wallet_network", None)
            if context.user_data.pop("resume_create_deal", False):
                if has_requisites(user_id, currency):
                    context.user_data["state"] = "awaiting_amount"
                    await _edit_stored_message(update, context,
                        get_text(lang, "enter_amount", currency=currency_label(currency, bold=True)),
                        kb_cancel("menu", lang), photo_id=AMOUNT_PHOTO_ID)
                else:
                    context.user_data["resume_create_deal"] = True
                    await _edit_stored_message(update, context,
                        get_text(lang, "no_requisites_text", currency=currency_label(currency, bold=True)),
                        kb_no_wallet(lang, currency), photo_id=NO_REQ_PHOTO_ID)
            else:
                await _edit_stored_message(update, context, get_text(lang, "stars_username_saved"), kb_back("wallet", lang))
            return

        # ── Regular crypto wallet validation ───────────────────────
        valid = True
        if net_key == "TON" and not (addr.startswith("UQ") or addr.startswith("EQ") or addr.startswith("0:")):
            valid = False
        elif net_key == "TRC20" and not (addr.startswith("T") and len(addr) in range(30, 44)):
            valid = False
        elif net_key in ("BEP20", "ERC20") and not (addr.startswith("0x") and len(addr) == 42):
            valid = False
        elif net_key == "BTC" and not (addr.startswith("1") or addr.startswith("3") or addr.startswith("bc1")):
            valid = False
        if not valid:
            net_label = network_title(net_key)
            await _edit_stored_message(update, context, get_text(lang, "invalid_crypto", currency=net_label), kb_cancel("wallet", lang))
            return
        res = await asyncio.to_thread(db_execute, "SELECT wallet_crypto FROM users WHERE user_id=?", (user_id,))
        wallets = _parse_wallets(res[0][0] if res else "")
        wallets[net_key] = addr
        await asyncio.to_thread(db_execute, "UPDATE users SET wallet_crypto=? WHERE user_id=?", (json.dumps(wallets), user_id))
        context.user_data["state"] = None
        context.user_data.pop("wallet_network", None)
        if context.user_data.pop("resume_create_deal", False):
            # Proceed only if the saved wallet matches the deal currency's network.
            if has_requisites(user_id, currency):
                context.user_data["state"] = "awaiting_amount"
                await _edit_stored_message(update, context,
                    get_text(lang, "enter_amount", currency=currency_label(currency, bold=True)),
                    kb_cancel("menu", lang), photo_id=AMOUNT_PHOTO_ID)
            else:
                context.user_data["resume_create_deal"] = True
                await _edit_stored_message(update, context,
                    get_text(lang, "no_requisites_text", currency=currency_label(currency, bold=True)),
                    kb_no_wallet(lang, currency), photo_id=NO_REQ_PHOTO_ID)
        else:
            await _edit_stored_message(update, context, get_text(lang, "crypto_saved"), kb_back("wallet", lang))
        return

    if state == "awaiting_bank_card":
        card_num = text.replace(" ", "").replace("-", "")
        if not card_num.isdigit() or len(card_num) < 13 or len(card_num) > 19:
            await _edit_stored_message(update, context, get_text(lang, "invalid_bank_card"), kb_cancel("wallet", lang))
            return
        context.user_data["bank_card_temp"] = card_num
        context.user_data["state"] = "awaiting_bank_name"
        await _edit_stored_message(update, context, get_text(lang, "enter_bank_name"), kb_cancel("wallet", lang))
        return

    if state == "awaiting_bank_name":
        card_num = context.user_data.get("bank_card_temp", "")
        card_name = text.strip()
        await asyncio.to_thread(db_execute, "UPDATE users SET bank_card_number=?, bank_card_name=? WHERE user_id=?", (card_num, card_name, user_id))
        context.user_data["state"] = None
        context.user_data.pop("bank_card_temp", None)
        if context.user_data.pop("resume_create_deal", False):
            context.user_data["state"] = "awaiting_amount"
            await _edit_stored_message(update, context,
                get_text(lang, "enter_amount", currency=currency_label(currency, bold=True)),
                kb_cancel("menu", lang), photo_id=AMOUNT_PHOTO_ID)
        else:
            await _edit_stored_message(update, context, get_text(lang, "bank_card_saved"), kb_back("wallet", lang))
        return

    if state == "awaiting_withdraw":
        try:
            amount = float(text.replace(",", "."))
            if amount <= 0 or amount > user["balance"]:
                raise ValueError
        except:
            await _edit_stored_message(update, context, get_text(lang, "invalid_amount"), kb_cancel("profile", lang))
            return
        context.user_data["state"] = None
        wallets = get_all_wallets(user)
        if wallets:
            wallet_addr = format_wallets_display(wallets)
        else:
            wallet_addr = h(get_wallet_address(user))
        for admin_id in ADMIN_IDS:
            try:
                admin = await get_user(admin_id)
                admin_lang = user_lang(admin)
                await context.bot.send_message(
                    admin_id,
                    get_text(admin_lang, "withdraw_request",
                             user_id=user_id, username=h(username),
                             amount=amount, currency=currency_label(currency, bold=True),
                             address=wallet_addr or "—"),
                    parse_mode="HTML",
                )
            except:
                pass
        await _edit_stored_message(update, context, get_text(lang, "withdraw_sent"), kb_back("menu", lang))
        return

# ════════════════════════════════════════════════════════════════
#  FLASK ДЛЯ RENDER
# ════════════════════════════════════════════════════════════════

flask_app = Flask("")

# Allow browser clients to call the API.
@flask_app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Telegram-Init-Data"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@flask_app.errorhandler(Exception)
def _json_errors(e):
    """Always return JSON (with CORS) for unhandled errors so browser clients can
    surface the real cause instead of a blank 'try again'. HTTP errors (404/405)
    keep their own status; everything else is a 500."""
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        resp = jsonify({"error": e.name.lower().replace(" ", "_")})
        resp.status_code = e.code
        return resp
    logger.exception("unhandled API error")
    return jsonify({"error": f"server: {type(e).__name__}: {e}"}), 500


def _verify_init_data(init_data: str):
    """Validate Telegram initData (HMAC-SHA256) and return the user dict, or None."""
    if not init_data:
        return None
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        recv_hash = pairs.pop("hash", None)
        if not recv_hash:
            return None
        data_check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
        secret = hmac.new(b"Web" + b"AppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calc_hash = hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc_hash, recv_hash):
            return None
        return json.loads(pairs.get("user", "{}"))
    except Exception as e:
        logger.warning("initData verify failed: %s", e)
        return None


def _auth():
    """Return (user_id, username) from request initData, or (None, None)."""
    u = _verify_init_data(request.headers.get("X-Telegram-Init-Data", ""))
    if not u or "id" not in u:
        # Fallback for clients that only pass user_id in the query string.
        # We still require a valid Telegram user id, but do not hard-fail when
        # the WebApp initData header is unavailable on some mobile launches.
        try:
            raw_uid = request.args.get("user_id")
            if raw_uid is None:
                return None, None
            uid = int(raw_uid)
            uname = request.args.get("username") or ""
            return uid, uname
        except (TypeError, ValueError):
            return None, None
    uname = u.get("username") or u.get("first_name") or ""
    return int(u["id"]), uname


def _deal_to_json(row, seller_name=""):
    # row: deal_id, amount, description, seller_id, buyer_id, status, currency,
    #      attachment_file_id, [photo_url], [payload], [moderation]
    photo = row[8] if len(row) > 8 and row[8] else ""
    # Only browser-renderable data URLs are returned (Telegram file_ids can't be shown in a browser).
    if not isinstance(photo, str) or not photo.startswith("data:"):
        photo = ""
    payload = None
    if len(row) > 9 and row[9]:
        try:
            payload = json.loads(row[9])
        except Exception:
            payload = None
    moderation = (row[10] if len(row) > 10 and row[10] else "approved")
    return {
        "dealId": row[0],
        "amount": row[1],
        "description": row[2] or "",
        "sellerId": row[3],
        "sellerName": seller_name,
        "buyerId": row[4],
        "status": row[5] or "active",
        "currency": row[6] or "TON",
        "photo": photo,
        "moderation": moderation,
        # Full front-end Deal object for mini-app listings (None for bot escrow deals).
        "payload": payload,
    }


# Columns selected wherever a deal is serialized to JSON (keep order in sync with _deal_to_json).
_DEAL_COLS = (
    "deal_id, amount, description, seller_id, buyer_id, status, currency, "
    "attachment_file_id, photo_url, payload, moderation"
)


def _seller_name(seller_id):
    r = db_execute("SELECT username FROM users WHERE user_id=?", (seller_id,))
    return (r[0][0] if r and r[0][0] else str(seller_id))


def _is_admin(uid):
    return True


def _topup_to_json(row):
    return {
        "id": row[0],
        "userId": row[1],
        "username": row[2] or "",
        "amount": row[3] or 0,
        "currency": row[4] or "TON",
        "creditAmount": row[5] if row[5] else (row[3] or 0),
        "creditCurrency": row[6] or row[4] or "TON",
        "method": row[7] or "",
        "destination": row[8] or "",
        "status": row[9] or "pending",
        "createdAt": row[10],
        "approvedBy": row[11] or None,
        "approvedAt": row[12],
        "rejectedBy": row[13] or None,
        "rejectedAt": row[14],
    }


def _topup_select(where="", params=()):
    rows = db_execute(
        "SELECT request_id, user_id, username, amount, currency, credit_amount, credit_currency, "
        "method, destination, status, created_at, approved_by, approved_at, rejected_by, rejected_at "
        "FROM topup_requests "
        + where,
        params,
    )
    return [_topup_to_json(r) for r in rows]


def _notify_admins_topup(req_id, user_id, username, amount, currency, method, destination, credit_amount, credit_currency):
    import urllib.request
    text = (
        "💰 <b>Заявка на пополнение</b>\n\n"
        f"ID: <code>{h(req_id)}</code>\n"
        f"Пользователь: <code>{user_id}</code> @{h(username or '')}\n"
        f"Сумма: <b>{amount:.2f} {currency_label(currency, bold=True)}</b>\n"
        f"К зачислению: <b>{credit_amount:.2f} {currency_label(credit_currency, bold=True)}</b>\n"
        f"Метод: <b>{h(method.upper())}</b>\n"
        f"Реквизиты: <code>{h(destination or '—')}</code>\n"
        f"Статус: <b>pending</b>\n\n"
        "Если деньги пришли, нажмите подтверждение — баланс зачислится автоматически."
    )
    markup = {"inline_keyboard": [[
        {"text": "❌ Отклонить", "callback_data": f"reject_topup_{req_id}"},
        {"text": "✅ Одобрить", "callback_data": f"approve_topup_{req_id}"},
    ]]}
    # Send to private admin chats AND the log group chat.
    targets = list(ADMIN_IDS) + [LOG_CHAT_ID]
    for chat_id in targets:
        try:
            payload = json.dumps({
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "reply_markup": markup,
            }).encode()
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as e:
            logger.warning("topup notify failed for %s: %s", chat_id, e)


def _approve_topup_sync(req_id, admin_id):
    rows = db_execute(
        "SELECT user_id, amount, currency, credit_amount, credit_currency, status FROM topup_requests WHERE request_id=?",
        (req_id,),
    )
    if not rows:
        return None, "not_found"
    user_id, amount, currency, credit_amount, credit_currency, status = rows[0]
    if status != "pending":
        return _topup_select("WHERE request_id=?", (req_id,))[0], "already_processed"
    currency = (currency or "TON").upper()
    credit_currency = (credit_currency or currency or "TON").upper()
    try:
        credit_amount = float(credit_amount or 0)
    except (TypeError, ValueError):
        credit_amount = 0.0
    if credit_amount <= 0:
        credit_amount = convert(float(amount or 0), currency, credit_currency)
        db_execute(
            "UPDATE topup_requests SET credit_amount=?, credit_currency=? WHERE request_id=?",
            (credit_amount, credit_currency, req_id),
        )
    db_execute("UPDATE users SET balance=balance+? WHERE user_id=?", (credit_amount, user_id))
    db_execute(
        "UPDATE topup_requests SET status='approved', approved_by=?, approved_at=? WHERE request_id=?",
        (admin_id, datetime.now().isoformat(), req_id),
    )
    return _topup_select("WHERE request_id=?", (req_id,))[0], None


def _reject_topup_sync(req_id, admin_id):
    rows = db_execute(
        "SELECT user_id, status FROM topup_requests WHERE request_id=?",
        (req_id,),
    )
    if not rows:
        return None, "not_found"
    user_id, status = rows[0]
    if status != "pending":
        return _topup_select("WHERE request_id=?", (req_id,))[0], "already_processed"
    db_execute(
        "UPDATE topup_requests SET status='rejected', rejected_by=?, rejected_at=? WHERE request_id=?",
        (admin_id, datetime.now().isoformat(), req_id),
    )
    return _topup_select("WHERE request_id=?", (req_id,))[0], None


def _notify_admins_paid(deal_id, amount, currency, buyer_id, seller_id):
    """Notify admins about a browser payment via the Telegram HTTP API (we're in
    the Flask thread, not the bot's async loop). Mirrors the bot's pay flow so the
    same confirm/cancel escrow buttons appear."""
    import urllib.request
    for admin_id in ADMIN_IDS:
        try:
            lang = DEFAULT_LANG
            try:
                ar = db_execute("SELECT lang FROM users WHERE user_id=?", (admin_id,))
                if ar and ar[0][0] in LOC:
                    lang = ar[0][0]
            except Exception:
                pass
            text = get_text(lang, "admin_deal_paid", deal_id=deal_id, amount=amount,
                            currency=currency_label(currency, bold=True), buyer_id=buyer_id, seller_id=seller_id)
            markup = {"inline_keyboard": [[
                {"text": get_text(lang, "admin_confirm_btn"), "callback_data": f"admin_confirm_{deal_id}"},
                {"text": get_text(lang, "admin_cancel_btn"), "callback_data": f"admin_cancel_{deal_id}"},
            ]]}
            payload = json.dumps({
                "chat_id": admin_id, "text": text, "parse_mode": "HTML",
                "reply_markup": markup,
            }).encode()
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                data=payload, headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as e:
            logger.warning("admin notify (http) failed for %s: %s", admin_id, e)


@flask_app.route("/")
def home():
    return "OK"


@flask_app.route("/api/me")
def api_me():
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    deals = db_execute("SELECT COUNT(*), COALESCE(SUM(amount),0) FROM deals WHERE buyer_id=? AND status='completed'", (uid,))
    bought, volume = (deals[0][0], deals[0][1]) if deals else (0, 0)
    sold = db_execute("SELECT COUNT(*) FROM deals WHERE seller_id=? AND status='completed'", (uid,))
    return jsonify({
        "userId": uid,
        "username": user.get("username", ""),
        "balance": user.get("balance", 0.0),
        "currency": user.get("currency", "TON"),
        "lang": user.get("lang") if user.get("lang") in LOC else "",
        "bought": bought,
        "sold": sold[0][0] if sold else 0,
        "volume": volume,
    })


@flask_app.route("/api/balance")
def api_balance():
    """Lightweight balance endpoint: the mini-app polls this to stay in sync
    after /tnuve, admin deposits, or approved topups."""
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    return jsonify({
        "userId": uid,
        "balance": user.get("balance", 0.0),
        "currency": user.get("currency", "TON"),
    })


@flask_app.route("/api/deposit", methods=["POST", "OPTIONS"])
def api_deposit():
    """Admin-only direct deposit (mirrors /tnuve from the bot). Body:
    {userId?: int, amount: number}. Credits balance immediately and logs."""
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True) or {}
    try:
        target_id = int(body.get("userId") or uid)
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid"}), 400
    if amount <= 0:
        return jsonify({"error": "invalid_amount"}), 400
    target = _ensure_user_sync(target_id)
    new_balance = float(target.get("balance", 0.0)) + amount
    db_execute("UPDATE users SET balance=? WHERE user_id=?", (new_balance, target_id))
    # Mirror the topup notification so deposits are auditable in the log chat.
    try:
        import urllib.request
        text = (
            "💸 <b>Прямой депозит (admin)</b>\n\n"
            f"Пользователь: <code>{target_id}</code> @{h(target.get('username',''))}\n"
            f"Сумма: <b>+{amount:.2f} {currency_label(target.get('currency','TON'), bold=True)}</b>\n"
            f"Новый баланс: <b>{new_balance:.2f}</b>\n"
            f"Админ: <code>{uid}</code>"
        )
        payload = json.dumps({"chat_id": LOG_CHAT_ID, "text": text, "parse_mode": "HTML"}).encode()
        r = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=payload, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(r, timeout=10).read()
    except Exception as e:
        logger.warning("deposit log failed: %s", e)
    return jsonify({"ok": True, "userId": target_id, "balance": new_balance,
                    "currency": target.get("currency", "TON")})


@flask_app.route("/api/deals", methods=["GET", "POST", "OPTIONS"])
def api_deals():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()

    if request.method == "GET":
        # scope controls which marketplace listings are returned:
        #   public  (default) — active, non-rejected listings visible to everyone
        #   mine             — every listing created by the caller (any status)
        #   pending / all    — admin moderation queue
        scope = (request.args.get("scope") or "public").lower()
        q = (request.args.get("q") or "").strip()
        # Only rows with a payload are mini-app marketplace listings (bot escrow
        # deals have an empty payload and must never surface in the catalog).
        if scope == "mine":
            if uid is None:
                return jsonify({"error": "unauthorized"}), 401
            where = "payload != '' AND seller_id=?"
            params = [uid]
        elif scope in ("pending", "all"):
            if uid is None:
                return jsonify({"error": "unauthorized"}), 401
            if not _is_admin(uid):
                return jsonify({"error": "forbidden"}), 403
            where = "payload != ''" + (" AND moderation='pending'" if scope == "pending" else "")
            params = []
        else:  # public
            where = "payload != '' AND status='active' AND moderation != 'rejected'"
            params = []
        if q:
            where += " AND (description LIKE ? OR deal_id LIKE ?)"
            params += [f"%{q}%", f"%{q}%"]
        rows = db_execute(
            f"SELECT {_DEAL_COLS} FROM deals WHERE {where} ORDER BY created_at DESC LIMIT 100",
            tuple(params))
        return jsonify([_deal_to_json(r, _seller_name(r[3])) for r in rows])

    # POST → create a marketplace listing
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if isinstance(payload, dict):
        # Mini-app listing: derive escrow columns from the full Deal object.
        try:
            amount = float(payload.get("price", 0))
        except (TypeError, ValueError):
            amount = 0
        description = (payload.get("title") or payload.get("description") or "").strip()
        currency = payload.get("currency") or user.get("currency", "TON")
        photo = payload.get("photo") or ""
        moderation = payload.get("moderation") or "pending"
    else:
        try:
            amount = float(body.get("amount", 0))
        except (TypeError, ValueError):
            amount = 0
        description = (body.get("description") or "").strip()
        currency = user.get("currency", "TON")
        photo = body.get("photoBase64") or ""
        moderation = "pending"
        payload = None
    if amount <= 0 or not description:
        return jsonify({"error": "invalid"}), 400
    # Optional photo as a small data URL (full-res images are downscaled client-side).
    if not (isinstance(photo, str) and photo.startswith("data:") and len(photo) <= 400_000):
        photo = ""
    # Reuse the client-supplied id when present so deep links stay stable across devices.
    deal_id = ""
    if isinstance(payload, dict):
        cand = str(payload.get("id") or "").strip().upper()
        if cand and cand.isalnum() and len(cand) <= 16:
            deal_id = cand
    if not deal_id:
        deal_id = str(uuid.uuid4())[:8].upper()
    if isinstance(payload, dict):
        payload = {**payload, "id": deal_id, "photo": photo}
    payload_json = json.dumps(payload, ensure_ascii=False) if isinstance(payload, dict) else ""
    try:
        db_execute(
            "INSERT OR REPLACE INTO deals (deal_id, amount, description, seller_id, status, currency, created_at, attachment_file_id, photo_url, payload, moderation) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (deal_id, amount, description, uid, "active", currency, datetime.now().isoformat(), "", photo, payload_json, moderation))
    except Exception as e:
        logger.exception("create deal failed")
        return jsonify({"error": f"db: {e}"}), 500
    return jsonify(_deal_to_json(
        (deal_id, amount, description, uid, None, "active", currency, "", photo, payload_json, moderation),
        user.get("username", "")))


@flask_app.route("/api/currency", methods=["POST", "OPTIONS"])
def api_currency():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    body = request.get_json(silent=True) or {}
    new_cur = (body.get("currency") or "").upper()
    if new_cur not in CURRENCIES:
        return jsonify({"error": "invalid currency"}), 400
    old_cur = user.get("currency", "TON")
    old_bal = user.get("balance", 0.0)
    try:
        # Mirror the bot: convert the stored balance into the new currency.
        if old_cur != new_cur and old_bal > 0:
            new_bal = convert(old_bal, old_cur, new_cur)
            db_execute("UPDATE users SET currency=?, balance=? WHERE user_id=?", (new_cur, new_bal, uid))
        else:
            db_execute("UPDATE users SET currency=? WHERE user_id=?", (new_cur, uid))
    except Exception as e:
        logger.exception("set currency failed")
        return jsonify({"error": f"db: {e}"}), 500
    updated = _ensure_user_sync(uid, uname)
    return jsonify({"ok": True, "currency": updated.get("currency", new_cur), "balance": updated.get("balance", 0.0)})


@flask_app.route("/api/lang", methods=["POST", "OPTIONS"])
def api_lang():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json(silent=True) or {}
    lang = (body.get("lang") or "").lower()
    if lang not in LOC:
        return jsonify({"error": "invalid lang"}), 400
    _ensure_user_sync(uid, uname)
    db_execute("UPDATE users SET lang=? WHERE user_id=?", (lang, uid))
    return jsonify({"ok": True, "lang": lang})


@flask_app.route("/api/log-event", methods=["POST", "OPTIONS"])
def api_log_event():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    body = request.get_json(silent=True) or {}
    text = str(body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "invalid"}), 400
    safe_text = h(text[:3500])
    try:
        import urllib.request
        payload = json.dumps({
            "chat_id": LOG_CHAT_ID,
            "text": f"📲 <b>Mini App event</b>\n\n<pre>{safe_text}</pre>",
            "parse_mode": "HTML",
        }).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        logger.warning("miniapp log event failed for %s/%s: %s", uid, uname, e)
    return jsonify({"ok": True})


@flask_app.route("/api/deals/<deal_id>")
def api_deal(deal_id):
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    rows = db_execute(
        f"SELECT {_DEAL_COLS} FROM deals WHERE deal_id=?", (deal_id,))
    if not rows:
        return jsonify(None)
    return jsonify(_deal_to_json(rows[0], _seller_name(rows[0][3])))


@flask_app.route("/api/deals/<deal_id>/update", methods=["POST", "OPTIONS"])
def api_deal_update(deal_id):
    """Owner (or admin) upserts a listing's status/payload — mirrors the
    front-end saveDeal(). Used e.g. to mark a deal 'paid' after escrow."""
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    rows = db_execute("SELECT seller_id, payload FROM deals WHERE deal_id=?", (deal_id,))
    if not rows:
        return jsonify({"error": "not_found"}), 404
    seller_id = rows[0][0]
    if uid != seller_id and not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True) or {}
    payload = body.get("payload")
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid"}), 400
    payload = {**payload, "id": deal_id}
    status = payload.get("status") or "active"
    moderation = payload.get("moderation") or "approved"
    photo = payload.get("photo") if isinstance(payload.get("photo"), str) and payload.get("photo", "").startswith("data:") else ""
    try:
        amount = float(payload.get("price", 0))
    except (TypeError, ValueError):
        amount = 0
    description = (payload.get("title") or payload.get("description") or "").strip()
    currency = payload.get("currency") or "TON"
    db_execute(
        "UPDATE deals SET amount=?, description=?, status=?, currency=?, photo_url=?, payload=?, moderation=? WHERE deal_id=?",
        (amount, description, status, currency, photo,
         json.dumps(payload, ensure_ascii=False), moderation, deal_id))
    return jsonify({"ok": True})


@flask_app.route("/api/deals/<deal_id>/moderate", methods=["POST", "OPTIONS"])
def api_deal_moderate(deal_id):
    """Admin approves/rejects a marketplace listing."""
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True) or {}
    action = (body.get("action") or "").lower()
    if action not in ("approve", "reject"):
        return jsonify({"error": "invalid"}), 400
    moderation = "approved" if action == "approve" else "rejected"
    note = (body.get("note") or "")
    rows = db_execute("SELECT payload FROM deals WHERE deal_id=?", (deal_id,))
    if not rows:
        return jsonify({"error": "not_found"}), 404
    # Keep the payload's moderation fields in sync so the front-end Deal stays consistent.
    payload_json = rows[0][0] or ""
    if payload_json:
        try:
            p = json.loads(payload_json)
            p["moderation"] = moderation
            p["moderationNote"] = note or None
            payload_json = json.dumps(p, ensure_ascii=False)
        except Exception:
            pass
    db_execute("UPDATE deals SET moderation=?, payload=? WHERE deal_id=?",
               (moderation, payload_json, deal_id))
    return jsonify({"ok": True, "moderation": moderation})


@flask_app.route("/api/deals/<deal_id>/delete", methods=["POST", "OPTIONS"])
def api_deal_delete(deal_id):
    """Owner (or admin) removes a marketplace listing."""
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    rows = db_execute("SELECT seller_id FROM deals WHERE deal_id=?", (deal_id,))
    if not rows:
        return jsonify({"ok": True})
    if uid != rows[0][0] and not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    db_execute("DELETE FROM deals WHERE deal_id=?", (deal_id,))
    return jsonify({"ok": True})


# Global admin-curated collections (sellers, hand-picked products) live in the
# shared system_settings KV table so every device sees the same catalog.
_STORE_KEYS = {"admin_products", "admin_sellers"}


@flask_app.route("/api/store/<key>", methods=["GET", "POST", "OPTIONS"])
def api_store(key):
    if request.method == "OPTIONS":
        return ("", 204)
    if key not in _STORE_KEYS:
        return jsonify({"error": "not_found"}), 404
    if request.method == "GET":
        # Public read — the catalog must render the same products for everyone.
        rows = db_execute("SELECT value FROM system_settings WHERE key=?", (f"store:{key}",))
        if not rows or not rows[0][0]:
            return jsonify(None)
        try:
            return jsonify(json.loads(rows[0][0]))
        except Exception:
            return jsonify(None)
    # POST → admin-only write of the whole collection (JSON array/object).
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "invalid"}), 400
    db_execute(
        "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?,?)",
        (f"store:{key}", json.dumps(body, ensure_ascii=False)))
    return jsonify({"ok": True})


@flask_app.route("/api/deals/<deal_id>/buy", methods=["POST", "OPTIONS"])
def api_buy(deal_id):
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    rows = db_execute(
        "SELECT deal_id, amount, description, seller_id, buyer_id, status, currency, attachment_file_id, photo_url "
        "FROM deals WHERE deal_id=?", (deal_id,))
    if not rows:
        return jsonify({"ok": False, "error": "not_found"}), 404
    deal = rows[0]
    amount, seller_id, status, deal_currency = deal[1], deal[3], deal[5], deal[6] or "TON"
    return _buy_deal_response(deal_id, uid, user, amount, seller_id, status, deal_currency)


def _buy_deal_response(deal_id, uid, user, amount, seller_id, status, deal_currency):
    user_currency = user.get("currency", "TON")
    balance = float(user.get("balance", 0.0))
    debit_amount = convert(float(amount), deal_currency, user_currency)
    if status != "active":
        return jsonify({"ok": False, "error": "unavailable", "balance": balance, "currency": user_currency})
    if uid == seller_id:
        return jsonify({"ok": False, "error": "own_deal", "balance": balance, "currency": user_currency})
    if balance < debit_amount:
        return jsonify({
            "ok": False,
            "error": "insufficient",
            "balance": balance,
            "currency": user_currency,
            "missing": debit_amount - balance,
        })
    db_execute("UPDATE users SET balance=balance-?, total_spent=COALESCE(total_spent,0)+? WHERE user_id=?", (debit_amount, debit_amount, uid))
    db_execute("UPDATE deals SET buyer_id=?, status='pending_confirm' WHERE deal_id=?", (uid, deal_id))
    _notify_admins_paid(deal_id, amount, deal_currency, uid, seller_id)
    return jsonify({"ok": True, "balance": balance - debit_amount, "currency": user_currency, "debited": debit_amount})


@flask_app.route("/api/purchase", methods=["POST", "OPTIONS"])
def api_purchase():
    """Debit the authenticated user's backend balance for mini-app catalog
    purchases. The mini-app has local catalog products that are not rows in the
    bot deals table, so this endpoint keeps the real bot balance authoritative.
    """
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    body = request.get_json(silent=True) or {}
    product_id = str(body.get("productId") or "").strip()
    deal_id = product_id[5:] if product_id.startswith("deal-") else product_id
    if deal_id:
        rows = db_execute(
            "SELECT deal_id, amount, seller_id, status, currency FROM deals WHERE deal_id=? AND payload != ''",
            (deal_id.upper(),),
        )
        if not rows and deal_id != deal_id.upper():
            rows = db_execute(
                "SELECT deal_id, amount, seller_id, status, currency FROM deals WHERE deal_id=? AND payload != ''",
                (deal_id,),
            )
        if rows:
            found_deal_id, amount, seller_id, status, deal_currency = rows[0]
            return _buy_deal_response(found_deal_id, uid, user, amount, seller_id, status, deal_currency or "TON")
    try:
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError):
        amount = 0
    price_currency = (body.get("currency") or "RUB").upper()
    if amount <= 0 or price_currency not in CURRENCIES:
        return jsonify({"ok": False, "error": "invalid", "balance": user.get("balance", 0.0), "currency": user.get("currency", "TON")}), 400

    user_currency = user.get("currency", "TON")
    debit_amount = convert(amount, price_currency, user_currency)
    balance = float(user.get("balance", 0.0))
    if balance < debit_amount:
        return jsonify({
            "ok": False,
            "error": "insufficient",
            "balance": balance,
            "currency": user_currency,
            "missing": debit_amount - balance,
        })

    new_balance = balance - debit_amount
    db_execute("UPDATE users SET balance=?, total_spent=COALESCE(total_spent,0)+? WHERE user_id=?", (new_balance, debit_amount, uid))
    try:
        product_id = str(body.get("productId") or "")[:80]
        title = str(body.get("title") or "")[:200]
        logger.info("miniapp purchase user=%s product=%s title=%s amount=%s %s debit=%s %s", uid, product_id, title, amount, price_currency, debit_amount, user_currency)
    except Exception:
        pass
    return jsonify({
        "ok": True,
        "balance": new_balance,
        "currency": user_currency,
        "debited": debit_amount,
    })


@flask_app.route("/api/withdraw", methods=["POST", "OPTIONS"])
def api_withdraw():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    user = _ensure_user_sync(uid, uname)
    body = request.get_json(silent=True) or {}
    try:
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError):
        amount = 0
    method = (body.get("method") or "").strip().lower()
    if amount <= 0 or method not in {"crypto", "card"}:
        return jsonify({"ok": False, "error": "invalid", "balance": user.get("balance", 0.0), "currency": user.get("currency", "TON")}), 400
    if amount > float(user.get("balance", 0.0)):
        return jsonify({"ok": False, "error": "insufficient", "balance": user.get("balance", 0.0), "currency": user.get("currency", "TON")})

    if method == "crypto":
        network = h((body.get("network") or "").strip()[:40])
        address = h((body.get("walletAddress") or "").strip()[:200])
        if len(address) < 8 or len(network) < 2:
            return jsonify({"ok": False, "error": "invalid_requisites", "balance": user.get("balance", 0.0), "currency": user.get("currency", "TON")}), 400
        requisites = f"{network}: <code>{address}</code>"
    else:
        card_number = h((body.get("cardNumber") or "").strip()[:40])
        holder_name = h((body.get("holderName") or "").strip()[:120])
        if len(card_number.replace(" ", "")) < 12 or len(holder_name) < 2:
            return jsonify({"ok": False, "error": "invalid_requisites", "balance": user.get("balance", 0.0), "currency": user.get("currency", "TON")}), 400
        requisites = f"<code>{card_number}</code> · {holder_name}"

    currency = user.get("currency", "TON")
    for admin_id in ADMIN_IDS:
        try:
            admin = _ensure_user_sync(admin_id)
            admin_lang = user_lang(admin)
            payload = json.dumps({
                "chat_id": admin_id,
                "text": get_text(
                    admin_lang,
                    "withdraw_request",
                    user_id=uid,
                    username=h(user.get("username") or uname),
                    amount=amount,
                    currency=currency_label(currency, bold=True),
                    address=requisites,
                ),
                "parse_mode": "HTML",
            }).encode()
            import urllib.request
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            urllib.request.urlopen(req, timeout=10).read()
        except Exception as e:
            logger.warning("withdraw notify failed for %s: %s", admin_id, e)
    return jsonify({"ok": True, "balance": user.get("balance", 0.0), "currency": currency})


@flask_app.route("/api/topups", methods=["GET", "POST", "OPTIONS"])
def api_topups():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, uname = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401

    if request.method == "GET":
        if _is_admin(uid) and request.args.get("scope") == "all":
            return jsonify(_topup_select("ORDER BY created_at DESC LIMIT 100"))
        return jsonify(_topup_select("WHERE user_id=? ORDER BY created_at DESC LIMIT 20", (uid,)))

    user = _ensure_user_sync(uid, uname)
    body = request.get_json(silent=True) or {}
    try:
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError):
        amount = 0
    method = (body.get("method") or "").strip().lower()
    destination = (body.get("destination") or "").strip()
    if amount <= 0 or method not in TOPUP_METHOD_CURRENCY:
        return jsonify({"error": "invalid"}), 400
    req_id = ("TU" + uuid.uuid4().hex[:8]).upper()
    requested_currency = (body.get("currency") or "").upper()
    method_currency = TOPUP_METHOD_CURRENCY[method]
    currency = requested_currency if requested_currency == method_currency else method_currency
    credit_currency = user.get("currency", "TON")
    credit_amount = convert(amount, currency, credit_currency)
    db_execute(
        "INSERT INTO topup_requests (request_id, user_id, username, amount, currency, credit_amount, credit_currency, method, destination, status, created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (
            req_id, uid, user.get("username", uname), amount, currency,
            credit_amount, credit_currency, method, destination, "pending",
            datetime.now().isoformat(),
        ),
    )
    _notify_admins_topup(req_id, uid, user.get("username", uname), amount, currency, method, destination, credit_amount, credit_currency)
    return jsonify(_topup_select("WHERE request_id=?", (req_id,))[0])


@flask_app.route("/api/topups/<req_id>/approve", methods=["POST", "OPTIONS"])
def api_approve_topup(req_id):
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    item, error = _approve_topup_sync(req_id, uid)
    if error == "not_found":
        return jsonify({"error": "not_found"}), 404
    if error == "already_processed":
        return jsonify({"ok": False, "error": "already_processed", "topup": item})
    try:
        import urllib.request
        target_user = _ensure_user_sync(int(item["userId"]))
        lang = user_lang(target_user)
        credited_user = _ensure_user_sync(int(item["userId"]))
        payload = json.dumps({
            "chat_id": int(item["userId"]),
            "text": get_text(
                lang,
                "tnuve_success",
                amount=float(item.get("creditAmount") or item["amount"]),
                currency=currency_label(item.get("creditCurrency") or item["currency"]),
                new_balance=float(credited_user.get("balance", 0.0)),
            ),
            "parse_mode": "HTML",
        }).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        logger.warning("topup approve http notify failed: %s", e)
    return jsonify({"ok": True, "topup": item})


@flask_app.route("/api/topups/<req_id>/reject", methods=["POST", "OPTIONS"])
def api_reject_topup(req_id):
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    item, error = _reject_topup_sync(req_id, uid)
    if error == "not_found":
        return jsonify({"error": "not_found"}), 404
    if error == "already_processed":
        return jsonify({"ok": False, "error": "already_processed", "topup": item})
    try:
        import urllib.request
        lang = DEFAULT_LANG
        target_rows = db_execute("SELECT lang FROM users WHERE user_id=?", (int(item["userId"]),))
        if target_rows and target_rows[0][0] in LOC:
            lang = target_rows[0][0]
        payload = json.dumps({
            "chat_id": int(item["userId"]),
            "text": get_text(lang, "topup_rejected", request_id=h(req_id)),
            "parse_mode": "HTML",
        }).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        logger.warning("topup reject http notify failed: %s", e)
    return jsonify({"ok": True, "topup": item})


@flask_app.route("/api/admin/balance", methods=["POST", "OPTIONS"])
def api_admin_balance():
    if request.method == "OPTIONS":
        return ("", 204)
    uid, _ = _auth()
    if uid is None:
        return jsonify({"error": "unauthorized"}), 401
    if not _is_admin(uid):
        return jsonify({"error": "forbidden"}), 403
    body = request.get_json(silent=True) or {}
    try:
        target_id = int(body.get("userId") or uid)
        amount = float(body.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid"}), 400
    mode = body.get("mode") or "add"
    target = _ensure_user_sync(target_id)
    if mode == "set":
        new_balance = amount
        db_execute("UPDATE users SET balance=? WHERE user_id=?", (new_balance, target_id))
    else:
        new_balance = float(target.get("balance", 0.0)) + amount
        db_execute("UPDATE users SET balance=? WHERE user_id=?", (new_balance, target_id))
    return jsonify({"ok": True, "userId": target_id, "balance": new_balance, "currency": target.get("currency", "TON")})


def run_flask():
    flask_app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

# ════════════════════════════════════════════════════════════════
#  ЗАПУСК
# ════════════════════════════════════════════════════════════════

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error("Exception: %s\n%s", context.error, traceback.format_exc())

def main():
    db_dir = os.path.dirname(DB_NAME)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    init_db_sync()
    threading.Thread(target=run_flask, daemon=True).start()
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("health", health_command))
    app.add_handler(CommandHandler("admin", admin_command))
    app.add_handler(CommandHandler("tnuve", tnuve_command))
    app.add_handler(MessageHandler(
        (filters.ANIMATION | filters.VIDEO | filters.PHOTO) & filters.Chat(chat_id=ADMIN_IDS),
        get_media_id,
    ))
    app.add_handler(CallbackQueryHandler(button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.VIDEO_NOTE, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_text))
    app.add_error_handler(error_handler)
    logger.info("Playerok Escrow Bot started")
    asyncio.set_event_loop(asyncio.new_event_loop())
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()

@router.message(F.animation) 
async def get_anim_id(message: Message): 
await message.answer(f"{message.animation.file_id}", parse_mode="Markdown")
