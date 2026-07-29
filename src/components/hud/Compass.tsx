import { usePlayerStore } from '@/stores/playerStore';
import { HALLS } from '@/data/halls';

export function Compass() {
  const yaw = usePlayerStore((s) => s.yaw);
  const hallId = usePlayerStore((s) => s.hallId);
  const hall = HALLS[hallId];
  const yawDeg = (yaw * 180 / Math.PI + 360) % 360;
  return (
    <div style={{
      position: 'absolute',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 320,
      textAlign: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--accent)',
        letterSpacing: '0.3em',
        textShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
        marginBottom: 4,
      }}>
        {hall.name.zh}
      </div>
      <div style={{
        position: 'relative',
        height: 4,
        background: 'var(--bg-glass)',
        borderRadius: 2,
        border: '1px solid var(--border-glass)',
      }}>
        <div style={{
          position: 'absolute',
          top: -2,
          left: '50%',
          width: 2,
          height: 8,
          background: 'var(--accent)',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 6px var(--accent)',
        }} />
        <div style={{
          position: 'absolute',
          top: -6,
          left: `calc(50% - 14px - ${(yawDeg / 360) * 280}px)`,
          transition: 'left 100ms linear',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>
          N · {Math.round(yawDeg)}°
        </div>
      </div>
    </div>
  );
}
