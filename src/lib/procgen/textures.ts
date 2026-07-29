import * as THREE from 'three';
import { mulberry32 } from '@/lib/utils/seedRandom';

/**
 * 程序化生成 CanvasTexture
 * 全部用离屏 2D canvas 绘制，避免外部资源
 */

export function createNoiseCanvasTexture(
  size: number,
  baseColor: string,
  variation: number,
  contrast: number = 1,
  seed: number = 1,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rng = mulberry32(seed);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const r = rng() * variation;
    const g = rng() * variation;
    const b = rng() * variation;
    const a = 255;
    const idx = i * 4;
    img.data[idx] = Math.max(0, Math.min(255, (r * contrast + (1 - contrast / 2) * 255) | 0));
    img.data[idx + 1] = Math.max(0, Math.min(255, (g * contrast + (1 - contrast / 2) * 255) | 0));
    img.data[idx + 2] = Math.max(0, Math.min(255, (b * contrast + (1 - contrast / 2) * 255) | 0));
    img.data[idx + 3] = a;
  }
  ctx.putImageData(img, 0, 0);

  // 叠加 baseColor
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createMarbleTexture(size: number, baseColor: string, seed: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = mulberry32(seed);
  for (let i = 0; i < 200; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${rng() * 0.06})`;
    ctx.lineWidth = rng() * 2 + 0.5;
    ctx.beginPath();
    const x = rng() * size;
    const y = rng() * size;
    const r = rng() * 60 + 20;
    for (let t = 0; t < Math.PI * 2; t += 0.1) {
      const xx = x + Math.cos(t) * r + (rng() - 0.5) * 8;
      const yy = y + Math.sin(t) * r + (rng() - 0.5) * 8;
      if (t === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createWoodTexture(size: number, baseColor: string, seed: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = mulberry32(seed);
  // 木纹：多条垂直扭曲条带
  for (let i = 0; i < 40; i++) {
    const x0 = (i / 40) * size;
    const alpha = 0.05 + rng() * 0.15;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 1 + rng() * 3;
    ctx.beginPath();
    ctx.moveTo(x0 + (rng() - 0.5) * 4, 0);
    for (let y = 0; y < size; y += 8) {
      ctx.lineTo(x0 + Math.sin(y * 0.02) * 6 + (rng() - 0.5) * 2, y);
    }
    ctx.stroke();
  }
  // 一些疤节
  for (let i = 0; i < 8; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 4 + rng() * 8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createStarFloorTexture(size: number, baseColor: string, seed: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = mulberry32(seed);
  for (let i = 0; i < 800; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = rng() * 1.2;
    const a = rng() * 0.7 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 几个大星
  for (let i = 0; i < 12; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 4 + rng() * 4;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grad.addColorStop(0, 'rgba(180,200,255,0.9)');
    grad.addColorStop(0.4, 'rgba(180,200,255,0.3)');
    grad.addColorStop(1, 'rgba(180,200,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createRuneTexture(size: number, baseColor: string, seed: number = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  const rng = mulberry32(seed);
  for (let i = 0; i < 50; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 8 + rng() * 24;
    ctx.strokeStyle = `rgba(${180 + rng() * 50},${180 + rng() * 50},${220},${0.3 + rng() * 0.4})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const sides = 3 + Math.floor(rng() * 5);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const xx = x + Math.cos(a) * r;
      const yy = y + Math.sin(a) * r;
      if (j === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createBookCoverTexture(
  title: string,
  author: string,
  baseColor: string,
  seed: number,
  material: 'leather' | 'cloth' | 'metal' | 'crystal' | 'paper',
): THREE.CanvasTexture {
  const W = 256, H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rng = mulberry32(seed);

  // 背景
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, shade(baseColor, -20));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 材质装饰
  if (material === 'leather') {
    // 皮革纹理
    for (let i = 0; i < 300; i++) {
      const x = rng() * W;
      const y = rng() * H;
      ctx.fillStyle = `rgba(0,0,0,${rng() * 0.05})`;
      ctx.fillRect(x, y, rng() * 3, rng() * 3);
    }
    // 边框
    ctx.strokeStyle = shade(baseColor, 30);
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, W - 30, H - 30);
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, W - 50, H - 50);
  } else if (material === 'cloth') {
    // 布纹网格
    for (let x = 0; x < W; x += 4) {
      ctx.strokeStyle = `rgba(0,0,0,0.06)`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (material === 'metal') {
    // 金属反射
    for (let i = 0; i < 5; i++) {
      const g = ctx.createLinearGradient(0, (H / 5) * i, 0, (H / 5) * (i + 1));
      g.addColorStop(0, 'rgba(255,255,255,0.05)');
      g.addColorStop(0.5, 'rgba(0,0,0,0.1)');
      g.addColorStop(1, 'rgba(255,255,255,0.05)');
      ctx.fillStyle = g;
      ctx.fillRect(0, (H / 5) * i, W, H / 5);
    }
    ctx.strokeStyle = shade(baseColor, 50);
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);
  } else if (material === 'crystal') {
    // 棱镜切面
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 8; i++) {
      const x1 = rng() * W, y1 = rng() * H;
      const x2 = rng() * W, y2 = rng() * H;
      const x3 = rng() * W, y3 = rng() * H;
      ctx.fillStyle = `rgba(255,255,255,${rng() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, W - 30, H - 30);
  } else if (material === 'paper') {
    // 纸张
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${rng() * 60},${rng() * 50},${rng() * 30},${rng() * 0.08})`;
      ctx.fillRect(rng() * W, rng() * H, rng() * 2, rng() * 2);
    }
  }

  // 标题
  ctx.fillStyle = material === 'paper' ? '#3a2a1a' : '#f0e8d0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleFont = Math.max(18, Math.min(36, 200 / Math.max(4, title.length / 2)));
  ctx.font = `bold ${titleFont}px "Cinzel", "Noto Serif SC", serif`;
  wrapText(ctx, title, W / 2, H / 2 - 30, W - 60, titleFont * 1.3);

  // 作者
  ctx.font = `16px "Cinzel", "Noto Serif SC", serif`;
  ctx.fillStyle = material === 'paper' ? '#5a4a3a' : '#d0c8a0';
  wrapText(ctx, `— ${author} —`, W / 2, H - 60, W - 60, 22);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createBookSpineTexture(
  title: string,
  baseColor: string,
  seed: number,
  material: 'leather' | 'cloth' | 'metal' | 'crystal' | 'paper',
): THREE.CanvasTexture {
  const W = 64, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const rng = mulberry32(seed);

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, shade(baseColor, -15));
  grad.addColorStop(0.5, baseColor);
  grad.addColorStop(1, shade(baseColor, -15));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (material === 'leather') {
    ctx.strokeStyle = shade(baseColor, 30);
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 8, W - 8, H - 16);
  }

  // 标题（沿书脊方向）
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = material === 'paper' ? '#3a2a1a' : '#f0e8d0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(10, Math.min(18, 600 / Math.max(2, title.length)));
  ctx.font = `bold ${fontSize}px "Cinzel", "Noto Serif SC", serif`;
  const truncated = title.length > 14 ? title.slice(0, 12) + '…' : title;
  ctx.fillText(truncated, 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  // 中英混合简单分行
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineHeight));
}

function shade(hex: string, percent: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0xff) + percent;
  let b = (num & 0xff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export { shade };
