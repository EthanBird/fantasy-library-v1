import { useState } from 'react';
import { useBookStore } from '@/stores/bookStore';
import { useUIStore } from '@/stores/uiStore';
import { ModalShell } from './SearchTerminal';

export function ImportExportDialog({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState<string>('');
  const exportAll = useBookStore((s) => s.exportAll);
  const importAll = useBookStore((s) => s.importAll);
  const notify = useUIStore((s) => s.notify);

  const handleExport = async () => {
    setProgress('正在打包你的图书馆…');
    try {
      const data = await exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fantasy-library-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setProgress(`✓ 已导出 ${data.stubs.length} 本书，${data.contents.length} 本有内容`);
      notify({ level: 'success', message: '图书馆已导出', durationMs: 2000 });
    } catch (e: any) {
      setProgress('✗ 导出失败：' + e?.message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProgress('正在解析…');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.version || !Array.isArray(data.stubs)) throw new Error('文件格式无效');
        setProgress('正在导入（将覆盖现有数据）…');
        await importAll(data);
        setProgress(`✓ 已导入 ${data.stubs.length} 本书`);
        notify({ level: 'success', message: '图书馆已导入', durationMs: 2000 });
      } catch (e: any) {
        setProgress('✗ 导入失败：' + e?.message);
        notify({ level: 'error', message: '导入失败', durationMs: 2000 });
      }
    };
    input.click();
  };

  return (
    <ModalShell title="导入 / 导出" onClose={onClose} width={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          将整个图书馆（所有书、书签、历史）打包为 JSON 文件；导入时将覆盖现有数据。<br />
          <span style={{ color: 'var(--text-muted)' }}>注意：API Key 不包含在导出包中。</span>
        </p>
        <button onClick={handleExport} className="primary">📥 导出图书馆</button>
        <button onClick={handleImport}>📤 导入图书馆</button>
        {progress && (
          <div style={{
            padding: 12,
            background: 'var(--bg-glass-light)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            {progress}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
