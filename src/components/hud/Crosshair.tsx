import { useUIStore } from '@/stores/uiStore';

export function Crosshair() {
  const hover = useUIStore((s) => s.hover);
  const interactive = hover.type !== null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle
          cx="10" cy="10" r={interactive ? 5 : 1.5}
          fill={interactive ? 'rgba(212, 175, 55, 0.9)' : 'rgba(232, 228, 216, 0.7)'}
          stroke={interactive ? '#d4af37' : 'rgba(232, 228, 216, 0.5)'}
          strokeWidth="1"
          style={{ transition: 'all 150ms ease-out' }}
        />
        {interactive && (
          <circle cx="10" cy="10" r="9" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.5">
            <animate attributeName="r" from="9" to="14" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}
