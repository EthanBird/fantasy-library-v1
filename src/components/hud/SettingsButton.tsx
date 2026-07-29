import { useUIStore } from '@/stores/uiStore';

export function SettingsButton() {
  const openModal = useUIStore((s) => s.openModal);
  return (
    <button onClick={() => openModal('settings')} title="设置" style={{ minWidth: 40, padding: '6px 10px' }}>
      ⚙
    </button>
  );
}
