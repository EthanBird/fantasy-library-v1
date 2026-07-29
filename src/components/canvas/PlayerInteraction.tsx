import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import { useBookStore } from '@/stores/bookStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import { audioEngine } from '@/lib/audio/engine';
import { eventBus } from '@/lib/utils/eventbus';
import { HALLS } from '@/data/halls';
import { buildAABBList, buildRoomBounds, resolveCollision, type AABB } from '@/lib/controls/collision';

interface Props {
  controlsRef: React.RefObject<any>;
}

/**
 * 每帧：射线检测、按键交互、音频 listener 更新、碰撞
 */
export function PlayerInteraction({ controlsRef }: Props) {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const tmpVec = useRef(new THREE.Vector3());
  const lastInteract = useRef(0);
  const lastAudioSync = useRef(0);
  const lastHover = useRef<string>('');

  const setHover = useUIStore((s) => s.setHover);
  const openBook = useUIStore((s) => s.openBook);
  const notify = useUIStore((s) => s.notify);
  const setReading = usePlayerStore((s) => s.setReading);
  const setHall = usePlayerStore((s) => s.setHall);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const getStubsByHall = useBookStore((s) => s.getStubsByHall);
  const recordRead = useProgressStore((s) => s.recordRead);
  const recomputeUnlocks = useProgressStore((s) => s.recomputeUnlocks);
  const progress = useProgressStore();
  const ui = useUIStore();
  const fov = useSettingsStore((s) => s.visuals.fov);

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);

  useFrame((state, delta) => {
    const player = usePlayerStore.getState();
    if (player.isReading) return;

    const cam = camera as THREE.PerspectiveCamera;
    const camPos = cam.position;

    // 音频 listener 同步（节流 50ms）
    const now = state.clock.getElapsedTime() * 1000;
    if (now - lastAudioSync.current > 50) {
      lastAudioSync.current = now;
      const fwd = new THREE.Vector3();
      cam.getWorldDirection(fwd);
      audioEngine.updateListener([camPos.x, camPos.y, camPos.z], [fwd.x, fwd.y, fwd.z]);
    }

    // 碰撞：玩家位置 vs 当前馆厅的 AABB
    const hallId = player.hallId;
    const hall = HALLS[hallId];
    const aabbs: AABB[] = [
      ...buildRoomBounds(hall.parameters.roomSize),
      ...buildAABBList(
        hall.shelfLayout.map((s) => ({
          position: s.position,
          width: 2.4,
          height: 2.4,
          depth: 0.5,
        })),
      ),
    ];
    const desired: [number, number, number] = [camPos.x, camPos.y, camPos.z];
    const resolved = resolveCollision(desired, desired, 0.3, aabbs);
    if (resolved !== desired) {
      camPos.set(resolved[0], resolved[1], resolved[2]);
      setPosition([resolved[0], resolved[1], resolved[2]]);
    }

    // 射线检测
    raycaster.current.setFromCamera({ x: 0, y: 0 } as any, cam);
    raycaster.current.far = 6;
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    // 找到最近的可交互对象
    let hit: { type: 'book' | 'shelf' | 'crystal-ball' | 'portal'; id: string; data?: any } | null = null;
    for (const it of intersects) {
      let obj: THREE.Object3D | null = it.object;
      while (obj) {
        const tag = obj.userData.interactType as string | undefined;
        if (tag === 'book' && obj.userData.bookId) {
          hit = { type: 'book', id: obj.userData.bookId, data: obj.userData };
          break;
        } else if (tag === 'crystal-ball') {
          hit = { type: 'crystal-ball', id: 'crystal-ball' };
          break;
        } else if (tag === 'portal' && obj.userData.targetHall) {
          hit = { type: 'portal', id: obj.userData.targetHall, data: { targetHall: obj.userData.targetHall } };
          break;
        } else if (tag === 'shelf' && obj.userData.shelfId) {
          hit = { type: 'shelf', id: obj.userData.shelfId, data: obj.userData };
        }
        obj = obj.parent;
      }
      if (hit) break;
    }

    const hoverKey = hit ? `${hit.type}:${hit.id}` : '';
    if (hoverKey !== lastHover.current) {
      lastHover.current = hoverKey;
      if (hit) {
        setHover({ type: hit.type, id: hit.id, data: hit.data });
      } else {
        setHover({ type: null, id: '' });
      }
    }

    // 交互键 E
    if (hit && (now - lastInteract.current > 200)) {
      // 真实按键检查在 useEffect 监听 keydown
    }
  });

  // 键监听
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const t = performance.now();
      if (t - lastInteract.current < 200) return;
      lastInteract.current = t;

      const hover = useUIStore.getState().hover;
      if (hover.type === 'book') {
        audioEngine.playSfx('take');
        const stub = useBookStore.getState().stubs[hover.id];
        if (stub) {
          setReading(true);
          const content = useBookStore.getState().contents[hover.id];
          useUIStore.setState({ readingBookId: hover.id, readingPage: content?.lastPageRead ?? 0 });
        }
      } else if (hover.type === 'crystal-ball') {
        audioEngine.playSfx('hover');
        useUIStore.getState().openModal('search');
      } else if (hover.type === 'portal') {
        const target = hover.data?.targetHall as string;
        if (target) {
          audioEngine.playSfx('portal');
          useUIStore.getState().notify({ level: 'info', message: `正在传送至 ${HALLS[target as any]?.name.zh ?? target}…`, durationMs: 1500 });
          setTimeout(() => {
            setHall(target as any);
            setPosition([0, 1.6, 6]);
            camPosRef.current = [0, 1.6, 6];
            useProgressStore.getState().discoverHall(target as any);
          }, 600);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openBook, setHall, setPosition, setReading]);

  return null;
}

// 辅助引用
const camPosRef: { current: [number, number, number] | null } = { current: null };
