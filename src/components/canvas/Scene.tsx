import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { useProgressStore } from '@/stores/progressStore';
import { getQualitySettings } from '@/lib/perf/quality';
import { HallManager } from './Hall/HallManager';
import { PointerLockControls, type PointerLockControlsRef } from '@/lib/controls/PointerLockControls';
import { Camera } from './Camera';
import { PlayerInteraction } from './PlayerInteraction';
import { PostFX } from './PostFX/PostFX';
import { TouchControls } from './TouchControls';
import { audioEngine } from '@/lib/audio/engine';

export function Scene() {
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const isReading = usePlayerStore((s) => s.isReading);
  const isPointerLocked = usePlayerStore((s) => s.isPointerLocked);
  const settings = useSettingsStore.getState();
  const canvasRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<PointerLockControlsRef>(null);
  const qs = getQualitySettings(quality);
  const [isMobile, setIsMobile] = useState(false);
  const hover = useUIStore((s) => s.hover);
  const setReading = usePlayerStore((s) => s.setReading);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent));
  }, []);

  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const onChange = () => setIsPortrait(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        cursor: isMobile ? 'default' : (isPointerLocked ? 'none' : 'crosshair'),
        touchAction: isMobile ? 'none' : 'auto',
      }}
      onClick={() => {
        if (!isMobile && !isReading) controlsRef.current?.lock();
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
        <color attach="background" args={['#3a3050']} />
        <fog attach="fog" args={['#5a4a70', 20, qs.drawDistance]} />

        <Camera />
        <PointerLockControls ref={controlsRef} enabled={!isReading} />
        <PlayerInteraction controlsRef={controlsRef} />
        <HallManager />

        <PostFX />
      </Canvas>

      {isMobile && !isReading && (
        <TouchControls
          visible={!isReading}
          onMove={(x, y) => controlsRef.current?.setMovement(x, y)}
          onLook={(dx, dy) => controlsRef.current?.addLookDelta(dx * 0.005, dy * 0.005)}
          onInteract={() => {
            const h = useUIStore.getState().hover;
            if (h.type === 'book' && h.id) {
              setReading(true);
              useUIStore.setState({ readingBookId: h.id, readingPage: 0 });
            } else if (h.type === 'crystal-ball') {
              useUIStore.getState().openModal('search');
            } else if (h.type === 'portal') {
              const target = (h.data as any)?.targetHall;
              if (target) {
                audioEngine.playSfx('portal');
                usePlayerStore.getState().setHall(target);
                usePlayerStore.getState().setPosition([0, 1.6, 6]);
                useProgressStore.getState().discoverHall(target);
              }
            }
          }}
        />
      )}

      {isMobile && isPortrait && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 12, 40, 0.95)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📱↻</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>请将设备横屏以获得完整体验</div>
          <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 280, lineHeight: 1.6 }}>
            异世界图书馆为横屏设计。竖屏下交互受限，建议旋转设备。
          </div>
        </div>
      )}
    </div>
  );
}
