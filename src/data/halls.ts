import type { HallDefinition, HallId, ShelfLayout } from '@/types';

/**
 * 7 个馆厅的完整参数定义（v2 - 调亮版，温暖明亮不压抑）
 * 所有几何/材质/灯光/粒子都从这里的常量生成
 */

const shelfId = (hallId: HallId, row: string, level: number) => `${hallId}-${row}-L${level}`;

function makeGridLayout(
  hallId: HallId,
  count: number,
  startX: number,
  endX: number,
  startZ: number,
  endZ: number,
  rows: number,
  cols: number,
  categoryFn: (i: number) => { category: string; theme: ShelfLayout['theme'] },
  font: ShelfLayout['labelFont'] = 'gothic',
): ShelfLayout[] {
  const out: ShelfLayout[] = [];
  const stepX = (endX - startX) / Math.max(1, cols - 1);
  const stepZ = (endZ - startZ) / Math.max(1, rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (out.length >= count) break;
      const i = out.length;
      const { category, theme } = categoryFn(i);
      out.push({
        hallId,
        shelfId: shelfId(hallId, String.fromCharCode(65 + r), 1),
        position: [startX + c * stepX, 0, startZ + r * stepZ],
        rotation: [0, 0, 0],
        category,
        capacity: 40,
        theme,
        labelFont: font,
        level: 1,
      });
    }
  }
  return out;
}

// ============================================================================
// 中央大厅 - 温暖金黄色调
// ============================================================================
const centralLayout: ShelfLayout[] = makeGridLayout(
  'central',
  6,
  -8,
  8,
  -8,
  8,
  2,
  3,
  (i) => [
    { category: '索引 · 异典', theme: 'general' },
    { category: '索引 · 异闻', theme: 'history' },
    { category: '索引 · 星图', theme: 'science' },
    { category: '索引 · 万象', theme: 'general' },
    { category: '索引 · 残卷', theme: 'mystery' },
    { category: '索引 · 鸿篇', theme: 'literature' },
  ][i] ?? { category: '未名', theme: 'general' },
  'gothic',
);

// ============================================================================
// 古木回廊 - 暖棕蜜糖色调
// ============================================================================
const woodCategories = [
  { category: '上古编年', theme: 'history' as const },
  { category: '林间牧歌', theme: 'poetry' as const },
  { category: '游侠列传', theme: 'literature' as const },
  { category: '精灵史诗', theme: 'fantasy' as const },
  { category: '矮人匠录', theme: 'engineering' as const },
  { category: '草药志', theme: 'medicine' as const },
  { category: '部族源流', theme: 'history' as const },
  { category: '古木图鉴', theme: 'science' as const },
  { category: '德鲁伊教典', theme: 'magic' as const },
  { category: '磨坊日札', theme: 'literature' as const },
  { category: '酒馆残稿', theme: 'literature' as const },
  { category: '商队日志', theme: 'history' as const },
  { category: '兽语译本', theme: 'mystery' as const },
  { category: '守林人戒律', theme: 'philosophy' as const },
  { category: '橡树年轮', theme: 'science' as const },
  { category: '藤蔓隐喻', theme: 'poetry' as const },
  { category: '追忆之书', theme: 'literature' as const },
  { category: '山岭鸟谱', theme: 'science' as const },
  { category: '夜行手记', theme: 'mystery' as const },
  { category: '丰收祭歌', theme: 'poetry' as const },
];

const woodLayout: ShelfLayout[] = woodCategories.map((cat, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  return {
    hallId: 'wood',
    shelfId: shelfId('wood', String.fromCharCode(65 + row), 1),
    position: [-8 + col * 4, 0, -6 + row * 6],
    rotation: [0, 0, 0],
    category: cat.category,
    capacity: 40,
    theme: cat.theme,
    labelFont: 'gothic',
    level: 1,
  };
});

