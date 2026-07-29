import { useSettingsStore } from '@/stores/settingsStore';

/**
 * 昼夜 / 天气系统
 * - 根据 settings.currentTimeOfDay 决定全局色调
 * - 影响 ambient + directional 灯光色温
 * - 决定窗外/穹顶的星点数量
 */

export interface Daylight {
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunAngle: number; // 弧度：0 = 正午顶光，PI = 午夜
  starCount: number;
  fogColor: string;
}

export function computeDaylight(timeOfDay: number): Daylight {
  // 0-24 小时
  const t = ((timeOfDay % 24) + 24) % 24;
  const sunAngle = ((t - 6) / 12) * Math.PI; // 6am = 0, 12pm = PI/2, 6pm = PI, midnight = -PI/2

  // 色温
  const isDay = t >= 6 && t < 18;
  const isDawnDusk = t >= 5 && t < 7 || t >= 17 && t < 19;
  let sunColor: string, ambientColor: string, sunIntensity: number, ambientIntensity: number;

  if (isDay) {
    sunColor = '#fff5e0';
    ambientColor = '#a8b8d0';
    sunIntensity = 1.0;
    ambientIntensity = 0.5;
  } else if (isDawnDusk) {
    sunColor = '#ff9966';
    ambientColor = '#a06060';
    sunIntensity = 0.7;
    ambientIntensity = 0.4;
  } else {
    sunColor = '#4466aa';
    ambientColor = '#1a2240';
    sunIntensity = 0.1;
    ambientIntensity = 0.2;
  }

  return {
    sunColor,
    sunIntensity,
    ambientColor,
    ambientIntensity,
    sunAngle,
    starCount: isDay ? 50 : 800,
    fogColor: isDay ? '#a0b0c0' : isDawnDusk ? '#604030' : '#0a0a1a',
  };
}

export function setTimeOfDay(t: number) {
  useSettingsStore.getState().setGameplay({ currentTimeOfDay: t });
}

export function advanceTime(deltaSeconds: number) {
  const s = useSettingsStore.getState();
  const next = (s.gameplay.currentTimeOfDay + deltaSeconds / 60) % 24;
  s.setGameplay({ currentTimeOfDay: next });
}
