import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const baseProps = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const SearchIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const GridIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="6" cy="6" r="1.4" />
    <circle cx="12" cy="6" r="1.4" />
    <circle cx="18" cy="6" r="1.4" />
    <circle cx="6" cy="12" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="18" cy="12" r="1.4" />
    <circle cx="6" cy="18" r="1.4" />
    <circle cx="12" cy="18" r="1.4" />
    <circle cx="18" cy="18" r="1.4" />
  </svg>
);

export const SteamIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="9" cy="9" r="3" />
    <circle cx="15.5" cy="15" r="2.5" />
    <path d="m11 11 4 4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const DonateIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 7h16v3H4z" />
    <path d="M5 10v9h14v-9" />
    <path d="M12 7v12" />
    <path d="M9 7c-1.5-1.5-1.5-4 0-4 1 0 2 1 3 3 1-2 2-3 3-3 1.5 0 1.5 2.5 0 4" />
  </svg>
);

export const SubscriptionIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="3" y="4" width="18" height="14" rx="3" />
    <path d="M3 9h18" />
    <path d="M8 14h4" />
  </svg>
);

export const SwordsIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="m5 5 5 5-4 4-2-2z" />
    <path d="m19 5-5 5 4 4 2-2z" />
    <path d="m11 13 3 3" />
    <path d="m10 14-4 4-2-1" />
    <path d="m14 14 4 4 2-1" />
  </svg>
);

export const SellIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const ChatIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M21 12a8 8 0 1 1-3-6.3L21 5l-1.7 3.2A8 8 0 0 1 21 12Z" />
  </svg>
);

export const UserIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export const MoonIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const StarIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9L2 9.2l7.1-.6L12 2Z" />
  </svg>
);

export const InfoIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8h.01" />
    <path d="M11 12h1v5h1" />
  </svg>
);

export const ChevronRightIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const CloseIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export const ArrowLeftIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const SwapIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M7 7h11l-3-3" />
    <path d="M17 17H6l3 3" />
  </svg>
);

export const CheckIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="m5 12 5 5 9-11" />
  </svg>
);

export const CameraIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const ShieldIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const CopyIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

export const TagIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);

export const PlusIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BagIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M5 9h14l-1 11H6L5 9Z" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
  </svg>
);

export const AlertIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M12 2 2 21h20L12 2Z" />
    <path d="M12 10v5" />
    <path d="M12 18h.01" />
  </svg>
);

export const SunIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </svg>
);

export const SendIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest} fill="currentColor" stroke="none">
    <path d="M3 12 21 3l-4 18-5-8-9-1Z" />
  </svg>
);

export const WalletIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M16 13h3" />
    <path d="M3 9h18" />
  </svg>
);

export const HeadsetIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 14v-2a8 8 0 1 1 16 0v2" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
    <path d="M21 18a4 4 0 0 1-4 4h-1" />
  </svg>
);

export const MenuIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
