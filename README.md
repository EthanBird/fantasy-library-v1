# 异世界图书馆 · Fantasy Library 3D

> 一个第一人称可漫游的 3D 奇幻图书馆，配合 AI 无限生成书库。
> 基于参考项目 [EthanBird/fantasy-library-v0.1](https://github.com/EthanBird/fantasy-library-v0.1) 的 3D 沉浸式重制。

## ✨ 核心特性

- 🎮 **第一人称漫游**：WASD 移动 + 鼠标环视，Pointer Lock 控制
- 🏛️ **7 个主题馆厅**：中央大厅、古木回廊、星象台、水晶书阁、炼金密室、虚空深渊、现实之门
- 📚 **AI 驱动无限书库**：OpenAI 兼容 API，按位置懒加载、按页生成、预加载下一页
- 🔍 **水晶球搜索终端**：3D 化搜索 UI，光点飞出引导到目标书架
- 📖 **3D 卷页翻页 + 全屏阅读模式**：含 Markdown + KaTeX 公式渲染
- 🎨 **程序化生成**：馆厅/书架/书脊/水晶球/符文全部参数化生成，零外部资产
- 🌌 **奇幻光影**：体积光、粒子（尘埃/萤火虫/符文/星点）、后处理 Bloom + ColorGrade
- 🔊 **空间音效**：Web Audio API + 距离衰减，各馆厅独立环境音
- 🗄️ **完全本地**：IndexedDB + LocalStorage，支持导入/导出整个图书馆
- 🌓 **馆厅解锁机制**：阅读主题书达到阈值解锁新厅
- ⏰ **昼夜/天气循环**：窗外景色与室内光色联动

## 🚀 快速开始

```bash
# 安装依赖（需要 Node.js 18+）
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:5173
```

> 首次启动会进入**演示模式**（无需 API Key），可以体验所有视觉效果。
> 配置 API：进入右上角设置 → 填入 `baseUrl` / `apiKey` / `model`，即可解锁 AI 书目生成。

## ⌨️ 快捷键

| 按键 | 行为 |
| --- | --- |
| `WASD` / 方向键 | 移动 |
| 鼠标 | 视角环视（需先点击屏幕激活 Pointer Lock） |
| `Shift` | 跑步 |
| `E` | 交互（取书/激活水晶球/进入拱门） |
| `Esc` | 释放鼠标 / 关闭模态 |
| `Tab` | 开关小地图放大 |
| `B` | 书签面板 |
| `M` | 小地图全屏 |
| `Space` | 翻页（阅读模式） |
| `←` / `→` | 翻页（阅读模式） |

## 🏗️ 项目结构

```
src/
├── main.tsx, App.tsx        # 入口
├── types/                    # 全局类型
├── data/                     # 静态数据（halls/themes/unlock）
├── stores/                   # Zustand stores
├── lib/
│   ├── storage/             # IndexedDB 封装
│   ├── ai/                  # AI Service + Prompts
│   ├── controls/            # PointerLockControls + 碰撞
│   ├── procgen/             # 程序化几何（地板/墙/书架/书/水晶/粒子/体积光）
│   ├── audio/               # 空间音频引擎
│   ├── perf/                # 性能检测与分级
│   ├── time/                # 昼夜系统
│   └── utils/               # 工具函数
├── components/
│   ├── canvas/              # R3F 场景内组件
│   │   ├── Hall/            # 馆厅（含 7 个具体厅）
│   │   ├── Shelf/           # 书架
│   │   ├── Book/            # 书籍
│   │   ├── Lighting/        # 灯光
│   │   ├── Particle/        # 粒子
│   │   ├── PostFX/          # 后处理
│   │   ├── Sky/             # 天空穹顶
│   │   └── Interactables/   # 水晶球/拱门
│   ├── hud/                 # 屏幕 2D 层
│   └── modals/              # 模态面板
└── styles/                  # 全局样式
```

## 🛠️ 技术栈

- **渲染**：Three.js 0.164 + React Three Fiber 8 + Drei 9
- **UI**：React 18 + TypeScript 5
- **状态**：Zustand 4
- **后处理**：`postprocessing` 6
- **AI/Markdown**：OpenAI 兼容 API + react-markdown + KaTeX
- **存储**：IndexedDB (idb) + LocalStorage
- **构建**：Vite 5

## 📄 设计文档

完整设计文档见 [`docs/DESIGN.md`](./docs/DESIGN.md)。

## 📜 License

MIT
