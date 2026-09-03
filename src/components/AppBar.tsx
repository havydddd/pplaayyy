import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CloseIcon } from './Icon';
import { useLanguage } from '../state/LanguageContext';

interface AppBarProps {
  title: string;
  leading?: 'back' | 'none';
  trailing?: 'close' | 'none';
  onClose?: () => void;
}

export function AppBar({ title, leading = 'back', trailing = 'close', onClose }: AppBarProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  return (
    <div className="appbar">
      {leading === 'back' ? (
        <button className="icon-btn" onClick={handleBack} aria-label={t.back}>
          <ArrowLeftIcon size={18} />
        </button>
      ) : (
        <span />
      )}
      <div className="appbar__title">{title}</div>
      {trailing === 'close' ? (
        <button className="icon-btn" onClick={handleClose} aria-label={t.close}>
          <CloseIcon size={18} />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
