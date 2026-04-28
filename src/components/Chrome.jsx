import React, { useState, useEffect } from 'react';
import { Icon, Avatar } from './Icons';
import { signInWithGoogle, signOut, saveAuth, loadAuth } from '../lib/auth';
import { SubscriptionView } from './SubscriptionView';

/* ── 로그인 모달 ──────────────────────────────────────────────────────────── */
export function LoginModal({ open, onClose, onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!open) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      console.log('[auth] signInWithGoogle result:', result);
      const { token, user } = result;
      saveAuth(token, user);
      onLogin(user);
      onClose();
    } catch (e) {
      if (e?.code === 'auth/popup-closed-by-user') { setLoading(false); return; }
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 340, background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 20,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>로그인</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Google 계정으로 계속하세요</div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', textAlign: 'center',
          }}>{error}</div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#fff', color: '#333', border: 'none', borderRadius: 10,
            padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? <span style={{ width: 16, height: 16, border: '2px solid #ccc', borderTopColor: '#555', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
            : <GoogleIcon />
          }
          {loading ? '로그인 중...' : 'Google로 계속하기'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', margin: 0 }}>
          로그인 시 이용약관 및 개인정보 처리방침에 동의합니다
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */
export const Topbar = ({ view, crumbs, onHome, user, onLoginClick }) => {
  const [subOpen, setSubOpen] = useState(false);
  return (
    <div className="topbar">
      <div className="brand" onClick={onHome} style={{ cursor: 'pointer' }}>
        <img src="/logo.png" alt="STEP D" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
        <div className="brand-name">STEP D<em>beta</em></div>
      </div>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <Icon name="chevron-right" size={12} style={{ color: 'var(--text-4)' }} />}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-right">
        <button className="btn ghost icon" title="구독 관리" onClick={() => setSubOpen(true)}>
          <Icon name="settings" size={16} />
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {/* 프로필 아바타 */}
        {user?.picture ? (
          <img src={user.picture} alt={user.name} title={user.name}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1.5px solid var(--border)' }} />
        ) : (
          <button className="btn ghost icon" title="로그인" onClick={onLoginClick}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <Icon name="user" size={14} style={{ color: 'var(--text-3)' }} />
          </button>
        )}
      </div>
      {subOpen && <SubscriptionView onClose={() => setSubOpen(false)} />}
    </div>
  );
};

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
export const Sidebar = ({ view, setView, activeProject, activeShort, onGoHome, user, setUser, onLoginClick }) => {
  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  const items = [
    { id: 'dashboard',  icon: 'home',   label: '대시보드' },
    { id: 'projects',   icon: 'folder', label: '프로젝트' },
    { id: 'templates',  icon: 'layers', label: '템플릿' },
    { id: 'assets',     icon: 'image',  label: '에셋 라이브러리' },
  ];

  const stage = activeShort?.stage;
  const STAGE_ORDER = ['scenario', 'cast', 'scene_image', 'scene_video', 'audio', 'done'];
  const stageIdx = STAGE_ORDER.indexOf(stage);

  const creditValue = 840;
  const creditMax = 1000;
  const creditPct = Math.max(0, Math.min(100, (creditValue / creditMax) * 100));
  const CreditBar = () => (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2, rgba(255,255,255,0.75))' }}>
        <Icon name="zap" size={14} className="ico" />
        <span>크레딧</span>
        <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ color: 'var(--mint)', fontWeight: 600 }}>{creditValue.toLocaleString()}</span>
          <span style={{ color: 'var(--text-4, rgba(255,255,255,0.45))' }}> / {creditMax.toLocaleString()}</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${creditPct}%`, height: '100%', background: 'var(--mint)', borderRadius: 999, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  const shortItems = activeShort ? [
    { id: 'canvas',      icon: 'split',    label: '워크플로우',     step: null,          sub: false },
    { id: 'script',      icon: 'doc',      label: '① 시나리오',    step: 'scenario',    sub: false },
    { id: 'characters',  icon: 'user',     label: '② 등장인물',    step: 'cast',        sub: false },
    { id: 'background',  icon: 'camera',   label: '배경 / 구도',   step: 'cast',        sub: true  },
    { id: 'imagechat',   icon: 'sparkles', label: 'AI 이미지 생성', step: null,          sub: true  },
    { id: 'scene-image', icon: 'image',    label: '③ 씬 이미지',   step: 'scene_image', sub: false },
    { id: 'render',      icon: 'film',     label: '④ 씬 영상',     step: 'scene_video', sub: false },
    { id: 'render',      icon: 'mic',      label: '나레이션 TTS',   step: 'audio',       sub: true  },
    { id: 'editor',      icon: 'edit',     label: '영상 편집기',    step: null,          sub: true  },
    { id: 'thumbnail',   icon: 'image',    label: '⑤ 썸네일',      step: null,          sub: false },
    { id: 'export',      icon: 'download', label: '합성·내보내기',  step: null,          sub: false },
  ] : [];

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {!activeProject ? (
        <>
          <div className="side-section">
            <div className="side-title">워크스페이스</div>
            {items.map(it => (
              <div key={it.id} className={'side-item ' + (view === it.id ? 'active' : '')} onClick={() => setView(it.id)}>
                <Icon name={it.icon} size={16} className="ico" /><span>{it.label}</span>
              </div>
            ))}
          </div>

          {user && (
            <div className="side-section" style={{ marginTop: 'auto' }}>
              <CreditBar />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="side-section">
            <div className="side-item" style={{ color: 'var(--text-3)', marginBottom: 4 }} onClick={onGoHome}>
              <Icon name="chevron-left" size={15} className="ico" /><span>모든 프로젝트</span>
            </div>
            <div className="side-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span>{activeProject.title}</span>
            </div>
            <div style={{ padding: '4px 10px 10px', fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot mint" /><span>진행 {activeProject.progress}%</span>
            </div>
            <div className={'side-item ' + (view === 'home' ? 'active' : '')} onClick={() => setView('home')}>
              <Icon name="grid" size={16} className="ico" /><span>프로젝트 홈</span>
            </div>
            {activeShort && (
              <>
                <div style={{ padding: '8px 10px 4px', fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="film" size={10} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{activeShort.title || '다큐'}</span>
                </div>
                {shortItems.map(it => {
                  const itemStageIdx = it.step ? STAGE_ORDER.indexOf(it.step) : -1;
                  const isDone    = it.step && stageIdx > itemStageIdx;
                  const isCurrent = it.step && stageIdx === itemStageIdx;
                  return (
                    <div key={it.id}
                      className={'side-item ' + (view === it.id ? 'active' : '')}
                      onClick={() => setView(it.id)}
                      style={{ paddingLeft: it.sub ? 32 : 20, fontSize: it.sub ? 12 : undefined }}
                    >
                      <Icon name={it.icon} size={16} className="ico" />
                      <span style={{ flex: 1 }}>{it.label}</span>
                      {isDone    && <Icon name="check" size={11} style={{ color: 'var(--mint)', flexShrink: 0 }} />}
                      {isCurrent && activeShort?.status === 'generating' && <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </>
            )}
          </div>
          {user && (
            <div className="side-section" style={{ marginTop: 'auto' }}>
              <CreditBar />
            </div>
          )}
        </>
      )}

      {/* 어드민 — admin role만 표시 */}
      {user?.role === 'admin' && (
        <>
          <div
            className={'side-item ' + (view === 'seeds' ? 'active' : '')}
            onClick={() => setView('seeds')}
            style={{ borderTop: '1px solid var(--border)', margin: 0, borderRadius: 0, padding: '10px 14px' }}
          >
            <Icon name="hash" size={16} className="ico" /><span>시드 라이브러리</span>
          </div>
          <div
            className={'side-item ' + (view === 'admin' ? 'active' : '')}
            onClick={() => setView('admin')}
            style={{ margin: 0, borderRadius: 0, padding: '10px 14px' }}
          >
            <Icon name="sparkles" size={16} className="ico" /><span>어드민 · 점수 태깅</span>
          </div>
        </>
      )}

      {/* 맨 아래 고정: 유저 프로필 */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 10px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8 }}>
            {user.picture
              ? <img src={user.picture} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--violet)', flexShrink: 0 }}>{user.name?.[0] ?? '?'}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <button onClick={handleLogout} title="로그아웃"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-4)', display: 'flex', borderRadius: 5, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
              <Icon name="log-out" size={14} />
            </button>
          </div>
        ) : (
          <div className="side-item" onClick={onLoginClick}>
            <Icon name="log-in" size={16} className="ico" /><span style={{ color: 'var(--text-2)' }}>로그인</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </aside>
  );
};
