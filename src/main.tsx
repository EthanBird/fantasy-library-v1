import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Fallback2D } from './components/Fallback2D';
import { detectWebGL } from './lib/utils/webgl';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// 先检测 WebGL；不支持直接降级到 2D
const webgl = detectWebGL();

if (webgl.supported) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.warn('[boot] WebGL unavailable, falling back to 2D mode:', webgl.error);
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Fallback2D />
    </React.StrictMode>,
  );
}
