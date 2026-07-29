import { useEffect, useRef, useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * 移动端触摸控制
 * - 左侧：移动摇杆（虚拟）
 * - 右侧：视角控制（手指拖动）
 * - 中央偏下：交互按钮
 * - 自动请求横屏锁定
 */
export function TouchControls({ onMove, onLook, onInteract, visible }: {
  onMove: (x: number, y: number) => void;       // -1..1
  onLook: (dx: number, dy: number) => void;     // 像素增量
  onInteract: () => void;
  visible: boolean;
}) {
  const settings = useSettingsStore();
  const [showHint, setShowHint] = useState(false);
  const moveTouch = useRef<{ id: number | null; cx: number; cy: number; active: boolean }>({ id: null, cx: 0, cy: 0, active: false });
  const lookTouch = useRef<{ id: number | null; lx: number; ly: number; lastX: number; lastY: number }>({ id: null, lx: 0, ly: 0, lastX: 0, lastY: 0 });
  const moveKnobRef = useRef<HTMLDivElement>(null);
  const moveBaseRef = useRef<HTMLDivElement>(null);

  // 请求横屏
  useEffect(() => {
    const tryLock = async () => {
      try {
        const so = (screen as any).orientation;
        if (so?.lock) {
          await so.lock('landscape');
        }
      } catch {
        // 不支持锁定也不报错
      }
    };
    tryLock();
    // 监听方向变化
    const onChange = () => {
      if (window.matchMedia('(orientation: portrait)').matches) {
        // 仍竖屏
      }
    };
    window.addEventListener('orientationchange', onChange);
    return () => window.removeEventListener('orientationchange', onChange);
  }, []);

  // 移动摇杆
  const handleMoveStart = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (moveTouch.current.id !== null) return;
    moveTouch.current = {
      id: t.identifier,
      cx: t.clientX,
      cy: t.clientY,
      active: true,
    };
  }, []);

  const handleMoveMove = useCallback((e: React.TouchEvent) => {
    if (moveTouch.current.id === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== moveTouch.current.id) continue;
      const base = moveBaseRef.current;
      const knob = moveKnobRef.current;
      if (!base || !knob) continue;
      const rect = base.getBoundingClientRect();
      const maxR = rect.width / 2 - 18;
      const dx = t.clientX - moveTouch.current.cx;
      const dy = t.clientY - moveTouch.current.cy;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxR);
      const ang = Math.atan2(dy, dx);
      const kx = Math.cos(ang) * dist;
      const ky = Math.sin(ang) * dist;
      knob.style.transform = `translate(${kx}px, ${ky}px)`;
      // 输出
      const nx = kx / maxR;
      const ny = ky / maxR;
      onMove(nx, ny);
    }
  }, [onMove]);

  const handleMoveEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === moveTouch.current.id) {
        moveTouch.current = { id: null, cx: 0, cy: 0, active: false };
        const knob = moveKnobRef.current;
        if (knob) knob.style.transform = 'translate(0, 0)';
        onMove(0, 0);
      }
    }
  }, [onMove]);

  // 视角控制
  const handleLookStart = useCallback((e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    if (lookTouch.current.id !== null) return;
    lookTouch.current = { id: t.identifier, lx: t.clientX, ly: t.clientY, lastX: t.clientX, lastY: t.clientY };
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    if (lookTouch.current.id === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== lookTouch.current.id) continue;
      const dx = t.clientX - lookTouch.current.lastX;
      const dy = t.clientY - lookTouch.current.lastY;
      lookTouch.current.lastX = t.clientX;
      lookTouch.current.lastY = t.clientY;
      onLook(dx, dy);
    }
  }, [onLook]);

  const handleLookEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouch.current.id) {
        lookTouch.current = { id: null, lx: 0, ly: 0, lastX: 0, lastY: 0 };
      }
    }
  }, []);

  if (!visible) return null;

  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
  if (!isMobile) return null;

  return (
    <>
      {/* 左侧移动摇杆 */}
      <div
        ref={moveBaseRef}
        onTouchStart={handleMoveStart}
        onTouchMove={handleMoveMove}
        onTouchEnd={handleMoveEnd}
        onTouchCancel={handleMoveEnd}
        style={{
          position: 'fixed',
          bottom: 30,
          left: 30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255, 200, 100, 0.12)',
          border: '2px solid rgba(255, 200, 100, 0.3)',
          touchAction: 'none',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          ref={moveKnobRef}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 220, 130, 0.9), rgba(255, 180, 80, 0.6))',
            border: '2px solid rgba(255, 240, 200, 0.7)',
            boxShadow: '0 0 16px rgba(255, 200, 100, 0.4)',
            transition: 'transform 60ms linear',
          }}
        />
      </div>

      {/* 右侧视角控制 */}
      <div
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '50%',
          touchAction: 'none',
          zIndex: 49,
        }}
      />

      {/* 交互按钮 */}
      <button
        onClick={onInteract}
        style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 200, 100, 0.9), rgba(180, 130, 60, 0.8))',
          border: '2px solid rgba(255, 240, 200, 0.8)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 0 24px rgba(255, 200, 100, 0.5)',
          zIndex: 50,
          touchAction: 'manipulation',
        }}
      >
        取书
      </button>

      {/* 提示 */}
      {showHint && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', background: 'rgba(0,0,0,0.6)', color: 'white',
          borderRadius: 8, fontSize: 12, zIndex: 60,
        }}>
          左侧摇杆移动 · 右侧滑动视角 · 中间按钮交互
        </div>
      )}
    </>
  );
}