// ============================================================================
// 星象台 - 星空蓝紫但提亮，月光感
// ============================================================================
const astroCategories = [
  { category: '黄道十二宫', theme: 'mystery' as const },
  { category: '星图残卷', theme: 'science' as const },
  { category: '占星要义', theme: 'mystery' as const },
  { category: '天体力学', theme: 'physics' as const },
  { category: '彗星志', theme: 'science' as const },
  { category: '月相寓言', theme: 'poetry' as const },
  { category: '几何原本', theme: 'math' as const },
  { category: '流形之理', theme: 'math' as const },
  { category: '星界游记', theme: 'fantasy' as const },
  { category: '魔法理论', theme: 'magic' as const },
  { category: '时辰之书', theme: 'mystery' as const },
  { category: '北极星传', theme: 'literature' as const },
  { category: '星尘来源', theme: 'physics' as const },
  { category: '黑域记', theme: 'science' as const },
  { category: '原初神话', theme: 'philosophy' as const },
  { category: '夜观手记', theme: 'history' as const },
  { category: '射电天鉴', theme: 'science' as const },
  { category: '星群民谣', theme: 'poetry' as const },
  { category: '星象占辞', theme: 'mystery' as const },
  { category: '银汉年志', theme: 'history' as const },
  { category: '诸曜列传', theme: 'literature' as const },
  { category: '虚空象学', theme: 'philosophy' as const },
  { category: '暗物质绪论', theme: 'physics' as const },
  { category: '时序学', theme: 'science' as const },
  { category: '星渊挽歌', theme: 'poetry' as const },
  { category: '行星议定书', theme: 'law' as const },
  { category: '天狼观测录', theme: 'science' as const },
  { category: '无限之形', theme: 'math' as const },
  { category: '魔导师占星', theme: 'magic' as const },
  { category: '星云考古', theme: 'history' as const },
];

const astroLayout: ShelfLayout[] = astroCategories.map((cat, i) => {
  const angle = (i / astroCategories.length) * Math.PI * 2;
  const radius = 11;
  return {
    hallId: 'astro',
    shelfId: shelfId('astro', String(i + 1).padStart(2, '0'), 1),
    position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
    rotation: [0, -angle + Math.PI / 2, 0],
    category: cat.category,
    capacity: 35,
    theme: cat.theme,
    labelFont: 'gothic',
    level: (i % 4) + 1,
  };
});

// ============================================================================
// 水晶书阁 - 明亮乳白珍珠色调
// ============================================================================
const crystalCategories = [
  { category: '纯理初论', theme: 'math' as const },
  { category: '工程范式', theme: 'engineering' as const },
  { category: '方法论', theme: 'philosophy' as const },
  { category: '形式系统', theme: 'math' as const },
  { category: '控制论', theme: 'engineering' as const },
  { category: '信息论', theme: 'cs' as const },
  { category: '拓扑学', theme: 'math' as const },
  { category: '逻辑要义', theme: 'philosophy' as const },
  { category: '算法手册', theme: 'cs' as const },
  { category: '线性代数', theme: 'math' as const },
  { category: '结构力学', theme: 'engineering' as const },
  { category: '抽象代数', theme: 'math' as const },
  { category: '编译原理', theme: 'cs' as const },
  { category: '热力学', theme: 'physics' as const },
  { category: '概率论', theme: 'math' as const },
  { category: '符号学', theme: 'philosophy' as const },
  { category: '博弈论', theme: 'math' as const },
  { category: '微分流形', theme: 'math' as const },
  { category: '计算机体系', theme: 'cs' as const },
  { category: '电磁学', theme: 'physics' as const },
  { category: '光学', theme: 'physics' as const },
  { category: '数理逻辑', theme: 'philosophy' as const },
  { category: '范畴论', theme: 'math' as const },
  { category: '数据库系统', theme: 'cs' as const },
  { category: '网络原理', theme: 'cs' as const },
];

const crystalLayout: ShelfLayout[] = crystalCategories.map((cat, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    hallId: 'crystal',
    shelfId: shelfId('crystal', String.fromCharCode(65 + row), (col % 3) + 1),
    position: [-7.5 + col * 3, 0, -5 + row * 5],
    rotation: [0, 0, 0],
    category: cat.category,
    capacity: 30,
    theme: cat.theme,
    labelFont: 'sans',
    level: (col % 3) + 1,
  };
});

