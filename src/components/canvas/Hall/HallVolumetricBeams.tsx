import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { createVolumetricBeam } from '@/lib/procgen/volumetric';

export function HallVolumetricBeams({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const beams = useMemo(() => {
    const count = hall.parameters.volumetricBeams;
    const out: THREE.Mesh[] = [];
    const size = hall.parameters.roomSize;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 4;
      out.push(
        createVolumetricBeam({
          position: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
          height: size[1] * 0.85,
          radius: 1.2,
          color: hall.accentColor,
          intensity: 0.4,
        }),
      );
    }
    return out;
  }, [hallId]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    beams.forEach((b) => {
      const update = b.userData.update as ((t: number) => void) | undefined;
      if (update) update(t);
    });
  });

  return (
    <group>
      {beams.map((b, i) => <primitive key={i} object={b} />)}
    </group>
  );
}
