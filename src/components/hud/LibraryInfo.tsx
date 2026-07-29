import { useBookStore } from '@/stores/bookStore';
import { useProgressStore } from '@/stores/progressStore';

export function LibraryInfo() {
  const stubs = useBookStore((s) => s.stubs);
  const totalBooks = Object.keys(stubs).length;
  const totalRead = useProgressStore((s) => s.totalBooksRead);
  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.15em',
      pointerEvents: 'none',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10 }}>
        藏 书 <span style={{ color: 'var(--accent)' }}>{totalBooks}</span> · 已读 <span style={{ color: 'var(--accent)' }}>{totalRead}</span>
      </div>
    </div>
  );
}
