import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';

export const NewProjectWizard = ({ onCreated, onClose }) => {
  const [step, setStep] = React.useState(1);
  const [title, setTitle] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const create = async () => {
    setLoading(true); setError(null);
    try {
      const project = await api.post('/api/projects', { title });
      onCreated(project);
    } catch (e) {
      setError(e.message || '프로젝트 생성 실패');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel" style={{ width: 'min(560px, 92vw)', boxShadow: 'var(--shadow-pop)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkles" size={16} style={{ color: 'var(--mint)' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>새 프로젝트 만들기</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>STEP {step} / 2</div>
          <button className="btn ghost icon sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        {step === 1 && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
              프로젝트 제목을 입력하세요. 프로젝트 안에서 여러 개의 다큐를 만들 수 있습니다.
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>프로젝트 제목</div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && title.trim()) setStep(2); }}
              autoFocus
              style={{ width: '100%', padding: '12px 14px', fontSize: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', outline: 'none', boxSizing: 'border-box' }}
              placeholder="예: 한강 로맨스 시리즈"
              onFocus={e => e.target.style.borderColor = 'var(--mint)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 24, minHeight: 200 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '40px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1.2s linear infinite' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>프로젝트 생성 중...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>프로젝트 제목</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { icon: 'film', label: '다큐', value: '여러 개 생성 가능' },
                    { icon: 'user', label: '등장인물', value: '프로젝트 공유' },
                    { icon: 'camera', label: '영상 클립', value: '씬별 자동 생성' },
                  ].map(s => (
                    <div key={s.label} className="panel" style={{ padding: 12, textAlign: 'center' }}>
                      <Icon name={s.icon} size={18} style={{ color: 'var(--mint)' }} />
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'color-mix(in oklch, var(--rose) 10%, var(--surface))', border: '1px solid var(--rose)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--rose)' }}>{error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {step === 2 && !loading && <button className="btn sm" onClick={() => { setStep(1); setError(null); }}>이전</button>}
          {step === 1 && <button className="btn sm primary" onClick={() => setStep(2)} disabled={!title.trim()}>다음</button>}
          {step === 2 && !loading && (
            <button className="btn sm primary" onClick={create}>
              <Icon name="sparkles" size={12} />프로젝트 생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
