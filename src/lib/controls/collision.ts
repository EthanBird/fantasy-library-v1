import * as THREE from 'three';
import type { Vec3 } from '@/types';

/**
 * 简易碰撞系统：AABB 列表
 * 玩家被建模为半径 0.3、高度 1.6 的胶囊
 */

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
  tag?: string;
}

export interface Capsule {
  position: Vec3;
  radius: number;
  height: number;
}

export function checkCapsuleAABB(capsule: Capsule, aabb: AABB): boolean {
  const [px, , pz] = capsule.position;
  const cx = Math.max(aabb.min.x, Math.min(px, aabb.max.x));
  const cz = Math.max(aabb.min.z, Math.min(pz, aabb.max.z));
  const dx = px - cx;
  const dz = pz - cz;
  return dx * dx + dz * dz < capsule.radius * capsule.radius;
}

export function resolveCollision(
  current: Vec3,
  desired: Vec3,
  radius: number,
  boxes: AABB[],
  height: number = 1.6,
): Vec3 {
  const capsule: Capsule = { position: desired, radius, height };

  // 简化：先试 X 方向
  const tryX: Vec3 = [desired[0], current[1], current[2]];
  const xCollide = boxes.some((b) => checkCapsuleAABB({ position: tryX, radius, height }, b));
  if (!xCollide) {
    const tryZ: Vec3 = [desired[0], current[1], desired[2]];
    const zCollide = boxes.some((b) => checkCapsuleAABB({ position: tryZ, radius, height }, b));
    if (!zCollide) return desired;
    // X 可 Z 不行
    return [desired[0], current[1], current[2]];
  }
  // X 不行
  const tryZ: Vec3 = [current[0], current[1], desired[2]];
  const zCollide = boxes.some((b) => checkCapsuleAABB({ position: tryZ, radius, height }, b));
  if (!zCollide) return [current[0], current[1], desired[2]];

  return current;
}

/**
 * 把书架布局转成 AABB 列表
 */
export function buildAABBList(
  shelves: { position: Vec3; rotation?: Vec3; width: number; depth: number; height: number }[],
): AABB[] {
  return shelves.map((s) => {
    const [x, y, z] = s.position;
    return {
      min: new THREE.Vector3(x - s.width / 2, y, z - s.depth / 2),
      max: new THREE.Vector3(x + s.width / 2, y + s.height, z + s.depth / 2),
    };
  });
}

/**
 * 房间边界 AABB
 */
export function buildRoomBounds(
  roomSize: Vec3,
  centerY: number = 0,
): AABB[] {
  const [w, h, d] = roomSize;
  const half = [w / 2, h / 2, d / 2];
  return [
    { min: new THREE.Vector3(-half[0], centerY, -half[2]), max: new THREE.Vector3(half[0], centerY + h, -half[2] + 0.3) },
    { min: new THREE.Vector3(-half[0], centerY, half[2] - 0.3), max: new THREE.Vector3(half[0], centerY + h, half[2]) },
    { min: new THREE.Vector3(-half[0], centerY, -half[2]), max: new THREE.Vector3(-half[0] + 0.3, centerY + h, half[2]) },
    { min: new THREE.Vector3(half[0] - 0.3, centerY, -half[2]), max: new THREE.Vector3(half[0], centerY + h, half[2]) },
  ];
}
