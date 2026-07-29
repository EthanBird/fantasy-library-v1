import * as THREE from 'three';
import { createRuneTexture, createWoodTexture, createNoiseCanvasTexture } from './textures';
import type { HallShape, HallVisualParams, Vec3 } from '@/types';

export interface WallOptions {
  roomShape: HallShape;
  size: Vec3;
  height: number;
  color: string;
  roughness: number;
  metalness: number;
  pattern?: HallVisualParams['walls']['pattern'];
  seed?: number;
}

export function createWalls(opts: WallOptions): THREE.Group {
  const group = new THREE.Group();
  const [w, h, d] = opts.size;
  const seed = opts.seed ?? 1;
  let map: THREE.Texture | null = null;
  if (opts.pattern === 'rune') map = createRuneTexture(512, opts.color, seed);
  else if (opts.pattern === 'wood') map = createWoodTexture(512, opts.color, seed);
  else map = createNoiseCanvasTexture(256, opts.color, 20, 1.0, seed);

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness: opts.roughness,
    metalness: opts.metalness,
    side: THREE.BackSide,
  });

  if (opts.roomShape === 'circle' || opts.roomShape === 'octagon' || opts.roomShape === 'tower') {
    const segments = opts.roomShape === 'octagon' ? 8 : 32;
    const radius = Math.max(w, d) / 2;
    const geom = new THREE.CylinderGeometry(radius, radius, h, segments, 1, true);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = h / 2;
    group.add(mesh);
  } else {
    // 矩形
    const walls = [
      { size: [w, h, 0.1], pos: [0, h / 2, -d / 2] as Vec3 },
      { size: [w, h, 0.1], pos: [0, h / 2, d / 2] as Vec3 },
      { size: [0.1, h, d], pos: [-w / 2, h / 2, 0] as Vec3 },
      { size: [0.1, h, d], pos: [w / 2, h / 2, 0] as Vec3 },
    ];
    for (const wall of walls) {
      const geom = new THREE.BoxGeometry(...(wall.size as [number, number, number]));
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(...wall.pos);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  return group;
}

export function createCeiling(opts: WallOptions): THREE.Object3D | null {
  if (opts.roomShape === 'open') return null;
  const [w, h, d] = opts.size;
  const geom = new THREE.PlaneGeometry(w, d);
  geom.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.y = h;
  return mesh;
}
