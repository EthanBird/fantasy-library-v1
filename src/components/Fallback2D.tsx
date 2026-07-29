import { useEffect, useState, useMemo } from 'react';
import { detectWebGL, type WebGLStatus } from '@/lib/utils/webgl';
import { useBookStore } from '@/stores/bookStore';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ModalLayer } from '@/components/modals/ModalLayer';
import { Notification } from '@/components/hud/Notification';
import { getHall } from '@/data/halls';
import { getTheme } from '@/data/themes';

/**
 * 2D 降级模式：WebGL 不可用时启用
 * - 隐藏整个 3D 场景
 * - 提供馆厅选择 + 书架浏览 + 搜索 + 阅读
 * - 设置/导入导出/书签/历史 全部可用（用 ModalLayer）
 */
export function Fallback2D() {
  const [webgl, setWebgl] = useState<WebGLStatus | null>(null);
  const init = useBookStore((s) => s.init);
  const stubs = useBookStore((s) => s.stubs);
  const initialized = useBookStore((s) => s.initialized);
  const setBootProgress = useUIStore((s) => s.setBootProgress);
  const openModal = useUIStore((s) => s.openModal);
  const setReading = useUIStore((s) => s.notify as any); // avoid unused
  const readTheme = useSettingsStore((s) => s.gameplay.readTheme);
  const [selectedHall, setSelectedHall] = useState<string>('central');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', readTheme);
  }, [readTheme]);

  useEffect(() => {
    setBootProgress({ step: '正在加载藏书…', progress: 0.5 });
    (async () => {
      await init();
      setBootProgress({ step: '准备就绪', progress: 1 });
      setTimeout(() => setBootProgress(null), 400);
    })();
    setWebgl(detectWebGL());
  }, [init, setBootProgress]);

  // 排序 & 过滤
  const filtered = useMemo(() => {
    let list = Object.values(stubs);
    if (selectedHall !== 'all') list = list.filter((s) => s.location.hallId === selectedHall);
    if (search.trim()) {
      const ql = search.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(ql) ||
        s.author.toLowerCase().includes(ql) ||
        s.introduction.toLowerCase().includes(ql),
      );
    }
    return list;
  }, [stubs, selectedHall, search]);

  const hallList = ['central', 'wood', 'astro', 'crystal', 'alchemy', 'void', 'real'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部错误条 */}
      {webgl && !webgl.supported && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(192, 80, 77, 0.15)',
          borderBottom: '1px solid rgba(192, 80, 77, 0.4)',
          fontSize: 12,
          color: '#e8a89e',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>3D 沉浸模式不可用（已切换 2D 降级）</div>
            <div style={{ opacity: 0.85 }}>{webgl.error}</div>
          </div>
          <button onClick={() => location.reload()} style={{ fontSize: 11 }}>重试</button>
        </div>
      )}

      {/* 顶栏 */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <h1 className="text-display" style={{ fontSize: 20, color: 'var(--accent)', letterSpacing: '0.1em' }}>
          异世界图书馆
        </h1>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>2D 降级模式</span>
        <div style={{ flex: 1 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索书名 / 作者 / 关键词…"
          style={{ width: 280 }}
        />
        <button onClick={() => openModal('settings')} title="设置">⚙ 设置</button>
        <button onClick={() => openModal('bookmarks')} title="书签">📑</button>
        <button onClick={() => openModal('history')} title="历史">🕘</button>
        <button onClick={() => openModal('import-export')} title="导入导出">💾</button>
      </header>

      {/* 馆厅 tab */}
      <nav style={{
        display: 'flex',
        gap: 4,
        padding: '8px 24px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-glass)',
        overflowX: 'auto',
      }}>
        <button
          onClick={() => setSelectedHall('all')}
          className={selectedHall === 'all' ? 'primary' : ''}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          全部 ({Object.values(stubs).length})
        </button>
        {hallList.map((id) => {
          const h = getHall(id as any);
          const count = Object.values(stubs).filter((s) => s.location.hallId === id).length;
          return (
            <button
              key={id}
              onClick={() => setSelectedHall(id)}
              className={selectedHall === id ? 'primary' : ''}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              {h.name.zh} ({count})
            </button>
          );
        })}
      </nav>

      {/* 书卡片网格 */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {!initialized ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>加载中…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            {search ? '没有匹配的书' : '这个馆厅还没有书。配置 API Key 后会自动生成。'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((book) => {
              const theme = getTheme(book.theme);
              return (
                <div
                  key={book.id}
                  onClick={() => {
                    useUIStore.setState({ readingBookId: book.id, readingPage: 0 });
                  }}
                  className="glass"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    display: 'flex',
                    gap: 12,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
                >
                  <div style={{
                    width: 48,
                    height: 64,
                    background: `linear-gradient(135deg, ${book.coverColor}, ${theme.defaultPulseColor})`,
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.3)',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 3, top: 4, bottom: 4, width: 1,
                      background: 'rgba(255,255,255,0.2)',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      《{book.title}》
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {book.author} · {book.category}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {book.introduction}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={{
        padding: '8px 24px',
        borderTop: '1px solid var(--border-glass)',
        background: 'var(--bg-glass)',
        fontSize: 11,
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        想体验完整 3D 沉浸模式？请在 Chrome / Edge 桌面版打开，并确保浏览器"硬件加速"已开启。
      </footer>

      <ModalLayer />
      <Notification />
    </div>
  );
}
