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
        <div style={{
          position: 'fixed', inset: 0,
          background: 'linear-gradient(135deg, #2a1f3a 0%, #3a2f5a 100%)',
          color: '#f5ecd0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: 24,
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: '#ffc857', marginBottom: 12 }}>运行时错误</h1>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto', textAlign: 'left' }}>
              {error.message}
            </pre>
            <button onClick={reset} style={{ marginTop: 16, padding: '10px 24px', background: '#ffc857', color: '#1a1428', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              重试
            </button>
          </div>
        </div>
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
