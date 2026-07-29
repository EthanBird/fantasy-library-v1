import { useMemo } from 'react';
import { HALLS } from '@/data/halls';
import { createWalls } from '@/lib/procgen/wall';

export function HallWalls({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const walls = useMemo(() => {
    const p = hall.parameters.walls;
    return createWalls({
      roomShape: hall.parameters.roomShape,
      size: hall.parameters.roomSize,
      height: hall.parameters.roomSize[1],
      color: p.color,
      roughness: p.roughness,
      metalness: p.metalness,
      pattern: p.pattern,
      seed: hashString(hallId),
    });
  }, [hallId]);
  return <primitive object={walls} />;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
