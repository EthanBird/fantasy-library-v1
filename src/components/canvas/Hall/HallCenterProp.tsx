import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { createCrystalBall, createCrystalCluster } from '@/lib/procgen/sphere';
import { useUIStore } from '@/stores/uiStore';

export function HallCenterProp({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const prop = hall.parameters.centerProp;
  const setHover = useUIStore((s) => s.setHover);

  // 用 useMemo 创建几何（确保每次渲染 hook 数量稳定）
  const geometry = useMemo<THREE.Group>(() => {
    if (prop.kind === 'crystal-ball') {
      return createCrystalBall(prop.scale);
    } else if (prop.kind === 'crystal-cluster' || prop.kind === 'void-portal') {
      return createCrystalCluster(prop.scale);
    } else {
      const g = new THREE.Group();
      if (prop.kind === 'ancient-tree') {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.5, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 }),
        );
        trunk.position.y = 2;
        g.add(trunk);
        const leaves = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.5, 1),
          new THREE.MeshStandardMaterial({ color: 0x6aa840, roughness: 0.9 }),
        );
        leaves.position.y = 4.5;
        g.add(leaves);
      } else if (prop.kind === 'alchemy-stand') {
        const stand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.8, 1, 8),
          new THREE.MeshStandardMaterial({ color: 0xc8a860, roughness: 0.5, metalness: 0.4 }),
        );
        stand.position.y = 0.5;
        g.add(stand);
        for (let i = 0; i < 3; i++) {
          const flask = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 12),
            new THREE.MeshPhysicalMaterial({
              color: i % 2 === 0 ? 0x88cc44 : 0xffd870,
              roughness: 0.1,
              transmission: 0.7,
              emissive: i % 2 === 0 ? 0x44aa22 : 0xddae22,
              emissiveIntensity: 0.3,
            }),
          );
          flask.position.set(
            Math.cos((i / 3) * Math.PI * 2) * 0.4,
            1.2,
            Math.sin((i / 3) * Math.PI * 2) * 0.4,
          );
          g.add(flask);
        }
      } else if (prop.kind === 'lectern') {
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.2, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.5, metalness: 0.05 }),
        );
        stand.position.y = 0.6;
        g.add(stand);
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.05, 0.7),
          new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.5 }),
        );
        top.position.y = 1.25;
        top.rotation.x = -0.3;
        g.add(top);
      }
      return g;
    }
  }, [prop.kind, prop.scale]);

  const group = useRef<THREE.Group>(null);

  // 交互标记：水晶球才需要
  useEffect(() => {
    if (prop.kind !== 'crystal-ball') return;
    geometry.traverse((obj) => {
      obj.userData.interactType = 'crystal-ball';
    });
  }, [geometry, prop.kind]);

  // 清理
  useEffect(() => {
    return () => {
      geometry.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
    };
  }, [geometry]);

  // 动画
  useFrame((state, delta) => {
    if (!group.current) return;
    if (prop.rotation) {
      group.current.rotation.y += delta * 0.15;
    }
    if (prop.kind === 'crystal-ball' || prop.kind === 'crystal-cluster' || prop.kind === 'void-portal') {
      group.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.6) * 0.15;
    }
    if (geometry.userData.coreLight) {
      const l = geometry.userData.coreLight as THREE.PointLight;
      l.intensity = 1.2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
    }
  });

  return (
    <group
      ref={group}
      position={[0, prop.kind === 'ancient-tree' ? 0 : 1.2, 0]}
      onPointerOver={() => {
        if (prop.kind === 'crystal-ball') {
          setHover({ type: 'crystal-ball', id: 'crystal-ball' });
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (prop.kind === 'crystal-ball') {
          setHover({ type: null, id: '' });
          document.body.style.cursor = '';
        }
      }}
    >
      <primitive object={geometry} />
    </group>
  );
}
