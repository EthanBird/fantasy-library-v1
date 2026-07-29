import * as THREE from 'three';

/**
 * 体积光（volumetric light beam）
 * 用 ConeGeometry + 自定义 shader 实现从上到下的光柱
 */
export function createVolumetricBeam(opts: {
  position: [number, number, number];
  height?: number;
  radius?: number;
  color?: string;
  intensity?: number;
  rotation?: [number, number, number];
}): THREE.Mesh {
  const { position, height = 12, radius = 1.5, color = '#fff5e0', intensity = 0.4 } = opts;
  const geom = new THREE.ConeGeometry(radius, height, 32, 1, true);
  geom.translate(0, -height / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying float vY;
      varying vec2 vUv;
      void main() {
        vY = position.y / ${height.toFixed(1)};
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      varying float vY;
      varying vec2 vUv;
      void main() {
        // 中心更亮、边缘更暗
        float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
        radial = pow(radial, 2.0);
        // 上端更强，下端渐隐
        float vertical = smoothstep(0.0, 0.4, vY) * smoothstep(1.0, 0.6, vY);
        // 时间扰动
        float noise = sin(vY * 8.0 + uTime * 0.5) * 0.1 + 0.9;
        float a = radial * vertical * uIntensity * noise;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(position[0], position[1] + height, position[2]);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  mesh.userData.update = (t: number) => {
    (mat.uniforms.uTime.value as number) = t;
  };
  return mesh;
}
