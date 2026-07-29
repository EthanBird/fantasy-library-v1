import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { useSettingsStore } from '@/stores/settingsStore';
import { getQualitySettings } from '@/lib/perf/quality';

export function HallLights({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const qs = getQualitySettings(quality);
  const cfg = hall.parameters.lighting;

  // 主方向光
  const dirRef = useRef<THREE.DirectionalLight>(null);

  // 点光源闪烁
  const flickerRefs = useRef<THREE.PointLight[]>([]);
  const flickerOriginal = useRef<number[]>([]);

  useEffect(() => {
    flickerRefs.current = flickerRefs.current.slice(0, cfg.pointLights.length);
    flickerOriginal.current = cfg.pointLights.map((p) => p.intensity);
  }, [hallId]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    flickerRefs.current.forEach((light, i) => {
      const orig = flickerOriginal.current[i];
      if (orig === undefined) return;
      if (cfg.pointLights[i]?.flicker) {
        light.intensity = orig * (0.85 + 0.15 * Math.sin(t * 8 + i * 1.3) * Math.cos(t * 13.7 + i));
      }
    });
  });

  return (
    <group>
      {/* 环境光 */}
      {cfg.hemisphere && (
        <hemisphereLight
          intensity={cfg.hemisphere.intensity * hall.parameters.ambient.intensity}
          color={hall.parameters.ambient.color}
          groundColor="#000000"
        />
      )}

      {/* 方向光 */}
      {cfg.directional && (
        <directionalLight
          ref={dirRef}
          position={[5, 12, 5]}
          intensity={cfg.directional.intensity * hall.parameters.ambient.intensity}
          color={cfg.directional.color}
          castShadow={cfg.directional.shadow && qs.enableShadows}
          shadow-mapSize-width={qs.shadowMapSize}
          shadow-mapSize-height={qs.shadowMapSize}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
        />
      )}

      {/* 聚光灯 */}
      {cfg.spots.slice(0, qs.maxLights).map((spot, i) => (
        <spotLight
          key={`spot-${i}`}
          position={spot.position}
          intensity={spot.intensity * hall.parameters.ambient.intensity}
          color={spot.color}
          angle={spot.angle}
          distance={spot.distance}
          penumbra={0.4}
        />
      ))}

      {/* 点光源 */}
      {cfg.pointLights.slice(0, qs.maxLights).map((p, i) => (
        <pointLight
          key={`point-${i}`}
          ref={(el) => {
            if (el) flickerRefs.current[i] = el;
          }}
          position={p.position}
          intensity={p.intensity}
          color={p.color}
          distance={p.distance}
          decay={2}
        />
      ))}

      {/* 装饰光（emissive accent） */}
      {cfg.emissiveAccents?.slice(0, qs.maxLights).map((e, i) => (
        <pointLight
          key={`emissive-${i}`}
          position={e.position}
          intensity={e.intensity}
          color={e.color}
          distance={4}
          decay={2}
        />
      ))}
    </group>
  );
}
