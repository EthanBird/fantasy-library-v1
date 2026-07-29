import * as THREE from 'three';
import { mulberry32 } from '@/lib/utils/seedRandom';

export type ParticleKind = 'dust' | 'firefly' | 'rune' | 'star' | 'orb' | 'page';

export interface ParticleFieldOptions {
  count: number;
  kind: ParticleKind;
  bounds: { size: [number, number, number]; center: [number, number, number] };
  color?: string;
  seed?: number;
}

export function createParticleField(opts: ParticleFieldOptions): THREE.Points {
  const { count, kind, bounds, color = '#ffffff' } = opts;
  const rng = mulberry32(opts.seed ?? 1);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const ages = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - 0.5) * bounds.size[0] + bounds.center[0];
    positions[i * 3 + 1] = rng() * bounds.size[1] + bounds.center[1];
    positions[i * 3 + 2] = (rng() - 0.5) * bounds.size[2] + bounds.center[2];
    velocities[i * 3] = (rng() - 0.5) * 0.02;
    velocities[i * 3 + 1] = -0.01 - rng() * 0.02;
    velocities[i * 3 + 2] = (rng() - 0.5) * 0.02;
    sizes[i] = kind === 'star' ? 0.04 + rng() * 0.08 : 0.06 + rng() * 0.04;
    ages[i] = rng() * 100;
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geom.setAttribute('age', new THREE.BufferAttribute(ages, 1));

  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    blending: kind === 'star' || kind === 'firefly' ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });

  // 自定义 texture (圆点)
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const cx = c.getContext('2d')!;
  const grad = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 64, 64);
  mat.map = new THREE.CanvasTexture(c);

  const points = new THREE.Points(geom, mat);
  points.userData.update = (dt: number) => {
    const pos = geom.attributes.position.array as Float32Array;
    const vel = geom.attributes.velocity.array as Float32Array;
    const age = geom.attributes.age.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      age[i] += dt;

      if (kind === 'firefly') {
        // 萤火虫：缓慢摆动 + 重新生成
        pos[i * 3] += Math.sin(age[i] * 0.5 + i) * 0.001;
        pos[i * 3 + 1] += Math.cos(age[i] * 0.3 + i) * 0.0008;
      }

      if (pos[i * 3 + 1] < bounds.center[1] - 1) {
        pos[i * 3] = (rng() - 0.5) * bounds.size[0] + bounds.center[0];
        pos[i * 3 + 1] = bounds.center[1] + bounds.size[1];
        pos[i * 3 + 2] = (rng() - 0.5) * bounds.size[2] + bounds.center[2];
      }
    }
    geom.attributes.position.needsUpdate = true;
  };

  return points;
}
