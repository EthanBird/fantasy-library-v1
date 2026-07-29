import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { HALLS } from '@/data/halls';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function Minimap() {
  const hallId = usePlayerStore((s) => s.hallId);
  const pos = usePlayerStore((s) => s.position);
  const yaw = usePlayerStore((s) => s.yaw);
  const hall = HALLS[hallId];
  const unlockedHalls = useProgressStore((s) => s.unlockedHalls);
  const discoveredHalls = useProgressStore((s) => s.discoveredHalls);
  const setHall = usePlayerStore((s) => s.setHall);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const [expanded, setExpanded] = useState(false);
  const scale = useSettingsStore((s) => s.ui.minimapScale);

  const size = hall.parameters.roomSize;
  const padding = 8;
  const miniSize = (expanded ? 300 : 160) * scale;
  const range = Math.max(size[0], size[2]) + 4;
  const mapX = ((pos[0] + range / 2) / range) * miniSize;
  const mapZ = ((pos[2] + range / 2) / range) * miniSize;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: miniSize,
        height: miniSize,
        background: 'rgba(10, 8, 32, 0.6)',
        border: '1px solid var(--border-glass)',
        borderRadius: 8,
        backdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* 房间轮廓 */}
      <svg width={miniSize} height={miniSize}>
        <rect
          x={padding} y={padding}
          width={miniSize - padding * 2} height={miniSize - padding * 2}
          fill="none" stroke="var(--border-glass)" strokeWidth="1" opacity="0.5"
        />
        {/* 书架点 */}
        {hall.shelfLayout.map((s, i) => {
          const sx = ((s.position[0] + range / 2) / range) * miniSize;
          const sz = ((s.position[2] + range / 2) / range) * miniSize;
          return <circle key={i} cx={sx} cy={sz} r="2" fill="var(--text-muted)" opacity="0.6" />;
        })}
        {/* 玩家 */}
        <g transform={`translate(${mapX}, ${mapZ})`}>
          <circle r="4" fill="var(--accent)" opacity="0.8" />
          <line x1="0" y1="0" x2={Math.sin(yaw) * 12} y2={-Math.cos(yaw) * 12} stroke="var(--accent)" strokeWidth="1.5" />
        </g>
      </svg>
      {expanded && (
        <div style={{
          position: 'absolute',
          top: miniSize + 4,
          right: 0,
          background: 'rgba(10, 8, 32, 0.9)',
          border: '1px solid var(--border-glass)',
          borderRadius: 8,
          padding: 8,
          minWidth: 200,
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>已探索馆厅</div>
          {discoveredHalls.map((id) => {
            const h = HALLS[id];
            const unlocked = unlockedHalls.includes(id);
            return (
              <div
                key={id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (unlocked) {
                    setHall(id);
                    setPosition([0, 1.6, 6]);
                  }
                }}
                style={{
                  fontSize: 12,
                  padding: '4px 6px',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                  opacity: unlocked ? 1 : 0.5,
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => { if (unlocked) e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              >
                {h.name.zh} {unlocked ? '' : '🔒'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
