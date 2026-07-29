# 异世界图书馆 · 3D 沉浸版 · 设计文档

> **代号**：`fantasy-library-3d`
> **基线参考**：[EthanBird/fantasy-library-v0.1](https://github.com/EthanBird/fantasy-library-v0.1)（HTML 静态 demo，2D 列表 + 翻页）
> **本文档定位**：本阶段仅做设计/规划，不写实现代码。后续按本文档 §10 的里程碑逐 Phase 落地。
> **版本**：v1.0（设计基线，2026-07-28）

---

## 目录

1. [项目概述与目标](#1-项目概述与目标)
2. [3D 场景架构设计](#2-3d-场景架构设计)
3. [馆厅系统设计](#3-馆厅系统设计)
4. [交互流程设计](#4-交互流程设计)
5. [数据模型设计](#5-数据模型设计)
6. [AI 生成管线设计](#6-ai-生成管线设计)
7. [性能策略](#7-性能策略)
8. [UI/UX 规范](#8-uiux-规范)
9. [技术选型与依赖清单](#9-技术选型与依赖清单)
10. [里程碑与开发计划](#10-里程碑与开发计划)
11. [附录 A：术语表](#附录-a术语表)
12. [附录 B：开放问题清单](#附录-b开放问题清单)

---

## 1. 项目概述与目标

### 1.1 一句话定位

> 把「无限 AI 生成书库」从 2D 平面升级为一个**第一人称可漫游的、奇幻主题的 3D 图书馆**，让阅读变成一次沉浸式探索。

### 1.2 背景

参考项目（v0.1）已实现以下核心机制：

- OpenAI 兼容 API 接入（URL / API Key / 模型可配置）
- 图书按虚拟位置懒加载（标题/简介层）
- 内容按页生成 + 预加载下一页
- 模糊搜索（≤3 本同主题同名结果）
- 书架/馆厅导航（已观测才可见）
- Markdown 渲染 + 公式（KaTeX）
- 手动分类、编辑简介/目录
- 现实世界图书馆入口（现代主题切换）
- 导入/导出整个图书馆
- LocalStorage 持久化

**问题**：v0.1 仍是 2D 列表 + 卡片式书架，缺乏"异世界"的画面冲击力和探索沉浸感；交互也偏静态。

### 1.3 目标（按优先级）

| 优先级 | 目标 | 验收标准 |
| --- | --- | --- |
| P0 | 第一人称 3D 漫游 + 奇幻氛围 | WASD + 鼠标环视通过；体积光/粒子/雾效可见；帧率 ≥45fps（中端笔电） |
| P0 | 6 馆厅 + 中央大厅可访问 | 用户能依次进入每个馆厅，视觉/听觉明显不同 |
| P0 | 全部 v0.1 功能可用 | AI 生成、按需加载、搜索、书签、历史、导入导出、Markdown+公式、主题切换、配置页全部保留并能用 |
| P1 | 取书/翻页/阅读动画 | 触发"飞出-展开-进入阅读"完整链路，3D 卷页翻动 |
| P1 | 空间音效 | 不同馆厅环境音 + 距离衰减 |
| P1 | 馆厅解锁机制 | 解锁条件可被触达；进度可读 |
| P2 | 水晶球搜索终端 | 走近触发 3D 化搜索 UI；光点引导到书架 |
| P2 | 时间系统（昼夜/天气） | 开关可见地改变窗外/室内光色 |

### 1.4 非目标（本期不做）

- 多人联机 / 实时同步
- 移动端原生 App（仅响应式 Web，移动端做"基础可读"，不做完整漫游）
- 商业级电影化剧情、过场动画
- 上传/上传/管理 3D 模型（所有几何体走程序化生成）
- 复杂室内物理（碰撞只做"不可穿墙 + 不可穿过书架"两层）

### 1.5 关键设计原则

1. **沉浸感优先，但浏览器可跑**——不堆全路径追踪、不堆 8K 贴图；所有效果能在中端 GPU（GTX 1060 / M1）上 60fps 或 30fps 稳定运行。
2. **程序化优先**——馆厅建筑、书架、书脊、符文均程序化生成（PBR 材质 + 噪声纹理 + 几何组合），杜绝外部 .glb/.fbx 依赖。
3. **生成与渲染解耦**——AI 文本生成是异步后台任务，前端渲染不阻塞；网络/AI 故障时降级到本地占位文本 + UI 提示。
4. **数据本地优先**——默认所有用户数据存本地（IndexedDB + LocalStorage），不引入后端。
5. **优雅降级**——WebGL2 不支持时给出"建议更换浏览器"；Web Audio API 不可用时静音。

---

## 2. 3D 场景架构设计

### 2.1 总体系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                            │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  React UI    │◄──►│  Zustand Stores  │◄──►│  R3F / Three  │  │
│  │  (HUD/Modal) │    │  (状态中心)      │    │  (3D 渲染层)  │  │
│  └──────┬───────┘    └────────┬─────────┘    └───────┬───────┘  │
│         │                     │                      │          │
│         │              ┌──────▼──────┐               │          │
│         │              │  事件总线   │               │          │
│         │              │  (EventBus) │               │          │
│         │              └──────┬──────┘               │          │
│         │                     │                      │          │
│  ┌──────▼─────────────────────▼──────────────────────▼───────┐  │
│  │                    Service Layer                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ AIService│ │BookStore │ │HallLoader│ │AudioEngine │  │  │
│  │  │ (流式)   │ │(IDB/LSS) │ │(场景装配)│ │(空间音)    │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │  │
│  └───────┼────────────┼────────────┼─────────────┼─────────┘  │
│          │            │            │             │             │
│  ┌───────▼────────────▼────────────▼─────────────▼─────────┐  │
│  │   Storage / External                                       │  │
│  │   - IndexedDB (书籍内容/缓存)                              │  │
│  │   - LocalStorage (用户配置/进度/解锁)                      │  │
│  │   - OpenAI 兼容 API (远端)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 组件树

```
<App>
├── <BootGate>            // 启动门：WebGL 检测、配置加载、初始 Hall 装载
│   ├── <LoadingScreen>   // 启动加载遮罩
│   └── <IntroFadeIn>
├── <Canvas>              // R3F Canvas，全屏
│   ├── <PerspectiveCamera> + <Controls>  // 第一人称控制器
│   ├── <LightingSystem>  // 全部光源（见 §3.2 灯光组件）
│   ├── <EffectComposer>  // 后处理（Bloom / DOF / Volumetric / ColorGrade）
│   ├── <AudioListener>   // 跟随相机
│   └── <HallManager>     // 当前激活馆厅
│       ├── <HallGeometries>  // 墙体、地板、天花板、拱门
│       ├── <ShelfCloud>      // 当前厅内所有书架（按可见性剔除）
│       ├── <Bookshelf>×N     // 单个书架（见 §2.4 组件结构）
│       │   ├── <Frame>
│       │   ├── <ShelfBoard>×K
│       │   ├── <BookSpine>×N    // 每本书的 3D 表现
│       │   └── <ShelfLabel>     // 悬停分类标签
│       ├── <Interactables>      // 水晶球、传送门、符文等
│       ├── <ParticleField>      // 尘埃/萤火虫/星光/符文
│       ├── <EnvironmentSky>     // 穹顶/窗外天空盒
│       └── <PortalToHall>×N     // 通向其他馆厅的拱门
├── <HUD>                 // 屏幕空间 2D 覆盖
│   ├── <Compass>         // 罗盘 + 小地图
│   ├── <Crosshair>       // 中心十字
│   ├── <InteractionHint> // "按 E 取书"
│   ├── <TimeOfDay>       // 昼夜指示
│   ├── <AudioToggle>     // 静音按钮
│   └── <SettingsButton>  // 打开设置
├── <ModalLayer>          // 模态层
│   ├── <BookReader>      // 全屏阅读（双页 + 翻页动画）
│   ├── <SearchTerminal>  // 水晶球触发的搜索面板
│   ├── <SettingsPanel>   // API/视觉/音频配置
│   ├── <ImportExportDialog>
│   ├── <BookmarksPanel>
│   ├── <HistoryPanel>
│   └── <CategoryEditor>
└── <DevOverlay>          // 开发模式下的调试信息（FPS、当前 Hall、相机位姿）
```

### 2.3 数据流图

```
                   ┌─────────────────────────────┐
                   │   User Input (Keyboard/     │
                   │   Mouse / Pointer Lock)     │
                   └──────────────┬──────────────┘
                                  │ 事件
                                  ▼
                        ┌──────────────────┐
                        │    EventBus      │
                        │  (mitt 风格)     │
                        └──────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
  ┌──────────┐           ┌──────────┐          ┌──────────┐
  │Camera/   │           │Interaction│         │ Settings │
  │Controls  │           │  System   │         │  Store   │
  │ (写)     │           │  (派发)   │         │  (读)    │
  └────┬─────┘           └────┬──────┘         └────┬─────┘
       │                      │                     │
       ▼                      ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────────┐
│ Zustand      │    │ BookStore        │   │ AIService       │
│  - player    │◄──►│  - 加载/缓存/CRUD│◄─►│  - 流式补全      │
│  - hall      │    │  (IndexedDB)     │   │  (OpenAI 兼容)   │
│  - ui        │    └────────┬─────────┘   └────────┬─────────┘
│  - settings  │             │                      │
└──────┬───────┘             ▼                      ▼
       │              ┌──────────────┐       ┌──────────────┐
       │              │ R3F <Book>   │       │  Page Cache  │
       │              │  视觉表现层  │       │  (LSS+IDB)   │
       │              └──────────────┘       └──────────────┘
       ▼
┌──────────────────┐
│  React UI 层     │
│  (HUD / Modal)   │
│  仅订阅需要的    │
│  store slice     │
└──────────────────┘
```

关键约定：
- **Store 是唯一状态源**；3D 场景不直接持有业务状态，只把 store 投影到视觉。
- **EventBus 用于一次性事件**（如「书被翻开」「水晶球被激活」），避免轮询。
- **AI 是异步副作用**，通过 store action 触发，组件通过 `useStore(selector)` 订阅加载/完成状态。

### 2.4 3D 场景层级结构（Scene Graph）

```
Scene
├── RenderGroup
│   ├── [Camera]  PerspectiveCamera (fov 70, near 0.1, far 200)
│   └── [Lights]
│       ├── HemisphereLight (天光, 0.15 intensity)
│       ├── DirectionalLight × N (按 Hall 配置, shadow map 2048)
│       ├── SpotLight × N (水晶球、聚焦灯, 阴影)
│       └── PointLight × N (书脊呼吸光, no shadow)
├── HallRoot (active)
│   ├── [Skybox / Skydome]            (穹顶或天空盒)
│   ├── [Floor]                        (程序化地板, 100x100 plane)
│   ├── [Architecture]
│   │   ├── Walls
│   │   ├── Pillars
│   │   ├── Archways (Portal × N)
│   │   ├── Ceiling
│   │   └── Decorations (Rune/Vine/Chain)
│   ├── [CenterProp]                   (水晶球 / 古树 / 水晶棱柱)
│   ├── [ShelfCloud]
│   │   └── Shelf[0..N]
│   │       ├── Frame                   (CylinderGeometry + BoxGeometry 组合)
│   │       ├── Board[0..K]
│   │       └── Book[0..M]
│   │           ├── Spine               (BoxGeometry + 程序化纹理)
│   │           ├── Cover               (PlaneGeometry, PBR)
│   │           ├── TitleDecal          (CanvasTexture, 动态生成)
│   │           └── PulseGlow           (PointLight 弱光, 脉动)
│   ├── [ParticleField]
│   │   ├── DustField                  (Points + 自定义 shader)
│   │   ├── Fireflies / Runes / Stars  (InstancedMesh)
│   │   └── MagicOrbs                  (沿轨道漂浮)
│   ├── [VolumetricBeams]              (ConeGeometry + 自定义 shader)
│   └── [EnvironmentProps]             (桌椅、烛台、符文柱等)
├── EffectComposer
│   ├── RenderPass
│   ├── UnrealBloomPass (threshold 0.6, strength 0.7, radius 0.4)
│   ├── BokehPass (DOF, 仅阅读时开启)
│   ├── ColorCorrectionPass (按 Hall 主题调色)
│   └── FXAAPass / SMAAPass
└── AudioListener (跟随 Camera)
```

### 2.5 渲染管线

| 阶段 | 选型 | 说明 |
| --- | --- | --- |
| 场景图 | Three.js Scene + R3F | 用 R3F 是为了和 React 状态对齐；纯渲染密集部分可用原生 Three 写 imperative 优化 |
| 控制器 | `PointerLockControls`（自写） | 自带 WASD + 鼠标环视 + 碰撞检测 |
| 后处理 | `postprocessing` 库 | 链式 composer 性能优于 three/examples 原生 |
| 阴影 | PCFSoftShadow | 主光 2048，移动光 1024 |
| 物理/碰撞 | 自写（OBB + AABB） | 不引入 cannon/rapier，碰撞需求简单 |
| 文字纹理 | `CanvasTexture` 离屏 | 标题/标签文字渲染到 2D canvas 再贴到 3D plane |
| 资产 | 全部程序化 | 无外部模型；无 HDR（用 `RoomEnvironment` + 自调色调代替 HDR IBL） |

### 2.6 输入与控制

| 输入 | 行为 | 备注 |
| --- | --- | --- |
| `WASD` / 方向键 | 平移 | 持续按住加速；最大 5 m/s |
| 鼠标 | 视角环视 | 需先点击屏幕激活 pointer lock |
| 鼠标滚轮 | 调整 FOV（55°-85°） | 非缩放，避免移动端体验割裂 |
| `Shift`（按住） | 跑步 ×1.6 | 显示喘息/脚步加速音效 |
| `E` | 交互（取书/激活水晶球/进入拱门） | 范围内高亮目标显示提示 |
| `Tab` | 开关小地图/罗盘放大 |
| `Esc` | 释放 pointer lock / 关闭 Modal |
| `F` | 飞页 / 快速翻到下一章 |
| `B` | 打开书签面板 |
| `M` | 打开小地图全屏 |
| `H` | 历史记录 |

---

## 3. 馆厅系统设计

### 3.1 馆厅全景

| ID | 名称 | 主色（HEX） | 氛围关键词 | 默认解锁 | 主题门类 |
| --- | --- | --- | --- | --- | --- |
| `central` | 中央大厅 | `#1a1430 → #3b2f6b` | 星穹、悬浮水晶、暖色聚光 | ✅ | 全局（搜索/传送/导航） |
| `wood` | 古木回廊 | `#3a2a18 → #6b4a25` | 暖棕、藤蔓、萤火虫、嘎吱声 | ✅ | 古典/历史/游记/奇幻冒险 |
| `astro` | 星象台 | `#0a1840 → #2a3a7a` | 深蓝、弧形书架、星图地面 | 🔒 阅读 5 本奇幻书 | 占星/神秘学/魔法理论/数学/几何 |
| `crystal` | 水晶书阁 | `#d8e8f0 → #a0c0d0` | 冷白、折射、晶莹回响 | 🔒 阅读 3 本神秘学 | 纯理论/工程/科学方法/学术 |
| `alchemy` | 炼金密室 | `#1a3024 → #4a6840` | 暗绿、铜金、烧瓶、蒸汽 | 🔒 阅读 3 本魔法书 | 炼金/药学/化学/生物/毒理 |
| `void` | 虚空深渊 | `#100018 → #2a0040` | 暗紫黑、悬浮、星辰碎片 | 🔒 阅读 5 本哲学 | 哲学/宗教/形而上学/死亡学/玄学 |
| `real` | 现实之门 | `#f5f5f7 → #dcdce0` | 现代学院、明亮、留白 | ✅（始终可达） | 数学/物理/化学/生物/CS/文学/历史/哲学/经济/法学/医学/工程/小说/诗歌/论文 |

> 6 个主题馆厅（不含中央大厅和现实之门）严格对齐用户需求 §3.2 的"初始 6 个"。
> 现实之门**始终可达**，可作为"对世界开放的入口"。

### 3.2 馆厅视觉参数表

下表是**程序化生成所需的关键参数**，每条都是代码里可以直接读出来的常量。

#### 3.2.1 中央大厅（Central Atrium）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 圆形，半径 18 m |
| `floor.material` | 大理石 PBR（procedural noise），反射率 0.6，粗糙度 0.3 |
| `ceiling` | 星空穹顶（半径 30 m，shader 渲染深空星点） |
| `wall.material` | 深色石墙，粗糙度 0.85 |
| `ambient.color` | `#3a3060` |
| `ambient.intensity` | 0.25 |
| `directional` | 顶部天窗倾泻，方向 `vec3(0, -1, 0.2)`，强度 1.2，色 `#fff5e0` |
| `spotlights` | 6 盏环形排列，聚焦中央水晶球 |
| `particles` | 缓慢下落的金粉 dust（80 颗） |
| `volumetric.beams` | 3 道从穹顶天窗斜射（cone 几何 + shader） |
| `fog` | 无 |
| `centerProp` | 水晶球（半径 1.2 m，折射材质，缓慢自转 + 公转） |
| `archways` | 6 扇，分别通向上述 6 个主题厅（5 锁 + 1 通向现实之门） |
| `audio.ambient` | 低频持续嗡鸣 + 远处风铃 |
| `audio.reverb` | 大教堂型 IR |
| `unlock` | 默认 |

#### 3.2.2 古木回廊（Ancient Wood Gallery）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 长方形 24×10 m，廊道结构，2 列立柱 |
| `floor.material` | 旧木板（高粗糙度，纹理 noise） |
| `ceiling` | 拱顶 + 横梁，可见上方藤蔓悬挂 |
| `wall.material` | 树皮肌理 |
| `ambient.color` | `#5a3a20` |
| `ambient.intensity` | 0.4 |
| `lighting` | 10 盏烛台 point light（暖黄 `#ffaa55`，半径 4 m） + 少量穿顶日光 |
| `shelves` | 巨大树木化身（每根 4 层架） |
| `particles` | 萤火虫（20 颗，黄绿，缓慢漂移） + 尘埃 |
| `volumetric.beams` | 2 道从破损屋顶洒入 |
| `vine.density` | 0.6（程序化藤蔓沿柱身螺旋） |
| `audio.ambient` | 木结构嘎吱 + 风声 + 远处鸟鸣 |
| `audio.reverb` | 木质中型厅堂 IR |
| `unlock` | 默认 |
| `shelfLabel.font` | 哥特体 Garamond-Italic |

#### 3.2.3 星象台（Astronomy Wing）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 圆形塔楼，半径 14 m，8 层向上收分（每层半径减 1 m） |
| `floor.material` | 深蓝大理石 + 内嵌星图（CanvasTexture 渲染星图，glow） |
| `ceiling` | 透明天穹，shader 渲染实时星空（与时间系统联动） |
| `wall.material` | 深色石材，带金线符文 |
| `ambient.color` | `#1a2a6a` |
| `ambient.intensity` | 0.3 |
| `lighting` | 中心大水晶球冷光 + 各塔窗边蓝白光 |
| `shelves` | 弧形靠墙书架，顺塔壁收分 |
| `particles` | 银白星点 200 颗（缓慢自转） + 蓝色符文 8 个（悬浮轨道） |
| `volumetric.beams` | 1 道中心向上贯穿全塔 |
| `audio.ambient` | 低频嗡鸣 + 钟声远响（每 12s 一次） |
| `audio.reverb` | 极长混响 IR（4s+） |
| `unlock` | 阅读 5 本奇幻类书 |
| `magicRunes` | 圆形轨道，半径 5m，漂浮旋转 |

#### 3.2.4 水晶书阁（Crystal Archive）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 多边形（八边形），半径 12 m |
| `floor.material` | 镜面白色地砖，反射率 0.9 |
| `ceiling` | 多面体几何，无明确"顶"，采光靠水晶柱 |
| `wall.material` | 透明/半透明水晶棱柱（多面），折射 IOR 1.45 |
| `ambient.color` | `#b0c8d8` |
| `ambient.intensity` | 0.5 |
| `lighting` | 内部嵌入水晶的发光（emissive）+ 顶部环形冷白灯 |
| `shelves` | 透明水晶棱柱柱体作为书架（每柱 5 层） |
| `particles` | 折射光斑（动态 cubemap reflection） + 漂浮微粒 50 |
| `volumetric.beams` | 中心冷白聚光 |
| `audio.ambient` | 清脆回响（玻璃质感）+ 高频铃声 |
| `audio.reverb` | 极长极高频反射 IR |
| `unlock` | 阅读 3 本神秘学/魔法理论 |
| `lensFlare` | 强（水晶柱引发） |

#### 3.2.5 炼金密室（Alchemy Chamber）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 不规则，约 16×14 m，多个隔间 |
| `floor.material` | 暗色石砖，缝隙发光（emissive） |
| `ceiling` | 工业拱顶，悬挂铜管和烧瓶 |
| `wall.material` | 铜绿金属 + 石墙 |
| `ambient.color` | `#2a4020` |
| `ambient.intensity` | 0.35 |
| `lighting` | 烧瓶发光（黄绿，emissive）+ 铜管反射光 |
| `shelves` | 金属管道 + 烧瓶陈列架 |
| `particles` | 蒸汽（半透明 noise volume，向上） + 绿色荧光液滴 20 |
| `volumetric.beams` | 3 道从顶部天窗 |
| `audio.ambient` | 烧瓶咕嘟 + 滴水 + 远处金属敲击 |
| `audio.reverb` | 中等混响 IR（潮湿） |
| `unlock` | 阅读 3 本魔法书 |
| `props` | 6-8 个发光烧瓶（程序化液体动画） |

#### 3.2.6 虚空深渊（Void Depths）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 悬浮结构，地板为半透明黑曜石（透出下方星云） |
| `floor.material` | 黑曜石 + 底部 nebula（深紫黑渐变 shader） |
| `ceiling` | 无（开放至星空） |
| `wall.material` | 无（结构柱悬浮） |
| `ambient.color` | `#1a0030` |
| `ambient.intensity` | 0.2 |
| `lighting` | 紫色 edge light + 远处星云反光 |
| `shelves` | 悬浮书架（无地面支撑，缓慢上下浮动） |
| `particles` | 紫色星尘 200 + 偶尔书页飘散 30 |
| `volumetric.beams` | 从天空斜射 4 道紫色光柱 |
| `audio.ambient` | 深空低频 + 远处呢喃（loop） |
| `audio.reverb` | 极长极深 |
| `unlock` | 阅读 5 本哲学/形而上学 |
| `gravity.feel` | 无（书架可微浮，相机轻微 bob） |

#### 3.2.7 现实之门（Real World Portal）

| 参数 | 值 |
| --- | --- |
| `roomShape` | 现代学院风格，矩形 20×14 m，落地窗 |
| `floor.material` | 浅木地板，反射率 0.4 |
| `ceiling` | 平顶，嵌入 LED 灯带 |
| `wall.material` | 白色 + 木色书架背板 |
| `ambient.color` | `#f0f0f0` |
| `ambient.intensity` | 0.7 |
| `lighting` | 落地窗天光 + LED 顶部均匀光 |
| `shelves` | 标准木质书架 30 座，分学科标签清晰 |
| `particles` | 极少量（尘埃 + 阳光体积光） |
| `volumetric.beams` | 2 道窗外射入 |
| `audio.ambient` | 现代静音（图书馆白噪音） |
| `audio.reverb` | 短 IR |
| `unlock` | 始终可达 |
| `subjects` | 数学/物理/化学/生物/CS/文学/历史/哲学/经济/法学/医学/工程/小说/诗歌/学术论文 |
| `theme.switch` | 切到现代浅色 UI（HUD 玻璃拟态 → Material 3 风格） |

### 3.3 馆厅程序化生成策略

每个馆厅由以下程序化模块组合生成（**不依赖任何外部模型文件**）：

| 模块 | 几何 | 材质 | 来源 |
| --- | --- | --- | --- |
| 地板 | `PlaneGeometry` + noise displacement | 程序化 PBR（贴图 CanvasTexture） | `@/lib/procgen/floor.ts` |
| 墙体 | `ExtrudeGeometry`（路径由参数化函数生成） | 程序化 | `@/lib/procgen/wall.ts` |
| 拱门 | `TorusGeometry` 段 + `BoxGeometry` 框 | 金属/石材 | `@/lib/procgen/arch.ts` |
| 立柱 | `CylinderGeometry` + 雕刻 noise | 大理石/木 | `@/lib/procgen/pillar.ts` |
| 书架 | `BoxGeometry` 组合 + 子 `Board` 网格 | 木材/金属/水晶 | `@/lib/procgen/shelf.ts` |
| 书籍 | `BoxGeometry`（不同 w/h/d） + 平面贴封面 | 皮革/布纹/金属/水晶 | `@/lib/procgen/book.ts` |
| 水晶球 | `IcosahedronGeometry`（细分 4） | MeshPhysicalMaterial（IOR 1.5, transmission） | `@/lib/procgen/sphere.ts` |
| 粒子 | `Points` + 自定义 shader | — | `@/lib/procgen/particles.ts` |
| 体积光 | `ConeGeometry` + 自定义 shader | — | `@/lib/procgen/volumetric.ts` |
| 符文 | `SpriteMaterial` + CanvasTexture | — | `@/lib/procgen/rune.ts` |

### 3.4 馆厅切换与边界

- 馆厅之间通过**拱门传送**（步行穿过 + 镜头快速淡出淡入到目标厅的入口）。
- 也可以通过**中央大厅水晶球**快速传送（直接 fade + load + spawn）。
- 切换时：
  - 卸载当前厅的 `InstancedMesh` 资源池到内存（不释放 GL 资源，下次回访复用）。
  - IndexedDB 中的书保持不变。
  - 当前馆厅 ID 与玩家位姿写入 `playerState` store。

---

## 4. 交互流程设计

### 4.1 总览

| 场景 | 主交互 | 触发条件 | 视觉/听觉反馈 |
| --- | --- | --- | --- |
| 漫游 | WASD + 鼠标 | 任何时候（pointer lock 后） | 脚步音（视地板材质） |
| 接近书架 | 显示分类标签 | 距离 < 3 m | 标签淡入 |
| 取书 | 走近 + 注视 + `E` | 注视书脊 + 距离 < 1.5 m | 书脊发光、飞出动画 |
| 阅读 | 全屏双页 | 取书后自动 | 翻页动画、键盘控制 |
| 翻页 | 鼠标拖拽 / 方向键 / `Space` | 阅读模式 | 3D 卷页 |
| 搜索 | 走近水晶球 + `E` | 中央大厅 | 水晶球亮起、UI 浮层 |
| 传送 | 水晶球内点选 | 搜索 UI | 拱门光效 + 渐变 |
| 解锁 | 满足条件 | 后台检测 | 通知 + 新拱门显形 |
| 设置 | HUD 按钮 | 任何时候 | 模态面板 |
| 导入/导出 | 设置面板 | — | 进度条 + Toast |

### 4.2 取书流程（最关键链路）

```
[Walking] ──走近+注视──> [Hover] ──E键──> [Selected]
   │                        │                 │
   │ <2m 触发               │ 高亮 + hint     │ 书脊脉动
   │                        │                 ▼
   │                        │            [Take-off] 飞出动画
   │                        │                 │ (0.8s)
   │                        │                 ▼
   │                        │            [Open]  镜头拉近
   │                        │                 │ (0.6s)
   │                        │                 ▼
   │                        │            [Reading Mode]
   │                        │                 │ 加载封面页 + 目录页
   │                        │                 │ 预加载 P1, P2
   │                        │                 ▼
   │                        │            [Paging] 翻页
   │                        │                 │ 预加载当前页 + 1, 2 页
   │                        │                 ▼
   │                        │            [Close] (Esc 或点 X)
   │                        │                 │ 镜头拉远
   │                        │                 │ 飞回书架归位
   │                        │                 ▼
   │                        │            [Walking] 回到原位
```

### 4.3 阅读模式

- **进入**：淡入到全屏 2D 覆盖层（背景是当前馆厅的高斯模糊渲染纹理），上层是双页书籍。
- **双页视图**：左页 = 当前页，右页 = 当前页 + 1（奇数页在右）。或者更接近真实书籍：左偶右奇。
- **翻页**：
  - 鼠标按住左键从书脊方向拖动 → 3D 卷页（用 R3F + 自定义 shader 实现，或 `react-pageflip`）。
  - 键盘 `←` / `→` / `Space`。
  - 触屏滑动。
- **目录**：左侧抽屉式侧栏（可隐藏），可点击跳转。
- **书签**：右上角图标，点击当前页加书签。
- **阅读进度**：自动写入 store + IndexedDB。
- **预加载**：当前页渲染完成后，后台请求 P+1、P+2（已经在 §6 详述）。
- **关闭**：回到第一视角，相机位姿平滑过渡到阅读前的位置。

### 4.4 搜索流程（水晶球）

```
走近水晶球 (distance < 2m)
  │
  ├── 注视 + E
  │     ▼
  │  触发 <SearchTerminal> 浮层（玻璃质感，悬浮在水晶球前）
  │     │
  │     ▼
  │  输入关键词
  │     │
  │     ▼
  │  AIService.searchBooks(query)
  │     │  返回 ≤3 本匹配的 BookStub
  │     │  （含 id/title/introduction/position/cover）
  │     ▼
  │  水晶球内显示 3 个光点（旋转星座动画）
  │     │
  │     ▼
  │  点击光点 / 浮层列表项
  │     │
  │     ▼
  │  选中书的 light point 飞出水晶球
  │     │
  │     ▼
  │  触发 [Guide-to-Shelf] 流程
  │     │  - 若目标馆厅已解锁：自动传送 + 路径指示
  │     │  - 若未解锁：提示解锁条件
```

### 4.5 传送流程

- **自动触发**：搜索选中后。
- **手动触发**：HUD 罗盘点击已发现馆厅。
- **动画**：
  1. 屏幕 0.3s 渐黑（中央书页粒子向中心收拢）。
  2. 0.3s 黑屏（加载目标厅）。
  3. 0.3s 渐显（粒子向四周散开），玩家出现在目标厅入口。
- **取消**：传送动画期间按 `Esc` 不取消（避免半途卡死），但**移动出当前提示区**可中断（保留位置）。

### 4.6 馆厅解锁流程

```
阅读完成某主题书 (book.read.complete)
  │
  ├── BookStore.completeBook(id)
  │     │
  │     ▼
  │  检查 unlockTable 中各厅的进度
  │     │  例如：unlockTable.alchemy = {required: 'magic', count: 3, current: 0..n}
  │     │
  │     ▼
  │  若达到阈值，触发 HallUnlock 事件
  │     │
  │     ▼
  │  通知 (Toast + 音效)
  │     │
  │     ▼
  │  中央大厅对应拱门显形（未解锁前拱门显示黑雾+符文锁）
  │     │
  │     ▼
  │  玩家可穿越进入
```

---

## 5. 数据模型设计

### 5.1 实体模型

```ts
// === 用户相关 ===
type UserId = 'local';                 // 单用户（暂不支持多用户）

interface UserSettings {
  api: {
    baseUrl: string;                   // OpenAI 兼容
    apiKey: string;                    // 加密存（见 §5.3）
    model: string;                     // 默认模型
    temperature: number;               // 0.0–1.0
    streamEnabled: boolean;
  };
  visuals: {
    enableBloom: boolean;
    enableVolumetric: boolean;
    enableParticles: boolean;
    enableAnimations: boolean;
    qualityPreset: 'low' | 'mid' | 'high' | 'ultra';
    fov: number;                       // 55–85
  };
  audio: {
    master: number;                    // 0–1
    ambient: number;
    sfx: number;
    muted: boolean;
  };
  gameplay: {
    timeSystemEnabled: boolean;
    currentTimeOfDay: number;          // 0–24
    weather: 'clear' | 'rain' | 'snow' | 'fog';
    unlockedHalls: HallId[];
    readTheme: 'fantasy' | 'real';
  };
  ui: {
    minimapScale: number;
    showTutorials: boolean;
  };
}

// === 馆厅相关 ===
type HallId =
  | 'central' | 'wood' | 'astro'
  | 'crystal' | 'alchemy' | 'void' | 'real';

interface HallDefinition {
  id: HallId;
  name: { zh: string; en: string };
  themeColor: string;
  unlockCondition?: UnlockCondition;
  parameters: HallVisualParams;          // 见 §3.2
  shelfLayout: ShelfLayout[];
}

type UnlockCondition =
  | { kind: 'always' }
  | { kind: 'themeBooks'; theme: BookTheme; count: number }
  | { kind: 'totalBooks'; count: number };

interface ShelfLayout {
  hallId: HallId;
  shelfId: string;                      // 'A-1' 形式
  position: [number, number, number];   // 相对厅中心
  rotation: [number, number, number];
  category: string;                     // 分类名（哥特体显示）
  capacity: number;                     // 30-60
  theme: BookTheme;
  labelFont: 'gothic' | 'sans' | 'mono';
}

// === 书籍相关 ===
type BookTheme =
  | 'fantasy' | 'history' | 'mystery' | 'magic'
  | 'philosophy' | 'science' | 'engineering' | 'medicine'
  | 'literature' | 'poetry' | 'thesis'
  | 'math' | 'physics' | 'chemistry' | 'biology' | 'cs'
  | 'economics' | 'law' | 'general';

interface BookStub {
  id: string;                           // uuid
  title: string;
  author: string;
  introduction: string;                 // 2-4 句简介
  coverColor: string;                   // '#3a2a18'
  coverTextureSeed: number;             // 程序化纹理种子
  thickness: number;                    // 0.04-0.10
  height: number;                       // 0.25-0.35
  width: number;                        // 0.15-0.22
  category: string;
  theme: BookTheme;
  location: {
    hallId: HallId;
    shelfId: string;
    slotIndex: number;                  // 架上第几格
  };
  generatedAt: number;                  // epoch ms
  isUserEdited: boolean;                // 用户是否编辑过简介/目录
}

interface BookContent {
  bookId: string;
  tableOfContents: TocEntry[];          // 第一页 = 目录
  pages: Record<number, PageContent>;   // 懒加载
  totalEstimatedPages: number;          // 估计总页数
  lastPageRead: number;
  lastReadAt: number;
  status: 'stub-only' | 'toc-generated' | 'in-progress' | 'completed';
}

interface TocEntry {
  index: number;
  title: string;
  startPage: number;                    // 估算起始页
}

interface PageContent {
  pageNumber: number;
  markdown: string;                     // 含 LaTeX
  generatedAt: number;
  tokenCount: number;                   // 估算
}

// === 阅读相关 ===
interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  label?: string;
  createdAt: number;
}

interface ReadHistory {
  bookId: string;
  lastPage: number;
  lastReadAt: number;
  readingTimeMs: number;
  completionRatio: number;              // 0-1
}

// === 解锁与进度 ===
interface ProgressState {
  unlockedHalls: HallId[];
  themeReadCounts: Record<BookTheme, number>;
  totalBooksRead: number;
  totalBooksReadToCompletion: number;
  discoveredHalls: HallId[];            // 走进过（与 unlocked 不同）
}

// === 玩家位姿 ===
interface PlayerState {
  hallId: HallId;
  position: [number, number, number];
  rotation: [number, number, number];   // yaw, pitch, roll
  fov: number;
  isReading: boolean;
  isPointerLocked: boolean;
}
```

### 5.2 存储分层

| 层 | 用途 | 容量上限 | 生命周期 |
| --- | --- | --- | --- |
| **LocalStorage** | `UserSettings`、`ProgressState`、玩家位姿快照、UI 偏好 | ~5 MB | 长期 |
| **IndexedDB** | `BookStub[]`、`BookContent[]`（含页面 markdown）、`Bookmark[]`、`ReadHistory[]`、导入/导出快照 | 浏览器配额（典型数百 MB） | 长期 |
| **内存** | 当前 Hall 内的书脊 InstancedMesh 数据、纹理缓存、当前阅读页 | 与 RAM 挂钩 | 会话 |
| **Service Worker Cache** | 静态资源（程序化则不需） | — | 长期 |

> **关键设计**：所有数据本地化。无后端。导入/导出即"整个 IDB 库的 JSON 序列化（含压缩）"。

#### 5.2.1 IndexedDB 表结构

| Store | Key | Indexes | 说明 |
| --- | --- | --- | --- |
| `bookStubs` | `id` | `theme`, `location.hallId`, `category`, `title` | 仅元数据 + 位置 |
| `bookContents` | `bookId` | `status`, `lastReadAt` | 内容懒加载 |
| `bookmarks` | `id` | `bookId`, `createdAt` | 书签 |
| `readHistory` | `bookId` | `lastReadAt` | 阅读历史 |
| `imports` | `id` | `importedAt` | 导入快照（用于回滚） |
| `audioCache` | `key` | — | 空间音效 audiobuffer 缓存 |

### 5.3 敏感数据处理

- `apiKey` 不明文存 LocalStorage：用 Web Crypto API（PBKDF2 + AES-GCM）加密，密钥从浏览器特征指纹派生或用户输入密码。
- 导入导出时 API Key **不**包含在导出包中（让用户重新填）。

### 5.4 数据生命周期

- 重新整理书架时（用户操作）：软删 → 30 天后清理。
- 导出：JSON（含所有 stubs、contents、bookmarks、history）+ ZIP 压缩。
- 导入：覆盖或合并（用户选择）。

---

## 6. AI 生成管线设计

### 6.1 触发矩阵

| 触发点 | 动作 | 必填输入 | 输出 |
| --- | --- | --- | --- |
| 玩家走进新馆厅 | 懒加载该厅前 12 个 stub | hallId, theme | 12 个 BookStub |
| 玩家注视书脊 | 抓取该书 stub | shelfId, slotIndex | 1 个 BookStub |
| 玩家点搜索 | 搜索 + 顺带生成 | query | ≤3 个 BookStub |
| 玩家翻开书 | 加载 + 生成第一页 | stub | PageContent(0=封面) + PageContent(1=目录) |
| 玩家阅读当前页 P | 后台预加载 P+1, P+2 | P 内容 | PageContent(P+1), PageContent(P+2) |
| 玩家跳到目录条目 N | 直接生成 PageContent(N) | N, toc | PageContent(N) |
| 玩家编辑目录 | 重新生成对应页 | toc, bookId | 替换 Pages |

### 6.2 Prompt 模板

#### 6.2.1 BookStub 生成（位置懒加载）

```text
你是一个异世界图书馆的图书管理员。
当前玩家进入的馆厅是：{hallName}（主题：{theme}）。
请生成 {count} 本与该馆厅主题相符、彼此不重复的书。
每本书按 JSON 输出：
{
  "id": "uuid",
  "title": "完整书名（包含副标题或卷数）",
  "author": "虚构作者名",
  "introduction": "2-4 句话的简介，30-80 字",
  "category": "具体子分类",
  "theme": "fantasy|history|mystery|magic|philosophy|..."
}
要求：
- 标题富有奇幻感但不过度晦涩
- 简介含 1-2 个能让读者产生好奇的悬念点
- 输出纯 JSON 数组，不要额外说明
```

#### 6.2.2 TableOfContents 生成（开书时）

```text
你正在为一本奇幻图书馆中的书生成目录页。
书名：{title}
作者：{author}
简介：{introduction}
分类：{category}

请生成 8-14 章的目录，每章含：
- index: 章节序号
- title: 章节标题（4-20 字）
- startPage: 估算起始页（1, 8, 16, ... 递增）

输出 JSON 数组。第一章必须从"引子/序章/楔子"类型开始。
```

#### 6.2.3 PageContent 生成（翻页/预加载）

```text
你正在为这本奇幻书籍生成第 {pageNumber} 页：
书名：{title}
作者：{author}
分类：{category}
简介：{introduction}
目录：
{tocJson}
{previousPagesSummary}

要求：
1. 输出 Markdown 格式
2. 中间穿插 1-2 个 LaTeX 公式（如果适用，如魔法理论、工程等）
3. 本页约 300-500 字
4. 与前文连贯，结尾留 1-2 处悬念
5. 不要输出"第 X 页"或任何页码标识
6. 输出纯净 Markdown，不要用代码块包裹
```

#### 6.2.4 搜索 + 同名书生成

```text
用户搜索："{query}"
馆厅：{hallName}
已有同名书：{existingTitles}

请返回 ≤3 本与该关键词相关、但书名不同的书。
（同关键词 ≤3 本约束；如已存在某书名可继续生成其他变体）
按 BookStub JSON 格式输出。
```

### 6.3 流式响应

- 启用 `stream: true` 时使用 SSE / fetch stream。
- 阅读页加载时**优先用流式**（边生成边显示，体感快 30-50%）。
- stub / toc 用非流式（结构化 + 小）。
- 流式期间显示 "AI 正在撰写…" 进度条（按字符数估算）。
- 失败重试：3 次指数退避（1s, 2s, 4s），3 次后给本地占位 + Toast 提示。

### 6.4 缓存策略

- **BookContent.pages** 永久存 IDB（生成一次永不再生成）。
- **同主题的 stub** 跨馆厅缓存（生成过的同主题书可被复用）。
- **同 toc 的页面**用 prompt 模板 + toc 哈希作 LLM cache key（可选，依赖后端能力）。
- 客户端**不强制去重**：完全相同的 stub 允许出现（用户可手动合并）。

### 6.5 错误降级

| 场景 | 行为 |
| --- | --- |
| API Key 无效 | 设置页提示，禁用 AI 功能，进入"演示模式"（用本地静态文本） |
| 网络断开 | 当前生成任务排队，恢复后重试；不影响已生成内容 |
| 模型返回非 JSON | 强制解析 + 失败则用最后一次合法输出 |
| Token 超限 | 自动分块生成本页（前 300 字 + 后 200 字，2 次请求） |
| 单页生成失败 | 显示"魔法失灵…"占位文字 + 重试按钮 |

---

## 7. 性能策略

### 7.1 目标帧率与设备分级

| 档位 | 设备 | 目标帧率 | 后处理 | 阴影 |
| --- | --- | --- | --- | --- |
| Ultra | 桌面独显 RTX 3070+ | 60 | 全开 | 2048 PCF |
| High | M1 / GTX 1060 | 60 | Bloom + FXAA | 1024 PCF |
| Mid | 集显 / 低端独显 | 45 | Bloom 关 / FXAA | 512 |
| Low | 老旧 / 移动 | 30 | 全部简 | 关闭 |

> 默认检测 `detect-gpu` + 帧率自调（5 秒平均 < 30 fps → 降一档）。

### 7.2 渲染层优化

| 手段 | 实现 |
| --- | --- |
| **InstancedMesh** | 同一馆厅所有书脊用 1 个 instanced mesh（最多 600 实例），单 draw call |
| **LOD** | 远距离书架用低模（柱体 + 顶/底板），近 < 8m 切换到完整几何 |
| **视锥体剔除** | R3F `<Bvh>` + Three 自带 frustumCulled |
| **遮挡剔除** | 重要馆厅（如中央大厅）做简单 portal-based 剔除 |
| **纹理懒加载** | 封面纹理 4-8 张预生成，剩余用占位色 |
| **粒子上限** | 全局 ≤ 500 个粒子（按馆厅分配预算） |
| **后处理降级** | Mid 档禁用 Bokeh（只在阅读模式短暂启用） |
| **shadowMap 复用** | 移动光不投阴影；主光 2048 |
| **antialias** | MSAA 关，用 FXAA / SMAA 后处理代替 |
| **text 纹理** | CanvasTexture 离屏渲染，复用 atlas |

### 7.3 业务层优化

| 手段 | 实现 |
| --- | --- |
| **AI 请求合并** | 同一书 P+1 已在请求中时，不重复触发 |
| **预加载取消** | 用户跳页时取消未消费的预加载请求 |
| **IDB 索引** | 所有按 `bookId` / `theme` / `location.hallId` 走的查询都建索引 |
| **节流** | 玩家位姿保存：每 5s 最多一次 |
| **懒挂载** | 未解锁馆厅的 assets 不加载 |
| **资源回收** | 切换馆厅时已读书架的 detail 几何 dispose，但 InstancedMesh 保留 |

### 7.4 内存估算

- 单本书 P+1 PageContent：~2 KB（300-500 字 + markdown）
- 100 本书各 50 页 = 10 MB
- 600 个 instanced 书脊 + 4 个 LOD 等级 = ~5 MB GPU 显存
- 总内存预算：< 200 MB（含 1 个馆的 detail）

---

## 8. UI/UX 规范

### 8.1 设计语言

- **主题切换**：奇幻模式（暗色 + 哥特体 + 金色高亮）↔ 现实模式（浅色 + 无衬线 + 蓝色高亮）
- **配色**（奇幻）：
  - 主背景：半透明深紫黑 `rgba(20, 15, 35, 0.85)`
  - 主色：`#d4af37`（古金）
  - 辅色：`#8a6fd1`（魔法紫）
  - 文字：`#e8e4d8`（羊皮纸）
  - 危险/警告：`#c0504d`（暗红）
- **字体**：
  - 标题：Google Font `Cinzel`（哥特体） / `Noto Serif SC`
  - 正文：`EB Garamond` / `Noto Serif SC`
  - 代码/UI：`Inter` / `Noto Sans SC`

### 8.2 HUD 元素

| 元素 | 位置 | 行为 |
| --- | --- | --- |
| 十字准星 | 屏幕中心 | 5 px 圆点 + 1 px 描边；hover 到可交互对象时变金色 |
| 交互提示 | 准星下方 20px | "按 E 取书" 文字 + 交互对象名 |
| 罗盘 | 顶部 | 条状指南针；当前馆厅名 + 馆内目标（如水晶球、出口）箭头 |
| 小地图 | 右下角 | 200x200 px；显示当前馆厅俯视图 + 玩家点 + 书架点 |
| 时间/天气 | 左上角 | 当前 in-game 时间 + 天气图标；点击切换手动/自动 |
| 音频按钮 | 左下角 | 静音/调音 |
| 设置按钮 | 右上角 | 齿轮 |
| 通知/Toast | 屏幕中上 | 3s 自动消失；用于解锁/成就/错误 |

### 8.3 阅读模式

- **顶部条**：返回按钮（X / Esc） + 书名 + 当前页/总页 + 进度条
- **左侧抽屉**：目录（默认隐藏，点击展开；展开时占 30% 宽）
- **中央**：双页书籍视图
- **右侧边栏**：书签（点击展开）+ 阅读历史
- **底部**：翻页控制 + 设置（字号/主题/字体）

### 8.4 动效语言

| 场景 | 动效 | 时长 | 缓动 |
| --- | --- | --- | --- |
| 页面过渡 | 渐变 fade | 300ms | ease-in-out |
| 抽屉展开 | slide + fade | 250ms | ease-out |
| 翻页 | 3D 卷页 | 600ms | cubic-bezier(0.65, 0, 0.35, 1) |
| 取书飞出 | 抛物线 + 旋转 | 800ms | ease-in-out |
| 进入阅读 | 拉近 + 模糊 | 600ms | ease-out |
| 退出阅读 | 拉远 + 清晰 | 600ms | ease-in |
| 拱门传送 | 中心粒子收拢 | 300ms 渐黑 + 300ms 渐显 | — |
| 解锁 | 拱门黑雾消散 + 光芒 | 1200ms | ease-out |

### 8.5 无障碍

- **键盘全可达**：所有交互有对应快捷键。
- **可读性**：字号支持 ±2 档；高对比度模式；色弱友好配色。
- **减少动效**：遵循 `prefers-reduced-motion`，减少或关闭非必要动画。
- **屏幕阅读**：HUD 元素带 `aria-live`；模态打开时焦点捕获。
- **运动不适**：关闭 POV 抖动 / 跑步 bob / 暗角。

### 8.6 响应式

- **桌面（≥1280px）**：完整 3D 体验
- **平板（768-1280）**：3D 体验但 HUD 简化，部分交互降级（如无 pointer lock）
- **手机（<768）**：仅"基础可读"模式，2D 书架列表 + 全屏阅读（3D 暂时禁用，给提示"请使用桌面浏览器获得完整体验"）

---

## 9. 技术选型与依赖清单

### 9.1 技术栈总览

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 语言 | TypeScript 5.x | 类型安全；与 Three.js / R3F 生态完善 |
| 构建 | Vite 5.x | 快、HMR、原生 ESM、TS 一等公民 |
| UI 框架 | React 18 | 生态广；与 R3F 配合好 |
| 状态管理 | Zustand 4.x | 轻量、无 boilerplate、TS 友好 |
| 3D 核心 | Three.js 0.16x | 主流、稳定；可直接 imperative 优化 |
| 3D ↔ React | @react-three/fiber 8.x | 声明式 scene graph |
| 3D 辅助 | @react-three/drei 9.x | PointerLockControls / Environment / Html / Stats 等 |
| 后处理 | `postprocessing` 6.x | 高性能 composer |
| 路由 | React Router 6.x | Modal 路由化（可选） |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-katex` | 通用方案 |
| 公式 | KaTeX 0.16 | 比 MathJax 轻、快 |
| 持久化 | `idb` 8.x | IndexedDB 简单封装 |
| 加密 | Web Crypto API（原生） | 不引入 crypto-js |
| HTTP | 原生 `fetch` + AbortController | 流式支持好 |
| 工具 | `mitt` (event bus) / `nanoid` (id) / `dayjs` | 轻量 |
| 状态历史 | Zustand persist middleware | 自动同步 LS/IDB |
| 测试 | Vitest + React Testing Library + Playwright | 单元 + E2E |
| Lint/Format | ESLint + Prettier + lint-staged | 工程规范 |
| 提交规范 | Husky + commitlint | conventional commits |

### 9.2 目录结构（建议）

```
fantasy-library-3d/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── canvas/              # R3F 场景内组件
│   │   │   ├── Hall/
│   │   │   ├── Shelf/
│   │   │   ├── Book/
│   │   │   ├── Lighting/
│   │   │   ├── Particle/
│   │   │   └── Controls/
│   │   ├── hud/                 # 屏幕空间 UI
│   │   ├── modals/              # 阅读、搜索、设置等模态
│   │   └── dev/                 # 调试组件
│   ├── lib/
│   │   ├── procgen/             # 程序化生成（floor/wall/arch/...）
│   │   ├── audio/               # 空间音频引擎
│   │   ├── storage/             # IDB / LS 封装
│   │   ├── ai/                  # AIService + prompts
│   │   ├── controls/            # 自写相机/碰撞
│   │   ├── perf/                # FPS 监控、quality 切换
│   │   └── utils/
│   ├── stores/                  # Zustand stores
│   │   ├── playerStore.ts
│   │   ├── hallStore.ts
│   │   ├── bookStore.ts
│   │   ├── settingsStore.ts
│   │   └── uiStore.ts
│   ├── data/                    # 静态数据（馆厅参数、unlock table）
│   │   ├── halls.ts
│   │   ├── unlockTable.ts
│   │   └── themes.ts
│   ├── types/                   # 全局类型
│   ├── styles/                  # 全局 CSS / Tailwind 配置
│   └── workers/                 # Web Workers（AI 解析、IDB 迁移等）
├── docs/
│   ├── DESIGN.md                # 本文档
│   ├── API.md                   # AI Service 接口
│   ├── STORAGE.md               # 存储 schema
│   └── CONTRIBUTING.md
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 9.3 npm 依赖

**dependencies**

```jsonc
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.16.0",
  "@react-three/drei": "^9.96.0",
  "postprocessing": "^6.35.0",
  "zustand": "^4.5.0",
  "react-router-dom": "^6.22.0",
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-katex": "^7.0.0",
  "katex": "^0.16.9",
  "idb": "^8.0.0",
  "mitt": "^3.0.1",
  "nanoid": "^5.0.0",
  "dayjs": "^1.11.10"
}
```

**devDependencies**

```jsonc
{
  "typescript": "^5.4.0",
  "vite": "^5.2.0",
  "@vitejs/plugin-react": "^4.2.0",
  "vitest": "^1.4.0",
  "@testing-library/react": "^14.2.0",
  "@playwright/test": "^1.42.0",
  "eslint": "^8.57.0",
  "@typescript-eslint/parser": "^7.0.0",
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "prettier": "^3.2.0",
  "husky": "^9.0.0",
  "lint-staged": "^15.2.0",
  "@commitlint/cli": "^19.0.0",
  "@commitlint/config-conventional": "^19.0.0"
}
```

### 9.4 浏览器目标

- Chrome / Edge 110+（主目标）
- Firefox 110+
- Safari 16.4+（WebGL2 + WebGPU 退化兼容）
- 不支持 IE

---

## 10. 里程碑与开发计划

> 建议采用**小步快跑、每个 Phase 都有可演示 Demo**的策略。

### Phase 0：脚手架（1 周）

- [ ] Vite + React + TS 初始化
- [ ] 目录结构 + ESLint/Prettier/Husky 接入
- [ ] Zustand stores 占位
- [ ] 静态 IDB schema 创建
- [ ] 一个最小 Canvas（空白 + 立方体 + OrbitControls）确认 Three.js 通

**Demo 验收**：能 `npm run dev` 看到一个可旋转的立方体。

### Phase 1：第一人称漫游（2 周）

- [ ] PointerLockControls（自写）
- [ ] WASD + Shift 跑步
- [ ] 碰撞（OBB + 简易 AABB）
- [ ] 一个简单的"测试馆厅"（空房间 + 几根立柱 + 一盏灯）
- [ ] HUD 十字 + 准星 + 提示

**Demo 验收**：能在一个房间里自由走动、不穿墙，看到准星。

### Phase 2：6 馆厅 + 中央大厅（3 周）

- [ ] 程序化几何库（floor/wall/pillar/arch/shelf）
- [ ] 6 馆厅 + 中央大厅装配（不含书）
- [ ] 馆厅切换（拱门穿越 + fade）
- [ ] 馆厅解锁逻辑（先只做 unlockCondition：always）
- [ ] 现实之门主题切换

**Demo 验收**：能在 7 个馆厅之间切换，每个厅的视觉差异明显。

### Phase 3：书架 + 书籍 3D（2 周）

- [ ] 程序化书架（含 LOD）
- [ ] 程序化书脊（含 4 种材质、随机尺寸）
- [ ] CanvasTexture 书脊标题渲染
- [ ] InstancedMesh 渲染（单馆 ≤600 性能验证）
- [ ] 悬停分类标签

**Demo 验收**：进入任意馆厅能看到满满的书架，书脊上能看到 AI 生成的标题。

### Phase 4：AI 生成管线（2 周）

- [ ] AIService（流式 + 重试 + 降级）
- [ ] 4 类 Prompt 模板（stub/toc/page/search）
- [ ] BookStore（IDB 持久化 + 缓存）
- [ ] 走进新馆厅 → 懒加载 stub
- [ ] 搜索 + 同名 ≤3 本

**Demo 验收**：走进新厅能自动出现书；搜索"龙"能找到 3 本相关书。

### Phase 5：阅读模式（2 周）

- [ ] 全屏阅读 UI（双页 + 抽屉目录）
- [ ] 3D 卷页翻页（或 react-pageflip）
- [ ] 预加载 P+1/P+2
- [ ] 书签 + 阅读历史
- [ ] Markdown + KaTeX 渲染
- [ ] 手动分类 + 编辑简介/目录

**Demo 验收**：能翻开任意一本书，流畅阅读到末尾，目录可点击跳转。

### Phase 6：氛围系统（2 周）

- [ ] 灯光组件 + 馆厅主题色温
- [ ] 体积光（cone + shader）
- [ ] 粒子系统（dust/firefly/star/rune/orb）
- [ ] 后处理（Bloom + ColorGrade + FXAA）
- [ ] 时间系统（昼夜/天气 + 窗外景象）
- [ ] 空间音效（Web Audio + distance attenuation）
- [ ] 性能分级与自适应

**Demo 验收**：每个馆厅的"沉浸感"达标：能看到体积光飘过尘埃、听到该厅的环境音。

### Phase 7：水晶球 + 传送 + 寻路（1 周）

- [ ] 水晶球几何 + 自转 + 折射材质
- [ ] 走近触发 SearchTerminal UI
- [ ] 光点动画 + 选中飞出
- [ ] 传送动画（fade + 渐显）
- [ ] 小地图 + 罗盘（带已探索区域）

**Demo 验收**：能在中央大厅用搜索直接传送到目标馆厅。

### Phase 8：解锁 + 收尾（2 周）

- [ ] 完整 unlockCondition 接入
- [ ] 解锁通知 + 拱门显形动画
- [ ] 导入/导出
- [ ] 设置页 + 加密存储 API Key
- [ ] 性能调优 + 兼容性测试
- [ ] 文档完善（README、CONTRIBUTING、API/STORAGE 文档）
- [ ] Playwright E2E 关键链路

**Demo 验收**：完整流程可走通；导出后在新浏览器导入能恢复全部数据。

### 时间线

| Phase | 周期 | 累计 |
| --- | --- | --- |
| 0 | 1 周 | W1 |
| 1 | 2 周 | W3 |
| 2 | 3 周 | W6 |
| 3 | 2 周 | W8 |
| 4 | 2 周 | W10 |
| 5 | 2 周 | W12 |
| 6 | 2 周 | W14 |
| 7 | 1 周 | W15 |
| 8 | 2 周 | W17 |

**总周期约 17 周（≈4 个月）**，单人全职；2 人可缩到 ~10 周。

### 风险与备选

| 风险 | 触发条件 | 备选 |
| --- | --- | --- |
| Web 端 3D 性能不达标 | 中端机 < 30 fps | 降档 → 2.5D 倾斜视角（伪 3D） |
| AI 流式阅读体验慢 | 模型 RT > 5s | 改用非流式 + skeleton placeholder |
| 浏览器存储配额 | IDB 写入失败 | 提供导出提示 + LRU 清理 |
| 移动端无法 3D | 触屏漫游体验差 | 维持"基础可读"模式作为兜底 |
| OpenAI 接口兼容性 | 不同 provider 输出格式差异 | adapter 层隔离，JSON 解析用 zod 兜底 |

---

## 附录 A：术语表

| 术语 | 含义 |
| --- | --- |
| Hall | 馆厅，独立的 3D 空间单元 |
| Shelf | 书架，Hall 内陈列书籍的容器 |
| BookStub | 书籍的"轻量元数据"，不含具体页面内容 |
| BookContent | 书籍的具体内容（toc + pages） |
| PageContent | 单页内容（markdown） |
| TOC | Table of Contents，目录 |
| LOD | Level of Detail，远近不同精度 |
| IBL | Image-Based Lighting，图像光照（用环境贴图） |
| IOR | Index of Refraction，折射率 |
| HUD | Heads-Up Display，屏幕覆盖层 |
| PointerLock | 浏览器 API，鼠标锁定用于 FPS 控制 |
| RT | Round-Trip，往返延迟（生成模型时） |
| SSE | Server-Sent Events，AI 流式响应常用方式 |
| IDB | IndexedDB |
| LSS | LocalStorage |

## 附录 B：开放问题清单

> 以下问题在本阶段未拍板，开发时按默认推进，遇到再调整。

1. **多用户/账号系统**：本期不做；如需后续支持，store 已用 `UserId = 'local'` 预留。
2. **导入文件格式**：JSON vs ZIP（JSON 便于 diff，ZIP 便于压缩）。默认 JSON + base64 资源；可选 ZIP。
3. **多语言**：UI i18n、书籍生成是否要支持英文？默认中英双语 prompt 模板；UI 中英切换放 v2。
4. **离线模式**：是否支持无网络下纯本地？默认支持（已读内容完整可用，新内容需联网）。
5. **内容审查**：AI 生成可能越界，是否做客户端 prompt 过滤？默认不做（用户自负），仅提供"举报生成结果"按钮。
6. **阅读统计**：是否记录每本书的阅读时长？默认记录（用于 unlock 条件）。
7. **音效授权**：所有音效来源（CC0 / 自制 / 第三方授权）需在 v1 落地前定。
8. **现实之门主题切换的"边界"**：跨主题后，3D 场景是否完全替换（更现代/干净的几何）？默认是（独立 HallDefinition）。
9. **水晶球内可搜索的内容范围**：默认全库（所有 hall 的 stub 集合）。
10. **传送 vs 步行**：是否提供"步行距离过远则提示传送"？默认是（>30m 拱门距离）。

---

> **本文档变更记录**
>
> - 2026-07-28 v1.0 — 首版基线设计（基于参考项目 v0.1 + 用户需求）
