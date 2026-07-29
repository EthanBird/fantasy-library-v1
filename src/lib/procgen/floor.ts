import * as THREE from 'three';
import { createMarbleTexture, createStarFloorTexture, createWoodTexture, createNoiseCanvasTexture, createRuneTexture } from './textures';
import type { HallVisualParams, Vec3 } from '@/types';

export interface FloorOptions {
  size: Vec3;
  pattern: HallVisualParams['floor']['pattern'];
  color: string;
  roughness: number;
  metalness: number;
  reflectivity?: number;
  seed?: number;
}

export function createFloor(opts: FloorOptions): THREE.Mesh {
  const { size, pattern, color, roughness, metalness } = opts;
  const [w, , d] = size;
  const geom = new THREE.PlaneGeometry(w, d, 8, 8);
  geom.rotateX(-Math.PI / 2);

  let map: THREE.Texture | null = null;
  const seed = opts.seed ?? 1;
  switch (pattern) {
    case 'marble':
      map = createMarbleTexture(512, color, seed);
      break;
    case 'wood':
      map = createWoodTexture(512, color, seed);
      break;
    case 'star':
      map = createStarFloorTexture(512, color, seed);
      break;
    case 'tile':
      map = createNoiseCanvasTexture(256, color, 20, 1.0, seed);
      break;
    default:
      map = createNoiseCanvasTexture(256, color, 15, 1.0, seed);
  }
  if (map) {
    map.repeat.set(w / 6, d / 6);
  }

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    roughness,
    metalness,
    envMapIntensity: opts.reflectivity ?? 0.3,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  return mesh;
}
