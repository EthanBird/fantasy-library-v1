import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useBookStore } from '@/stores/bookStore';
import { usePlayerStore } from '@/stores/playerStore';
import { aiService } from '@/lib/ai/service';
import { HALLS } from '@/data/halls';

export function SearchTerminal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<import('@/types').BookStub[]>([]);
  const [usedAI, setUsedAI] = useState(false);
  const upsertStubs = useBookStore((s) => s.upsertStubs);
  const stubs = useBookStore((s) => s.stubs);
  const setHall = usePlayerStore((s) => s.setHall);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const notify = useUIStore((s) => s.notify);

  const localSearch = (q: string): import('@/types').BookStub[] => {
    const ql = q.toLowerCase().trim();
    if (!ql) return [];
    return useBookStore.getState().searchStubs(ql).slice(0, 3);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setUsedAI(false);

    // 先查本地
    const local = localSearch(query);
    setResults(local);

    // 不够再 AI 补
    if (local.length < 3) {
      try {
        const aiResults = await aiService.searchAndGenerate({
          query,
          hallId: usePlayerStore.getState().hallId,
          hallName: HALLS[usePlayerStore.getState().hallId].name.zh,
          existingTitles: local.map((b) => b.title),
        });
        // 分配位置
        const stubList = Object.values(useBookStore.getState().stubs);
        const maxSlot = stubList.length;
        aiResults.forEach((s, i) => {
          s.location = {
            hallId: s.location.hallId || usePlayerStore.getState().hallId,
            shelfId: s.location.shelfId || `${usePlayerStore.getState().hallId}-A-L1`,
            slotIndex: (maxSlot + i) % 5,
          };
        });
        await upsertStubs(aiResults);
        setResults([...local, ...aiResults].slice(0, 3));
        setUsedAI(true);
      } catch (e: any) {
        if (e?.message === 'NO_API_KEY') {
          // 演示模式：返回随机 stub
          const allStubs = Object.values(useBookStore.getState().stubs);
          const shuffled = allStubs.sort(() => Math.random() - 0.5);
          setResults([...local, ...shuffled.slice(0, 3 - local.length)]);
          setUsedAI(true);
        } else {
          notify({ level: 'error', message: '搜索失败：' + (e?.message ?? ''), durationMs: 2000 });
        }
      }
    }
    setLoading(false);
  };

  const goToBook = (bookId: string) => {
    const book = useBookStore.getState().stubs[bookId];
    if (!book) return;
    setHall(book.location.hallId);
    setPosition([book.location.shelfId ? 0 : 0, 1.6, book.location.shelfId ? 0 : 0]);
    // 实际定位到书架前
    const hall = HALLS[book.location.hallId];
    const shelf = hall.shelfLayout.find((s) => s.shelfId === book.location.shelfId);
    if (shelf) {
      const [x, , z] = shelf.position;
      setPosition([x, 1.6, z + 1.5]);
    }
    onClose();
    notify({ level: 'success', message: `已传送至《${book.title}》所在书架`, durationMs: 2000 });
  };

  return (
    <ModalShell title="水晶球搜索" onClose={onClose}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="输入书名、作者、关键词…"
          autoFocus
          style={{ flex: 1 }}
        />
        <button onClick={handleSearch} disabled={loading} className="primary">
          {loading ? '搜索中…' : '搜索'}
        </button>
      </div>

      {usedAI && (
        <div style={{ fontSize: 11, color: 'var(--magic)', marginBottom: 12, fontStyle: 'italic' }}>
          ✨ AI 协助生成结果
        </div>
      )}

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {results.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            {query ? '未找到结果' : '输入关键词搜索（≤3 本相关书）'}
          </div>
        )}
        {results.map((book) => {
          const hall = HALLS[book.location.hallId];
          return (
            <div
              key={book.id}
              onClick={() => goToBook(book.id)}
              style={{
                display: 'flex',
                gap: 12,
                padding: 12,
                marginBottom: 8,
                background: 'var(--bg-glass-light)',
                border: '1px solid var(--border-glass)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
            >
              <div style={{
                width: 40, height: 56,
                background: book.coverColor,
                borderRadius: 3,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                  《{book.title}》
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {book.author} · {book.category}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {book.introduction}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  📍 {hall?.name.zh ?? book.location.hallId} · {book.location.shelfId}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

// 通用 Modal 外壳
export function ModalShell({ title, onClose, children, width = 600 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          animation: 'slideUp 300ms ease-out',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-glass)',
        }}>
          <h2 className="text-display" style={{ fontSize: 16, color: 'var(--accent)', letterSpacing: '0.1em' }}>{title}</h2>
          <button onClick={onClose} style={{ padding: '4px 10px', minWidth: 32 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
