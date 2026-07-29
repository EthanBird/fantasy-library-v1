import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { encryptApiKey } from '@/lib/utils/crypto';
import { useUIStore } from '@/stores/uiStore';
import { ModalShell } from './SearchTerminal';
import type { QualityPreset } from '@/types';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useSettingsStore();
  const openModal = useUIStore((s) => s.openModal);
  const notify = useUIStore((s) => s.notify);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [tab, setTab] = useState<'api' | 'visuals' | 'audio' | 'gameplay' | 'data'>('api');

  const saveApiKey = async () => {
    if (apiKey) {
      const encrypted = await encryptApiKey(apiKey);
      settings.setApiKeyEncrypted(encrypted);
      setApiKey('');
      notify({ level: 'success', message: 'API Key 已加密保存', durationMs: 1500 });
    }
  };

  return (
    <ModalShell title="设置" onClose={onClose} width={680}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-glass)' }}>
        {(['api', 'visuals', 'audio', 'gameplay', 'data'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? 'var(--bg-glass-light)' : 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0,
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              padding: '8px 16px',
            }}
          >
            {t === 'api' ? 'API' : t === 'visuals' ? '视觉' : t === 'audio' ? '音频' : t === 'gameplay' ? '游戏' : '数据'}
          </button>
        ))}
      </div>

      {tab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Base URL">
            <input
              value={settings.api.baseUrl}
              onChange={(e) => settings.setApiConfig({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="模型">
            <input
              value={settings.api.model}
              onChange={(e) => settings.setApiConfig({ model: e.target.value })}
              placeholder="gpt-4o-mini"
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="API Key">
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings.hasApiKey() ? '••••••••（已设置）' : 'sk-...'}
                style={{ flex: 1 }}
              />
              <button onClick={() => setShowKey((s) => !s)}>{showKey ? '隐藏' : '显示'}</button>
              <button onClick={saveApiKey} disabled={!apiKey} className="primary">保存</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              使用 Web Crypto 加密后存于 LocalStorage；导出时不包含
            </div>
          </Field>
          <Field label="Temperature">
            <input
              type="range" min="0" max="1" step="0.1"
              value={settings.api.temperature}
              onChange={(e) => settings.setApiConfig({ temperature: parseFloat(e.target.value) })}
            />
            <span style={{ marginLeft: 8 }}>{settings.api.temperature.toFixed(1)}</span>
          </Field>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.api.streamEnabled}
                onChange={(e) => settings.setApiConfig({ streamEnabled: e.target.checked })}
              />
              <span>启用流式响应</span>
            </label>
          </Field>
        </div>
      )}

      {tab === 'visuals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="画质">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['low', 'mid', 'high', 'ultra'] as QualityPreset[]).map((q) => (
                <button
                  key={q}
                  onClick={() => settings.setQuality(q)}
                  className={settings.visuals.qualityPreset === q ? 'primary' : ''}
                >
                  {q === 'low' ? '低' : q === 'mid' ? '中' : q === 'high' ? '高' : '极高'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="FOV">
            <input
              type="range" min="55" max="85" step="1"
              value={settings.visuals.fov}
              onChange={(e) => settings.setVisuals({ fov: parseInt(e.target.value) })}
            />
            <span style={{ marginLeft: 8 }}>{settings.visuals.fov}°</span>
          </Field>
          {(['enableBloom', 'enableVolumetric', 'enableParticles', 'enableAnimations'] as const).map((k) => (
            <Field key={k} label="">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.visuals[k]}
                  onChange={(e) => settings.setVisuals({ [k]: e.target.checked } as any)}
                />
                <span>{({ enableBloom: 'Bloom 光晕', enableVolumetric: '体积光', enableParticles: '粒子', enableAnimations: '动画' } as any)[k]}</span>
              </label>
            </Field>
          ))}
        </div>
      )}

      {tab === 'audio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(['master', 'ambient', 'sfx'] as const).map((k) => (
            <Field key={k} label={k === 'master' ? '主音量' : k === 'ambient' ? '环境音' : '音效'}>
              <input
                type="range" min="0" max="1" step="0.05"
                value={settings.audio[k]}
                onChange={(e) => settings.setAudio({ [k]: parseFloat(e.target.value) })}
              />
              <span style={{ marginLeft: 8 }}>{Math.round(settings.audio[k] * 100)}%</span>
            </Field>
          ))}
        </div>
      )}

      {tab === 'gameplay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={settings.gameplay.timeSystemEnabled}
                onChange={(e) => settings.setGameplay({ timeSystemEnabled: e.target.checked })}
              />
              <span>启用昼夜循环</span>
            </label>
          </Field>
          <Field label="时间">
            <input
              type="range" min="0" max="24" step="0.5"
              value={settings.gameplay.currentTimeOfDay}
              onChange={(e) => settings.setGameplay({ currentTimeOfDay: parseFloat(e.target.value) })}
            />
            <span style={{ marginLeft: 8 }}>{settings.gameplay.currentTimeOfDay.toFixed(1)}h</span>
          </Field>
          <Field label="天气">
            <div style={{ display: 'flex', gap: 4 }}>
              {(['clear', 'rain', 'snow', 'fog'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => settings.setWeather(w)}
                  className={settings.gameplay.weather === w ? 'primary' : ''}
                >
                  {w === 'clear' ? '晴' : w === 'rain' ? '雨' : w === 'snow' ? '雪' : '雾'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {tab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => openModal('import-export')} className="primary">
            导入 / 导出整个图书馆
          </button>
          <button onClick={() => openModal('history')}>查看阅读历史</button>
          <button
            onClick={() => {
              if (confirm('确定清空所有数据？此操作不可恢复')) {
                useBookStoreClear();
                settings.reset();
                notify({ level: 'success', message: '数据已清空', durationMs: 1500 });
              }
            }}
            className="danger"
          >
            清空所有数据
          </button>
        </div>
      )}
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>{label}</label>}
      {children}
    </div>
  );
}

import { useBookStore } from '@/stores/bookStore';
function useBookStoreClear() {
  return useBookStore.getState().clearAll();
}
