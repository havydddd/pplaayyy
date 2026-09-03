import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './state/ThemeContext';
import { WalletProvider } from './state/WalletContext';
import { LanguageProvider } from './state/LanguageContext';
import './styles/globals.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        openTelegramLink?: (url: string) => void;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
        };
      };
    };
  }
}

const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
  } catch {
    /* ignore non-Telegram environments */
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <WalletProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </WalletProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
