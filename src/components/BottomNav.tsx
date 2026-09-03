import { useLocation, useNavigate } from 'react-router-dom';
import { SearchIcon, SteamIcon, PlusIcon, ChatIcon, UserIcon, ShieldIcon } from './Icon';
import { isAdminId } from '../state/AdminAccess';
import { readTelegramUser } from '../state/TelegramUser';
import { useLanguage } from '../state/LanguageContext';

interface Item {
  id: string;
  path: string;
  match: (path: string) => boolean;
  icon: (props: { size?: number }) => JSX.Element;
}

const ITEMS: Item[] = [
  {
    id: 'search',
    path: '/',
    match: (p) =>
      p === '/' || p.startsWith('/home') || p.startsWith('/app/') || p.startsWith('/product/'),
    icon: (props) => <SearchIcon {...props} />,
  },
  {
    id: 'steam',
    path: '/app/steam',
    match: (p) => p === '/app/steam',
    icon: (props) => <SteamIcon {...props} />,
  },
  {
    id: 'sell',
    path: '/sell',
    match: (p) => p.startsWith('/sell') || p.startsWith('/terms') || p.startsWith('/create'),
    icon: (props) => <PlusIcon {...props} />,
  },
  {
    id: 'chats',
    path: '/chats',
    match: (p) => p.startsWith('/chats'),
    icon: (props) => <ChatIcon {...props} />,
  },
  {
    id: 'profile',
    path: '/profile',
    match: (p) =>
      p.startsWith('/profile') || p.startsWith('/deal') || p.startsWith('/topup'),
    icon: (props) => <UserIcon {...props} />,
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const user = readTelegramUser();
  const items: Item[] = isAdminId(user.id)
    ? [
        ...ITEMS.slice(0, 3),
        {
          id: 'admin',
          path: '/admin',
          match: (p) => p.startsWith('/admin'),
          icon: (props) => <ShieldIcon {...props} />,
        },
        ...ITEMS.slice(3),
      ]
    : ITEMS;
  const labels: Record<string, string> = {
    search: t.navSearch,
    steam: t.navSteam,
    sell: t.navSell,
    chats: t.navChat,
    profile: t.navProfile,
    admin: t.navAdmin,
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label={t.navSearch}>
      {items.map((item) => {
        const active = item.match(location.pathname);
        return (
          <button
            key={item.id}
            className={`bottom-nav__item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">
              <item.icon size={22} />
            </span>
            <span>{labels[item.id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
