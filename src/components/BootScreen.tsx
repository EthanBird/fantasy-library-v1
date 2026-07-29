import { useUIStore } from '@/stores/uiStore';

export function BootScreen() {
  const progress = useUIStore((s) => s.bootProgress);
  const p = progress?.progress ?? 0;
  return (
    <div className="boot-screen">
      <div className="boot-bg" />
      <div className="boot-content">
        <div className="boot-rune" />
        <h1 className="boot-title">异世界图书馆</h1>
        <p className="boot-subtitle text-display">Fantasy Library · 3D</p>
        <div className="boot-progress">
          <div className="boot-progress-bar" style={{ width: `${p * 100}%` }} />
        </div>
        <p className="boot-step">{progress?.step ?? '初始化中…'}</p>
      </div>
      <style>{`
        .boot-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0820;
          z-index: 1000;
        }
        .boot-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #1a1430 0%, #0a0820 70%);
        }
        .boot-content {
          position: relative;
          text-align: center;
          color: var(--text-primary);
          z-index: 1;
        }
        .boot-rune {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          border: 2px solid var(--accent);
          border-radius: 50%;
          position: relative;
          animation: spin 3s linear infinite;
          box-shadow: 0 0 24px var(--accent);
        }
        .boot-rune::before {
          content: '';
          position: absolute;
          inset: 12px;
          border: 1px solid var(--magic);
          border-radius: 50%;
          animation: spin 2s linear infinite reverse;
        }
        .boot-title {
          font-family: var(--font-display);
          font-size: 36px;
          letter-spacing: 0.1em;
          color: var(--accent);
          text-shadow: 0 0 16px var(--accent);
          margin-bottom: 8px;
        }
        .boot-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          letter-spacing: 0.3em;
          margin-bottom: 32px;
        }
        .boot-progress {
          width: 280px;
          height: 2px;
          background: var(--bg-glass-light);
          border-radius: 1px;
          overflow: hidden;
          margin: 0 auto 16px;
        }
        .boot-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--magic));
          transition: width 0.3s ease-out;
          box-shadow: 0 0 8px var(--accent);
        }
        .boot-step {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.2em;
        }
      `}</style>
    </div>
  );
}
