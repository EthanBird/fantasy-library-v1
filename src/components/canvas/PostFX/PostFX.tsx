import { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useSettingsStore } from '@/stores/settingsStore';
import { Vector2 } from 'three';

export function PostFX() {
  const enableBloom = useSettingsStore((s) => s.visuals.enableBloom);
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);

  const aberrationOffset = useMemo(() => new Vector2(0.0008, 0.0008), []);

  if (quality === 'low') return null;

  return (
    <EffectComposer multisampling={quality === 'ultra' ? 4 : 0} disableNormalPass>
      {enableBloom && (
        <Bloom
          intensity={quality === 'high' || quality === 'ultra' ? 0.7 : 0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
      )}
      <HueSaturation hue={0} saturation={0.05} />
      <BrightnessContrast brightness={0} contrast={0.05} />
      {quality !== 'low' && <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={aberrationOffset} />}
      <Vignette eskil={false} offset={0.3} darkness={0.5} />
    </EffectComposer>
  );
}
