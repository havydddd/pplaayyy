import type { CSSProperties } from 'react';
import type { AppId } from '../data/catalog';

/**
 * BrandIcon renders an app tile.
 *
 * Render priority (first that works wins):
 *   1. User-supplied raster image at /apps/<id>.(png|jpg|jpeg|webp).
 *      Drop a file with that exact name into miniapp/public/apps/
 *      and it will be picked up automatically — no code change needed.
 *   2. The built-in art defined below:
 *        - mode "mask": white glyph mask on a coloured background
 *          (used for Steam / Telegram / Roblox where we have a clean
 *          monochrome glyph from simple-icons).
 *        - mode "image": a full-colour SVG drawn as an <img>
 *          (used for Minecraft and Brawl Stars where the icon needs
 *          multiple colours / gradients).
 */

type ArtSpec =
  | { mode: 'mask'; bg: string; mask: string; maskSize?: string }
  | { mode: 'image'; image: string };

const ART: Record<AppId, ArtSpec> = {
  steam: {
    mode: 'mask',
    bg: 'radial-gradient(120% 120% at 25% 20%, #4b6e93 0%, #1b2838 55%, #0b1a2c 100%)',
    mask: '/apps/steam.svg',
    maskSize: '62%',
  },
  telegram: {
    mode: 'mask',
    bg: 'linear-gradient(135deg, #37bbfe 0%, #0088cc 100%)',
    mask: '/apps/telegram.svg',
    maskSize: '62%',
  },
  roblox: {
    mode: 'mask',
    bg: 'linear-gradient(180deg, #161719 0%, #232428 100%)',
    mask: '/apps/roblox.svg',
    maskSize: '58%',
  },
  minecraft: {
    mode: 'image',
    image: '/apps/minecraft.svg',
  },
  brawl: {
    mode: 'image',
    image: '/apps/brawl.svg',
  },
};

const CUSTOM_IMAGES: Partial<Record<AppId, string>> = {
  minecraft: '/apps/Minecraft-logo.png',
  brawl: '/apps/brawl-stars-logo.png',
};

/**
 * Pre-warm the custom-image cache for a list of apps. Useful from a splash
 * screen so the app waits for the user's uploaded logos before the first
 * paint, avoiding the SVG-fallback flash.
 */
export function preloadBrands(apps: AppId[]): Promise<void> {
  apps.forEach((app) => {
    const url = CUSTOM_IMAGES[app];
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
  return Promise.resolve();
}

interface Props {
  app: AppId;
  size?: number;
  rounded?: number;
  style?: CSSProperties;
  className?: string;
  /**
   * When true the icon spans the parent (width:100% / height:100%) instead
   * of using a fixed `size` in pixels. Useful for filling a card's photo
   * area with the brand artwork.
   */
  fill?: boolean;
}

export function BrandIcon({
  app,
  size = 78,
  rounded = 20,
  style,
  className,
  fill = false,
}: Props) {
  const art = ART[app];
  const customUrl = CUSTOM_IMAGES[app];

  const baseStyle: CSSProperties = {
    width: fill ? '100%' : size,
    height: fill ? '100%' : size,
    borderRadius: fill ? 0 : rounded,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    boxShadow: fill ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.18)',
    background: customUrl
      ? '#1f2029'
      : art.mode === 'mask'
      ? art.bg
      : '#1f2029',
    ...style,
  };

  // When filling a card we want the glyph noticeably bigger than the tile
  // version.
  const maskSize =
    art.mode === 'mask'
      ? fill
        ? '70%'
        : art.maskSize ?? '60%'
      : undefined;
  const customObjectFit: CSSProperties['objectFit'] = fill ? 'contain' : 'cover';

  return (
    <div className={className} style={baseStyle}>
      {customUrl ? (
        <img
          src={customUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: customObjectFit,
            display: 'block',
          }}
        />
      ) : art.mode === 'image' ? (
        <img
          src={art.image}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#ffffff',
            WebkitMaskImage: `url(${art.mask})`,
            maskImage: `url(${art.mask})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: maskSize,
            maskSize: maskSize,
          }}
        />
      )}
    </div>
  );
}
