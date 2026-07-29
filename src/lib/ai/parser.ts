/**
 * 解析 AI 输出：剥离 markdown 包裹、提取 JSON
 */

export function extractJsonArray<T = any>(text: string): T[] {
  if (!text) return [];
  // 1. 去掉 ```json ... ``` 包裹
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) s = fence[1].trim();
  // 2. 找首个 [ 到末尾的 ]
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start === -1 || end === -1) return tryFallbackObjects(s);
  const slice = s.slice(start, end + 1);
  try {
    const arr = JSON.parse(slice);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return tryFallbackObjects(s);
  }
}

export function extractJsonObject<T = any>(text: string): T | null {
  if (!text) return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  const slice = s.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function tryFallbackObjects<T = any>(s: string): T[] {
  // 容错：尝试逐个解析对象
  const out: T[] = [];
  const re = /\{[\s\S]*?\}/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    try {
      out.push(JSON.parse(m[0]));
    } catch {/* skip */}
  }
  return out;
}

export function cleanMarkdown(text: string): string {
  if (!text) return '';
  let s = text.trim();
  // 去掉代码块
  s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  return s;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // 简单估算：英文 1 token ≈ 4 字符；中文 1 token ≈ 1.5 字符
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const other = text.length - cn;
  return Math.ceil(cn * 1.5 + other / 4);
}
