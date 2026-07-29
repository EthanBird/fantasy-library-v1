/**
 * 异世界图书馆 · 全局类型定义
 * 单一来源真相（SSoT），所有 store / service / component 都引用此处
 */

// ============================================================================
// 基础别名
// ============================================================================
export type UUID = string;
export type EpochMs = number;
export type HexColor = string;
export type Vec3 = [number, number, number];

// ============================================================================
// 馆厅 / 主题
// ============================================================================
export type HallId =
  | 'central'
  | 'wood'
  | 'astro'
  | 'crystal'
  | 'alchemy'
  | 'void'
  | 'real';

export type BookTheme =
  | 'fantasy'
  | 'history'
  | 'mystery'
  | 'magic'
  | 'philosophy'
  | 'science'
  | 'engineering'
  | 'medicine'
  | 'literature'
  | 'poetry'
  | 'thesis'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'cs'
  | 'economics'
  | 'law'
  | 'general';

export type HallShape = 'circle' | 'rect' | 'octagon' | 'tower' | 'irregular';
export type ShelfLabelFont = 'gothic' | 'sans' | 'mono';
export type QualityPreset = 'low' | 'mid' | 'high' | 'ultra';
export type Weather = 'clear' | 'rain' | 'snow' | 'fog';
export type ReadTheme = 'fantasy' | 'real';

// ============================================================================
// 馆厅参数
// ============================================================================
export interface HallVisualParams {
  roomShape: HallShape;
  roomSize: Vec3; // [width, height, depth]，圆形/八边形则 width 视为直径
  floor: {
    color: HexColor;
    roughness: number;
    metalness: number;
    reflectivity?: number;
    emissive?: HexColor;
    pattern?: 'noise' | 'tile' | 'star' | 'wood' | 'marble';
  };
  ceiling:
    | { kind: 'solid'; color: HexColor; pattern?: 'plain' | 'star' | 'beam' }
    | { kind: 'skydome'; starCount?: number; nebula?: boolean }
    | { kind: 'open' };
  walls: { color: HexColor; roughness: number; metalness: number; pattern?: 'plain' | 'rune' | 'brick' | 'wood' };
  ambient: { color: HexColor; intensity: number };
  fog?: { color: HexColor; near: number; far: number };
  lighting: HallLightingConfig;
  particles: ParticleConfig;
  volumetricBeams: number; // 数量
  shelves: { count: number; pattern: 'grid' | 'arc' | 'ring' | 'floating' };
  centerProp: CenterPropConfig;
  audio: { ambientGain: number; reverb: 'cathedral' | 'wood' | 'crystal' | 'lab' | 'void' | 'modern' | 'none' };
  gravityFeel?: 'normal' | 'float';
  unlockCondition: UnlockCondition;
}

export interface HallLightingConfig {
  hemisphere?: { intensity: number };
  directional?: { color: HexColor; intensity: number; shadow: boolean };
  spots: Array<{ color: HexColor; intensity: number; position: Vec3; angle: number; distance: number }>;
  pointLights: Array<{ color: HexColor; intensity: number; position: Vec3; distance: number; flicker?: boolean }>;
  emissiveAccents?: Array<{ position: Vec3; color: HexColor; intensity: number }>;
}

export interface ParticleConfig {
  dust: number;
  fireflies?: number;
  runes?: number;
  stars?: number;
  orbs?: number;
  pages?: number;
}

export interface CenterPropConfig {
  kind: 'crystal-ball' | 'ancient-tree' | 'crystal-cluster' | 'alchemy-stand' | 'void-portal' | 'lectern' | 'none';
  scale: number;
  emissive?: HexColor;
  rotation?: boolean;
  description?: string;
}

export type UnlockCondition =
  | { kind: 'always' }
  | { kind: 'themeBooks'; theme: BookTheme; count: number }
  | { kind: 'totalBooks'; count: number }
  | { kind: 'discovery' };

// ============================================================================
// 馆厅定义
// ============================================================================
export interface HallDefinition {
  id: HallId;
  name: { zh: string; en: string };
  description: string;
  themeColor: HexColor;
  accentColor: HexColor;
  parameters: HallVisualParams;
  shelfLayout: ShelfLayout[];
  subjects?: string[];
  switchThemeOnEnter?: ReadTheme;
}

