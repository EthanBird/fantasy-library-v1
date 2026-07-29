import { create } from 'zustand';
import type { UUID } from '@/types';

export type ModalKind =
  | null
  | 'settings'
  | 'search'
  | 'bookmarks'
  | 'history'
  | 'import-export'
  | 'category-editor'
  | 'tutorial';

export interface Notification {
  id: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  durationMs: number;
  createdAt: number;
}

export interface HoverTarget {
  type: 'book' | 'shelf' | 'crystal-ball' | 'portal' | null;
  id: string;
  data?: any;
}

interface UIStore {
  // 模态
  modal: ModalKind;
  openModal: (m: NonNullable<ModalKind>) => void;
  closeModal: () => void;

  // 通知
  notifications: Notification[];
  notify: (n: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;

  // Hover/Target
  hover: HoverTarget;
  setHover: (h: HoverTarget) => void;

  // 阅读器
  readingBookId: UUID | null;
  readingPage: number;
  openBook: (bookId: UUID) => void;
  closeBook: () => void;
  setPage: (page: number) => void;

  // 水晶球 UI
  crystalBallActive: boolean;
  setCrystalBallActive: (a: boolean) => void;

  // 加载屏
  bootProgress: { step: string; progress: number } | null;
  setBootProgress: (b: { step: string; progress: number } | null) => void;

  // Tutorial
  hasShownTutorial: boolean;
  setTutorialShown: (b: boolean) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  modal: null,
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),

  notifications: [],
  notify: (n) => {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const notif: Notification = { ...n, id, createdAt: Date.now() };
    set((s) => ({ notifications: [...s.notifications, notif] }));
    if (n.durationMs > 0) {
      setTimeout(() => get().dismissNotification(id), n.durationMs);
    }
  },
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  hover: { type: null, id: '' },
  setHover: (h) => set({ hover: h }),

  readingBookId: null,
  readingPage: 0,
  openBook: (bookId) => {
    set({ readingBookId: bookId, readingPage: 0 });
  },
  closeBook: () => set({ readingBookId: null, readingPage: 0 }),
  setPage: (page) => set({ readingPage: page }),

  crystalBallActive: false,
  setCrystalBallActive: (a) => set({ crystalBallActive: a }),

  bootProgress: { step: '正在唤醒图书馆…', progress: 0 },
  setBootProgress: (b) => set({ bootProgress: b }),

  hasShownTutorial: false,
  setTutorialShown: (b) => set({ hasShownTutorial: b }),
}));
