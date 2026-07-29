import type { BookStub, BookTheme, HallId } from '@/types';

/**
 * 全部 AI 提示词模板
 * 关键约束：输出严格的 JSON（无 markdown 包裹、无解释），便于解析
 */

const SYSTEM_BASE = `你是一位服务于"异世界图书馆"的老图书管理员，馆中藏有无穷无尽的书，书籍由你依据读者所在馆厅与请求即时生成。
你的写作风格：富画面感、留白、隐喻、克制；不要使用现代网络用语；不要在内容中提及 AI、模型、提示词等元概念。`;

// ============================================================================
// 1. Stub 生成（位置懒加载）
// ============================================================================
export function buildStubPrompt(args: {
  hallName: string;
  hallTheme: string;
  count: number;
  existingTitles?: string[];
}): { system: string; user: string } {
  const { hallName, hallTheme, count, existingTitles = [] } = args;
  return {
    system: SYSTEM_BASE,
    user: `当前读者正步入馆厅：${hallName}（主题：${hallTheme}）。
请为他即时生成 ${count} 本与该馆厅主题契合、彼此不重复、富有奇幻气息的书。

${existingTitles.length ? `本馆已有同类书目（请避免完全相同的标题）：\n${existingTitles.slice(-20).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` : ''}
输出严格的 JSON 数组，不要使用 Markdown 代码块包裹，不要任何额外说明文字：
[
  {
    "title": "完整书名（包含副标题或卷数，长度 6-30 字）",
    "author": "虚构作者名（2-10 字，可含生僻字以增强异域感）",
    "introduction": "2-4 句简介，30-80 字，含 1-2 个悬念点",
    "category": "具体子分类（4-10 字）",
    "theme": "fantasy|history|mystery|magic|philosophy|science|engineering|medicine|literature|poetry|math|physics|chemistry|biology|cs|economics|law|general"
  }
]`,
  };
}

// ============================================================================
// 2. 目录生成
// ============================================================================
export function buildTocPrompt(args: {
  title: string;
  author: string;
  introduction: string;
  category: string;
  theme: BookTheme;
  totalPages?: number;
}): { system: string; user: string } {
  const { title, author, introduction, category, theme, totalPages = 80 } = args;
  return {
    system: SYSTEM_BASE,
    user: `请为下面这本书生成目录页（第一页将展示这份目录）：

书名：《${title}》
作者：${author}
分类：${category}
主题：${theme}
简介：${introduction}
估计总页数：${totalPages}

要求：
- 8-14 个章节（视书长而定）
- 第一章必须是"引子/序章/楔子"之类开场
- 章节名 4-20 字，富文学性
- 估算每章起始页（按总页数均匀分布，从 1 开始）

输出严格 JSON 数组（不要 Markdown 包裹）：
[
  {
    "index": 1,
    "title": "序章 · 章节名",
    "startPage": 1
  },
  ...
]`,
  };
}

// ============================================================================
// 3. 单页内容生成
// ============================================================================
export function buildPagePrompt(args: {
  title: string;
  author: string;
  category: string;
  theme: BookTheme;
  introduction: string;
  toc: { index: number; title: string; startPage: number }[];
  pageNumber: number;
  previousPagesSummary?: string;
  isFirstPage?: boolean;
  isTocPage?: boolean;
}): { system: string; user: string } {
  const { title, author, category, theme, introduction, toc, pageNumber, previousPagesSummary = '', isFirstPage = false, isTocPage = false } = args;

  if (isTocPage) {
    return {
      system: SYSTEM_BASE,
      user: `为《${title}》生成正式的目录页 Markdown。

书名：${title}
作者：${author}

要求：
- 以一级标题"目  录"或"# 目录"开头
- 列出以下章节（章名 + 估算起始页）：
${toc.map((t) => `  ${t.index}. ${t.title} … ${t.startPage}`).join('\n')}
- 格式美观，适合古书风格
- 仅输出 Markdown 内容，不要用代码块包裹`,
    };
  }

  return {
    system: SYSTEM_BASE,
    user: `请为下面这本书生成第 ${pageNumber} 页的内容：

书名：《${title}》
作者：${author}
分类：${category}
主题：${theme}
简介：${introduction}

目录：
${toc.map((t) => `第${t.index}章 ${t.title}（P${t.startPage}）`).join('\n')}

${previousPagesSummary ? `前文摘要：\n${previousPagesSummary}\n` : ''}要求：
1. 输出 Markdown 格式${isFirstPage ? '（这是第一页，可以是楔子或开场）' : ''}
2. 中间穿插 0-2 个 LaTeX 公式（如适用：魔法理论、工程学、科学类常含公式；用 $...$ 或 $$...$$）
3. 本页约 300-500 字
4. 与前文连贯，结尾留 1-2 处悬念或回味
5. 不要输出"第 X 页"或任何页码标识
6. 直接输出 Markdown 文字，不要用 \`\`\`markdown 包裹`,
  };
}

// ============================================================================
// 4. 搜索 + 同名书生成
// ============================================================================
export function buildSearchPrompt(args: {
  query: string;
  hallName: string;
  existingTitles?: string[];
  maxResults?: number;
}): { system: string; user: string } {
  const { query, hallName, existingTitles = [], maxResults = 3 } = args;
  return {
    system: SYSTEM_BASE,
    user: `用户正在馆厅"${hallName}"中搜索关键词："${query}"。

${existingTitles.length ? `该馆厅已有相关书（请避免重复）：\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` : ''}
请返回 ${maxResults} 本与该关键词相关、书名不同的书，按匹配度从高到低排序。

输出严格 JSON 数组：
[
  {
    "title": "完整书名",
    "author": "虚构作者名",
    "introduction": "2-4 句简介",
    "category": "子分类",
    "theme": "fantasy|history|mystery|magic|..."
  }
]`,
  };
}

// ============================================================================
// 5. 用户自定义分类的简介/目录重写
// ============================================================================
export function buildRewritePrompt(args: {
  field: 'introduction' | 'toc' | 'category' | 'title';
  current: string;
  userRequest: string;
  context: { title: string; author: string; category: string; theme: BookTheme };
}): { system: string; user: string } {
  const { field, current, userRequest, context } = args;
  return {
    system: SYSTEM_BASE,
    user: `用户希望修改一本书的"${field}"字段。

书名：《${context.title}》
作者：${context.author}
当前分类：${context.category}
当前主题：${context.theme}

当前${field}：
${current || '（空）'}

用户的要求：${userRequest}

请直接输出新的内容（不要任何解释、Markdown 包裹）：
${field === 'toc' ? `返回 JSON 数组：[{"index":1,"title":"...","startPage":1}, ...]` : ''}`,
  };
}

// ============================================================================
// 工具：根据主题映射
// ============================================================================
export function themePromptHint(theme: BookTheme): string {
  const map: Record<BookTheme, string> = {
    fantasy: '剑与魔法、异世界、英雄冒险',
    history: '编年体、考据、传记、史论',
    mystery: '占星、符咒、秘传、占卜',
    magic: '魔法理论、咒文、典籍、炼金',
    philosophy: '形而上学、伦理学、逻辑、美学',
    science: '自然哲学、实证、综述',
    engineering: '机械、土木、制造、工程学',
    medicine: '药理、解剖、临床、本草',
    literature: '小说、戏剧、散文、随笔',
    poetry: '诗集、词、赋、抒情',
    thesis: '学术论文、研究报告、综述',
    math: '代数、几何、分析、拓扑',
    physics: '力学、电磁、量子、相对',
    chemistry: '有机、无机、反应、材料',
    biology: '细胞、生态、遗传、生化',
    cs: '算法、系统、网络、AI',
    economics: '宏观、微观、金融、博弈',
    law: '法理、判例、规约、宪政',
    general: '通识、综合性、索引',
  };
  return map[theme] ?? map.general;
}
