import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { useUIStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useProgressStore } from '@/stores/progressStore';
import { audioEngine } from '@/lib/audio/engine';

export function HallPortals({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const allHalls = Object.values(HALLS);
  const unlockedHalls = useProgressStore((s) => s.unlockedHalls);
  const setHover = useUIStore((s) => s.setHover);
  const setHall = usePlayerStore((s) => s.setHall);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const notify = useUIStore((s) => s.notify);

  // 中央大厅通向所有馆厅（除自身外）；其他馆厅通回中央
  const targets: { id: string; angle: number; name: string }[] = [];
  if (hallId === 'central') {
    allHalls.forEach((h, i) => {
      if (h.id === 'central') return;
      if (!unlockedHalls.includes(h.id as any)) return;
      targets.push({
        id: h.id,
        angle: (i / allHalls.length) * Math.PI * 2,
        name: h.name.zh,
      });
    });
  } else {
    targets.push({ id: 'central', angle: 0, name: '中央大厅' });
  }

  return (
    <group>
      {targets.map((t) => (
        <Portal
          key={t.id}
          targetHall={t.id}
          angle={t.angle}
          name={t.name}
          unlocked={unlockedHalls.includes(t.id as any)}
          onHover={(hovering) => {
            if (hovering) {
              setHover({ type: 'portal', id: t.id, data: { targetHall: t.id, name: t.name } });
              document.body.style.cursor = 'pointer';
            } else {
              setHover({ type: null, id: '' });
              document.body.style.cursor = '';
            }
          }}
        />
      ))}
    </group>
  );
}

function Portal({ targetHall, angle, name, unlocked, onHover }: { targetHall: string; angle: number; name: string; unlocked: boolean; onHover: (b: boolean) => void }) {
  const radius = 9.5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3;
    }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 2) * 0.15;
    }
  });

  if (!unlocked) {
    // 未解锁：显示黑雾 + 符文锁
    return (
      <group position={[x, 0, z]}>
        <mesh>
          <torusGeometry args={[0.9, 0.05, 8, 32]} />
          <meshStandardMaterial color="#0a0000" emissive="#220000" emissiveIntensity={0.2} roughness={0.9} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.85, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <sprite position={[0, 1.6, 0]} scale={[2, 0.4, 1]}>
          <spriteMaterial color="#664444" transparent opacity={0.7} />
        </sprite>
      </group>
    );
  }

  return (
    <group
      position={[x, 1.5, z]}
      userData={{ interactType: 'portal', targetHall }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={() => onHover(false)}
    >
      <mesh ref={ringRef}>
        <torusGeometry args={[0.9, 0.04, 8, 32]} />
        <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.6} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh ref={innerRef}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial color={targetHall === 'central' ? '#8a6fd1' : '#d4af37'} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#d4af37" intensity={1.5} distance={3} />
      <sprite position={[0, 1.4, 0]} scale={[1.8, 0.4, 1]}>
        <spriteMaterial color="#d4af37" transparent opacity={0.9} />
      </sprite>
    </group>
  );
}
