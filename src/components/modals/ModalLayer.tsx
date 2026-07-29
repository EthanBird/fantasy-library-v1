import { lazy, Suspense } from 'react';
import { useUIStore } from '@/stores/uiStore';

// 懒加载所有 modal：只在用户打开时才下载
const BookReader = lazy(() => import('./BookReader').then(m => ({ default: m.BookReader })));
const SearchTerminal = lazy(() => import('./SearchTerminal').then(m => ({ default: m.SearchTerminal })));
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const ImportExportDialog = lazy(() => import('./ImportExportDialog').then(m => ({ default: m.ImportExportDialog })));
const BookmarksPanel = lazy(() => import('./BookmarksPanel').then(m => ({ default: m.BookmarksPanel })));
const HistoryPanel = lazy(() => import('./HistoryPanel').then(m => ({ default: m.HistoryPanel })));
const CategoryEditor = lazy(() => import('./CategoryEditor').then(m => ({ default: m.CategoryEditor })));

function LoadingModal() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20, 12, 40, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#ffc857', fontSize: 14, letterSpacing: '0.2em',
    }}>
      加载中…
    </div>
  );
}

export function ModalLayer() {
  const modal = useUIStore((s) => s.modal);
  const close = useUIStore((s) => s.closeModal);
  const readingBookId = useUIStore((s) => s.readingBookId);

  return (
    <Suspense fallback={<LoadingModal />}>
      {readingBookId && <BookReader />}
      {modal === 'search' && <SearchTerminal onClose={close} />}
      {modal === 'settings' && <SettingsPanel onClose={close} />}
      {modal === 'import-export' && <ImportExportDialog onClose={close} />}
      {modal === 'bookmarks' && <BookmarksPanel onClose={close} />}
      {modal === 'history' && <HistoryPanel onClose={close} />}
      {modal === 'category-editor' && <CategoryEditor onClose={close} />}
    </Suspense>
  );
}
