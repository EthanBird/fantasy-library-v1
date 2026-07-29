import { useMemo } from 'react';
import { HALLS } from '@/data/halls';
import { createFloor } from '@/lib/procgen/floor';

export function HallFloor({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const floor = useMemo(() => {
    const p = hall.parameters.floor;
    return createFloor({
      size: hall.parameters.roomSize,
      pattern: p.pattern ?? 'noise',
      color: p.color,
      roughness: p.roughness,
      metalness: p.metalness,
      reflectivity: p.reflectivity,
      seed: hashString(hallId),
    });
  }, [hallId]);
  return <primitive object={floor} />;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
