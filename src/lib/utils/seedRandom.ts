/**
 * 基于种子的伪随机数生成器 (Mulberry32)
 * 同样的 seed 永远产生同样的随机序列
 */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromString(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = (h ^ str.charCodeAt(i)) * 16777619;
  }
  return mulberry32(h >>> 0);
}

export function pickRandom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickRandomN<T>(arr: T[], n: number, rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function rangeRandom(min: number, max: number, rng: () => number = Math.random): number {
  return min + rng() * (max - min);
}

export function intRandom(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rangeRandom(min, max + 1, rng));
}
