import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // 手动拆包：核心 / three / 后处理 / AI / React
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
          if (id.includes('postprocessing')) return 'vendor-post';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('katex') || id.includes('mdast') || id.includes('micromark') || id.includes('unified') || id.includes('hast')) return 'vendor-ai';
          if (id.includes('/react/') || id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('zustand') || id.includes('nanoid') || id.includes('idb') || id.includes('mitt')) return 'vendor-utils';
        },
        // chunk 文件名：vendor 走带 hash，入口走带 hash
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  worker: {
    format: 'es',
  },
});
