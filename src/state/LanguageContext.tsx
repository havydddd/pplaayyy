import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe, hasTelegramAuth, setApiLanguage } from './BotApi';

export type Lang = 'ru' | 'en';
const LANG_KEY = 'playerok-otc:language';

function readLang(): Lang {
  if (typeof window === 'undefined') return 'ru';
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    if (v === 'ru' || v === 'en') return v as Lang;
  } catch {/**/}
  return 'ru';
}

export interface Translations {
  // HomePage
  search: string;
  apps: string;
  games: string;
  mobileGames: string;
  premiumProducts: string;
  donate: string;
  subscriptions: string;
  items: string;
  accounts: string;
  keys: string;
  nft: string;
  topupSteam: string;
  steamLoginLabel: string;
  steamLoginPlaceholder: string;
  amountLabel: string;
  commission: string;
  pay: string;
  noLoginError: string;
  enterLoginFirst: string;
  ok: string;
  // ProfilePage
  profileTitle: string;
  myItems: string;
  purchases: string;
  sales: string;
  active: string;
  completed: string;
  noItemsTitle: string;
  noItemsSub: string;
  listItem: string;
  noPurchasesTitle: string;
  noPurchasesSub: string;
  goToShop: string;
  noSalesTitle: string;
  noSalesSub: string;
  noReviews: string;
  onPlayerok: string;
  // BalancePage
  balanceTitle: string;
  available: string;
  topUp: string;
  withdraw: string;
  withdrawHistory: string;
  noWithdrawals: string;
  afterRequest: string;
  cryptoLabel: string;
  bankCard: string;
  pendingLabel: string;
  // TopupPage
  topupBalance: string;
  currentBalance: string;
  onReview: string;
  adminConfirms: string;
  topupAmountLabel: string;
  paymentMethod: string;
  continueBtn: string;
  demoNote: string;
  remoteNote: string;
  supportOnly: string;
  contactSupport: string;
  iSent: string;
  iTransferred: string;
  copyDetails: string;
  copied: string;
  network: string;
  transferAmount: string;
  walletHint: string;
  phone: string;
  receivingBank: string;
  recipient: string;
  cardNumber: string;
  bankLabel: string;
  requestNum: string;
  important: string;
  cryptoWarning: string;
  sbpWarning: string;
  cardWarning: string;
  kaspiWarning: string;
  successTitle: string;
  successMsg: string;
  toProfile: string;
  toBuy: string;
  equivalent: string;
  // SteamPaymentPage
  steamPayment: string;
  toPay: string;
  paymentMethodTitle: string;
  cryptoMethod: string;
  bankCardMethod: string;
  payBtn: string;
  waitingTitle: string;
  waitingMsg: string;
  toHome: string;
  sendPayment: string;
  steamNote: string;
  supportOnlyMethod: string;
  // Common
  back: string;
  cancel: string;
  close: string;
  adminPanel: string;
  noAccess: string;
  noAccessMsg: string;
  navSearch: string;
  navSteam: string;
  navSell: string;
  navChat: string;
  navProfile: string;
  navAdmin: string;
  buy: string;
  deposit: string;
  insufficientFunds: string;
  orderCreated: string;
  paymentAccepted: string;
  paymentUnavailable: string;
  support: string;
  productNotFound: string;
  goHome: string;
  details: string;
  delivery: string;
  guarantee: string;
  paymentMethods: string;
  seller: string;
  sellerLevel: string;
  steamLoginForCredit: string;
  steamLoginHint: string;
  enterSteamLoginToContinue: string;
  openChat: string;
  backToShop: string;
  topupBalanceFull: string;
  requestSendError: string;
  networkError: string;
  topupPendingSent: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  productTitle: string;
  productRemoved: string;
  sellerChat: string;
  deliveryTime: string;
  productPaymentMethodsValue: string;
  reviewsTitle: string;
  deleteProduct: string;
  orderCreatedMsg: string;
  orderPaidNotice: string;
  noticePaidTitle: string;
  noticePaidBody: string;
  noticePurchaseLabel: string;
  noticeAmountLabel: string;
  noticeDealLabel: string;
  noticeDateLabel: string;
  contactRelayer: string;
  missingFunds: string;
  dealTitle: string;
  dealNotFound: string;
  dealNotFoundMsg: string;
  buyerDealTitle: string;
  noPhoto: string;
  toPayLabel: string;
  escrowFee: string;
  yourBalance: string;
  dealPendingModeration: string;
  dealRejectedModeration: string;
  escrowWarning: string;
  paid: string;
  dealSuccessMsg: string;
  openSupport: string;
  supportTitle: string;
  supportOnline: string;
  screenshotThanks: string;
  screenshotAlt: string;
  attachmentReady: string;
  removeAttachment: string;
  attachScreenshot: string;
  captionPlaceholder: string;
  messagePlaceholder: string;
  send: string;
  sellTitle: string;
  gamesAndApps: string;
  popularCategories: string;
  lowerPaymentTitle: string;
  priceCalculator: string;
  itemPrice: string;
  income: string;
  payoutFee: string;
  payoutMethods: string;
  payoutMethodsHint: string;
  startSelling: string;
  withdrawTitle: string;
  walletAddress: string;
  ownerName: string;
  withdrawSubmit: string;
  withdrawalSubmitted: string;
  withdrawalHistoryUpdated: string;
  toBalance: string;
  newBadge: string;
  clear: string;
  searchResultsTitle: string;
  resultOne: string;
  resultFew: string;
  resultMany: string;
  nothingFound: string;
  nothingFoundHint: string;
  userDeals: string;
  fromUser: string;
  catalogTitle: string;
  enableLightTheme: string;
  enableDarkTheme: string;
  chooseLanguage: string;
  millionPlus: string;
  copyPrompt: string;
  kaspiNumber: string;
}

