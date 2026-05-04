import React from 'react';
import { api } from '../api.js';

/* ── 공용 ─────────────────────────────────────────────────────────────── */
const ScoreButtons = ({ score, onChange, disabled }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[
      { v: 0, label: '비활성', color: 'var(--text4)' },
      { v: 1, label: '기본',   color: 'var(--blue)' },
      { v: 2, label: '우수',   color: 'var(--mint)' },
    ].map(({ v, label, color }) => (
      <button key={v}
        className={`btn btn-sm ${score === v ? 'btn-primary' : 'btn-ghost'}`}
        style={{ fontSize: 11, padding: '2px 8px', color: score === v ? undefined : color, opacity: disabled ? 0.5 : 1 }}
        disabled={disabled}
        onClick={e => { e.stopPropagation(); onChange(v); }}
      >{label}</button>
    ))}
  </div>
);

const IMG_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/media/';
const imgUrl = (projectId, path) => path ? `${IMG_BASE}${projectId}/${path}` : null;

/* ── Gold Characters ──────────────────────────────────────────────────── */
const CHAR_GENDER_OPTS = ['all', 'male', 'female', 'neutral', 'unknown'];

const CharModal = ({ char, onClose, onScoreChange }) => {
  const [saving, setSaving] = React.useState(false);
  const [localScore, setLocalScore] = React.useState(char.quality_score ?? 0);

  const handleScore = async (v) => {
    setLocalScore(v);
    setSaving(true);
    try {
      await api.patch(`/images/gold-characters/${char.id}`, { quality_score: v });
      onScoreChange(char.id, v);
    } catch (e) { alert(e.message); setLocalScore(char.quality_score ?? 0); }
    finally { setSaving(false); }
  };

  const thumb = imgUrl(char.project_id, char.image_path);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          {thumb && (
            <img src={thumb} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{char.name || '이름 없음'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
              {[char.gender, char.age_group, char.ethnicity].filter(Boolean).join(' · ')}
            </div>
            <ScoreButtons score={localScore} onChange={handleScore} disabled={saving} />
          </div>
        </div>

        {char.description && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>설명</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{char.description}</div>
          </div>
        )}

        {char.full_prompt && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>Full Prompt</div>
            <pre style={{ fontSize: 11, background: 'var(--bg2)', borderRadius: 6, padding: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--mono)', maxHeight: 260, overflowY: 'auto' }}>
              {char.full_prompt}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text4)', flexWrap: 'wrap', marginBottom: 16 }}>
          {char.source_short_id && <span>short: <span className="mono">{char.source_short_id}</span></span>}
          {char.created_at && <span>{new Date(char.created_at).toLocaleString('ko')}</span>}
        </div>

        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

const GoldCharactersPanel = () => {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [gender, setGender] = React.useState('all');
  const [scoreFilter, setScoreFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [saving, setSaving] = React.useState({});
  const PER_PAGE = 30;

  const load = React.useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
      if (gender !== 'all') params.set('gender', gender);
      if (scoreFilter !== 'all') params.set('quality_score', scoreFilter);
      const data = await api.get(`/images/gold-characters?${params}`);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [gender, scoreFilter, page]);

  React.useEffect(() => { load(); }, [load]);

  const handleScoreChange = async (id, score) => {
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/images/gold-characters/${id}`, { quality_score: score });
      setItems(prev => prev.map(c => c.id === id ? { ...c, quality_score: score } : c));
      if (selected?.id === id) setSelected(p => ({ ...p, quality_score: score }));
    } catch (e) { alert(e.message); }
    finally { setSaving(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Gold 캐릭터 <span style={{ color: 'var(--text4)', fontWeight: 400 }}>({total})</span></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={gender} onChange={e => { setGender(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }}>
            {CHAR_GENDER_OPTS.map(g => <option key={g} value={g}>{g === 'all' ? '성별 전체' : g}</option>)}
          </select>
          <select value={scoreFilter} onChange={e => { setScoreFilter(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }}>
            <option value="all">점수 전체</option>
            <option value="0">비활성 (0)</option>
            <option value="1">기본 (1)</option>
            <option value="2">우수 (2)</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
        </div>
      </div>

      {err && <div style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)', fontSize: 13 }}>캐릭터가 없습니다.</div>
      ) : (
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>썸네일</th>
                <th>이름</th>
                <th>성별</th>
                <th>연령대</th>
                <th>민족</th>
                <th>품질 점수</th>
                <th>생성일</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => {
                const thumb = imgUrl(c.project_id, c.image_path);
                const inactive = (c.quality_score ?? 0) === 0;
                return (
                  <tr key={c.id} style={{ opacity: inactive ? 0.45 : 1, cursor: 'pointer' }}
                    onClick={() => setSelected(c)}>
                    <td>
                      {thumb
                        ? <img src={thumb} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--bg2)', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--text4)' }}>없음</div>
                      }
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.name || '-'}</td>
                    <td><span className="badge badge-gray">{c.gender || '-'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.age_group || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.ethnicity || '-'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <ScoreButtons score={c.quality_score ?? 0} onChange={v => handleScoreChange(c.id, v)} disabled={!!saving[c.id]} />
                    </td>
                    <td className="text-muted">{c.created_at ? new Date(c.created_at).toLocaleDateString('ko') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>◀</button>
          <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>▶</button>
        </div>
      )}

      {selected && (
        <CharModal
          char={selected}
          onClose={() => setSelected(null)}
          onScoreChange={(id, score) => {
            setItems(prev => prev.map(c => c.id === id ? { ...c, quality_score: score } : c));
            setSelected(p => ({ ...p, quality_score: score }));
          }}
        />
      )}
    </div>
  );
};

/* ── Gold Scene Images ────────────────────────────────────────────────── */
const SCENE_TYPE_OPTS = ['all', 'character', 'background', 'object', 'abstract'];
const SHOT_SIZE_OPTS  = ['all', 'ECU', 'CU', 'MCU', 'MS', 'MLS', 'LS', 'WS', 'EWS'];

const SceneImageModal = ({ img, onClose, onScoreChange }) => {
  const [saving, setSaving] = React.useState(false);
  const [localScore, setLocalScore] = React.useState(img.quality_score ?? 0);

  const handleScore = async (v) => {
    setLocalScore(v);
    setSaving(true);
    try {
      await api.patch(`/images/gold-images/${img.id}`, { quality_score: v });
      onScoreChange(img.id, v);
    } catch (e) { alert(e.message); setLocalScore(img.quality_score ?? 0); }
    finally { setSaving(false); }
  };

  const src = imgUrl(img.project_id, img.image_path);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {src && (
          <img src={src} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, marginBottom: 16, background: 'var(--bg2)' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {img.scene_type && <span className="badge badge-blue" style={{ marginRight: 6 }}>{img.scene_type}</span>}
              {img.shot_size  && <span className="badge badge-gray">{img.shot_size}</span>}
            </div>
            {img.mood && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{img.mood}</div>}
          </div>
          <ScoreButtons score={localScore} onChange={handleScore} disabled={saving} />
        </div>

        {img.prompt && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>프롬프트</div>
            <pre style={{ fontSize: 11, background: 'var(--bg2)', borderRadius: 6, padding: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--mono)', maxHeight: 200, overflowY: 'auto' }}>
              {img.prompt}
            </pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text4)', flexWrap: 'wrap', marginBottom: 16 }}>
          {img.lens_style    && <span>렌즈: <span className="mono">{img.lens_style}</span></span>}
          {img.color_grade   && <span>색보정: <span className="mono">{img.color_grade}</span></span>}
          {img.lighting      && <span>라이팅: {img.lighting}</span>}
          {img.source_short_id && <span>short: <span className="mono">{img.source_short_id}</span></span>}
          {img.created_at    && <span>{new Date(img.created_at).toLocaleString('ko')}</span>}
        </div>

        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

const GoldSceneImagesPanel = () => {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [sceneType, setSceneType] = React.useState('all');
  const [shotSize, setShotSize] = React.useState('all');
  const [scoreFilter, setScoreFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [saving, setSaving] = React.useState({});
  const PER_PAGE = 30;

  const load = React.useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
      if (sceneType !== 'all') params.set('scene_type', sceneType);
      if (shotSize  !== 'all') params.set('shot_size', shotSize);
      if (scoreFilter !== 'all') params.set('quality_score', scoreFilter);
      const data = await api.get(`/images/gold-images?${params}`);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [sceneType, shotSize, scoreFilter, page]);

  React.useEffect(() => { load(); }, [load]);

  const handleScoreChange = async (id, score) => {
    setSaving(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/images/gold-images/${id}`, { quality_score: score });
      setItems(prev => prev.map(i => i.id === id ? { ...i, quality_score: score } : i));
      if (selected?.id === id) setSelected(p => ({ ...p, quality_score: score }));
    } catch (e) { alert(e.message); }
    finally { setSaving(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Gold 씬 이미지 <span style={{ color: 'var(--text4)', fontWeight: 400 }}>({total})</span></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={sceneType} onChange={e => { setSceneType(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }}>
            {SCENE_TYPE_OPTS.map(t => <option key={t} value={t}>{t === 'all' ? '씬 타입 전체' : t}</option>)}
          </select>
          <select value={shotSize} onChange={e => { setShotSize(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }}>
            {SHOT_SIZE_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? '샷 사이즈 전체' : s}</option>)}
          </select>
          <select value={scoreFilter} onChange={e => { setScoreFilter(e.target.value); setPage(1); }}
            style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }}>
            <option value="all">점수 전체</option>
            <option value="0">비활성 (0)</option>
            <option value="1">기본 (1)</option>
            <option value="2">우수 (2)</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
        </div>
      </div>

      {err && <div style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)', fontSize: 13 }}>이미지가 없습니다.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {items.map(img => {
            const src = imgUrl(img.project_id, img.image_path);
            const inactive = (img.quality_score ?? 0) === 0;
            return (
              <div key={img.id}
                style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', opacity: inactive ? 0.45 : 1, transition: 'opacity 0.15s' }}
                onClick={() => setSelected(img)}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--surface)' }}>
                  {src
                    ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--text4)' }}>이미지 없음</div>
                  }
                  {inactive && (
                    <div style={{ position: 'absolute', top: 6, right: 6 }}>
                      <span className="badge badge-gray" style={{ fontSize: 10 }}>비활성</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                    {img.scene_type && <span className="badge badge-blue" style={{ fontSize: 10 }}>{img.scene_type}</span>}
                    {img.shot_size  && <span className="badge badge-gray" style={{ fontSize: 10 }}>{img.shot_size}</span>}
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <ScoreButtons score={img.quality_score ?? 0} onChange={v => handleScoreChange(img.id, v)} disabled={!!saving[img.id]} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>◀</button>
          <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>▶</button>
        </div>
      )}

      {selected && (
        <SceneImageModal
          img={selected}
          onClose={() => setSelected(null)}
          onScoreChange={(id, score) => {
            setItems(prev => prev.map(i => i.id === id ? { ...i, quality_score: score } : i));
            setSelected(p => ({ ...p, quality_score: score }));
          }}
        />
      )}
    </div>
  );
};

/* ── 페이지 ───────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'characters', label: 'Gold 캐릭터' },
  { id: 'scenes',     label: 'Gold 씬 이미지' },
];

export const GoldImages = () => {
  const [tab, setTab] = React.useState('characters');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">Gold 이미지</div>
      </div>
      <div className="page-sub">RAG 학습용 고품질 캐릭터 · 씬 이미지 관리</div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '6px 6px 0 0', borderBottom: tab === t.id ? '2px solid var(--mint)' : '2px solid transparent' }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'characters' && <GoldCharactersPanel />}
        {tab === 'scenes'     && <GoldSceneImagesPanel />}
      </div>
    </div>
  );
};
