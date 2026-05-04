import React from 'react';
import { api } from '../api.js';

const CONTENT_TYPES = [
  { value: 'docu',   label: '다큐멘터리' },
  { value: 'shorts', label: '숏츠' },
];

const TYPE_BADGE = {
  docu:   { bg: '#1e3a5f', color: '#60a5fa', label: '다큐' },
  shorts: { bg: '#1a3a2a', color: '#4ade80', label: '숏츠' },
};

function Badge({ type }) {
  const s = TYPE_BADGE[type] || { bg: '#2a2a2a', color: '#aaa', label: type };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

// 에피소드 편집 패널
function EpisodesEditor({ episodes, onChange }) {
  const add = () => onChange([...episodes, { ep: episodes.length + 1, title: '', arc: '', scenes: [''] }]);
  const remove = (i) => onChange(episodes.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = episodes.map((ep, idx) => idx === i ? { ...ep, [field]: val } : ep);
    onChange(next);
  };
  const updateScene = (epIdx, sIdx, val) => {
    const next = episodes.map((ep, idx) => {
      if (idx !== epIdx) return ep;
      const scenes = ep.scenes.map((s, si) => si === sIdx ? val : s);
      return { ...ep, scenes };
    });
    onChange(next);
  };
  const addScene = (epIdx) => {
    const next = episodes.map((ep, idx) => idx === epIdx ? { ...ep, scenes: [...ep.scenes, ''] } : ep);
    onChange(next);
  };
  const removeScene = (epIdx, sIdx) => {
    const next = episodes.map((ep, idx) => {
      if (idx !== epIdx) return ep;
      return { ...ep, scenes: ep.scenes.filter((_, si) => si !== sIdx) };
    });
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {episodes.map((ep, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 60 }}>EP {ep.ep || i + 1}</span>
            <input
              className="input"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="에피소드 제목"
              value={ep.title}
              onChange={e => update(i, 'title', e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => remove(i)}>삭제</button>
          </div>
          <textarea
            className="input"
            style={{ width: '100%', fontSize: 12, minHeight: 56, resize: 'vertical', marginBottom: 8 }}
            placeholder="아크 설명 — 이 에피소드에서 일어나는 일"
            value={ep.arc}
            onChange={e => update(i, 'arc', e.target.value)}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>씬 힌트</div>
          {ep.scenes.map((scene, si) => (
            <div key={si} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input
                className="input"
                style={{ flex: 1, fontSize: 12 }}
                placeholder={`씬 힌트 ${si + 1}`}
                value={scene}
                onChange={e => updateScene(i, si, e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)' }} onClick={() => removeScene(i, si)}>✕</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => addScene(i)} style={{ marginTop: 2, fontSize: 11 }}>+ 씬 힌트 추가</button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>+ 에피소드 추가</button>
    </div>
  );
}

// 템플릿 편집 모달
function TemplateModal({ template, onSave, onClose }) {
  const isNew = !template.id;
  const [form, setForm] = React.useState({
    name: template.name || '',
    content_type: template.content_type || 'docu',
    description: template.description || '',
    episodes: template.episodes || [],
    sort_order: template.sort_order ?? 0,
    is_active: template.is_active ?? true,
  });
  const [saving, setSaving] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return alert('이름을 입력하세요');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 24, width: 640, maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{isNew ? '새 템플릿' : '템플릿 편집'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 2 }}>
            <div className="label">이름</div>
            <input className="input" style={{ width: '100%' }} value={form.name} onChange={e => set('name', e.target.value)} placeholder="템플릿 이름" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">유형</div>
            <select className="input" value={form.content_type} onChange={e => set('content_type', e.target.value)}>
              {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ width: 60 }}>
            <div className="label">순서</div>
            <input className="input" type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
          </div>
        </div>

        <div>
          <div className="label">설명</div>
          <textarea className="input" style={{ width: '100%', minHeight: 48, resize: 'vertical' }}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="이 템플릿이 어떤 구조인지 한두 줄 설명" />
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>에피소드 구조</div>
          <EpisodesEditor episodes={form.episodes} onChange={v => set('episodes', v)} />
        </div>

        {!isNew && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
            활성화
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}

export function Templates() {
  const [templates, setTemplates] = React.useState([]);
  const [filter, setFilter] = React.useState('all');
  const [modal, setModal] = React.useState(null); // null | {template}
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/templates');
      setTemplates(data.templates || []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    if (modal.template?.id) {
      await api.patch(`/templates/${modal.template.id}`, form);
    } else {
      await api.post('/templates', form);
    }
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.del(`/templates/${id}`);
    await load();
  };

  const toggleActive = async (t) => {
    await api.patch(`/templates/${t.id}`, { is_active: !t.is_active });
    await load();
  };

  const visible = filter === 'all' ? templates : templates.filter(t => t.content_type === filter);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>기획 템플릿</h2>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>에피소드 구조 템플릿 관리 — AI가 기획 문서에 맞게 커스터마이징합니다</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ template: {} })}>+ 새 템플릿</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'docu', 'shorts'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? '전체' : f === 'docu' ? '다큐' : '숏츠'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>불러오는 중...</div>
      ) : visible.length === 0 ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>템플릿이 없습니다</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, background: 'var(--bg2)', opacity: t.is_active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Badge type={t.content_type} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</span>
                    {!t.is_active && <span style={{ fontSize: 11, color: 'var(--text3)' }}>(비활성)</span>}
                  </div>
                  {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{t.description}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(t.episodes || []).map((ep, i) => (
                      <span key={i} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text2)' }}>
                        EP{ep.ep} {ep.title}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(t)}>
                    {t.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal({ template: t })}>편집</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => handleDelete(t.id)}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TemplateModal
          template={modal.template}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
