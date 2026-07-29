import type { BookTheme } from '@/types';

/**
 * 主题分类到中英文 + 默认色调映射
 */

export interface ThemeInfo {
  id: BookTheme;
  zh: string;
  en: string;
  defaultColor: string; // 默认书脊颜色
  defaultPulseColor: string; // 呼吸光颜色
  description: string;
}

export const THEMES: Record<BookTheme, ThemeInfo> = {
  fantasy: { id: 'fantasy', zh: '奇幻', en: 'Fantasy', defaultColor: '#5a2d8a', defaultPulseColor: '#9966ff', description: '魔法、异世界、英雄冒险' },
  history: { id: 'history', zh: '历史', en: 'History', defaultColor: '#8a5a2d', defaultPulseColor: '#ffcc66', description: '编年、传记、考据' },
  mystery: { id: 'mystery', zh: '神秘学', en: 'Mystery', defaultColor: '#1a4a6a', defaultPulseColor: '#66aaff', description: '占星、符咒、秘传' },
  magic: { id: 'magic', zh: '魔法', en: 'Magic', defaultColor: '#4a1a6a', defaultPulseColor: '#cc66ff', description: '魔法理论、咒文、典籍' },
  philosophy: { id: 'philosophy', zh: '哲学', en: 'Philosophy', defaultColor: '#2a2a4a', defaultPulseColor: '#9999cc', description: '形而上学、伦理学、逻辑' },
  science: { id: 'science', zh: '科学', en: 'Science', defaultColor: '#1a4a4a', defaultPulseColor: '#66cccc', description: '自然、实证、综述' },
  engineering: { id: 'engineering', zh: '工程', en: 'Engineering', defaultColor: '#4a4a2a', defaultPulseColor: '#cccc66', description: '机械、土木、制造' },
  medicine: { id: 'medicine', zh: '医学', en: 'Medicine', defaultColor: '#6a2a2a', defaultPulseColor: '#ff6688', description: '药理、解剖、临床' },
  literature: { id: 'literature', zh: '文学', en: 'Literature', defaultColor: '#5a3a1a', defaultPulseColor: '#ffaa66', description: '小说、戏剧、散文' },
  poetry: { id: 'poetry', zh: '诗歌', en: 'Poetry', defaultColor: '#3a1a4a', defaultPulseColor: '#cc88ff', description: '诗集、词、赋' },
  thesis: { id: 'thesis', zh: '论文', en: 'Thesis', defaultColor: '#2a3a3a', defaultPulseColor: '#88aaaa', description: '学术论文、研究报告' },
  math: { id: 'math', zh: '数学', en: 'Math', defaultColor: '#1a2a5a', defaultPulseColor: '#6688ff', description: '代数、几何、分析' },
  physics: { id: 'physics', zh: '物理', en: 'Physics', defaultColor: '#1a3a5a', defaultPulseColor: '#66aaff', description: '力学、电磁、量子' },
  chemistry: { id: 'chemistry', zh: '化学', en: 'Chemistry', defaultColor: '#2a4a2a', defaultPulseColor: '#88cc66', description: '有机、无机、反应' },
  biology: { id: 'biology', zh: '生物', en: 'Biology', defaultColor: '#2a5a3a', defaultPulseColor: '#66cc88', description: '细胞、生态、遗传' },
  cs: { id: 'cs', zh: '计算机', en: 'Computer Science', defaultColor: '#1a4a3a', defaultPulseColor: '#66ccaa', description: '算法、系统、网络' },
  economics: { id: 'economics', zh: '经济', en: 'Economics', defaultColor: '#5a4a1a', defaultPulseColor: '#ffcc66', description: '宏观、微观、金融' },
  law: { id: 'law', zh: '法学', en: 'Law', defaultColor: '#4a2a2a', defaultPulseColor: '#ff8866', description: '法理、判例、规约' },
  general: { id: 'general', zh: '通识', en: 'General', defaultColor: '#3a3a3a', defaultPulseColor: '#aaaaaa', description: '综合性、索引' },
};

export const THEME_LIST: ThemeInfo[] = Object.values(THEMES);

export function getTheme(id: BookTheme): ThemeInfo {
  return THEMES[id] ?? THEMES.general;
}