export interface ShelfLayout {
  hallId: HallId;
  shelfId: string;
  position: Vec3;
  rotation: Vec3;
  category: string;
  categoryEn?: string;
  capacity: number;
  theme: BookTheme;
  labelFont: ShelfLabelFont;
  level: number; // 1-N
}

// ============================================================================
// 书籍
// ============================================================================
export interface BookStub {
  id: UUID;
  title: string;
  author: string;
  introduction: string;
  coverColor: HexColor;
  coverTextureSeed: number;
  coverMaterial: 'leather' | 'cloth' | 'metal' | 'crystal' | 'paper';
  thickness: number;
  height: number;
  width: number;
  category: string;
  theme: BookTheme;
  location: {
    hallId: HallId;
    shelfId: string;
    slotIndex: number;
  };
  pulseColor?: HexColor; // 书脊呼吸光颜色
  generatedAt: EpochMs;
  isUserEdited: boolean;
  isHidden?: boolean;
  isCustom?: boolean; // 用户手动创建
  tags?: string[];
}

export interface TocEntry {
  index: number;
  title: string;
  startPage: number;
}

export interface PageContent {
  pageNumber: number;
  markdown: string;
  generatedAt: EpochMs;
  tokenCount: number;
  isLoading?: boolean;
  error?: string;
}

export type BookStatus = 'stub-only' | 'toc-generating' | 'toc-generated' | 'in-progress' | 'completed';

export interface BookContent {
  bookId: UUID;
  tableOfContents: TocEntry[];
  pages: Record<number, PageContent>;
  totalEstimatedPages: number;
  lastPageRead: number;
  lastReadAt: EpochMs;
  status: BookStatus;
  isCustomToc?: boolean;
}

// ============================================================================
// 用户数据
// ============================================================================
export interface Bookmark {
  id: UUID;
  bookId: UUID;
  pageNumber: number;
  label?: string;
  createdAt: EpochMs;
}

export interface ReadHistory {
  bookId: UUID;
  lastPage: number;
  lastReadAt: EpochMs;
  readingTimeMs: number;
  completionRatio: number;
}

export interface ProgressState {
  unlockedHalls: HallId[];
  discoveredHalls: HallId[];
  themeReadCounts: Record<BookTheme, number>;
  totalBooksRead: number;
  totalBooksCompleted: number;
  totalPagesRead: number;
}

export interface UserSettings {
  api: {
    baseUrl: string;
    apiKeyEncrypted?: string;
    model: string;
    temperature: number;
    streamEnabled: boolean;
  };
  visuals: {
    enableBloom: boolean;
    enableVolumetric: boolean;
    enableParticles: boolean;
    enableAnimations: boolean;
    qualityPreset: QualityPreset;
    fov: number;
  };
  audio: {
    master: number;
    ambient: number;
    sfx: number;
    muted: boolean;
  };
  gameplay: {
    timeSystemEnabled: boolean;
    currentTimeOfDay: number;
    weather: Weather;
    readTheme: ReadTheme;
    showTutorials: boolean;
  };
  ui: {
    minimapScale: number;
    reducedMotion: boolean;
    highContrast: boolean;
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  };
}

export interface PlayerState {
  hallId: HallId;
  position: Vec3;
  yaw: number;
  pitch: number;
  fov: number;
  isReading: boolean;
  isPointerLocked: boolean;
  isRunning: boolean;
}

// ============================================================================
// 事件
// ============================================================================
export type AppEvent =
  | { type: 'book/hover'; bookId: UUID }
  | { type: 'book/select'; bookId: UUID }
  | { type: 'book/open'; bookId: UUID }
  | { type: 'book/close'; bookId: UUID }
  | { type: 'book/page-turn'; bookId: UUID; direction: 'next' | 'prev'; page: number }
  | { type: 'crystal-ball/activate' }
  | { type: 'crystal-ball/select-book'; bookId: UUID }
  | { type: 'portal/enter'; fromHall: HallId; toHall: HallId }
  | { type: 'hall/unlock'; hallId: HallId }
  | { type: 'shelf/hover'; shelfId: string }
  | { type: 'notification'; level: 'info' | 'success' | 'warn' | 'error'; message: string; durationMs?: number }
  | { type: 'settings/change'; key: keyof UserSettings };

// ============================================================================
// 派生运行时类型
// ============================================================================
export interface RaycastTarget {
  type: 'book' | 'shelf' | 'crystal-ball' | 'portal' | 'shelf-label';
  id: string;
  data?: unknown;
}

export interface ShuffleSeed {
  seed: number;
}
