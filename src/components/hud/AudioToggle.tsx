import { useSettingsStore } from '@/stores/settingsStore';
import { audioEngine } from '@/lib/audio/engine';

export function AudioToggle() {
  const muted = useSettingsStore((s) => s.audio.muted);
  const setAudio = useSettingsStore((s) => s.setAudio);
  return (
    <button
      onClick={() => {
        const next = !muted;
        setAudio({ muted: next });
        audioEngine.setMuted(next);
      }}
      style={{ minWidth: 40, padding: '6px 10px' }}
      title={muted ? '取消静音' : '静音'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
