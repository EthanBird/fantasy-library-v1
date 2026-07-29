import { useSettingsStore } from '@/stores/settingsStore';
import { useTimeOfDay } from '@/lib/hooks/useTimeOfDay';

export function TimeOfDayHUD() {
  const t = useSettingsStore((s) => s.gameplay.currentTimeOfDay);
  const setGameplay = useSettingsStore((s) => s.setGameplay);
  const weather = useSettingsStore((s) => s.gameplay.weather);
  const enabled = useSettingsStore((s) => s.gameplay.timeSystemEnabled);
  const daylight = useTimeOfDay();

  const hours = Math.floor(t);
  const minutes = Math.floor((t - hours) * 60);

  const weatherIcons = { clear: '☀', rain: '☔', snow: '❄', fog: '☁' };

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 24,
        fontSize: 12,
        color: 'var(--text-secondary)',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={() => setGameplay({ timeSystemEnabled: !enabled })}
      title={enabled ? '点击停止时间' : '点击启动时间'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'rgba(10, 8, 32, 0.4)', borderRadius: 16, border: '1px solid var(--border-glass)' }}>
        <span>{weatherIcons[weather]}</span>
        <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </span>
        {!enabled && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(静止)</span>}
      </div>
    </div>
  );
}
