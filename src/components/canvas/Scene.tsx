import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayerStore } from '@/stores/playerStore';
import { getQualitySettings } from '@/lib/perf/quality';
import { HallManager } from './Hall/HallManager';
import { PointerLockControls } from '@/lib/controls/PointerLockControls';
import { Camera } from './Camera';
import { PlayerInteraction } from './PlayerInteraction';
import { PostFX } from './PostFX/PostFX';

export function Scene() {
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const isReading = usePlayerStore((s) => s.isReading);
  const isPointerLocked = usePlayerStore((s) => s.isPointerLocked);
  const settings = useSettingsStore.getState();
  const canvasRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const qs = getQualitySettings(quality);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        cursor: isPointerLocked ? 'none' : 'crosshair',
      }}
      onClick={() => {
        if (!isReading) controlsRef.current?.lock();
      }}
    >
      <Canvas
        shadows={qs.enableShadows}
        dpr={qs.dpr}
        gl={{
          antialias: qs.antialias,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          outputColorSpace: SRGBColorSpace,
        }}
        camera={{ fov: settings.visuals.fov, near: 0.1, far: qs.drawDistance * 2, position: [0, 1.6, 4] }}
      >
        <color attach="background" args={['#0a0820']} />
        <fog attach="fog" args={['#0a0820', 20, qs.drawDistance]} />

        <Camera />
        <PointerLockControls ref={controlsRef} enabled={!isReading} />
        <PlayerInteraction controlsRef={controlsRef} />
        <HallManager />

        <PostFX />
      </Canvas>
    </div>
  );
}
