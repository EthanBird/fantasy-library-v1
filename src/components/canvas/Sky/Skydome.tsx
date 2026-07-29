import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  variant: 'star' | 'none';
  starCount?: number;
}

/**
 * 简化的天空穹顶 / 星空
 */
export function Skydome({ variant, starCount = 500 }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  const stars = useMemo(() => {
    if (variant !== 'star') return null;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      // 球面均匀分布
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const r = 30;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // 仅上半球
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = new THREE.Color().setHSL(Math.random() * 0.2 + 0.55, 0.3, 0.7 + Math.random() * 0.3);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [variant, starCount]);

  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.005;
    }
  });

  if (variant === 'none') return null;

  return (
    <group ref={groupRef}>
      {/* 背景球 */}
      <mesh>
        <sphereGeometry args={[29, 32, 32]} />
        <meshBasicMaterial color="#0a0820" side={THREE.BackSide} fog={false} />
      </mesh>
      {stars && (
        <points geometry={stars} frustumCulled={false}>
          <pointsMaterial size={0.15} sizeAttenuation vertexColors transparent opacity={0.9} fog={false} />
        </points>
      )}
    </group>
  );
}
