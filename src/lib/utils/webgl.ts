/**
 * WebGL 支持检测
 * 优先 WebGL2，回退 WebGL1，都不行就返回 supported=false
 */

export type WebGLStatus =
  | { supported: true; version: 1 | 2; vendor: string; renderer: string }
  | { supported: false; error: string };

export function detectWebGL(): WebGLStatus {
  if (typeof document === 'undefined') {
    return { supported: false, error: 'SSR / no document' };
  }
  try {
    const canvas = document.createElement('canvas');

    // 1. 试 WebGL2
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
    }) as WebGL2RenderingContext | null;
    let version: 1 | 2 = 2;
    if (!gl) {
      gl = (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false })) as WebGLRenderingContext | null;
      version = 1;
    }
    if (!gl) {
      return {
        supported: false,
        error: '浏览器未启用 WebGL。请在浏览器设置中开启"硬件加速"，或更换支持 WebGL 的浏览器（Chrome / Edge / Firefox）。',
      };
    }

    // 2. 拿 debug info
    let vendor = 'unknown';
    let renderer = 'unknown';
    try {
      const dbg = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        vendor = (gl as any).getParameter(dbg.UNMASKED_VENDOR_WEBGL) ?? 'unknown';
        renderer = (gl as any).getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? 'unknown';
      } else {
        vendor = gl.getParameter(gl.VENDOR) as string;
        renderer = gl.getParameter(gl.RENDERER) as string;
      }
    } catch {
      /* 忽略 */
    }

    // 3. 检查"Disabled"或 sandboxed
    if (vendor === 'Disabled' || renderer === 'Disabled' || vendor === '0xffff' || renderer === '0xffff') {
      return {
        supported: false,
        error: '检测到 WebGL 已被沙盒禁用（常见于企业内网浏览器、微信 / QQ / 钉钉内置 WebView、或浏览器"硬件加速"被关闭）。请在系统设置或浏览器设置中开启硬件加速 / GPU 加速。',
      };
    }

    return { supported: true, version, vendor, renderer };
  } catch (e: any) {
    return { supported: false, error: e?.message ?? 'WebGL 检测异常' };
  }
}