// ============================================================================
// 炼金密室 - 暖绿铜色调（不暗）
// ============================================================================
const alchemyCategories = [
  { category: '炼金要旨', theme: 'magic' as const },
  { category: '毒物学', theme: 'medicine' as const },
  { category: '草药大全', theme: 'medicine' as const },
  { category: '金属嬗变', theme: 'chemistry' as const },
  { category: '元素论', theme: 'chemistry' as const },
  { category: '冶金手记', theme: 'engineering' as const },
  { category: '炼丹炉志', theme: 'magic' as const },
  { category: '蒸馏术', theme: 'chemistry' as const },
  { category: '菌类图鉴', theme: 'biology' as const },
  { category: '解剖学', theme: 'medicine' as const },
  { category: '宝石学', theme: 'science' as const },
  { category: '炼金符号', theme: 'mystery' as const },
  { category: '血脉论', theme: 'biology' as const },
  { category: '本草纲目', theme: 'medicine' as const },
  { category: '药理学', theme: 'medicine' as const },
  { category: '腐蚀与再生', theme: 'chemistry' as const },
  { category: '黑粉配方', theme: 'engineering' as const },
  { category: '延寿术', theme: 'magic' as const },
  { category: '瘟疫史', theme: 'history' as const },
  { category: '解梦药典', theme: 'mystery' as const },
  { category: '黏合剂志', theme: 'chemistry' as const },
  { category: '反应炉图', theme: 'engineering' as const },
  { category: '炼丹禁忌', theme: 'philosophy' as const },
  { category: '炼金诗篇', theme: 'poetry' as const },
  { category: '哲人石考', theme: 'mystery' as const },
  { category: '试验日志', theme: 'science' as const },
  { category: '蒸汽机要', theme: 'engineering' as const },
  { category: '炼金寓言', theme: 'literature' as const },
  { category: '矿物志', theme: 'science' as const },
  { category: '细胞学', theme: 'biology' as const },
];

const alchemyLayout: ShelfLayout[] = alchemyCategories.map((cat, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    hallId: 'alchemy',
    shelfId: shelfId('alchemy', String.fromCharCode(65 + row), 1),
    position: [-7.5 + col * 3, 0, -5 + row * 5],
    rotation: [0, 0, 0],
    category: cat.category,
    capacity: 35,
    theme: cat.theme,
    labelFont: 'gothic',
    level: 1,
  };
});

// ============================================================================
// 虚空深渊 - 改为「星海」- 紫罗兰渐变天空，更明亮梦幻
// ============================================================================
const voidCategories = [
  { category: '万象源流', theme: 'philosophy' as const },
  { category: '晨光诗集', theme: 'poetry' as const },
  { category: '云端游记', theme: 'literature' as const },
  { category: '星海地图', theme: 'fantasy' as const },
  { category: '晨曦寓言', theme: 'poetry' as const },
  { category: '远方游吟', theme: 'history' as const },
  { category: '未来考古', theme: 'philosophy' as const },
  { category: '黎明集', theme: 'poetry' as const },
  { category: '清风抄本', theme: 'mystery' as const },
  { category: '星海诗抄', theme: 'poetry' as const },
  { category: '天际初论', theme: 'philosophy' as const },
  { category: '远方寓言', theme: 'literature' as const },
  { category: '梦与晨', theme: 'philosophy' as const },
  { category: '云端抄本', theme: 'literature' as const },
  { category: '明日残卷', theme: 'mystery' as const },
  { category: '清晨手记', theme: 'philosophy' as const },
  { category: '星海挽歌', theme: 'poetry' as const },
  { category: '晨风考辨', theme: 'philosophy' as const },
  { category: '远方宣言', theme: 'literature' as const },
  { category: '轻梦之书', theme: 'mystery' as const },
  { category: '云端民俗', theme: 'history' as const },
  { category: '流云考', theme: 'history' as const },
  { category: '无名集', theme: 'poetry' as const },
  { category: '天际论辩', theme: 'philosophy' as const },
  { category: '黎明歌行', theme: 'poetry' as const },
  { category: '归途之论', theme: 'philosophy' as const },
  { category: '云端弥撒', theme: 'literature' as const },
  { category: '星海经', theme: 'literature' as const },
  { category: '守星人手记', theme: 'literature' as const },
  { category: '远潮', theme: 'poetry' as const },
];

const voidLayout: ShelfLayout[] = voidCategories.map((cat, i) => {
  const angle = (i / voidCategories.length) * Math.PI * 2;
  const radius = 10;
  return {
    hallId: 'void',
    shelfId: shelfId('void', String(i + 1).padStart(2, '0'), 1),
    position: [Math.cos(angle) * radius, Math.sin(i * 0.7) * 0.5, Math.sin(angle) * radius],
    rotation: [0, -angle + Math.PI / 2, 0],
    category: cat.category,
    capacity: 30,
    theme: cat.theme,
    labelFont: 'gothic',
    level: 1,
  };
});

