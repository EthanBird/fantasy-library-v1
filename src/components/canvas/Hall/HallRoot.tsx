import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimeOfDay } from '@/lib/hooks/useTimeOfDay';
import { HallFloor } from './HallFloor';
import { HallWalls } from './HallWalls';
import { HallCeiling } from './HallCeiling';
import { HallLights } from './HallLights';
import { HallParticles } from './HallParticles';
import { HallVolumetricBeams } from './HallVolumetricBeams';
import { HallShelves } from './HallShelves';
import { HallCenterProp } from './HallCenterProp';
import { HallPortals } from './HallPortals';
import { Skydome } from '../Sky/Skydome';

interface Props {
  hallId: string;
}

/**
 * 单个馆厅的根组件：根据 hallId 装配所有子元素
 */
export function HallRoot({ hallId }: Props) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const enableVolumetric = useSettingsStore((s) => s.visuals.enableVolumetric);

  const daylight = useTimeOfDay();

  return (
    <group name={`Hall-${hallId}`}>
      {/* 天空穹顶 */}
      <Skydome variant={hall.parameters.ceiling.kind === 'skydome' ? 'star' : 'none'} starCount={daylight.starCount} />

      {/* 地板 */}
      <HallFloor hallId={hallId} />

      {/* 墙体 */}
      <HallWalls hallId={hallId} />

      {/* 天花板 */}
      <HallCeiling hallId={hallId} />

      {/* 灯光 */}
      <HallLights hallId={hallId} />

      {/* 粒子 */}
      <HallParticles hallId={hallId} />

      {/* 体积光 */}
      {enableVolumetric && quality !== 'low' && quality !== 'mid' && (
        <HallVolumetricBeams hallId={hallId} />
      )}

      {/* 书架 */}
      <HallShelves hallId={hallId} />

      {/* 中央装饰 */}
      {hall.parameters.centerProp.kind !== 'none' && (
        <HallCenterProp hallId={hallId} />
      )}

      {/* 拱门/传送门 */}
      <HallPortals hallId={hallId} />
    </group>
  );
}