const RU: Translations = {
  search: 'Поиск игр и приложений',
  apps: 'Приложения',
  games: 'Игры',
  mobileGames: 'Мобильные игры',
  premiumProducts: 'Премиум товары',
  donate: 'Донат',
  subscriptions: 'Подписки',
  items: 'Предметы',
  accounts: 'Аккаунты',
  keys: 'Ключи',
  nft: 'NFT',
  topupSteam: 'Пополнить Steam',
  steamLoginLabel: 'Логин Steam',
  steamLoginPlaceholder: 'Введите логин',
  amountLabel: 'Сумма',
  commission: 'Комиссия',
  pay: 'Оплатить',
  noLoginError: 'Сначала введите логин Steam',
  enterLoginFirst: '',
  ok: 'Понятно',
  profileTitle: 'Профиль',
  myItems: 'Мои товары',
  purchases: 'Покупки',
  sales: 'Продажи',
  active: 'Активные',
  completed: 'Завершённые',
  noItemsTitle: 'Нет товаров',
  noItemsSub: 'Пора выставить свой товар на продажу',
  listItem: 'Выставить товар',
  noPurchasesTitle: 'Нет покупок',
  noPurchasesSub: 'Здесь будут показаны товары, которые вы купили',
  goToShop: 'Перейти в магазин',
  noSalesTitle: 'Нет продаж',
  noSalesSub: 'Здесь будут показаны успешно завершённые сделки',
  noReviews: 'нет отзывов',
  onPlayerok: 'на Playerok',
  balanceTitle: 'Баланс',
  available: 'Доступно',
  topUp: 'Пополнить',
  withdraw: 'Вывести',
  withdrawHistory: 'История вывода',
  noWithdrawals: 'Заявок пока нет',
  afterRequest: 'После отправки заявки она появится здесь.',
  cryptoLabel: 'Криптовалюта',
  bankCard: 'Банковская карта',
  pendingLabel: 'на рассмотрении',
  topupBalance: 'Пополнение баланса',
  currentBalance: 'Текущий баланс',
  onReview: 'На проверке',
  adminConfirms: 'Администратор подтверждает переводы в течение 5–30 минут.',
  topupAmountLabel: 'Сумма пополнения',
  paymentMethod: 'Способ оплаты',
  continueBtn: 'Продолжить',
  demoNote: 'Это демо-пополнение: после подтверждения сумма сразу попадёт в локальный баланс.',
  remoteNote: 'Заявка отправлена. После подтверждения админом баланс обновится автоматически.',
  supportOnly: 'Пополнение через этот метод доступно только через поддержку.',
  contactSupport: 'Написать в поддержку',
  iSent: 'Я отправил перевод',
  iTransferred: 'Я перевёл',
  copyDetails: 'Скопировать реквизиты',
  copied: 'Скопировано',
  network: 'Сеть',
  transferAmount: 'Сумма к переводу',
  walletHint: 'Кошелёк для перевода. После подтверждения сумма появится на балансе:',
  phone: 'Номер телефона',
  receivingBank: 'Банк-получатель',
  recipient: 'Получатель',
  cardNumber: 'Номер карты',
  bankLabel: 'Банк',
  requestNum: 'Заявка',
  important: 'Важно.',
  cryptoWarning: 'Переводите только на указанный адрес. После перевода нажмите «Я отправил» — администратор сверит транзакцию.',
  sbpWarning: 'Переведите сумму по СБП. После перевода нажмите «Я перевёл» — администратор подтвердит зачисление.',
  cardWarning: 'Пополнение через карту доступно только через поддержку — нажмите кнопку ниже.',
  kaspiWarning: 'Переведите сумму через Kaspi. После перевода нажмите «Я перевёл».',
  successTitle: 'Заявка отправлена',
  successMsg: 'После подтверждения администратором баланс обновится.',
  toProfile: 'В профиль',
  toBuy: 'К покупкам',
  equivalent: 'эквивалент',
  steamPayment: 'Оплата Steam',
  toPay: 'К оплате',
  paymentMethodTitle: 'Способ оплаты',
  cryptoMethod: 'Криптовалюта',
  bankCardMethod: 'Банковская карта / СБП',
  payBtn: 'Оплатить',
  waitingTitle: 'Заявка отправлена',
  waitingMsg: 'Ожидайте подтверждения администратора. Мы уведомим вас в боте.',
  toHome: 'На главную',
  sendPayment: 'Я оплатил',
  steamNote: 'Средства зачислятся на Steam-аккаунт после подтверждения платежа.',
  supportOnlyMethod: 'Пополнение через карту и СБП доступно только через поддержку.',
  back: 'Назад',
  cancel: 'Отмена',
  close: 'Закрыть',
  adminPanel: 'Админ-панель',
  noAccess: 'Доступ закрыт',
  noAccessMsg: 'Этот раздел доступен только администратору.',
  navSearch: 'Поиск',
  navSteam: 'Steam',
  navSell: 'Продать',
  navChat: 'Чат',
  navProfile: 'Профиль',
  navAdmin: 'Админ',
  buy: 'Купить',
  deposit: 'Пополнить',
  insufficientFunds: 'Недостаточно средств',
  orderCreated: 'Заказ оформлен',
  paymentAccepted: 'Оплата принята',
  paymentUnavailable: 'Оплата недоступна',
  support: 'Поддержка',
  productNotFound: 'Товар не найден',
  goHome: 'На главную',
  details: 'Описание',
  delivery: 'Доставка',
  guarantee: 'Гарантия',
  paymentMethods: 'Способы оплаты',
  seller: 'Продавец',
  sellerLevel: 'уровень',
  steamLoginForCredit: 'Логин Steam для зачисления',
  steamLoginHint: 'Логин нужен только для зачисления, пароль никогда не запрашивается.',
  enterSteamLoginToContinue: 'Введите логин Steam, чтобы продолжить',
  openChat: 'Открыть чат',
  backToShop: 'Назад в магазин',
  topupBalanceFull: 'Пополнить баланс',
  requestSendError: 'Не удалось отправить заявку. Проверьте подключение к бэкенду.',
  networkError: 'Ошибка сети. Не удалось связаться с сервером — попробуйте позже.',
  topupPendingSent: 'Заявка отправлена. Баланс обновится после подтверждения администратора.',
  statusPending: 'ожидает',
  statusApproved: 'одобрено',
  statusRejected: 'отклонено',
  productTitle: 'Товар',
  productRemoved: 'Ссылка устарела или товар был снят с продажи.',
  sellerChat: 'Чат с продавцом',
  deliveryTime: '5–15 минут',
  productPaymentMethodsValue: 'Баланс · СБП · TON · USDT',
  reviewsTitle: 'Отзывы',
  deleteProduct: 'Удалить товар',
  orderCreatedMsg: 'Ожидайте подтверждения администратора — оператор обработает заказ в течение 5 минут. Уведомление придёт в чат поддержки.',
  orderPaidNotice: '✅ Ваш товар «{title}» был куплен.\nПередайте товар/услугу нашему официальному посреднику @YOUR_SUPPORT_USERNAME для проверки и передачи покупателю.',
  noticePaidTitle: '✅ Ваш товар «{title}» был куплен.',
  noticePaidBody: 'Передайте товар/услугу нашему официальному посреднику @YOUR_SUPPORT_USERNAME для проверки и передачи покупателю.',
  noticePurchaseLabel: 'Покупка',
  noticeAmountLabel: 'Сумма',
  noticeDealLabel: 'ID сделки',
  noticeDateLabel: 'Дата',
  contactRelayer: 'Чат с посредником',
  missingFunds: 'Не хватает {amount}.',
  dealTitle: 'Сделка',
  dealNotFound: 'Сделка не найдена',
  dealNotFoundMsg: 'Ссылка устарела или ссылается на сделку с другого устройства продавца.',
  buyerDealTitle: 'Покупка через гаранта',
  noPhoto: 'Без фото',
  toPayLabel: 'К оплате',
  escrowFee: 'Гарант удержит',
  yourBalance: 'Ваш баланс',
  dealPendingModeration: 'Сделка ещё не прошла модерацию. Оплата откроется, как только админ одобрит товар.',
  dealRejectedModeration: 'Сделка отклонена модерацией. Оплата недоступна.',
  escrowWarning: 'Оплата проходит через OTC-гаранта. Не переводите деньги напрямую продавцу — иначе сделка не будет защищена.',
  paid: 'Оплачено',
  dealSuccessMsg: 'Ожидайте подтверждения администратора. Как только продавец передаст товар, сделка закроется автоматически.',
  openSupport: 'Открыть поддержку',
  supportTitle: 'Поддержка Playerok',
  supportOnline: 'Онлайн · отвечаем за 3 минуты',
  screenshotThanks: 'Спасибо за скриншот! Передал в работу — оператор подключится в ближайшее время.',
  screenshotAlt: 'Скриншот',
  attachmentReady: 'Скриншот готов к отправке',
  removeAttachment: 'Удалить вложение',
  attachScreenshot: 'Прикрепить скриншот',
  captionPlaceholder: 'Подпись к скриншоту…',
  messagePlaceholder: 'Сообщение поддержке…',
  send: 'Отправить',
  sellTitle: 'Продать',
  gamesAndApps: 'Игры и приложения',
  popularCategories: 'Популярные категории',
  lowerPaymentTitle: 'Платёж снизился в 2 раза',
  priceCalculator: 'Калькулятор цены',
  itemPrice: 'Цена товара',
  income: 'Доход',
  payoutFee: 'Платёж {percent}%',
  payoutMethods: 'Способы выплаты',
  payoutMethodsHint: 'Выводите средства удобным вам способом.',
  startSelling: 'Начать продажу',
  withdrawTitle: 'Вывод средств',
  walletAddress: 'Адрес кошелька',
  ownerName: 'Имя владельца',
  withdrawSubmit: 'Вывести',
  withdrawalSubmitted: 'Заявка подана на рассмотрение',
  withdrawalHistoryUpdated: 'История вывода обновлена.',
  toBalance: 'К балансу',
  newBadge: 'Новое',
  clear: 'Очистить',
  searchResultsTitle: 'Поиск',
  resultOne: 'результат',
  resultFew: 'результата',
  resultMany: 'результатов',
  nothingFound: 'Ничего не нашли',
  nothingFoundHint: 'Попробуйте другое слово: «Robux», «Telegram Premium», «CS2».',
  userDeals: 'Сделки пользователей',
  fromUser: 'от пользователя',
  catalogTitle: 'Каталог',
  enableLightTheme: 'Включить светлую тему',
  enableDarkTheme: 'Включить тёмную тему',
  chooseLanguage: 'Выбор языка',
  millionPlus: '1 млн+',
  copyPrompt: 'Скопируйте:',
  kaspiNumber: 'Kaspi-номер',
};