// ============================================================================
// 现实之门 - 明亮现代学院风
// ============================================================================
const realSubjects = [
  '数学', '物理', '化学', '生物', '计算机', '文学', '历史', '哲学',
  '经济', '法学', '医学', '工程', '小说', '诗歌', '论文',
];

const realLayout: ShelfLayout[] = realSubjects.map((subj, i) => {
  const col = i % 5;
  const row = Math.floor(i / 5);
  return {
    hallId: 'real',
    shelfId: shelfId('real', String.fromCharCode(65 + row), 1),
    position: [-8 + col * 4, 0, -5 + row * 5],
    rotation: [0, 0, 0],
    category: subj,
    categoryEn: subj,
    capacity: 50,
    theme: 'general',
    labelFont: 'sans',
    level: 1,
  };
});

// ============================================================================
// 7 个馆厅的完整定义（v2 - 调亮版）
// ============================================================================
export const HALLS: Record<HallId, HallDefinition> = {
  central: {
    id: 'central',
    name: { zh: '中央大厅', en: 'Central Atrium' },
    description: '巨大圆形大厅，中央悬浮水晶球作为全局搜索终端。',
    themeColor: '#c8a857',
    accentColor: '#ffd97a',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: centralLayout,
    parameters: {
      roomShape: 'circle',
      roomSize: [18, 12, 18],
      floor: { color: '#d4b888', roughness: 0.45, metalness: 0.15, reflectivity: 0.5, pattern: 'marble' },
      ceiling: { kind: 'skydome', starCount: 400, nebula: true },
      walls: { color: '#a89070', roughness: 0.85, metalness: 0.05 },
      ambient: { color: '#fff5e0', intensity: 0.85 },
      lighting: {
        hemisphere: { intensity: 0.6 },
        directional: { color: '#fff5e0', intensity: 1.6, shadow: true },
        spots: Array.from({ length: 6 }, (_, i) => ({
          color: '#ffe9b5',
          intensity: 1.2,
          position: [Math.cos((i / 6) * Math.PI * 2) * 8, 8, Math.sin((i / 6) * Math.PI * 2) * 8] as [number, number, number],
          angle: 0.5,
          distance: 14,
        })),
        pointLights: [],
      },
      particles: { dust: 60, runes: 6, stars: 100 },
      volumetricBeams: 3,
      shelves: { count: 6, pattern: 'ring' },
      centerProp: { kind: 'crystal-ball', scale: 1.2, emissive: '#fff0a8', rotation: true },
      audio: { ambientGain: 0.35, reverb: 'cathedral' },
      unlockCondition: { kind: 'always' },
    },
  },

  wood: {
    id: 'wood',
    name: { zh: '古木回廊', en: 'Ancient Wood Gallery' },
    description: '暖蜜糖色调，巨大古树化身书架，藤蔓缠绕，萤火虫飘移。',
    themeColor: '#d4a574',
    accentColor: '#ffc880',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: woodLayout,
    parameters: {
      roomShape: 'rect',
      roomSize: [22, 10, 14],
      floor: { color: '#c89868', roughness: 0.85, metalness: 0, pattern: 'wood' },
      ceiling: { kind: 'solid', color: '#e8b888', pattern: 'beam' },
      walls: { color: '#d4a070', roughness: 0.9, metalness: 0, pattern: 'wood' },
      ambient: { color: '#ffe8c0', intensity: 0.85 },
      lighting: {
        hemisphere: { intensity: 0.7 },
        directional: { color: '#fff0c8', intensity: 1.2, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 10 }, (_, i) => ({
          color: '#ffc880',
          intensity: 1.0,
          position: [(-9 + (i % 5) * 4.5), 4, -6 + Math.floor(i / 5) * 6] as [number, number, number],
          distance: 6,
          flicker: true,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 60, fireflies: 25 },
      volumetricBeams: 2,
      shelves: { count: 20, pattern: 'grid' },
      centerProp: { kind: 'ancient-tree', scale: 1.5, emissive: '#a8784a' },
      audio: { ambientGain: 0.4, reverb: 'wood' },
      unlockCondition: { kind: 'always' },
    },
  },

  astro: {
    id: 'astro',
    name: { zh: '星象台', en: 'Astronomy Wing' },
    description: '月光蓝紫调，弧形高塔书架，地面映射星图，穹顶为夜空。',
    themeColor: '#8a8ad0',
    accentColor: '#c8c8ff',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: astroLayout,
    parameters: {
      roomShape: 'tower',
      roomSize: [14, 18, 14],
      floor: { color: '#6a78c0', roughness: 0.4, metalness: 0.3, reflectivity: 0.4, pattern: 'star' },
      ceiling: { kind: 'skydome', starCount: 1200, nebula: true },
      walls: { color: '#8888b8', roughness: 0.6, metalness: 0.2, pattern: 'rune' },
      ambient: { color: '#d8d8f0', intensity: 0.75 },
      lighting: {
        hemisphere: { intensity: 0.7 },
        directional: { color: '#ffffff', intensity: 1.0, shadow: true },
        spots: [
          { color: '#e8e8ff', intensity: 1.4, position: [0, 14, 0], angle: 0.6, distance: 18 },
        ],
        pointLights: [],
        emissiveAccents: Array.from({ length: 8 }, (_, i) => ({
          position: [Math.cos((i / 8) * Math.PI * 2) * 5, 6, Math.sin((i / 8) * Math.PI * 2) * 5] as [number, number, number],
          color: '#a8b8ff',
          intensity: 0.5,
        })),
      },
      particles: { dust: 50, runes: 6, stars: 200 },
      volumetricBeams: 1,
      shelves: { count: 30, pattern: 'arc' },
      centerProp: { kind: 'crystal-cluster', scale: 1.0, emissive: '#a8b8ff' },
      audio: { ambientGain: 0.4, reverb: 'cathedral' },
      unlockCondition: { kind: 'themeBooks', theme: 'fantasy', count: 5 },
    },
  },

  crystal: {
    id: 'crystal',
    name: { zh: '水晶书阁', en: 'Crystal Archive' },
    description: '乳白珍珠色调，透明水晶棱柱书架，光线折射晶莹。',
    themeColor: '#e8eef4',
    accentColor: '#ffffff',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: crystalLayout,
    parameters: {
      roomShape: 'octagon',
      roomSize: [12, 9, 12],
      floor: { color: '#f4f8fc', roughness: 0.15, metalness: 0.05, reflectivity: 0.85 },
      ceiling: { kind: 'solid', color: '#e8eef4', pattern: 'plain' },
      walls: { color: '#e0e8f0', roughness: 0.1, metalness: 0.05, pattern: 'plain' },
      ambient: { color: '#ffffff', intensity: 0.95 },
      lighting: {
        hemisphere: { intensity: 0.85 },
        directional: { color: '#ffffff', intensity: 1.0, shadow: true },
        spots: [
          { color: '#ffffff', intensity: 1.2, position: [0, 7, 0], angle: 0.7, distance: 14 },
        ],
        pointLights: Array.from({ length: 6 }, (_, i) => ({
          color: '#ffffff',
          intensity: 0.8,
          position: [Math.cos((i / 6) * Math.PI * 2) * 6, 3, Math.sin((i / 6) * Math.PI * 2) * 6] as [number, number, number],
          distance: 7,
        })),
      },
      particles: { dust: 80, orbs: 25 },
      volumetricBeams: 1,
      shelves: { count: 25, pattern: 'ring' },
      centerProp: { kind: 'crystal-cluster', scale: 1.0, emissive: '#ffffff' },
      audio: { ambientGain: 0.3, reverb: 'crystal' },
      unlockCondition: { kind: 'themeBooks', theme: 'mystery', count: 3 },
    },
  },

  alchemy: {
    id: 'alchemy',
    name: { zh: '炼金密室', en: 'Alchemy Chamber' },
    description: '暖绿铜色调，金属管道与烧瓶陈列架，温暖蒸汽升腾。',
    themeColor: '#a8c890',
    accentColor: '#f0d880',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: alchemyLayout,
    parameters: {
      roomShape: 'irregular',
      roomSize: [16, 9, 14],
      floor: { color: '#88a878', roughness: 0.7, metalness: 0.25, pattern: 'tile' },
      ceiling: { kind: 'solid', color: '#b8c898', pattern: 'beam' },
      walls: { color: '#a0b888', roughness: 0.8, metalness: 0.3, pattern: 'brick' },
      ambient: { color: '#f0f8d8', intensity: 0.85 },
      lighting: {
        hemisphere: { intensity: 0.7 },
        directional: { color: '#fff8d8', intensity: 1.0, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 8 }, (_, i) => ({
          color: i % 2 === 0 ? '#d8e890' : '#ffd870',
          intensity: 0.9,
          position: [(-6 + (i % 4) * 4), 3, -4 + Math.floor(i / 4) * 4] as [number, number, number],
          distance: 6,
          flicker: true,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 60, orbs: 20 },
      volumetricBeams: 3,
      shelves: { count: 30, pattern: 'grid' },
      centerProp: { kind: 'alchemy-stand', scale: 1.0, emissive: '#d8e890' },
      audio: { ambientGain: 0.45, reverb: 'lab' },
      unlockCondition: { kind: 'themeBooks', theme: 'magic', count: 3 },
    },
  },

  void: {
    id: 'void',
    name: { zh: '星海长廊', en: 'Stellar Gallery' },
    description: '梦幻紫罗兰渐变天空，温暖星云漂浮，悬浮书架。',
    themeColor: '#b888d8',
    accentColor: '#ffc8e8',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: voidLayout,
    parameters: {
      roomShape: 'circle',
      roomSize: [16, 14, 16],
      floor: { color: '#9080c0', roughness: 0.4, metalness: 0.3, reflectivity: 0.5, pattern: 'star' },
      ceiling: { kind: 'open' },
      walls: { color: '#a890d0', roughness: 0.7, metalness: 0.2 },
      ambient: { color: '#ffe0f0', intensity: 0.8 },
      lighting: {
        hemisphere: { intensity: 0.7 },
        directional: { color: '#ffd8f0', intensity: 1.0, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 4 }, (_, i) => ({
          color: '#ffb8e8',
          intensity: 0.9,
          position: [Math.cos((i / 4) * Math.PI * 2) * 7, 5, Math.sin((i / 4) * Math.PI * 2) * 7] as [number, number, number],
          distance: 9,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 80, runes: 4, stars: 150, pages: 12 },
      volumetricBeams: 2,
      shelves: { count: 30, pattern: 'floating' },
      centerProp: { kind: 'void-portal', scale: 1.0, emissive: '#ffb8e8' },
      audio: { ambientGain: 0.4, reverb: 'void' },
      gravityFeel: 'float',
      unlockCondition: { kind: 'themeBooks', theme: 'philosophy', count: 5 },
    },
  },

  real: {
    id: 'real',
    name: { zh: '现实之门', en: 'Real World Portal' },
    description: '现代学院风格，明亮、整洁，分类涵盖各学科。',
    themeColor: '#e0e4ec',
    accentColor: '#4a7ad9',
    switchThemeOnEnter: 'real',
    shelfLayout: realLayout,
    subjects: realSubjects,
    parameters: {
      roomShape: 'rect',
      roomSize: [20, 8, 14],
      floor: { color: '#e8d8b8', roughness: 0.5, metalness: 0, pattern: 'wood' },
      ceiling: { kind: 'solid', color: '#fafafa', pattern: 'plain' },
      walls: { color: '#f8f8fa', roughness: 0.9, metalness: 0, pattern: 'plain' },
      ambient: { color: '#ffffff', intensity: 0.95 },
      lighting: {
        hemisphere: { intensity: 0.8 },
        directional: { color: '#ffffff', intensity: 1.2, shadow: true },
        spots: [],
        pointLights: [],
      },
      particles: { dust: 30 },
      volumetricBeams: 2,
      shelves: { count: 15, pattern: 'grid' },
      centerProp: { kind: 'lectern', scale: 1.0 },
      audio: { ambientGain: 0.25, reverb: 'modern' },
      unlockCondition: { kind: 'always' },
    },
  },
};

export const HALL_IDS: HallId[] = ['central', 'wood', 'astro', 'crystal', 'alchemy', 'void', 'real'];

export function getHall(id: HallId): HallDefinition {
  return HALLS[id];
}

export function getHallList(): HallDefinition[] {
  return HALL_IDS.map((id) => HALLS[id]);
}
