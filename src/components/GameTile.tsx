import type { AppInfo } from '../data/catalog';
import { BrandIcon } from './BrandIcon';
import { useLanguage } from '../state/LanguageContext';

interface Props {
  app: AppInfo;
  onClick?: () => void;
  size?: number;
}

export function GameTile({ app, onClick, size = 78 }: Props) {
  const { t } = useLanguage();
  return (
    <div className="tile" onClick={onClick} style={{ flexBasis: size }}>
      {app.badge === 'new' && <span className="badge badge--new">{t.newBadge}</span>}
      <BrandIcon app={app.id} size={size} rounded={Math.round(size / 4)} />
      <div className="tile__name" style={{ maxWidth: size + 8 }}>
        {app.short ?? app.name}
      </div>
    </div>
  );
}
