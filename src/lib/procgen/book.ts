import * as THREE from 'three';
import { createBookSpineTexture, createBookCoverTexture } from './textures';
import type { BookStub } from '@/types';

export interface BookMeshOptions {
  stub: BookStub;
  highlight?: boolean;
  pulseColor?: string;
}

/**
 * 单本书的 3D 表现：BoxGeometry + 程序化封面/书脊纹理
 * 注意：大量书用 InstancedMesh 时此处纹理需统一，这里返回 Group 用于单独摆放
 */
export function createBookMesh(opts: BookMeshOptions): THREE.Group {
  const { stub } = opts;
  const { thickness, height, width } = stub;

  const group = new THREE.Group();
  group.name = `Book-${stub.id}`;

  const spineTex = createBookSpineTexture(stub.title, stub.coverColor, stub.coverTextureSeed, stub.coverMaterial);
  const coverTex = createBookCoverTexture(stub.title, stub.author, stub.coverColor, stub.coverTextureSeed, stub.coverMaterial);

  // 6 个面：+X(右)、-X(左)、+Y(上)、-Y(下)、+Z(前)、-Z(后)
  const materials = [
    new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.7, metalness: stub.coverMaterial === 'metal' ? 0.6 : 0.05 }), // +X 右
    new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.7, metalness: stub.coverMaterial === 'metal' ? 0.6 : 0.05 }), // -X 左
    new THREE.MeshStandardMaterial({ color: stub.coverColor, roughness: 0.7, metalness: 0.05 }), // +Y 上
    new THREE.MeshStandardMaterial({ color: stub.coverColor, roughness: 0.7, metalness: 0.05 }), // -Y 下
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.7, metalness: stub.coverMaterial === 'metal' ? 0.6 : 0.05 }), // +Z 前
    new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.7, metalness: stub.coverMaterial === 'metal' ? 0.6 : 0.05 }), // -Z 后
  ];

  const geom = new THREE.BoxGeometry(width, height, thickness);
  const mesh = new THREE.Mesh(geom, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // 脉动光
  if (stub.pulseColor) {
    const light = new THREE.PointLight(stub.pulseColor, 0.2, 0.6);
    light.position.set(0, 0, 0);
    group.add(light);
    group.userData.pulseLight = light;
  }

  return group;
}

export function createBookSpineColor(stub: BookStub): string {
  return stub.coverColor;
}
