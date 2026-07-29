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

export default function App() {
  const [booted, setBooted] = useState(false);
  const init = useBookStore((s) => s.init);
  const setTheme = useSettingsStore((s) => s.setTheme);
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
        audioEngine.init();
        audioEngine.setMaster(useSettingsStore.getState().audio.master);
        audioEngine.setAmbient(useSettingsStore.getState().audio.ambient);
        audioEngine.setSfx(useSettingsStore.getState().audio.sfx);
        audioEngine.setMuted(useSettingsStore.getState().audio.muted);
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
    <>
      <Scene />
      <HUD />
      <ModalLayer />
      <Notification />
    </>
  );
}
