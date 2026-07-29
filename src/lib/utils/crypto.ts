/**
 * 简易的 API Key 加密 / 解密
 * 使用浏览器特征指纹派生 AES-GCM 密钥
 * 注：客户端加密本质上无法对抗攻击者，这是"挡懒人"的安全
 */

const SALT = 'fl3d.salt.v1';

async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const fp = await getBrowserFingerprint();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(fp),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getBrowserFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    new Date().getTimezoneOffset(),
  ];
  return parts.join('|');
}

export async function encryptApiKey(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plain),
  );
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  if (!encrypted) return '';
  try {
    const key = await deriveKey();
    const data = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const cipher = data.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return '';
  }
}
