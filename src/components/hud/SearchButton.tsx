import { useUIStore } from '@/stores/uiStore';

export function SearchButton() {
  const openModal = useUIStore((s) => s.openModal);
  return (
    <button onClick={() => openModal('search')} title="搜索">🔍</button>
  );
}
