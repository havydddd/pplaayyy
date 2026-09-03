import type { ReactNode } from 'react';
import { CheckIcon, AlertIcon } from './Icon';

interface Props {
  open: boolean;
  variant: 'success' | 'error';
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon?: ReactNode;
}

export function ResultSheet({
  open,
  variant,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon,
}: Props) {
  if (!open) return null;
  const defaultIcon =
    variant === 'success' ? <CheckIcon size={28} /> : <AlertIcon size={28} />;
  return (
    <div className="toast-backdrop" onClick={onSecondary ?? onPrimary}>
      <div className="toast-sheet" onClick={(e) => e.stopPropagation()}>
        <div className={`icon-wrap ${variant === 'success' ? 'icon-wrap--green' : 'icon-wrap--red'}`}>
          {icon ?? defaultIcon}
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="actions">
          <button className={`btn ${variant === 'success' ? 'btn--primary' : 'btn--danger'}`} onClick={onPrimary}>
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button className="btn btn--ghost" onClick={onSecondary}>
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
