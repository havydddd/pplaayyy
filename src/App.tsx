import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { preloadBrands } from './components/BrandIcon';
import { logSessionStart } from './state/EventLog';
import { displayName, readTelegramUser } from './state/TelegramUser';
import { refreshDeals } from './data/deals';
import { refreshAdminStore } from './state/AdminStore';
import HomePage from './pages/HomePage';
import SellPage from './pages/SellPage';
import TermsPage from './pages/TermsPage';
import CreateDealPage from './pages/CreateDealPage';
import ProfilePage from './pages/ProfilePage';
import DealCardPage from './pages/DealCardPage';
import BuyerDealPage from './pages/BuyerDealPage';
import AppCatalogPage from './pages/AppCatalogPage';
import ProductPage from './pages/ProductPage';
import TopupPage from './pages/TopupPage';
import ChatsPage from './pages/ChatsPage';
import CategoryPage from './pages/CategoryPage';
import AdminPage from './pages/AdminPage';
import BalancePage from './pages/BalancePage';
import WithdrawPage from './pages/WithdrawPage';
import SteamPaymentPage from './pages/SteamPaymentPage';

const SPLASH_MIN_MS = 700;
const SPLASH_MAX_MS = 3500;

function App() {
  const location = useLocation();
  const isBuyer = location.pathname.startsWith('/buyer');

  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.app-shell')?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const minDelay = new Promise<void>((r) => setTimeout(r, SPLASH_MIN_MS));
    const maxDelay = new Promise<void>((r) => setTimeout(r, SPLASH_MAX_MS));
    const work = preloadBrands(['steam', 'telegram', 'roblox', 'minecraft', 'brawl']);

    Promise.race([Promise.all([minDelay, work]), maxDelay]).then(() => {
      setFading(true);
      setTimeout(() => setReady(true), 280);
    });

    // Log once per browser session — feeds the admin event log.
    const user = readTelegramUser();
    logSessionStart(displayName(user), user.id, user.username);

    // Warm the shared (server-backed) caches so listings created on other
    // devices are visible immediately, even via deep links.
    void refreshDeals(['public', 'mine']);
    void refreshAdminStore();
  }, []);

  return (
    <>
      {!ready && <SplashScreen fadeOut={fading} />}
      <div className="app-shell" style={{ visibility: ready ? 'visible' : 'hidden' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/:appId" element={<AppCatalogPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/category/:tag" element={<CategoryPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/create" element={<CreateDealPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/topup" element={<TopupPage />} />
          <Route path="/steam-payment" element={<SteamPaymentPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/deal/:id" element={<DealCardPage />} />
        <Route path="/buyer/:id" element={<BuyerDealPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isBuyer && <BottomNav />}
      </div>
    </>
  );
}

export default App;
