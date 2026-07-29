import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Fallback2D } from './components/Fallback2D';
import { detectWebGL } from './lib/utils/webgl';
import './styles/global.css';

// 全局错误捕获：在屏幕上显示错误（便于 2D 模式调试）
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
  div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:8px 16px;background:rgba(192,80,77,0.95);color:white;font-size:12px;font-family:monospace;max-height:200px;overflow:auto;';
  div.textContent = `[错误] ${msg}`;
  document.body.appendChild(div);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// 先检测 WebGL；不支持直接降级到 2D
const webgl = detectWebGL();

if (webgl.supported) {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (e: any) {
    console.error('[boot] 3D 渲染初始化失败，降级到 2D', e);
    showFatalError(`3D 初始化失败: ${e?.message ?? e}`);
    root.innerHTML = '';
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Fallback2D />
      </React.StrictMode>,
    );
  }
} else {
  console.warn('[boot] WebGL unavailable, falling back to 2D mode:', webgl.error);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Fallback2D />
    </React.StrictMode>,
  );
}
