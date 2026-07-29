import { useUIStore } from '@/stores/uiStore';
import { useBookStore } from '@/stores/bookStore';

export function InteractionHint() {
  const hover = useUIStore((s) => s.hover);
  const stubs = useBookStore((s) => s.stubs);

  if (hover.type === null) return null;

  let text = '';
  let action = 'E';

  if (hover.type === 'book') {
    const stub = stubs[hover.id];
    text = stub?.title ?? '书';
    action = '取书';
  } else if (hover.type === 'shelf') {
    text = '书架';
    action = '浏览';
  } else if (hover.type === 'crystal-ball') {
    text = '水晶球';
    action = '搜索';
  } else if (hover.type === 'portal') {
    text = hover.data?.name ?? '拱门';
    action = '进入';
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(50% + 28px)',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      <div style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        按 [E] {action}
      </div>
      <div style={{
        fontSize: 16,
        color: 'var(--accent)',
        fontFamily: 'var(--font-display)',
        textShadow: '0 0 8px rgba(212, 175, 55, 0.5)',
        maxWidth: 320,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {text}
      </div>
    </div>
  );
}
