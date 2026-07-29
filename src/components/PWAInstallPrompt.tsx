import { useEffect, useState } from 'react';

/**
 * 移动端「添加到主屏幕」提示
 * - iOS: 走自家 prompt（不能拦截 beforeinstallprompt）
 * - Android/Desktop Chrome: 监听 beforeinstallprompt 事件
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 是否已经 dismiss
    if (localStorage.getItem('fl3d.pwaDismissed') === '1') {
      setDismissed(true);
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;

    if (isStandalone) {
      setDismissed(true);
      return;
    }

    if (isIOS && isMobile) {
      // iOS 没有 beforeinstallprompt，只能提示用户手动操作
      // 延迟 3 秒弹出，避免太快
      setTimeout(() => setShowIOSHint(true), 4000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowIOSHint(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || !showIOSHint) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDismissed(true);
        localStorage.setItem('fl3d.pwaDismissed', '1');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('fl3d.pwaDismissed', '1');
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        bottom: 100,
        left: 16,
        right: 16,
        background: 'linear-gradient(135deg, rgba(40,30,56,0.95), rgba(60,45,80,0.95))',
        border: '1px solid rgba(255, 200, 100, 0.4)',
        borderRadius: 12,
        padding: '12px 16px',
        zIndex: 100,
        color: '#f5ecd0',
        fontSize: 13,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        animation: 'slideUp 400ms ease-out',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: 'radial-gradient(circle, #ffc857, #c89030)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, boxShadow: '0 0 12px rgba(255, 200, 100, 0.4)',
      }}>📚</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#ffc857', marginBottom: 2 }}>
          添加到主屏幕，全屏体验
        </div>
        <div style={{ opacity: 0.85, fontSize: 12, lineHeight: 1.5 }}>
          {deferredPrompt
            ? '点击安装按钮即可添加到桌面，无浏览器 UI 干扰'
            : 'iOS：点击底部分享按钮 → 添加到主屏幕'}
        </div>
      </div>
      {deferredPrompt && (
        <button
          onClick={(e) => { e.stopPropagation(); handleInstall(); }}
          style={{
            background: '#ffc857', color: '#1a1428',
            border: 'none', borderRadius: 6, padding: '8px 14px',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          安装
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        style={{
          background: 'transparent', color: 'rgba(255,255,255,0.6)',
          border: 'none', padding: 4, fontSize: 18, cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}
