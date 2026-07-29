import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 全局相机 wrapper：每帧同步 audio listener 位置/朝向
 */
export function Camera() {
  const { camera } = useThree();
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    let raf = 0;
    const update = (t: number) => {
      raf = requestAnimationFrame(update);
      if (t - lastUpdate.current < 50) return; // 20fps 同步足够
      lastUpdate.current = t;
      // audio listener 更新（如果已初始化）
      // 实际由 AudioListenerUpdater 组件处理
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [camera]);

  return null;
}
