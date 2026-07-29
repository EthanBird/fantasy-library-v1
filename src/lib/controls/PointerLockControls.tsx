import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';

export interface PointerLockControlsRef {
  lock: () => void;
  unlock: () => void;
  isLocked: () => boolean;
  move: (dx: number, dz: number) => void;
  setRotation: (yaw: number, pitch: number) => void;
  getCamera: () => THREE.PerspectiveCamera;
}

const WALK_SPEED = 4.0; // m/s
const RUN_SPEED = 6.5; // m/s
const PITCH_LIMIT = Math.PI / 2 - 0.05;

interface Props {
  enabled: boolean;
  onMove?: (pos: THREE.Vector3) => void;
}

export const PointerLockControls = forwardRef<PointerLockControlsRef, Props>(function PointerLockControls(
  { enabled, onMove },
  ref,
) {
  const { camera, gl } = useThree();
  const setPointerLocked = usePlayerStore((s) => s.setPointerLocked);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const setRotation = usePlayerStore((s) => s.setRotation);
  const setRunning = usePlayerStore((s) => s.setRunning);
  const setReading = usePlayerStore((s) => s.setReading);
  const fov = useSettingsStore((s) => s.visuals.fov);
  const isReading = usePlayerStore((s) => s.isReading);

  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const yawRef = useRef(usePlayerStore.getState().yaw);
  const pitchRef = useRef(usePlayerStore.getState().pitch);
  const isLockedRef = useRef(false);
  const lastSaveRef = useRef(0);
  const positionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.6, 4));

  // 同步初始位置/朝向
  useEffect(() => {
    const p = usePlayerStore.getState().position;
    const y = usePlayerStore.getState().yaw;
    const pi = usePlayerStore.getState().pitch;
    positionRef.current.set(p[0], p[1], p[2]);
    camera.position.set(p[0], p[1], p[2]);
    yawRef.current = y;
    pitchRef.current = pi;
    applyRotation();
  }, [camera]);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  function applyRotation() {
    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }

  // 鼠标移动（pointer lock 期间）
  useEffect(() => {
    const canvas = gl.domElement;
    const onMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      const sens = 0.0025;
      yawRef.current -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitchRef.current));
      applyRotation();
    };
    canvas.addEventListener('mousemove', onMouseMove);
    return () => canvas.removeEventListener('mousemove', onMouseMove);
  }, [gl]);

  // 滚轮调整 FOV
  useEffect(() => {
    const canvas = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!isLockedRef.current) return;
      e.preventDefault();
      const next = Math.max(55, Math.min(85, fov + e.deltaY * 0.05));
      useSettingsStore.getState().setVisuals({ fov: next });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [gl, fov]);

  // 键盘
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keys.current.w = true;
      else if (k === 'a' || k === 'arrowleft') keys.current.a = true;
      else if (k === 's' || k === 'arrowdown') keys.current.s = true;
      else if (k === 'd' || k === 'arrowright') keys.current.d = true;
      else if (k === 'shift') keys.current.shift = true;
      setRunning(keys.current.shift);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keys.current.w = false;
      else if (k === 'a' || k === 'arrowleft') keys.current.a = false;
      else if (k === 's' || k === 'arrowdown') keys.current.s = false;
      else if (k === 'd' || k === 'arrowright') keys.current.d = false;
      else if (k === 'shift') keys.current.shift = false;
      setRunning(keys.current.shift);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [setRunning]);

  // pointer lock 状态变化
  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      isLockedRef.current = locked;
      setPointerLocked(locked);
    };
    const onPointerLockError = () => {
      isLockedRef.current = false;
      setPointerLocked(false);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('pointerlockerror', onPointerLockError);
    };
  }, [gl, setPointerLocked]);

  // 帧更新：移动
  useFrame((_state, delta) => {
    if (!isLockedRef.current || !enabled || isReading) return;
    const running = keys.current.shift;
    const speed = (running ? RUN_SPEED : WALK_SPEED) * delta;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let dx = 0, dz = 0;
    if (keys.current.w) { dx += forward.x * speed; dz += forward.z * speed; }
    if (keys.current.s) { dx -= forward.x * speed; dz -= forward.z * speed; }
    if (keys.current.d) { dx += right.x * speed; dz += right.z * speed; }
    if (keys.current.a) { dx -= right.x * speed; dz -= right.z * speed; }

    if (dx !== 0 || dz !== 0) {
      positionRef.current.x += dx;
      positionRef.current.z += dz;
      camera.position.copy(positionRef.current);
      onMove?.(positionRef.current);

      // 节流保存到 store（每 250ms 一次）
      const now = performance.now();
      if (now - lastSaveRef.current > 250) {
        lastSaveRef.current = now;
        setPosition([positionRef.current.x, positionRef.current.y, positionRef.current.z]);
        setRotation(yawRef.current, pitchRef.current);
      }
    }
  });

  useImperativeHandle(ref, () => ({
    lock: () => {
      const canvas = gl.domElement;
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    },
    unlock: () => {
      if (document.pointerLockElement) document.exitPointerLock();
    },
    isLocked: () => isLockedRef.current,
    move: (dx, dz) => {
      positionRef.current.x += dx;
      positionRef.current.z += dz;
      camera.position.copy(positionRef.current);
    },
    setRotation: (yaw, pitch) => {
      yawRef.current = yaw;
      pitchRef.current = pitch;
      applyRotation();
    },
    getCamera: () => camera as THREE.PerspectiveCamera,
  }));

  return null;
});