const EN: Translations = {
  search: 'Search games and apps',
  apps: 'Apps',
  games: 'Games',
  mobileGames: 'Mobile Games',
  premiumProducts: 'Premium Items',
  donate: 'Donate',
  subscriptions: 'Subscriptions',
  items: 'Items',
  accounts: 'Accounts',
  keys: 'Keys',
  nft: 'NFT',
  topupSteam: 'Top Up Steam',
  steamLoginLabel: 'Steam Login',
  steamLoginPlaceholder: 'Enter login',
  amountLabel: 'Amount',
  commission: 'Commission',
  pay: 'Pay',
  noLoginError: 'Please enter Steam login first',
  enterLoginFirst: '',
  ok: 'OK',
  profileTitle: 'Profile',
  myItems: 'My Items',
  purchases: 'Purchases',
  sales: 'Sales',
  active: 'Active',
  completed: 'Completed',
  noItemsTitle: 'No items',
  noItemsSub: 'List your item for sale',
  listItem: 'List item',
  noPurchasesTitle: 'No purchases',
  noPurchasesSub: 'Items you buy will appear here',
  goToShop: 'Go to shop',
  noSalesTitle: 'No sales',
  noSalesSub: 'Completed sales will appear here',
  noReviews: 'no reviews',
  onPlayerok: 'on Playerok',
  balanceTitle: 'Balance',
  available: 'Available',
  topUp: 'Top Up',
  withdraw: 'Withdraw',
  withdrawHistory: 'Withdrawal History',
  noWithdrawals: 'No requests yet',
  afterRequest: 'Requests will appear here after submission.',
  cryptoLabel: 'Cryptocurrency',
  bankCard: 'Bank Card',
  pendingLabel: 'pending',
  topupBalance: 'Top Up Balance',
  currentBalance: 'Current Balance',
  onReview: 'In review',
  adminConfirms: 'Admin confirms transfers within 5–30 minutes.',
  topupAmountLabel: 'Top Up Amount',
  paymentMethod: 'Payment Method',
  continueBtn: 'Continue',
  demoNote: 'Demo top-up: amount goes to local balance after confirmation.',
  remoteNote: 'Request sent. Balance updates after admin approval.',
  supportOnly: 'Top up via this method is only available through support.',
  contactSupport: 'Contact Support',
  iSent: 'I sent the transfer',
  iTransferred: 'I transferred',
  copyDetails: 'Copy details',
  copied: 'Copied',
  network: 'Network',
  transferAmount: 'Transfer amount',
  walletHint: 'Wallet address. Balance updates after admin confirms:',
  phone: 'Phone number',
  receivingBank: 'Bank',
  recipient: 'Recipient',
  cardNumber: 'Card number',
  bankLabel: 'Bank',
  requestNum: 'Request',
  important: 'Important.',
  cryptoWarning: 'Send only to the shown address. After sending, click "I sent" — admin will verify.',
  sbpWarning: 'Send via SBP. After sending, click "I transferred" — admin will confirm.',
  cardWarning: 'Card top-up is only available through support — tap the button below.',
  kaspiWarning: 'Transfer via Kaspi. After sending, click "I transferred".',
  successTitle: 'Request sent',
  successMsg: 'Balance will update after admin confirmation.',
  toProfile: 'To profile',
  toBuy: 'Shop',
  equivalent: 'equivalent',
  steamPayment: 'Steam Payment',
  toPay: 'To pay',
  paymentMethodTitle: 'Payment Method',
  cryptoMethod: 'Cryptocurrency',
  bankCardMethod: 'Bank Card / SBP',
  payBtn: 'Pay',
  waitingTitle: 'Request sent',
  waitingMsg: 'Please wait for admin confirmation. We will notify you in the bot.',
  toHome: 'Home',
  sendPayment: 'I paid',
  steamNote: 'Funds will be credited to Steam after payment confirmation.',
  supportOnlyMethod: 'Card and SBP top-up is only available through support.',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  adminPanel: 'Admin Panel',
  noAccess: 'Access denied',
  noAccessMsg: 'This section is for administrators only.',
  navSearch: 'Search',
  navSteam: 'Steam',
  navSell: 'Sell',
  navChat: 'Chat',
  navProfile: 'Profile',
  navAdmin: 'Admin',
  buy: 'Buy',
  deposit: 'Deposit',
  insufficientFunds: 'Insufficient funds',
  orderCreated: 'Order created',
  paymentAccepted: 'Payment accepted',
  paymentUnavailable: 'Payment unavailable',
  support: 'Support',
  productNotFound: 'Product not found',
  goHome: 'Home',
  details: 'Details',
  delivery: 'Delivery',
  guarantee: 'Guarantee',
  paymentMethods: 'Payment methods',
  seller: 'Seller',
  sellerLevel: 'level',
  steamLoginForCredit: 'Steam login for credit',
  steamLoginHint: 'Login is only used for crediting; password is never requested.',
  enterSteamLoginToContinue: 'Enter Steam login to continue',
  openChat: 'Open chat',
  backToShop: 'Back to shop',
  topupBalanceFull: 'Top up balance',
  requestSendError: 'Could not send the request. Check backend connection.',
  networkError: 'Network error. Could not reach the server — try again later.',
  topupPendingSent: 'Request sent. Balance updates after admin approval.',
  statusPending: 'pending',
  statusApproved: 'approved',
  statusRejected: 'rejected',
  productTitle: 'Product',
  productRemoved: 'This link is outdated or the product was removed.',
  sellerChat: 'Chat with seller',
  deliveryTime: '5–15 minutes',
  productPaymentMethodsValue: 'Balance · SBP · TON · USDT',
  reviewsTitle: 'Reviews',
  deleteProduct: 'Delete product',
  orderCreatedMsg: 'Wait for admin confirmation. An operator will process the order within 5 minutes. A notification will arrive in support chat.',
  orderPaidNotice: '✅ Your item “{title}” has been purchased.\nHand the item/service over to our official relayer @YOUR_SUPPORT_USERNAME for verification and delivery to the buyer.',
  noticePaidTitle: '✅ Your item “{title}” has been purchased.',
  noticePaidBody: 'Hand the item/service over to our official relayer @YOUR_SUPPORT_USERNAME for verification and delivery to the buyer.',
  noticePurchaseLabel: 'Purchase',
  noticeAmountLabel: 'Amount',
  noticeDealLabel: 'Deal ID',
  noticeDateLabel: 'Date',
  contactRelayer: 'Chat with relayer',
  missingFunds: 'Missing {amount}.',
  dealTitle: 'Deal',
  dealNotFound: 'Deal not found',
  dealNotFoundMsg: 'The link is outdated or points to a deal stored on another seller device.',
  buyerDealTitle: 'Escrow purchase',
  noPhoto: 'No photo',
  toPayLabel: 'To pay',
  escrowFee: 'Escrow fee',
  yourBalance: 'Your balance',
  dealPendingModeration: 'This deal is still under moderation. Payment opens after admin approval.',
  dealRejectedModeration: 'This deal was rejected by moderation. Payment is unavailable.',
  escrowWarning: 'Payment goes through OTC escrow. Do not send money directly to the seller or the deal will not be protected.',
  paid: 'Paid',
  dealSuccessMsg: 'Wait for admin confirmation. Once the seller transfers the item, the deal will close automatically.',
  openSupport: 'Open support',
  supportTitle: 'Playerok Support',
  supportOnline: 'Online · replies in 3 minutes',
  screenshotThanks: 'Thanks for the screenshot. I passed it to the operator.',
  screenshotAlt: 'Screenshot',
  attachmentReady: 'Screenshot ready to send',
  removeAttachment: 'Remove attachment',
  attachScreenshot: 'Attach screenshot',
  captionPlaceholder: 'Screenshot caption…',
  messagePlaceholder: 'Message support…',
  send: 'Send',
  sellTitle: 'Sell',
  gamesAndApps: 'Games and apps',
  popularCategories: 'Popular categories',
  lowerPaymentTitle: 'Fee reduced by half',
  priceCalculator: 'Price calculator',
  itemPrice: 'Item price',
  income: 'Income',
  payoutFee: 'Fee {percent}%',
  payoutMethods: 'Payout methods',
  payoutMethodsHint: 'Withdraw funds with a convenient method.',
  startSelling: 'Start selling',
  withdrawTitle: 'Withdraw funds',
  walletAddress: 'Wallet address',
  ownerName: 'Owner name',
  withdrawSubmit: 'Withdraw',
  withdrawalSubmitted: 'Request submitted',
  withdrawalHistoryUpdated: 'Withdrawal history updated.',
  toBalance: 'To balance',
  newBadge: 'New',
  clear: 'Clear',
  searchResultsTitle: 'Search',
  resultOne: 'result',
  resultFew: 'results',
  resultMany: 'results',
  nothingFound: 'Nothing found',
  nothingFoundHint: 'Try another query: "Robux", "Telegram Premium", "CS2".',
  userDeals: 'User deals',
  fromUser: 'from user',
  catalogTitle: 'Catalog',
  enableLightTheme: 'Enable light theme',
  enableDarkTheme: 'Enable dark theme',
  chooseLanguage: 'Language selection',
  millionPlus: '1M+',
  copyPrompt: 'Copy this:',
  kaspiNumber: 'Kaspi number',
};

export const TRANSLATIONS: Record<Lang, Translations> = { ru: RU, en: EN };

interface LangCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.documentElement.lang = next;
    try { window.localStorage.setItem(LANG_KEY, next); } catch {/**/}
    if (hasTelegramAuth()) {
      setApiLanguage(next).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!hasTelegramAuth()) return;
    fetchMe()
      .then((me) => {
        if (me.lang === 'ru' || me.lang === 'en') {
          setLangState(me.lang);
          document.documentElement.lang = me.lang;
          try { window.localStorage.setItem(LANG_KEY, me.lang); } catch {/**/}
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <Ctx.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLanguage must be used within LanguageProvider');
  return v;
}

