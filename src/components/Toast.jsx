import React from 'react';

/* ── 전역 토스트 시스템 ──
 * 사용법:
 *   import { useToast, ToastContainer } from './Toast';
 *   const toast = useToast();
 *   toast.success('저장됨'), toast.error('실패'), toast.info('메시지')
 *
 * App 루트에 <ToastContainer /> 한 번 추가하면 됨
 */

const ToastContext = React.createContext(null);

let _uid = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const add = React.useCallback((message, type = 'info', duration = 3000) => {
    const id = ++_uid;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const api = React.useMemo(() => ({
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error', dur ?? 4000),
    info:    (msg, dur) => add(msg, 'info', dur),
    warn:    (msg, dur) => add(msg, 'warn', dur),
  }), [add]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const TYPE_STYLE = {
  success: { bg: 'color-mix(in oklch, var(--mint) 15%, var(--surface))',    border: 'var(--mint)',   icon: '✓' },
  error:   { bg: 'color-mix(in oklch, var(--rose) 15%, var(--surface))',    border: 'var(--rose)',   icon: '✕' },
  warn:    { bg: 'color-mix(in oklch, var(--orange) 12%, var(--surface))',  border: 'var(--orange)', icon: '!' },
  info:    { bg: 'color-mix(in oklch, var(--violet) 12%, var(--surface))',  border: 'var(--violet)', icon: 'i' },
};

/* ── 연결 끊김 차단 모달 ──
 * 이미지 생성 중 네트워크가 끊기면 사용자가 다른 행동 못 하도록 블로킹
 * 사용: <NetworkBlockModal visible={offline && generating} />
 */
export const NetworkBlockModal = ({ visible, message }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(5,4,14,0.82)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20, pointerEvents: 'all',
    }}>
      {/* 스피너 링 */}
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <svg width={56} height={56} viewBox="0 0 56 56" fill="none" style={{ position: 'absolute', inset: 0, animation: 'nb-spin 1.1s linear infinite' }}>
          <circle cx={28} cy={28} r={23} stroke="rgba(167,139,255,0.15)" strokeWidth={4} />
          <path d="M28 5 A23 23 0 0 1 51 28" stroke="#a78bff" strokeWidth={4} strokeLinecap="round" />
        </svg>
        {/* 중앙 아이콘 */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#a78bff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
          </svg>
        </div>
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f8', letterSpacing: '-0.02em' }}>
          {message || '잠깐만 기다려주세요'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          이미지를 생성하는 중이에요.<br />연결이 복구되면 자동으로 계속됩니다.
        </div>
      </div>
      <style>{`@keyframes nb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const s = TYPE_STYLE[t.type] || TYPE_STYLE.info;
        return (
          <div key={t.id}
            onClick={() => onDismiss(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: s.bg, border: `1px solid color-mix(in oklch, ${s.border} 50%, transparent)`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              fontSize: 12, color: 'var(--text)',
              pointerEvents: 'auto', cursor: 'pointer',
              animation: 'toast-in 0.2s ease',
              minWidth: 220, maxWidth: 360,
            }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.border, flexShrink: 0,
              width: 16, height: 16, borderRadius: '50%',
              border: `1.5px solid color-mix(in oklch, ${s.border} 60%, transparent)`,
              display: 'grid', placeItems: 'center' }}>
              {s.icon}
            </span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
};
