import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { BookContent, BookStub, PageContent, TocEntry, UUID } from '@/types';
import * as db from '@/lib/storage/db';

interface BookStoreState {
  stubs: Record<UUID, BookStub>;
  contents: Record<UUID, BookContent>;
  bookmarks: Record<UUID, import('@/types').Bookmark>;
  history: Record<UUID, import('@/types').ReadHistory>;
  initialized: boolean;
  loadingStubs: Set<UUID>;
  loadingPages: Set<string>; // bookId-pageNo

  // === 初始化 ===
  init: () => Promise<void>;

  // === Stubs ===
  upsertStub: (s: BookStub) => Promise<void>;
  upsertStubs: (stubs: BookStub[]) => Promise<void>;
  removeStub: (id: UUID) => Promise<void>;
  getStubsByHall: (hallId: import('@/types').HallId) => BookStub[];
  getStubsByShelf: (shelfId: string) => BookStub[];
  searchStubs: (q: string) => BookStub[];

  // === Contents ===
  getContent: (bookId: UUID) => BookContent | undefined;
  setToc: (bookId: UUID, toc: TocEntry[], totalEstimated: number) => Promise<void>;
  setPage: (bookId: UUID, page: PageContent) => Promise<void>;
  markPageLoading: (bookId: UUID, page: number, loading: boolean) => void;
  updateLastRead: (bookId: UUID, page: number) => Promise<void>;

  // === Bookmarks ===
  addBookmark: (bookId: UUID, page: number, label?: string) => Promise<void>;
  removeBookmark: (id: UUID) => Promise<void>;
  getBookmarks: (bookId: UUID) => import('@/types').Bookmark[];

  // === History ===
  recordReadTime: (bookId: UUID, ms: number) => Promise<void>;
  getHistory: () => import('@/types').ReadHistory[];

  // === 整体操作 ===
  exportAll: () => Promise<LibraryExport>;
  importAll: (data: LibraryExport) => Promise<void>;
  clearAll: () => Promise<void>;
}

export interface LibraryExport {
  version: number;
  exportedAt: number;
  stubs: BookStub[];
  contents: BookContent[];
  bookmarks: import('@/types').Bookmark[];
  history: import('@/types').ReadHistory[];
}

