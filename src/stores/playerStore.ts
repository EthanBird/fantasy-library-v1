import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { HallId, PlayerState, Vec3 } from '@/types';

interface PlayerStore extends PlayerState {
  setHall: (id: HallId) => void;
  setPosition: (p: Vec3) => void;
  setRotation: (yaw: number, pitch: number) => void;
  setFov: (fov: number) => void;
  setReading: (r: boolean) => void;
  setPointerLocked: (locked: boolean) => void;
  setRunning: (running: boolean) => void;
  reset: () => void;
}

const DEFAULT: PlayerState = {
  hallId: 'central',
  position: [0, 1.6, 4],
  yaw: Math.PI,
  pitch: 0,
  fov: 70,
  isReading: false,
  isPointerLocked: false,
  isRunning: false,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      ...DEFAULT,
      setHall: (id) => set({ hallId: id }),
      setPosition: (p) => set({ position: p }),
      setRotation: (yaw, pitch) => set({ yaw, pitch }),
      setFov: (fov) => set({ fov }),
      setReading: (r) => set({ isReading: r }),
      setPointerLocked: (locked) => set({ isPointerLocked: locked }),
      setRunning: (running) => set({ isRunning: running }),
      reset: () => set({ ...DEFAULT }),
    }),
    {
      name: 'fl3d.player',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({ hallId: s.hallId, position: s.position, yaw: s.yaw, pitch: s.pitch, fov: s.fov }),
    },
  ),
);
