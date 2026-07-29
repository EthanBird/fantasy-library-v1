import { useEffect, useState } from 'react';
import { useBookStore } from '@/stores/bookStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { audioEngine } from '@/lib/audio/engine';
import { Scene } from '@/components/canvas/Scene';
import { HUD } from '@/components/hud/HUD';
import { ModalLayer } from '@/components/modals/ModalLayer';
import { Notification } from '@/components/hud/Notification';
import { BootScreen } from '@/components/BootScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Fallback2D } from '@/components/Fallback2D';

export default function App() {
  const [booted, setBooted] = useState(false);
  const init = useBookStore((s) => s.init);
  const readTheme = useSettingsStore((s) => s.gameplay.readTheme);
  const setBootProgress = useUIStore((s) => s.setBootProgress);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', readTheme);
  }, [readTheme]);

  useEffect(() => {
    if (booted) return;
    (async () => {
      try {
        setBootProgress({ step: '正在唤醒图书馆…', progress: 0.1 });
        await new Promise((r) => setTimeout(r, 200));

        setBootProgress({ step: '正在读取你的藏书…', progress: 0.4 });
        await init();
        await new Promise((r) => setTimeout(r, 300));

        setBootProgress({ step: '正在点燃魔法灯…', progress: 0.7 });
        try {
          audioEngine.init();
          audioEngine.setMaster(useSettingsStore.getState().audio.master);
          audioEngine.setAmbient(useSettingsStore.getState().audio.ambient);
          audioEngine.setSfx(useSettingsStore.getState().audio.sfx);
          audioEngine.setMuted(useSettingsStore.getState().audio.muted);
        } catch {/* 音频初始化失败不影响 3D 渲染 */}
        await new Promise((r) => setTimeout(r, 300));

        setBootProgress({ step: '欢迎来到异世界图书馆', progress: 1.0 });
        await new Promise((r) => setTimeout(r, 600));
        setBooted(true);
        setBootProgress(null);
      } catch (e) {
        console.error('Boot failed', e);
        setBooted(true);
      }
    })();
  }, [booted, init, setBootProgress]);

  if (!booted) return <BootScreen />;

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <>
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            padding: '10px 20px', background: 'rgba(192, 80, 77, 0.2)', borderBottom: '1px solid #c0504d',
            color: '#e8a89e', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span>⚠️ 3D 渲染失败：{error.message}</span>
            <button onClick={reset} style={{ marginLeft: 'auto' }}>重试 3D</button>
            <span style={{ color: '#888' }}>已自动降级到 2D 模式 ↓</span>
          </div>
          <div style={{ paddingTop: 50 }}>
            <Fallback2D />
          </div>
        </>
      )}
    >
      <>
        <Scene />
        <HUD />
        <ModalLayer />
        <Notification />
      </>
    </ErrorBoundary>
  );
}