export const useBookStore = create<BookStoreState>()(
  subscribeWithSelector((set, get) => ({
    stubs: {},
    contents: {},
    bookmarks: {},
    history: {},
    initialized: false,
    loadingStubs: new Set(),
    loadingPages: new Set(),

    init: async () => {
      if (get().initialized) return;
      const [stubs, contents, bookmarks, history] = await Promise.all([
        db.getAllStubs(),
        db.getAllContents(),
        db.getAllBookmarks(),
        db.getAllHistory(),
      ]);
      const stubMap: Record<UUID, BookStub> = {};
      stubs.forEach((s) => (stubMap[s.id] = s));
      const contentMap: Record<UUID, BookContent> = {};
      contents.forEach((c) => (contentMap[c.bookId] = c));
      const bmMap: Record<UUID, import('@/types').Bookmark> = {};
      bookmarks.forEach((b) => (bmMap[b.id] = b));
      const histMap: Record<UUID, import('@/types').ReadHistory> = {};
      history.forEach((h) => (histMap[h.bookId] = h));
      set({
        stubs: stubMap,
        contents: contentMap,
        bookmarks: bmMap,
        history: histMap,
        initialized: true,
      });
    },

    upsertStub: async (s) => {
      set((state) => ({ stubs: { ...state.stubs, [s.id]: s } }));
      await db.putStub(s);
    },
    upsertStubs: async (stubs) => {
      const map: Record<UUID, BookStub> = { ...get().stubs };
      stubs.forEach((s) => (map[s.id] = s));
      set({ stubs: map });
      await db.putStubs(stubs);
    },
    removeStub: async (id) => {
      set((state) => {
        const next = { ...state.stubs };
        delete next[id];
        return { stubs: next };
      });
      await db.deleteStub(id);
    },
    getStubsByHall: (hallId) => Object.values(get().stubs).filter((s) => s.location.hallId === hallId && !s.isHidden),
    getStubsByShelf: (shelfId) => Object.values(get().stubs).filter((s) => s.location.shelfId === shelfId && !s.isHidden),
    searchStubs: (q) => {
      const ql = q.toLowerCase().trim();
      if (!ql) return [];
      return Object.values(get().stubs).filter(
        (s) =>
          !s.isHidden &&
          (s.title.toLowerCase().includes(ql) ||
            s.author.toLowerCase().includes(ql) ||
            s.introduction.toLowerCase().includes(ql) ||
            s.category.toLowerCase().includes(ql) ||
            (s.tags ?? []).some((t) => t.toLowerCase().includes(ql))),
      );
    },

    getContent: (bookId) => get().contents[bookId],
    setToc: async (bookId, toc, totalEstimated) => {
      const cur = get().contents[bookId] ?? {
        bookId,
        tableOfContents: [],
        pages: {},
        totalEstimatedPages: totalEstimated,
        lastPageRead: 0,
        lastReadAt: Date.now(),
        status: 'toc-generated' as const,
      };
      const updated: BookContent = {
        ...cur,
        tableOfContents: toc,
        totalEstimatedPages: totalEstimated,
        status: 'toc-generated',
      };
      set((s) => ({ contents: { ...s.contents, [bookId]: updated } }));
      await db.putContent(updated);
    },
    setPage: async (bookId, page) => {
      const cur = get().contents[bookId];
      if (!cur) return;
      const updated: BookContent = {
        ...cur,
        pages: { ...cur.pages, [page.pageNumber]: page },
        status: cur.status === 'toc-generated' || cur.status === 'stub-only' ? 'in-progress' : cur.status,
      };
      set((s) => ({ contents: { ...s.contents, [bookId]: updated } }));
      await db.putContent(updated);
    },
    markPageLoading: (bookId, pageNum, loading) => {
      const key = `${bookId}-${pageNum}`;
      set((s) => {
        const next = new Set(s.loadingPages);
        if (loading) next.add(key);
        else next.delete(key);
        return { loadingPages: next };
      });
    },
    updateLastRead: async (bookId, page) => {
      const cur = get().contents[bookId];
      if (!cur) return;
      const updated = { ...cur, lastPageRead: page, lastReadAt: Date.now() };
      set((s) => ({ contents: { ...s.contents, [bookId]: updated } }));
      await db.putContent(updated);

      // 同步更新 history
      const hist = get().history[bookId] ?? {
        bookId,
        lastPage: 0,
        lastReadAt: Date.now(),
        readingTimeMs: 0,
        completionRatio: 0,
      };
      const ratio = cur.totalEstimatedPages > 0 ? Math.min(1, page / cur.totalEstimatedPages) : 0;
      const newHist = { ...hist, lastPage: page, lastReadAt: Date.now(), completionRatio: ratio };
      set((s) => ({ history: { ...s.history, [bookId]: newHist } }));
      await db.putHistory(newHist);
    },

    addBookmark: async (bookId, pageNumber, label) => {
      const id = `bm-${bookId}-${pageNumber}-${Date.now()}`;
      const bm: import('@/types').Bookmark = { id, bookId, pageNumber, label, createdAt: Date.now() };
      set((s) => ({ bookmarks: { ...s.bookmarks, [id]: bm } }));
      await db.putBookmark(bm);
    },
    removeBookmark: async (id) => {
      set((s) => {
        const next = { ...s.bookmarks };
        delete next[id];
        return { bookmarks: next };
      });
      await db.deleteBookmark(id);
    },
    getBookmarks: (bookId) => Object.values(get().bookmarks).filter((b) => b.bookId === bookId).sort((a, b) => a.pageNumber - b.pageNumber),

    recordReadTime: async (bookId, ms) => {
      const hist = get().history[bookId] ?? {
        bookId,
        lastPage: 0,
        lastReadAt: Date.now(),
        readingTimeMs: 0,
        completionRatio: 0,
      };
      const newHist = { ...hist, readingTimeMs: hist.readingTimeMs + ms };
      set((s) => ({ history: { ...s.history, [bookId]: newHist } }));
      await db.putHistory(newHist);
    },
    getHistory: () => Object.values(get().history).sort((a, b) => b.lastReadAt - a.lastReadAt),

    exportAll: async () => {
      return {
        version: 1,
        exportedAt: Date.now(),
        stubs: Object.values(get().stubs),
        contents: Object.values(get().contents),
        bookmarks: Object.values(get().bookmarks),
        history: Object.values(get().history),
      };
    },
    importAll: async (data) => {
      const stubMap: Record<UUID, BookStub> = {};
      data.stubs.forEach((s) => (stubMap[s.id] = s));
      const contentMap: Record<UUID, BookContent> = {};
      data.contents.forEach((c) => (contentMap[c.bookId] = c));
      const bmMap: Record<UUID, import('@/types').Bookmark> = {};
      data.bookmarks.forEach((b) => (bmMap[b.id] = b));
      const histMap: Record<UUID, import('@/types').ReadHistory> = {};
      data.history.forEach((h) => (histMap[h.bookId] = h));
      set({ stubs: stubMap, contents: contentMap, bookmarks: bmMap, history: histMap });
      await db.replaceAll(data);
    },
    clearAll: async () => {
      set({ stubs: {}, contents: {}, bookmarks: {}, history: {} });
      await db.clearAll();
    },
  })),
);
