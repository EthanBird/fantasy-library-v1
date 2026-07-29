import { useEffect, useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { useUIStore } from '@/stores/uiStore';
import { useBookStore } from '@/stores/bookStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useProgressStore } from '@/stores/progressStore';
import { aiService } from '@/lib/ai/service';
import { audioEngine } from '@/lib/audio/engine';
import { getTheme } from '@/data/themes';

export function BookReader() {
  const readingBookId = useUIStore((s) => s.readingBookId);
  const readingPage = useUIStore((s) => s.readingPage);
  const setPage = useUIStore((s) => s.setPage);
  const closeBook = useUIStore((s) => s.closeBook);
  const setReading = usePlayerStore((s) => s.setReading);
  const stubs = useBookStore((s) => s.stubs);
  const contents = useBookStore((s) => s.contents);
  const setToc = useBookStore((s) => s.setToc);
  const setPageContent = useBookStore((s) => s.setPage);
  const markPageLoading = useBookStore((s) => s.markPageLoading);
  const updateLastRead = useBookStore((s) => s.updateLastRead);
  const addBookmark = useBookStore((s) => s.addBookmark);
  const recordRead = useProgressStore((s) => s.recordRead);
  const recordCompleted = useProgressStore((s) => s.recordCompleted);
  const recomputeUnlocks = useProgressStore((s) => s.recomputeUnlocks);
  const notify = useUIStore((s) => s.notify);
  const openModal = useUIStore((s) => s.openModal);
  const loadingPages = useBookStore((s) => s.loadingPages);
  const startTimeRef = useRef(Date.now());

  const stub = readingBookId ? stubs[readingBookId] : null;
  const content = readingBookId ? contents[readingBookId] : null;
  const theme = stub ? getTheme(stub.theme) : null;

  const [tocOpen, setTocOpen] = useState(true);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);

  // 关闭阅读器
  useEffect(() => {
    if (!readingBookId) return;
    setReading(true);
    audioEngine.playSfx('take');
    return () => {
      setReading(false);
      const elapsed = Date.now() - startTimeRef.current;
      if (readingBookId && elapsed > 5000) {
        useBookStore.getState().recordReadTime(readingBookId, elapsed);
      }
    };
  }, [readingBookId, setReading]);

  // 同步 page 到 store
  useEffect(() => {
    if (!readingBookId) return;
    updateLastRead(readingBookId, readingPage);
  }, [readingPage, readingBookId, updateLastRead]);

  // 加载首页：先生成 toc
  useEffect(() => {
    if (!readingBookId || !stub) return;
    if (content && content.tableOfContents.length > 0) return;

    (async () => {
      try {
        const { toc, totalPages } = await aiService.generateToc({
          title: stub.title,
          author: stub.author,
          introduction: stub.introduction,
          category: stub.category,
          theme: stub.theme,
        });
        await setToc(readingBookId, toc, totalPages);
        // 立即加载目录页（页 1）
        if (!content?.pages[1]) {
          markPageLoading(readingBookId, 1, true);
          const tocPage = await aiService.generateTocPage({ title: stub.title, author: stub.author, toc });
          await setPageContent(readingBookId, {
            pageNumber: 1,
            markdown: tocPage,
            generatedAt: Date.now(),
            tokenCount: 0,
          });
          markPageLoading(readingBookId, 1, false);
        }
      } catch (e: any) {
        if (e?.message === 'NO_API_KEY') {
          // 演示模式：使用预置目录
          const demoToc = Array.from({ length: 8 }, (_, i) => ({
            index: i + 1,
            title: ['序章 · 引子', '第一章 · 启程', '第二章 · 邂逅', '第三章 · 试炼', '第四章 · 暗涌', '第五章 · 真相', '第六章 · 抉择', '终章 · 归途'][i],
            startPage: i * 10 + 1,
          }));
          await setToc(readingBookId, demoToc, 80);
          await setPageContent(readingBookId, {
            pageNumber: 1,
            markdown: `# 目录\n\n${demoToc.map((t) => `第${t.index}章 ${t.title} … ${t.startPage}`).join('\n\n')}\n\n*—— 此书为演示模式内容，请配置 API Key 以解锁 AI 生成 ——*`,
            generatedAt: Date.now(),
            tokenCount: 0,
          });
        } else {
          notify({ level: 'error', message: '目录生成失败：' + (e?.message ?? ''), durationMs: 3000 });
        }
      }
    })();
  }, [readingBookId, stub, content?.tableOfContents.length]);

  // 加载当前页 + 预加载 P+1, P+2
  useEffect(() => {
    if (!readingBookId || !stub || !content) return;
    if (readingPage < 1) return;
    if (content.pages[readingPage]) return;

    const load = async (pageNum: number) => {
      if (pageNum < 1) return;
      if (content.pages[pageNum]) return;
      markPageLoading(readingBookId, pageNum, true);
      try {
        const isFirstReal = pageNum === 2; // 1 = 目录
        const pageContent = await aiService.generatePage({
          bookId: readingBookId,
          title: stub.title,
          author: stub.author,
          category: stub.category,
          theme: stub.theme,
          introduction: stub.introduction,
          toc: content.tableOfContents,
          pageNumber: pageNum,
          isFirstPage: isFirstReal,
        });
        await setPageContent(readingBookId, pageContent);
      } catch (e: any) {
        if (e?.message === 'NO_API_KEY') {
          // 演示模式
          const chapterIdx = content.tableOfContents.findIndex((t, i) =>
            pageNum >= t.startPage && (i === content.tableOfContents.length - 1 || pageNum < content.tableOfContents[i + 1].startPage),
          );
          const chapter = content.tableOfContents[chapterIdx] ?? content.tableOfContents[0];
          const demoMd = `# ${chapter?.title ?? '正文'}\n\n*（演示模式）*\n\n这是《${stub.title}》的第 ${pageNum} 页。本页内容由演示数据填充。请在设置中配置你的 OpenAI 兼容 API，即可解锁 AI 即时生成。\n\n书名：《${stub.title}》\n作者：${stub.author}\n分类：${stub.category}\n\n> "书是无尽的森林，读者是迷途的旅人。" —— 异世界图书馆 · 序言\n\n---\n\n*继续翻页即可看到更多演示内容。*`;
          await setPageContent(readingBookId, {
            pageNumber: pageNum,
            markdown: demoMd,
            generatedAt: Date.now(),
            tokenCount: demoMd.length,
          });
        } else {
          notify({ level: 'error', message: '页面生成失败', durationMs: 2000 });
        }
      } finally {
        markPageLoading(readingBookId, pageNum, false);
      }
    };

    void load(readingPage);
    // 预加载下一页
    void load(readingPage + 1);
  }, [readingPage, readingBookId, content?.tableOfContents.length]);

  if (!stub || !readingBookId) return null;

  const currentPage = content?.pages[readingPage];
  const isLoading = loadingPages.has(`${readingBookId}-${readingPage}`);
  const progress = content ? (readingPage / Math.max(1, content.totalEstimatedPages)) : 0;

  const turnPage = useCallback((dir: 1 | -1) => {
    if (!content) return;
    const next = readingPage + dir;
    if (next < 1) return;
    audioEngine.playSfx('page');
    setPage(next);
    if (next === 3) recordRead(stub.theme); // 读过第 3 页算"读过"
    if (next >= content.totalEstimatedPages - 2) {
      recordCompleted();
      const newUnlocks = recomputeUnlocks();
      newUnlocks.forEach((hallId) => {
        notify({ level: 'success', message: `🏛️ 馆厅解锁：${hallId}`, durationMs: 5000 });
        audioEngine.playSfx('unlock');
      });
    }
  }, [content, readingPage, setPage, stub.theme, recordRead, recordCompleted, recomputeUnlocks, notify]);

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeBook(); }
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { turnPage(-1); }
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === ' ') { e.preventDefault(); turnPage(1); }
      else if (e.key === 'b' || e.key === 'B') { setBookmarkOpen((b) => !b); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turnPage, closeBook]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 3, 15, 0.96)',
      backdropFilter: 'blur(20px)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      animation: 'fadeIn 400ms ease-out',
    }}>
      {/* 顶部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-glass)',
      }}>
        <button onClick={() => { audioEngine.playSfx('close'); closeBook(); }} style={{ fontSize: 16 }}>✕ 关闭</button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', letterSpacing: '0.1em' }}>
            《{stub.title}》
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {stub.author} · {stub.category}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setTocOpen((o) => !o)} style={{ fontSize: 14 }}>📑 目录</button>
          <button onClick={() => { audioEngine.playSfx('take'); addBookmark(readingBookId, readingPage); notify({ level: 'success', message: '书签已添加', durationMs: 1500 }); }} style={{ fontSize: 14 }}>🔖 书签</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 目录侧栏 */}
        {tocOpen && content && (
          <div style={{
            width: 280,
            background: 'var(--bg-glass)',
            borderRight: '1px solid var(--border-glass)',
            overflowY: 'auto',
            padding: 16,
            flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', marginBottom: 12 }}>目  录</div>
            {content.tableOfContents.map((entry) => {
              const isCurrent = readingPage >= entry.startPage &&
                (content.tableOfContents.find((e) => e.index === entry.index + 1)?.startPage ?? Infinity) > readingPage;
              return (
                <div
                  key={entry.index}
                  onClick={() => { setPage(entry.startPage); audioEngine.playSfx('page'); }}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: isCurrent ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isCurrent ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    borderRadius: 4,
                    fontSize: 13,
                    lineHeight: 1.4,
                    marginBottom: 2,
                    borderLeft: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <div>{entry.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>P{entry.startPage}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 主体双页 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'auto' }}>
          <div style={{
            maxWidth: 720,
            width: '100%',
            minHeight: 600,
            background: '#f5ecd6',
            color: '#2a1a0a',
            padding: '60px 50px',
            borderRadius: 4,
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6), inset 0 0 60px rgba(180, 140, 100, 0.15)',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            lineHeight: 1.8,
            position: 'relative',
          }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, color: '#8a6a4a' }}>
                <div style={{ fontSize: 14, letterSpacing: '0.3em' }}>墨水正在凝聚…</div>
                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>第 {readingPage} 页</div>
              </div>
            ) : currentPage ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {currentPage.markdown}
              </ReactMarkdown>
            ) : (
              <div style={{ color: '#8a6a4a', textAlign: 'center' }}>暂无内容</div>
            )}
          </div>
        </div>
      </div>

      {/* 底部翻页控制 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderTop: '1px solid var(--border-glass)',
        background: 'var(--bg-glass)',
      }}>
        <button onClick={() => turnPage(-1)} disabled={readingPage <= 1}>← 上一页</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          第 {readingPage} 页 / 共 {content?.totalEstimatedPages ?? '?'} 页
          <div style={{ width: 200, height: 2, background: 'var(--bg-glass-light)', margin: '6px auto 0', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--accent)' }} />
          </div>
        </div>
        <button onClick={() => turnPage(1)} className="primary">下一页 →</button>
      </div>
    </div>
  );
}


