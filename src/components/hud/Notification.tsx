import { useUIStore } from '@/stores/uiStore';

export function Notification() {
  const notifications = useUIStore((s) => s.notifications);
  const dismiss = useUIStore((s) => s.dismissNotification);
  return (
    <div style={{
      position: 'fixed',
      top: 120,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => dismiss(n.id)}
          style={{
            padding: '8px 16px',
            background: n.level === 'error' ? 'rgba(192, 80, 77, 0.85)' :
                        n.level === 'warn' ? 'rgba(204, 153, 51, 0.85)' :
                        n.level === 'success' ? 'rgba(68, 153, 68, 0.85)' :
                        'var(--bg-glass)',
            border: `1px solid ${n.level === 'error' ? '#c0504d' : n.level === 'warn' ? '#cc9933' : n.level === 'success' ? '#449944' : 'var(--border-glass)'}`,
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 13,
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            animation: 'slideUp 300ms ease-out',
            minWidth: 200,
            textAlign: 'center',
          }}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
