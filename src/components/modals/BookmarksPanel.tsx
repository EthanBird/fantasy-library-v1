import { useBookStore } from '@/stores/bookStore';
import { useUIStore } from '@/stores/uiStore';
import { ModalShell } from './SearchTerminal';

export function BookmarksPanel({ onClose }: { onClose: () => void }) {
  const bookmarks = useBookStore((s) => s.bookmarks);
  const stubs = useBookStore((s) => s.stubs);
  const removeBookmark = useBookStore((s) => s.removeBookmark);
  const openBook = useUIStore((s) => s.openBook);
  const setReading = useUIStore((s) => s.setReading);

  const list = Object.values(bookmarks).sort((a, b) => b.createdAt - a.createdAt);

  const open = (bookId: string) => {
    setReading(true);
    openBook(bookId);
    onClose();
  };

  return (
    <ModalShell title="我的书签" onClose={onClose} width={500}>
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          还没有书签。在阅读模式下按 B 或点击 🔖 按钮添加。
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((bm) => {
            const stub = stubs[bm.bookId];
            return (
              <div
                key={bm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-glass-light)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => open(bm.bookId)}>
                  <div style={{ fontSize: 13, color: 'var(--accent)' }}>《{stub?.title ?? '已删除的书'}》</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    第 {bm.pageNumber} 页 · {new Date(bm.createdAt).toLocaleString()}
                  </div>
                </div>
                <button onClick={() => removeBookmark(bm.id)} style={{ fontSize: 11 }}>删除</button>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}
