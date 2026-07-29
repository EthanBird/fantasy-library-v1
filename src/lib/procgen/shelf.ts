import * as THREE from 'three';
import { createWoodTexture, createNoiseCanvasTexture } from './textures';
import type { Vec3 } from '@/types';

export interface ShelfOptions {
  width?: number;   // X 方向
  height?: number;  // Y 方向
  depth?: number;   // Z 方向
  levels?: number;  // 几层架
  color?: string;   // 木色
  material?: 'wood' | 'metal' | 'crystal';
  seed?: number;
}

/**
 * 生成一个书架（多层架 + 侧板 + 顶/底板）
 * 顶点输出：local space
 */
export function createShelfMesh(opts: ShelfOptions = {}): THREE.Group {
  const width = opts.width ?? 2.4;
  const height = opts.height ?? 2.4;
  const depth = opts.depth ?? 0.4;
  const levels = opts.levels ?? 4;
  const color = opts.color ?? '#3a2818';
  const seed = opts.seed ?? 1;

  const group = new THREE.Group();
  group.name = 'Bookshelf';

  // 材质
  const tex = opts.material === 'metal'
    ? createNoiseCanvasTexture(256, color, 30, 1.1, seed)
    : createWoodTexture(256, color, seed);
  tex.repeat.set(1, 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex,
    roughness: opts.material === 'metal' ? 0.4 : 0.85,
    metalness: opts.material === 'metal' ? 0.6 : 0.05,
  });

  // 侧板
  const sideGeom = new THREE.BoxGeometry(0.06, height, depth);
  const left = new THREE.Mesh(sideGeom, mat);
  left.position.set(-width / 2 + 0.03, height / 2, 0);
  left.castShadow = true;
  left.receiveShadow = true;
  group.add(left);

  const right = new THREE.Mesh(sideGeom, mat);
  right.position.set(width / 2 - 0.03, height / 2, 0);
  right.castShadow = true;
  right.receiveShadow = true;
  group.add(right);

  // 顶/底板
  const topGeom = new THREE.BoxGeometry(width, 0.05, depth);
  const top = new THREE.Mesh(topGeom, mat);
  top.position.set(0, height - 0.025, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const bottom = new THREE.Mesh(topGeom, mat);
  bottom.position.set(0, 0.025, 0);
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  group.add(bottom);

  // 背板
  const backGeom = new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.02);
  const back = new THREE.Mesh(backGeom, new THREE.MeshStandardMaterial({
    color: shade(color, -30),
    roughness: 0.95,
    metalness: 0,
  }));
  back.position.set(0, height / 2, -depth / 2 + 0.02);
  group.add(back);

  // 隔板
  const boardGeom = new THREE.BoxGeometry(width - 0.12, 0.025, depth - 0.04);
  for (let i = 0; i <= levels; i++) {
    const board = new THREE.Mesh(boardGeom, mat);
    board.position.set(0, (height / levels) * i, 0.01);
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);
  }

  return group;
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

/**
 * 创建水晶棱柱书架（水晶书阁用）
 */
export function createCrystalShelfMesh(opts: ShelfOptions = {}): THREE.Group {
  const width = opts.width ?? 1.0;
  const height = opts.height ?? 2.4;
  const depth = opts.depth ?? 0.4;
  const levels = opts.levels ?? 4;

  const group = new THREE.Group();
  group.name = 'CrystalShelf';

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xc0e0f0,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.85,
    thickness: 0.5,
    ior: 1.45,
    transparent: true,
    opacity: 0.7,
  });

  // 主体棱柱
  const main = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, height, 6, 1),
    mat,
  );
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  group.add(main);

  // 隔板（小六棱柱片）
  for (let i = 0; i <= levels; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.02, 6, 1),
      mat,
    );
    ring.position.set(0, (height / levels) * i, 0);
    group.add(ring);
  }

  // 内部发光
  const coreLight = new THREE.PointLight(0xffffff, 0.4, 2);
  coreLight.position.set(0, height / 2, 0);
  group.add(coreLight);

  return group;
}
