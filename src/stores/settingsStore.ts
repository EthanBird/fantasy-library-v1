import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QualityPreset, ReadTheme, UserSettings, Weather } from '@/types';

interface SettingsState extends UserSettings {
  setApiConfig: (cfg: Partial<UserSettings['api']>) => void;
  setVisuals: (cfg: Partial<UserSettings['visuals']>) => void;
  setAudio: (cfg: Partial<UserSettings['audio']>) => void;
  setGameplay: (cfg: Partial<UserSettings['gameplay']>) => void;
  setUi: (cfg: Partial<UserSettings['ui']>) => void;
  setQuality: (q: QualityPreset) => void;
  setTheme: (t: ReadTheme) => void;
  setWeather: (w: Weather) => void;
  reset: () => void;
  setApiKeyEncrypted: (encrypted: string) => void;
  hasApiKey: () => boolean;
}

// 设备检测：移动端默认 mid，桌面端默认 high
function detectInitialQuality(): QualityPreset {
  if (typeof navigator === 'undefined') return 'mid';
  const isMobile = /mobile|android|ios|iphone|ipad/i.test(navigator.userAgent);
  if (isMobile) return 'mid';
  return 'high';
}

const DEFAULT: UserSettings = {
  api: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    streamEnabled: true,
  },
  visuals: {
    enableBloom: true,
    enableVolumetric: false,    // 移动端关掉
    enableParticles: true,
    enableAnimations: true,
    qualityPreset: detectInitialQuality(),
    fov: 70,
  },
  audio: {
    master: 0.7,
    ambient: 0.6,
    sfx: 0.8,
    muted: false,
  },
  gameplay: {
    timeSystemEnabled: true,
    currentTimeOfDay: 12,
    weather: 'clear',
    readTheme: 'fantasy',
    showTutorials: true,
  },
  ui: {
    minimapScale: 1,
    reducedMotion: false,
    highContrast: false,
    colorblindMode: 'none',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT,
      setApiConfig: (cfg) => set((s) => ({ api: { ...s.api, ...cfg } })),
      setVisuals: (cfg) => set((s) => ({ visuals: { ...s.visuals, ...cfg } })),
      setAudio: (cfg) => set((s) => ({ audio: { ...s.audio, ...cfg } })),
      setGameplay: (cfg) => set((s) => ({ gameplay: { ...s.gameplay, ...cfg } })),
      setUi: (cfg) => set((s) => ({ ui: { ...s.ui, ...cfg } })),
      setQuality: (q) => set((s) => ({ visuals: { ...s.visuals, qualityPreset: q } })),
      setTheme: (t) => set((s) => ({ gameplay: { ...s.gameplay, readTheme: t } })),
      setWeather: (w) => set((s) => ({ gameplay: { ...s.gameplay, weather: w } })),
      setApiKeyEncrypted: (encrypted) => set((s) => ({ api: { ...s.api, apiKeyEncrypted: encrypted } })),
      hasApiKey: () => !!get().api.apiKeyEncrypted,
      reset: () => set({ ...DEFAULT }),
    }),
    {
      name: 'fl3d.settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
