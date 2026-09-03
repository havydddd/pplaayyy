/**
 * Loading splash shown while the app preloads critical brand icons. White
 * background, blue Playerok wordmark with a logo square on the left.
 */
export function SplashScreen({ fadeOut = false }: { fadeOut?: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24,
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 260ms ease',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <PlayerokMark size={56} />
        <span
          style={{
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: '-0.025em',
            color: '#2f6dff',
          }}
        >
          Playerok
        </span>
      </div>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid rgba(47, 109, 255, 0.18)',
          borderTopColor: '#2f6dff',
          animation: 'pl-spin 700ms linear infinite',
        }}
      />

      <style>{`@keyframes pl-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PlayerokMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="plMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6dff" />
          <stop offset="100%" stopColor="#12c8ef" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#plMark)" />
      <path
        d="M22 16 L36 16 Q46 16 46 27 Q46 38 36 38 L28 38 L28 50 L22 50 Z M28 22 L28 32 L34 32 Q40 32 40 27 Q40 22 34 22 Z"
        fill="#ffffff"
      />
    </svg>
  );
}
