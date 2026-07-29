import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { createCrystalBall, createCrystalCluster } from '@/lib/procgen/sphere';
import { useUIStore } from '@/stores/uiStore';

export function HallCenterProp({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const prop = hall.parameters.centerProp;
  const setHover = useUIStore((s) => s.setHover);
  const setCrystalBallActive = useUIStore((s) => s.setCrystalBallActive);

  const group = useRef<THREE.Group>(null);

  // 中央装饰几何
  const geometry = useRef<THREE.Group | null>(null);
  useEffect(() => {
    if (prop.kind === 'crystal-ball') {
      geometry.current = createCrystalBall(prop.scale);
    } else if (prop.kind === 'crystal-cluster' || prop.kind === 'void-portal') {
      geometry.current = createCrystalCluster(prop.scale);
    } else {
      // alchemy-stand / ancient-tree / lectern: 简单占位
      geometry.current = new THREE.Group();
      if (prop.kind === 'ancient-tree') {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.5, 4, 8),
          new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 }),
        );
        trunk.position.y = 2;
        geometry.current.add(trunk);
        const leaves = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.5, 1),
          new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 }),
        );
        leaves.position.y = 4.5;
        geometry.current.add(leaves);
      } else if (prop.kind === 'alchemy-stand') {
        const stand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.8, 1, 8),
          new THREE.MeshStandardMaterial({ color: 0x4a3a20, roughness: 0.7, metalness: 0.5 }),
        );
        stand.position.y = 0.5;
        geometry.current.add(stand);
        for (let i = 0; i < 3; i++) {
          const flask = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 12),
            new THREE.MeshPhysicalMaterial({
              color: i % 2 === 0 ? 0x88cc44 : 0xccaa44,
              roughness: 0.1,
              transmission: 0.7,
              emissive: i % 2 === 0 ? 0x44aa22 : 0xaa8822,
              emissiveIntensity: 0.3,
            }),
          );
          flask.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.4, 1.2, Math.sin((i / 3) * Math.PI * 2) * 0.4);
          geometry.current.add(flask);
        }
      } else if (prop.kind === 'lectern') {
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.2, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.5, metalness: 0.1 }),
        );
        stand.position.y = 0.6;
        geometry.current.add(stand);
        const top = new THREE.Mesh(
          new THREE.BoxGeometry(1, 0.05, 0.7),
          new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.5 }),
        );
        top.position.y = 1.25;
          top.rotation.x = -0.3;
        geometry.current.add(top);
      }
    }
    return () => {
      geometry.current?.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
    };
  }, [prop.kind, prop.scale]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (prop.rotation) {
      group.current.rotation.y += delta * 0.15;
    }
    // 水晶球/cluster 上下浮动
    if (prop.kind === 'crystal-ball' || prop.kind === 'crystal-cluster' || prop.kind === 'void-portal') {
      group.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.6) * 0.15;
    }
    // 内部光闪烁
    if (geometry.current?.userData.coreLight) {
      const l = geometry.current.userData.coreLight as THREE.PointLight;
      l.intensity = 1.2 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
    }
  });

  if (!geometry.current) return null;

  // 设置交互
  useEffect(() => {
    if (geometry.current && prop.kind === 'crystal-ball') {
      geometry.current.traverse((obj) => {
        obj.userData.interactType = 'crystal-ball';
      });
    }
  }, [geometry.current]);

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
      <primitive object={geometry.current} />
    </group>
  );
}
