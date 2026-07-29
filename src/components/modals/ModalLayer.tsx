import { useUIStore } from '@/stores/uiStore';
import { BookReader } from './BookReader';
import { SearchTerminal } from './SearchTerminal';
import { SettingsPanel } from './SettingsPanel';
import { ImportExportDialog } from './ImportExportDialog';
import { BookmarksPanel } from './BookmarksPanel';
import { HistoryPanel } from './HistoryPanel';
import { CategoryEditor } from './CategoryEditor';

export function ModalLayer() {
  const modal = useUIStore((s) => s.modal);
  const close = useUIStore((s) => s.closeModal);
  const readingBookId = useUIStore((s) => s.readingBookId);

  return (
    <>
      {readingBookId && <BookReader />}
      {modal === 'search' && <SearchTerminal onClose={close} />}
      {modal === 'settings' && <SettingsPanel onClose={close} />}
      {modal === 'import-export' && <ImportExportDialog onClose={close} />}
      {modal === 'bookmarks' && <BookmarksPanel onClose={close} />}
      {modal === 'history' && <HistoryPanel onClose={close} />}
      {modal === 'category-editor' && <CategoryEditor onClose={close} />}
    </>
  );
}
