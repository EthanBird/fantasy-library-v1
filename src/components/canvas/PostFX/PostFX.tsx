import { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, HueSaturation, BrightnessContrast } from '@react-three/postprocessing';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimeOfDay } from '@/lib/hooks/useTimeOfDay';
import { BlendFunction } from 'postprocessing';

export function PostFX() {
  const enableBloom = useSettingsStore((s) => s.visuals.enableBloom);
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const daylight = useTimeOfDay();

  if (quality === 'low') return null;

  // 根据昼夜调整 Bloom 强度（白天稍弱，晚上稍强）
  const isDay = daylight.sunAngle > 0 && daylight.sunAngle < Math.PI;
  const bloomStrength = isDay ? 0.35 : 0.6;

  return (
    <EffectComposer multisampling={quality === 'ultra' ? 4 : 0} disableNormalPass>
      {enableBloom && (
        <Bloom
          intensity={bloomStrength}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.3}
          mipmapBlur
          radius={0.6}
        />
      )}
      <HueSaturation hue={0} saturation={0.1} />
      <BrightnessContrast brightness={0.05} contrast={0.08} />
      {/* 极轻的暗角，不再有"恐怖"感 */}
      <Vignette eskil={false} offset={0.5} darkness={0.25} />
    </EffectComposer>
  );
}
