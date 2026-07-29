import type { BookTheme, HallId, UnlockCondition } from '@/types';
import { HALLS } from './halls';

/**
 * 馆厅解锁进度查询
 * 提供"是否解锁""距离解锁还差多少"等接口
 */

export interface UnlockProgress {
  hallId: HallId;
  unlocked: boolean;
  required: number;
  current: number;
  message: string;
}

export function isUnlocked(condition: UnlockCondition, themeReadCounts: Record<BookTheme, number>, totalRead: number): boolean {
  switch (condition.kind) {
    case 'always':
      return true;
    case 'themeBooks':
      return (themeReadCounts[condition.theme] ?? 0) >= condition.count;
    case 'totalBooks':
      return totalRead >= condition.count;
    case 'discovery':
      return false; // 手动标记
  }
}

export function computeUnlockProgress(
  hallId: HallId,
  unlockedHalls: HallId[],
  themeReadCounts: Record<BookTheme, number>,
  totalRead: number,
): UnlockProgress {
  const hall = HALLS[hallId];
  const cond = hall.parameters.unlockCondition;
  const unlocked = unlockedHalls.includes(hallId);

  if (cond.kind === 'always') {
    return { hallId, unlocked, required: 0, current: 0, message: '始终开放' };
  }
  if (cond.kind === 'themeBooks') {
    const current = themeReadCounts[cond.theme] ?? 0;
    return {
      hallId,
      unlocked,
      required: cond.count,
      current,
      message: unlocked ? '已解锁' : `阅读 ${cond.count} 本${getThemeName(cond.theme)}（当前 ${current}）`,
    };
  }
  if (cond.kind === 'totalBooks') {
    return {
      hallId,
      unlocked,
      required: cond.count,
      current: totalRead,
      message: unlocked ? '已解锁' : `阅读 ${cond.count} 本书（当前 ${totalRead}）`,
    };
  }
  return { hallId, unlocked, required: 1, current: 0, message: '待探索' };
}

function getThemeName(theme: BookTheme): string {
  const map: Record<BookTheme, string> = {
    fantasy: '奇幻',
    history: '历史',
    mystery: '神秘学',
    magic: '魔法',
    philosophy: '哲学',
    science: '科学',
    engineering: '工程',
    medicine: '医学',
    literature: '文学',
    poetry: '诗歌',
    thesis: '学术',
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    cs: '计算机',
    economics: '经济',
    law: '法学',
    general: '通识',
  };
  return map[theme];
}
