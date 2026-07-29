import { useUIStore } from '@/stores/uiStore';

export function BookmarksButton() {
  const openModal = useUIStore((s) => s.openModal);
  return (
    <button onClick={() => openModal('bookmarks')} title="书签 (B)">📑</button>
  );
}
