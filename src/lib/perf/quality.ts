import type { QualityPreset } from '@/types';

export interface QualitySettings {
  shadowMapSize: number;
  enableShadows: boolean;
  particleMultiplier: number;
  volumetricEnabled: boolean;
  bloomEnabled: boolean;
  dpr: [number, number];
  antialias: boolean;
  maxLights: number;
  drawDistance: number;
  textureAnisotropy: number;
}

const PRESETS: Record<QualityPreset, QualitySettings> = {
  ultra: { shadowMapSize: 2048, enableShadows: true, particleMultiplier: 1, volumetricEnabled: true, bloomEnabled: true, dpr: [1, 2], antialias: true, maxLights: 12, drawDistance: 80, textureAnisotropy: 16 },
  high: { shadowMapSize: 1024, enableShadows: true, particleMultiplier: 0.8, volumetricEnabled: true, bloomEnabled: true, dpr: [1, 1.5], antialias: true, maxLights: 10, drawDistance: 60, textureAnisotropy: 8 },
  mid: { shadowMapSize: 512, enableShadows: true, particleMultiplier: 0.5, volumetricEnabled: false, bloomEnabled: true, dpr: [0.7, 1], antialias: false, maxLights: 6, drawDistance: 45, textureAnisotropy: 4 },
  low: { shadowMapSize: 256, enableShadows: false, particleMultiplier: 0.25, volumetricEnabled: false, bloomEnabled: false, dpr: [0.5, 0.75], antialias: false, maxLights: 4, drawDistance: 30, textureAnisotropy: 1 },
};

export function getQualitySettings(preset: QualityPreset): QualitySettings {
  return PRESETS[preset];
}

/**
 * 自动检测设备档位
 */
export function autoDetectQuality(): QualityPreset {
  if (typeof window === 'undefined') return 'mid';
  const ua = navigator.userAgent;
  const isMobile = /mobile|android|ios/i.test(ua);
  const memory = (navigator as any).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;

  if (isMobile) return memory >= 6 ? 'mid' : 'low';
  if (memory >= 16 && cores >= 8) return 'ultra';
  if (memory >= 8 && cores >= 4) return 'high';
  if (memory >= 4) return 'mid';
  return 'low';
}

/**
 * FPS 监控器
 */
export class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private currentFPS = 60;
  private listeners: ((fps: number) => void)[] = [];

  tick() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.currentFPS = (this.frames * 1000) / (now - this.lastTime);
      this.frames = 0;
      this.lastTime = now;
      this.listeners.forEach((l) => l(this.currentFPS));
    }
  }

  get fps() {
    return this.currentFPS;
  }

  onChange(l: (fps: number) => void) {
    this.listeners.push(l);
  }
}
