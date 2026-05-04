import React from 'react';
import { api } from '../api.js';

// AI 파이프라인 단계별 프롬프트 관리
// GET  /api/admin/prompts          → { prompts: [{ key, stage, label, system, user, model, temperature, updated_at }] }
// GET  /api/admin/prompts/{key}    → single prompt
// PUT  /api/admin/prompts/{key}    → update fields
// POST /api/admin/prompts/{key}/reset → 기본값 복원

const STAGE_COLOR = {
  scenario:    { bg: 'color-mix(in srgb, var(--mint) 12%, transparent)',   text: 'var(--mint)' },
  cast:        { bg: 'color-mix(in srgb, #a78bfa 12%, transparent)',        text: '#a78bfa' },
  scene_image: { bg: 'color-mix(in srgb, var(--amber) 12%, transparent)',  text: 'var(--amber)' },
  scene_video: { bg: 'color-mix(in srgb, var(--rose) 12%, transparent)',   text: 'var(--rose)' },
  narration:   { bg: 'color-mix(in srgb, #38bdf8 12%, transparent)',       text: '#38bdf8' },
  other:       { bg: 'color-mix(in srgb, var(--text4) 12%, transparent)',  text: 'var(--text4)' },
};

const StageBadge = ({ stage }) => {
  const c = STAGE_COLOR[stage] || STAGE_COLOR.other;
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: c.bg, color: c.text }}>
      {stage}
    </span>
  );
};

const TokenCount = ({ text }) => {
  // rough estimate: 1 token ≈ 4 chars
  const n = Math.round((text || '').length / 4);
  return <span style={{ fontSize: 10, color: 'var(--text4)' }}>~{n.toLocaleString()} tok</span>;
};

const PromptEditor = ({ prompt, onSave, onReset, onClose }) => {
  const [system, setSystem] = React.useState(prompt.system || '');
  const [user, setUser] = React.useState(prompt.user || '');
  const [model, setModel] = React.useState(prompt.model || '');
  const [temperature, setTemperature] = React.useState(prompt.temperature ?? 0.7);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  const dirty = system !== (prompt.system || '') || user !== (prompt.user || '') ||
    model !== (prompt.model || '') || temperature !== (prompt.temperature ?? 0.7);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(prompt.key, { system, user, model, temperature });
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm(`'${prompt.key}' 프롬프트를 기본값으로 복원할까요?`)) return;
    setResetting(true);
    try {
      await onReset(prompt.key);
      onClose();
    } catch (e) { alert(e.message); }
    finally { setResetting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: 780, maxHeight: '90vh', overflow: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StageBadge stage={prompt.stage} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{prompt.label || prompt.key}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text4)' }}>{prompt.key}</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text4)', display: 'block', marginBottom: 4 }}>모델</label>
            <input value={model} onChange={e => setModel(e.target.value)}
              placeholder="claude-sonnet-4-6" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text4)', display: 'block', marginBottom: 4 }}>Temperature ({temperature})</label>
            <input type="range" min="0" max="1" step="0.05" value={temperature}
              onChange={e => setTemperature(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600 }}>System Prompt</label>
            <TokenCount text={system} />
          </div>
          <textarea value={system} onChange={e => setSystem(e.target.value)} rows={8}
            style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }}
            placeholder="You are..." />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 600 }}>User Prompt Template</label>
            <TokenCount text={user} />
            <span style={{ fontSize: 10, color: 'var(--text4)' }}>(변수: {'{'}{'{'} title {'}'}{'}'},  {'{'}{'{'} scenes {'}'}{'}'},  {'{'}{'{'} style {'}'}{'}'}  등)</span>
          </div>
          <textarea value={user} onChange={e => setUser(e.target.value)} rows={10}
            style={{ width: '100%', fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }}
            placeholder="다음 주제로..." />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" disabled={resetting} onClick={reset}>
            {resetting ? '복원 중...' : '기본값 복원'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>취소</button>
            <button className="btn btn-primary btn-sm" disabled={saving || !dirty} onClick={save}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Prompts = () => {
  const [prompts, setPrompts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null);
  const [filterStage, setFilterStage] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/prompts');
      setPrompts(data.prompts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const savePrompt = async (key, updates) => {
    await api.put(`/prompts/${key}`, updates);
    await load();
  };

  const resetPrompt = async (key) => {
    await api.post(`/prompts/${key}/reset`);
    await load();
  };

  const stages = ['all', ...new Set(prompts.map(p => p.stage).filter(Boolean))];

  const visible = prompts.filter(p => {
    if (filterStage !== 'all' && p.stage !== filterStage) return false;
    if (search && !p.key.includes(search) && !(p.label || '').includes(search)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">AI 프롬프트</div>
        <div className="flex gap-8 ml-auto">
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
        </div>
      </div>
      <div className="page-sub">코드 배포 없이 AI 단계별 프롬프트 · 모델 · Temperature 수정</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {stages.map(s => (
          <button key={s} className={`btn btn-sm ${filterStage === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterStage(s)}>
            {s === 'all' ? `전체 (${prompts.length})` : s}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="키 또는 이름 검색..." style={{ marginLeft: 'auto', width: 200 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div>
      ) : visible.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text4)' }}>
          {prompts.length === 0 ? '백엔드에서 프롬프트 목록을 불러올 수 없습니다.' : '검색 결과 없음'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(p => (
            <div key={p.key} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}
              onClick={() => setEditing(p)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <StageBadge stage={p.stage} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.label || p.key}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text4)' }}>{p.key}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {(p.system || '').slice(0, 120) || '(시스템 프롬프트 없음)'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>{p.model || '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>temp {p.temperature ?? '—'}</span>
                {p.updated_at && (
                  <span style={{ fontSize: 10, color: 'var(--text4)' }}>
                    {new Date(p.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); setEditing(p); }}>편집</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PromptEditor
          prompt={editing}
          onSave={savePrompt}
          onReset={resetPrompt}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};
