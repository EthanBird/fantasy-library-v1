import { useBookStore } from '@/stores/bookStore';
import { useUIStore } from '@/stores/uiStore';
import { ModalShell } from './SearchTerminal';

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const history = useBookStore((s) => s.history);
  const stubs = useBookStore((s) => s.stubs);
  const openBook = useUIStore((s) => s.openBook);
  const setReading = useUIStore((s) => s.setReading);

  const list = Object.values(history).sort((a, b) => b.lastReadAt - a.lastReadAt);

  const formatTime = (ms: number): string => {
    if (ms < 60_000) return `${Math.floor(ms / 1000)} 秒`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} 分钟`;
    return `${(ms / 3_600_000).toFixed(1)} 小时`;
  };

  const open = (bookId: string) => {
    setReading(true);
    openBook(bookId);
    onClose();
  };

  return (
    <ModalShell title="阅读历史" onClose={onClose} width={500}>
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>还没有阅读记录</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.slice(0, 50).map((h) => {
            const stub = stubs[h.bookId];
            return (
              <div
                key={h.bookId}
                onClick={() => open(h.bookId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-glass-light)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 32, height: 44, background: stub?.coverColor ?? '#3a3a3a', borderRadius: 3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--accent)' }}>《{stub?.title ?? '已删除的书'}》</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    第 {h.lastPage} 页 · 已读 {formatTime(h.readingTimeMs)} · 完成 {(h.completionRatio * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}
