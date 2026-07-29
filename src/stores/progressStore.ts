import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BookTheme, HallId, ProgressState } from '@/types';
import { isUnlocked } from '@/data/unlockTable';
import { HALLS } from '@/data/halls';

interface ProgressStore extends ProgressState {
  recordRead: (theme: BookTheme) => void;
  recordCompleted: () => void;
  recordPageRead: (n: number) => void;
  unlockHall: (id: HallId) => void;
  discoverHall: (id: HallId) => void;
  recomputeUnlocks: () => HallId[]; // 返回本次新解锁的馆厅列表
  reset: () => void;
}

const DEFAULT: ProgressState = {
  unlockedHalls: ['central', 'wood', 'real'],
  discoveredHalls: ['central'],
  themeReadCounts: {
    fantasy: 0, history: 0, mystery: 0, magic: 0, philosophy: 0,
    science: 0, engineering: 0, medicine: 0, literature: 0, poetry: 0,
    thesis: 0, math: 0, physics: 0, chemistry: 0, biology: 0, cs: 0,
    economics: 0, law: 0, general: 0,
  },
  totalBooksRead: 0,
  totalBooksCompleted: 0,
  totalPagesRead: 0,
};

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT,
      recordRead: (theme) => set((s) => ({
        themeReadCounts: { ...s.themeReadCounts, [theme]: (s.themeReadCounts[theme] ?? 0) + 1 },
        totalBooksRead: s.totalBooksRead + 1,
      })),
      recordCompleted: () => set((s) => ({ totalBooksCompleted: s.totalBooksCompleted + 1 })),
      recordPageRead: (n) => set((s) => ({ totalPagesRead: s.totalPagesRead + n })),
      unlockHall: (id) => set((s) => ({
        unlockedHalls: s.unlockedHalls.includes(id) ? s.unlockedHalls : [...s.unlockedHalls, id],
      })),
      discoverHall: (id) => set((s) => ({
        discoveredHalls: s.discoveredHalls.includes(id) ? s.discoveredHalls : [...s.discoveredHalls, id],
      })),
      recomputeUnlocks: () => {
        const state = get();
        const newlyUnlocked: HallId[] = [];
        const allHalls = Object.keys(HALLS) as HallId[];
        for (const id of allHalls) {
          if (state.unlockedHalls.includes(id)) continue;
          const cond = HALLS[id].parameters.unlockCondition;
          if (isUnlocked(cond, state.themeReadCounts, state.totalBooksRead)) {
            newlyUnlocked.push(id);
          }
        }
        if (newlyUnlocked.length > 0) {
          set((s) => ({
            unlockedHalls: [...s.unlockedHalls, ...newlyUnlocked],
          }));
        }
        return newlyUnlocked;
      },
      reset: () => set({ ...DEFAULT }),
    }),
    {
      name: 'fl3d.progress',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
