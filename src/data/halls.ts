import type { HallDefinition, HallId, ShelfLayout } from '@/types';

/**
 * 7 个馆厅的完整参数定义
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
// 中央大厅
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
// 古木回廊
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
// 星象台
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
  // 弧形靠墙
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
// 水晶书阁
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
// 炼金密室
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
// 虚空深渊
// ============================================================================
const voidCategories = [
  { category: '虚无本体论', theme: 'philosophy' as const },
  { category: '死亡研究', theme: 'philosophy' as const },
  { category: '形而上学', theme: 'philosophy' as const },
  { category: '深渊神话', theme: 'literature' as const },
  { category: '忘川之歌', theme: 'poetry' as const },
  { category: '墓园戒律', theme: 'mystery' as const },
  { category: '末世论', theme: 'philosophy' as const },
  { category: '苦短集', theme: 'poetry' as const },
  { category: '魂魄考', theme: 'mystery' as const },
  { category: '虚空诗抄', theme: 'poetry' as const },
  { category: '玄学初论', theme: 'philosophy' as const },
  { category: '彼岸寓言', theme: 'literature' as const },
  { category: '梦与醒', theme: 'philosophy' as const },
  { category: '黑镜抄本', theme: 'literature' as const },
  { category: '末日残卷', theme: 'mystery' as const },
  { category: '黄昏手记', theme: 'philosophy' as const },
  { category: '星渊挽歌', theme: 'poetry' as const },
  { category: '魂归考辨', theme: 'philosophy' as const },
  { category: '暗面宣言', theme: 'literature' as const },
  { category: '沉眠之书', theme: 'mystery' as const },
  { category: '葬仪考', theme: 'history' as const },
  { category: '虚空民俗', theme: 'history' as const },
  { category: '无名氏集', theme: 'poetry' as const },
  { category: '存在论辩', theme: 'philosophy' as const },
  { category: '永夜歌行', theme: 'poetry' as const },
  { category: '终结之论', theme: 'philosophy' as const },
  { category: '黑色弥撒', theme: 'literature' as const },
  { category: '深渊经', theme: 'literature' as const },
  { category: '守夜人手记', theme: 'literature' as const },
  { category: '残响', theme: 'poetry' as const },
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
// 现实之门
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
// 7 个馆厅的完整定义
// ============================================================================
export const HALLS: Record<HallId, HallDefinition> = {
  central: {
    id: 'central',
    name: { zh: '中央大厅', en: 'Central Atrium' },
    description: '巨大圆形大厅，中央悬浮水晶球作为全局搜索终端。',
    themeColor: '#3b2f6b',
    accentColor: '#d4af37',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: centralLayout,
    parameters: {
      roomShape: 'circle',
      roomSize: [18, 12, 18],
      floor: { color: '#1a1430', roughness: 0.4, metalness: 0.2, reflectivity: 0.6, pattern: 'marble' },
      ceiling: { kind: 'skydome', starCount: 800, nebula: true },
      walls: { color: '#2a1f3a', roughness: 0.85, metalness: 0.1 },
      ambient: { color: '#3a3060', intensity: 0.35 },
      fog: { color: '#1a1430', near: 20, far: 60 },
      lighting: {
        hemisphere: { intensity: 0.2 },
        directional: { color: '#fff5e0', intensity: 1.2, shadow: true },
        spots: Array.from({ length: 6 }, (_, i) => ({
          color: '#ffe9b5',
          intensity: 1.0,
          position: [Math.cos((i / 6) * Math.PI * 2) * 8, 8, Math.sin((i / 6) * Math.PI * 2) * 8] as [number, number, number],
          angle: 0.5,
          distance: 14,
        })),
        pointLights: [],
      },
      particles: { dust: 100, runes: 6, stars: 200 },
      volumetricBeams: 3,
      shelves: { count: 6, pattern: 'ring' },
      centerProp: { kind: 'crystal-ball', scale: 1.2, emissive: '#a890ff', rotation: true },
      audio: { ambientGain: 0.4, reverb: 'cathedral' },
      unlockCondition: { kind: 'always' },
    },
  },

  wood: {
    id: 'wood',
    name: { zh: '古木回廊', en: 'Ancient Wood Gallery' },
    description: '暖棕色调，巨大古树化身书架，藤蔓缠绕，萤火虫飘移。',
    themeColor: '#6b4a25',
    accentColor: '#ffb05a',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: woodLayout,
    parameters: {
      roomShape: 'rect',
      roomSize: [22, 10, 14],
      floor: { color: '#3a2818', roughness: 0.95, metalness: 0, pattern: 'wood' },
      ceiling: { kind: 'solid', color: '#2a1c10', pattern: 'beam' },
      walls: { color: '#4a2f1c', roughness: 0.95, metalness: 0, pattern: 'wood' },
      ambient: { color: '#5a3a20', intensity: 0.4 },
      fog: { color: '#3a2818', near: 18, far: 50 },
      lighting: {
        hemisphere: { intensity: 0.3 },
        directional: { color: '#ffd9a8', intensity: 0.6, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 10 }, (_, i) => ({
          color: '#ffaa55',
          intensity: 0.9,
          position: [(-9 + (i % 5) * 4.5), 4, -6 + Math.floor(i / 5) * 6] as [number, number, number],
          distance: 5,
          flicker: true,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 80, fireflies: 30 },
      volumetricBeams: 2,
      shelves: { count: 20, pattern: 'grid' },
      centerProp: { kind: 'ancient-tree', scale: 1.5, emissive: '#4a3018' },
      audio: { ambientGain: 0.5, reverb: 'wood' },
      unlockCondition: { kind: 'always' },
    },
  },

  astro: {
    id: 'astro',
    name: { zh: '星象台', en: 'Astronomy Wing' },
    description: '圆形塔楼，弧形高塔书架，地面映射星图，穹顶为实时星空。',
    themeColor: '#2a3a7a',
    accentColor: '#8acaff',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: astroLayout,
    parameters: {
      roomShape: 'tower',
      roomSize: [14, 18, 14],
      floor: { color: '#0a1840', roughness: 0.3, metalness: 0.4, reflectivity: 0.4, pattern: 'star' },
      ceiling: { kind: 'skydome', starCount: 1500, nebula: true },
      walls: { color: '#1a2a5a', roughness: 0.6, metalness: 0.3, pattern: 'rune' },
      ambient: { color: '#1a2a6a', intensity: 0.3 },
      fog: { color: '#0a1840', near: 25, far: 70 },
      lighting: {
        hemisphere: { intensity: 0.25 },
        directional: { color: '#aaccff', intensity: 0.8, shadow: true },
        spots: [
          { color: '#aaccff', intensity: 1.2, position: [0, 14, 0], angle: 0.6, distance: 18 },
        ],
        pointLights: [],
        emissiveAccents: Array.from({ length: 8 }, (_, i) => ({
          position: [Math.cos((i / 8) * Math.PI * 2) * 5, 6, Math.sin((i / 8) * Math.PI * 2) * 5] as [number, number, number],
          color: '#5588ff',
          intensity: 0.6,
        })),
      },
      particles: { dust: 60, runes: 8, stars: 300 },
      volumetricBeams: 1,
      shelves: { count: 30, pattern: 'arc' },
      centerProp: { kind: 'crystal-cluster', scale: 1.0, emissive: '#5588ff' },
      audio: { ambientGain: 0.45, reverb: 'cathedral' },
      unlockCondition: { kind: 'themeBooks', theme: 'fantasy', count: 5 },
    },
  },

  crystal: {
    id: 'crystal',
    name: { zh: '水晶书阁', en: 'Crystal Archive' },
    description: '八边形透明水晶棱柱书架，光线折射，冷白色调。',
    themeColor: '#a0c0d0',
    accentColor: '#ffffff',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: crystalLayout,
    parameters: {
      roomShape: 'octagon',
      roomSize: [12, 9, 12],
      floor: { color: '#d8e8f0', roughness: 0.1, metalness: 0.1, reflectivity: 0.9 },
      ceiling: { kind: 'solid', color: '#c0d0d8', pattern: 'plain' },
      walls: { color: '#b0c8d8', roughness: 0.05, metalness: 0.1, pattern: 'plain' },
      ambient: { color: '#b0c8d8', intensity: 0.5 },
      lighting: {
        hemisphere: { intensity: 0.5 },
        directional: { color: '#ffffff', intensity: 0.6, shadow: true },
        spots: [
          { color: '#ffffff', intensity: 1.0, position: [0, 7, 0], angle: 0.7, distance: 14 },
        ],
        pointLights: Array.from({ length: 6 }, (_, i) => ({
          color: '#ffffff',
          intensity: 0.8,
          position: [Math.cos((i / 6) * Math.PI * 2) * 6, 3, Math.sin((i / 6) * Math.PI * 2) * 6] as [number, number, number],
          distance: 7,
        })),
      },
      particles: { dust: 100, orbs: 30 },
      volumetricBeams: 1,
      shelves: { count: 25, pattern: 'ring' },
      centerProp: { kind: 'crystal-cluster', scale: 1.0, emissive: '#ffffff' },
      audio: { ambientGain: 0.35, reverb: 'crystal' },
      unlockCondition: { kind: 'themeBooks', theme: 'mystery', count: 3 },
    },
  },

  alchemy: {
    id: 'alchemy',
    name: { zh: '炼金密室', en: 'Alchemy Chamber' },
    description: '暗绿铜金调，金属管道与烧瓶陈列架，蒸汽升腾。',
    themeColor: '#4a6840',
    accentColor: '#aacc66',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: alchemyLayout,
    parameters: {
      roomShape: 'irregular',
      roomSize: [16, 9, 14],
      floor: { color: '#1a3024', roughness: 0.7, metalness: 0.3, pattern: 'tile' },
      ceiling: { kind: 'solid', color: '#2a3a28', pattern: 'beam' },
      walls: { color: '#2a4024', roughness: 0.8, metalness: 0.4, pattern: 'brick' },
      ambient: { color: '#2a4020', intensity: 0.35 },
      fog: { color: '#1a3024', near: 12, far: 40 },
      lighting: {
        hemisphere: { intensity: 0.2 },
        directional: { color: '#a8c08a', intensity: 0.5, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 8 }, (_, i) => ({
          color: i % 2 === 0 ? '#88cc44' : '#ccaa44',
          intensity: 0.7,
          position: [(-6 + (i % 4) * 4), 3, -4 + Math.floor(i / 4) * 4] as [number, number, number],
          distance: 5,
          flicker: true,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 80, orbs: 25 },
      volumetricBeams: 3,
      shelves: { count: 30, pattern: 'grid' },
      centerProp: { kind: 'alchemy-stand', scale: 1.0, emissive: '#88cc44' },
      audio: { ambientGain: 0.5, reverb: 'lab' },
      unlockCondition: { kind: 'themeBooks', theme: 'magic', count: 3 },
    },
  },

  void: {
    id: 'void',
    name: { zh: '虚空深渊', en: 'Void Depths' },
    description: '暗紫黑色调，悬浮书架于虚空中，下方为无尽星云深渊。',
    themeColor: '#2a0040',
    accentColor: '#aa66ff',
    switchThemeOnEnter: 'fantasy',
    shelfLayout: voidLayout,
    parameters: {
      roomShape: 'circle',
      roomSize: [16, 14, 16],
      floor: { color: '#100018', roughness: 0.3, metalness: 0.5, reflectivity: 0.5, pattern: 'star' },
      ceiling: { kind: 'open' },
      walls: { color: '#200030', roughness: 0.7, metalness: 0.3 },
      ambient: { color: '#1a0030', intensity: 0.25 },
      fog: { color: '#0a0018', near: 18, far: 55 },
      lighting: {
        hemisphere: { intensity: 0.15 },
        directional: { color: '#9966ff', intensity: 0.5, shadow: true },
        spots: [],
        pointLights: Array.from({ length: 4 }, (_, i) => ({
          color: '#aa66ff',
          intensity: 0.8,
          position: [Math.cos((i / 4) * Math.PI * 2) * 7, 5, Math.sin((i / 4) * Math.PI * 2) * 7] as [number, number, number],
          distance: 9,
        })),
        emissiveAccents: [],
      },
      particles: { dust: 100, runes: 6, stars: 200, pages: 15 },
      volumetricBeams: 4,
      shelves: { count: 30, pattern: 'floating' },
      centerProp: { kind: 'void-portal', scale: 1.0, emissive: '#aa66ff' },
      audio: { ambientGain: 0.5, reverb: 'void' },
      gravityFeel: 'float',
      unlockCondition: { kind: 'themeBooks', theme: 'philosophy', count: 5 },
    },
  },

  real: {
    id: 'real',
    name: { zh: '现实之门', en: 'Real World Portal' },
    description: '现代学院风格，明亮、整洁，分类涵盖各学科。',
    themeColor: '#dcdce0',
    accentColor: '#3a7ad9',
    switchThemeOnEnter: 'real',
    shelfLayout: realLayout,
    subjects: realSubjects,
    parameters: {
      roomShape: 'rect',
      roomSize: [20, 8, 14],
      floor: { color: '#c8b89a', roughness: 0.5, metalness: 0, pattern: 'wood' },
      ceiling: { kind: 'solid', color: '#f0f0f0', pattern: 'plain' },
      walls: { color: '#f5f5f7', roughness: 0.9, metalness: 0, pattern: 'plain' },
      ambient: { color: '#f0f0f0', intensity: 0.7 },
      lighting: {
        hemisphere: { intensity: 0.6 },
        directional: { color: '#ffffff', intensity: 0.8, shadow: true },
        spots: [],
        pointLights: [],
      },
      particles: { dust: 40 },
      volumetricBeams: 2,
      shelves: { count: 15, pattern: 'grid' },
      centerProp: { kind: 'lectern', scale: 1.0 },
      audio: { ambientGain: 0.3, reverb: 'modern' },
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
