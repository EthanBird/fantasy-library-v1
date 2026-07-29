import * as THREE from 'three';

export function createCrystalBall(scale: number = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CrystalBall';

  // 主体水晶球
  const geom = new THREE.IcosahedronGeometry(0.7 * scale, 4);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.8,
  });
  const ball = new THREE.Mesh(geom, mat);
  ball.castShadow = true;
  group.add(ball);

  // 内部光
  const core = new THREE.PointLight(0xa890ff, 1.5, 4);
  core.position.set(0, 0, 0);
  group.add(core);

  // 装饰圆环
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85 * scale, 0.015, 8, 64),
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0xd4af37,
        emissiveIntensity: 0.2,
      }),
    );
    ring.rotation.x = Math.PI / 2 + i * 0.2;
    ring.rotation.z = i * 0.5;
    group.add(ring);
  }

  // 底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 0.3 * scale, 8),
    new THREE.MeshStandardMaterial({
      color: 0x2a1c10,
      roughness: 0.6,
      metalness: 0.4,
    }),
  );
  base.position.y = -0.85 * scale;
  base.castShadow = true;
  group.add(base);

  group.userData.coreLight = core;
  return group;
}

export function createCrystalCluster(scale: number = 1.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CrystalCluster';

  const positions: [number, number, number][] = [
    [0, 0, 0],
    [0.4, 0.3, 0.1],
    [-0.3, 0.2, -0.2],
    [0.2, 0.7, -0.1],
    [-0.4, 0.6, 0.2],
  ];

  for (const pos of positions) {
    const h = 0.3 + Math.random() * 0.5;
    const geom = new THREE.ConeGeometry(0.2, h, 5);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x88aaff,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.7,
      thickness: 0.3,
      ior: 1.5,
      transparent: true,
      opacity: 0.7,
      emissive: 0x4488ff,
      emissiveIntensity: 0.1,
    });
    const m = new THREE.Mesh(geom, mat);
    m.position.set(...pos);
    m.rotation.z = (Math.random() - 0.5) * 0.3;
    m.castShadow = true;
    group.add(m);
  }

  // 基座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1430, roughness: 0.7, metalness: 0.3 }),
  );
  base.position.y = -0.1;
  base.castShadow = true;
  group.add(base);

  return group;
}
