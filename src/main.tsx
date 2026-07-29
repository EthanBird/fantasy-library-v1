import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { detectWebGL } from './lib/utils/webgl';
import './styles/global.css';

// 注册 Service Worker（PWA 离线缓存 + 可安装）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 静默失败即可
    });
  });
}

// 全局错误捕获
window.addEventListener('error', (e) => {
  console.error('[GlobalError]', e.error ?? e.message);
  showFatalError(e.error?.message ?? e.message ?? '未知错误');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledRejection]', e.reason);
  showFatalError(String(e.reason ?? 'Promise rejected'));
});

function showFatalError(msg: string) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:12px 16px;background:rgba(192,80,77,0.95);color:white;font-size:13px;font-family:monospace;max-height:240px;overflow:auto;border-top:2px solid #c0504d;line-height:1.5;';
  div.textContent = `[错误] ${msg}`;
  document.body.appendChild(div);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// 检测 WebGL —— 必须支持
const webgl = detectWebGL();

if (!webgl.supported) {
  // 不支持 WebGL 时直接显示错误，不做 2D 降级
  root.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #2a1f3a 0%, #3a2f5a 100%);color:#f5ecd0;font-family:system-ui,sans-serif;padding:24px;">
      <div style="max-width:480px;text-align:center;">
        <div style="font-size:60px;margin-bottom:16px;">🔮</div>
        <h1 style="margin:0 0 12px;font-size:22px;color:#ffc857;letter-spacing:0.05em;">3D 渲染不可用</h1>
        <p style="line-height:1.6;font-size:14px;opacity:0.85;margin-bottom:24px;">${webgl.error}</p>
        <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,200,100,0.3);border-radius:8px;padding:16px;text-align:left;font-size:13px;line-height:1.7;">
          <div style="font-weight:600;margin-bottom:8px;color:#ffc857;">📋 解决建议：</div>
          <div>1. 用桌面浏览器（Chrome / Edge / Firefox）打开</div>
          <div>2. 浏览器设置中开启「硬件加速」</div>
          <div>3. 不要用微信/QQ/企业内嵌的 WebView 打开</div>
        </div>
        <button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;background:#ffc857;color:#1a1428;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;">重试</button>
      </div>
    </div>
  `;
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (e: any) {
    console.error('[boot] 3D 初始化失败', e);
    showFatalError(`3D 初始化失败: ${e?.message ?? e}`);
  }
}
