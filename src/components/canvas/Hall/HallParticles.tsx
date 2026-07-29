import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HALLS } from '@/data/halls';
import { createParticleField } from '@/lib/procgen/particle';
import { useSettingsStore } from '@/stores/settingsStore';
import { getQualitySettings } from '@/lib/perf/quality';

export function HallParticles({ hallId }: { hallId: string }) {
  const hall = HALLS[hallId as keyof typeof HALLS];
  const enableParticles = useSettingsStore((s) => s.visuals.enableParticles);
  const quality = useSettingsStore((s) => s.visuals.qualityPreset);
  const qs = getQualitySettings(quality);
  const mult = qs.particleMultiplier;

  const fields = useMemo(() => {
    if (!enableParticles) return [];
    const out: { field: THREE.Points; kind: string }[] = [];
    const pc = hall.parameters.particles;
    const size = hall.parameters.roomSize;
    const center: [number, number, number] = [0, size[1] / 2, 0];
    const bounds: [number, number, number] = [size[0] * 0.9, size[1] * 0.8, size[2] * 0.9];

    if (pc.dust && pc.dust > 0) {
      out.push({ field: createParticleField({ count: Math.floor(pc.dust * mult), kind: 'dust', bounds: { size: bounds, center }, color: '#d4c890', seed: hashString(hallId + 'dust') }), kind: 'dust' });
    }
    if (pc.fireflies && pc.fireflies > 0) {
      out.push({ field: createParticleField({ count: Math.floor(pc.fireflies * mult), kind: 'firefly', bounds: { size: bounds, center: [0, size[1] * 0.4, 0] }, color: '#aaff88', seed: hashString(hallId + 'ff') }), kind: 'firefly' });
    }
    if (pc.runes && pc.runes > 0) {
      out.push({ field: createParticleField({ count: pc.runes, kind: 'rune', bounds: { size: [size[0] * 0.5, size[1] * 0.6, size[2] * 0.5], center: [0, size[1] * 0.5, 0] }, color: hall.accentColor, seed: hashString(hallId + 'rune') }), kind: 'rune' });
    }
    if (pc.stars && pc.stars > 0) {
      out.push({ field: createParticleField({ count: pc.stars, kind: 'star', bounds: { size: [size[0] * 0.9, size[1] * 0.8, size[2] * 0.9], center }, color: '#ffffff', seed: hashString(hallId + 'star') }), kind: 'star' });
    }
    if (pc.orbs && pc.orbs > 0) {
      out.push({ field: createParticleField({ count: pc.orbs, kind: 'orb', bounds: { size: [size[0] * 0.6, size[1] * 0.6, size[2] * 0.6], center: [0, size[1] * 0.5, 0] }, color: hall.accentColor, seed: hashString(hallId + 'orb') }), kind: 'orb' });
    }
    if (pc.pages && pc.pages > 0) {
      out.push({ field: createParticleField({ count: pc.pages, kind: 'page', bounds: { size: [size[0] * 0.7, size[1] * 0.7, size[2] * 0.7], center }, color: '#f0e8d0', seed: hashString(hallId + 'page') }), kind: 'page' });
    }
    return out;
  }, [hallId, enableParticles, quality, mult, hall.accentColor, hall.parameters.particles]);

  useFrame((_, delta) => {
    fields.forEach(({ field }) => {
      const update = field.userData.update as ((dt: number) => void) | undefined;
      if (update) update(Math.min(delta, 0.05));
    });
  });

  return (
    <group>
      {fields.map((f, i) => (
        <primitive key={i} object={f.field} />
      ))}
    </group>
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
