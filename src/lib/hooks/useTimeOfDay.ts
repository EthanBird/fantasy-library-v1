import { useSettingsStore } from '@/stores/settingsStore';
import { useEffect, useState } from 'react';
import { computeDaylight } from '@/lib/time/timeOfDay';

/**
 * 每 30 秒更新一次昼夜（如果 timeSystemEnabled）
 */
export function useTimeOfDay() {
  const enabled = useSettingsStore((s) => s.gameplay.timeSystemEnabled);
  const t = useSettingsStore((s) => s.gameplay.currentTimeOfDay);
  const [v, setV] = useState(t);

  useEffect(() => {
    if (!enabled) {
      setV(t);
      return;
    }
    const id = setInterval(() => {
      const next = (useSettingsStore.getState().gameplay.currentTimeOfDay + 1 / 60) % 24;
      useSettingsStore.getState().setGameplay({ currentTimeOfDay: next });
      setV(next);
    }, 30_000);
    return () => clearInterval(id);
  }, [enabled]);

  useEffect(() => {
    setV(t);
  }, [t]);

  return computeDaylight(v);
}
