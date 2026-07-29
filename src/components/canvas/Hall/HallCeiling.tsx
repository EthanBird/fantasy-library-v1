import { useMemo } from 'react';
import { HALLS } from '@/data/halls';
import { createCeiling } from '@/lib/procgen/wall';

export function HallCeiling({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const ceiling = useMemo(() => {
    if (hall.parameters.ceiling.kind === 'solid') {
      return createCeiling({
        roomShape: hall.parameters.roomShape,
        size: hall.parameters.roomSize,
        height: hall.parameters.roomSize[1],
        color: hall.parameters.ceiling.color,
        roughness: 0.95,
        metalness: 0,
      });
    }
    return null;
  }, [hallId]);
  if (!ceiling) return null;
  return <primitive object={ceiling} />;
}
