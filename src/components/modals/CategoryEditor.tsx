import { useState } from 'react';
import { useBookStore } from '@/stores/bookStore';
import { useUIStore } from '@/stores/uiStore';
import { ModalShell } from './SearchTerminal';
import { aiService } from '@/lib/ai/service';
import { THEMES, THEME_LIST } from '@/data/themes';
import type { BookTheme, BookStub } from '@/types';

export function CategoryEditor({ onClose }: { onClose: () => void }) {
  const stubs = useBookStore((s) => s.stubs);
  const upsertStub = useBookStore((s) => s.upsertStub);
  const notify = useUIStore((s) => s.notify);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  const list = Object.values(stubs);
  const selected: BookStub | null = selectedId ? stubs[selectedId] ?? null : null;

  const handleRewrite = async (field: 'introduction' | 'category' | 'title') => {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await aiService.rewriteField({
        field,
        current: (selected as any)[field] ?? '',
        userRequest: instruction || '润色一下',
        context: {
          title: selected.title,
          author: selected.author,
          category: selected.category,
          theme: selected.theme,
        },
      });
      if (typeof result === 'string' && result) {
        await upsertStub({ ...selected, [field]: result, isUserEdited: true });
        notify({ level: 'success', message: '已更新', durationMs: 1500 });
      }
    } catch (e: any) {
      if (e?.message === 'NO_API_KEY') {
        notify({ level: 'warn', message: '需配置 API 才能使用 AI 编辑', durationMs: 2000 });
      } else {
        notify({ level: 'error', message: '编辑失败', durationMs: 2000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTheme = async (theme: BookTheme) => {
    if (!selected) return;
    await upsertStub({ ...selected, theme, isUserEdited: true });
  };

  return (
    <ModalShell title="分类编辑器" onClose={onClose} width={680}>
      <div style={{ display: 'flex', gap: 16, height: 500 }}>
        {/* 左：列表 */}
        <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid var(--border-glass)', paddingRight: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>所有书（{list.length}）</div>
          {list.slice(0, 100).map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              style={{
                padding: '6px 8px',
                fontSize: 12,
                background: selectedId === s.id ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                color: selectedId === s.id ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                borderRadius: 4,
                marginBottom: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              《{s.title}》
            </div>
          ))}
        </div>

        {/* 右：编辑 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {!selected ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>从左侧选择一本书</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>书名</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={selected.title} onChange={(e) => upsertStub({ ...selected, title: e.target.value, isUserEdited: true })} style={{ flex: 1 }} />
                  <button onClick={() => handleRewrite('title')} disabled={loading}>AI 改</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>分类</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input value={selected.category} onChange={(e) => upsertStub({ ...selected, category: e.target.value, isUserEdited: true })} style={{ flex: 1 }} />
                  <button onClick={() => handleRewrite('category')} disabled={loading}>AI 改</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>主题</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {THEME_LIST.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleChangeTheme(t.id)}
                      className={selected.theme === t.id ? 'primary' : ''}
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      {t.zh}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>简介</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <textarea
                    value={selected.introduction}
                    onChange={(e) => upsertStub({ ...selected, introduction: e.target.value, isUserEdited: true })}
                    rows={6}
                    style={{ flex: 1, fontFamily: 'var(--font-body)' }}
                  />
                  <button onClick={() => handleRewrite('introduction')} disabled={loading}>AI 改</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI 改写指令</label>
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="例如：让简介更古朴、加入悬念"
                  style={{ width: '100%', marginTop: 4 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
