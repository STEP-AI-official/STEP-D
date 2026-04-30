import React from 'react';
import { api } from '../api.js';

const STAGE_META = {
  scenario:    { cls: 'badge-blue',   label: '시나리오' },
  cast:        { cls: 'badge-violet', label: '캐스트' },
  scene_image: { cls: 'badge-orange', label: '이미지' },
  scene_video: { cls: 'badge-orange', label: '영상' },
  audio:       { cls: 'badge-violet', label: '오디오' },
  done:        { cls: 'badge-mint',   label: '완료' },
};
const STATUS_META = {
  pending:    { cls: 'badge-gray',   label: '대기' },
  generating: { cls: 'badge-orange', label: '생성중' },
  done:       { cls: 'badge-mint',   label: '완료' },
  failed:     { cls: 'badge-rose',   label: '실패' },
};

const DetailModal = ({ shortId, onClose }) => {
  const [d, setD] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get(`/shorts/${shortId}/detail`).then(setD).catch(console.error).finally(() => setLoading(false));
  }, [shortId]);

  const short = d?.short || {};
  const scenes = d?.scenes || [];
  const clips = d?.clips || [];
  const prog = d?.progress;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">쇼츠 상세</div>
        {loading ? <span className="spinner" /> : !d ? <span className="text-muted">데이터 없음</span> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 기본 정보 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['ID', short.id], ['제목', short.title], ['stage', short.stage], ['status', short.status], ['오류', short.error || '-']].map(([k, v]) => (
                <div key={k} className="flex gap-8">
                  <span className="text-muted" style={{ minWidth: 60, fontSize: 12 }}>{k}</span>
                  <span style={{ fontSize: 12 }}>{v || '-'}</span>
                </div>
              ))}
            </div>

            {/* 진행상태 */}
            {prog && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>진행 — {prog.step} ({prog.pct}%)</div>
                <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog.pct}%`, background: 'var(--mint)', borderRadius: 3 }} />
                </div>
              </div>
            )}

            {/* 시나리오 */}
            {d.scenario && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>시나리오</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{d.scenario.logline_ko || d.scenario.title_ko}</div>
              </div>
            )}

            {/* 씬 목록 */}
            {scenes.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>씬 ({scenes.length}개)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {scenes.map((s, i) => (
                    <div key={i} style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                      <span className="mono text-muted" style={{ marginRight: 8 }}>{s.scene_key}</span>
                      <span>{s.title_ko}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 클립 */}
            {clips.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>클립 ({clips.length}개)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {clips.map((c, i) => (
                    <div key={i} className="flex gap-8" style={{ fontSize: 12 }}>
                      <span className="mono text-muted" style={{ minWidth: 50 }}>{c.scene_key}</span>
                      <span className={`badge ${STATUS_META[c.status]?.cls || 'badge-gray'}`}>{c.status}</span>
                      {c.video_path && <a href={c.video_path} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 11 }}>영상</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export const Shorts = () => {
  const [shorts, setShorts] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [stage, setStage] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(null);
  const [detailId, setDetailId] = React.useState(null);
  const LIMIT = 50;

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset: off });
      if (stage)  p.set('stage',  stage);
      if (status) p.set('status', status);
      const data = await api.get(`/shorts?${p}`);
      setShorts(data.shorts || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(0); }, [stage, status]);

  const retry = async (id) => {
    setActing(id + '_r');
    try { await api.post(`/shorts/${id}/retry`); load(offset); }
    catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const del = async (id) => {
    if (!confirm('쇼츠를 삭제할까요?')) return;
    setActing(id + '_d');
    try { await api.del(`/shorts/${id}`); load(offset); }
    catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      {detailId && <DetailModal shortId={detailId} onClose={() => setDetailId(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">쇼츠</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>
      <div className="page-sub">전체 {total.toLocaleString()}개</div>

      <div className="flex gap-8 mb-16">
        <select value={stage} onChange={e => setStage(e.target.value)} style={{ width: 150 }}>
          <option value="">모든 stage</option>
          <option value="scenario">scenario</option>
          <option value="cast">cast</option>
          <option value="scene_image">scene_image</option>
          <option value="scene_video">scene_video</option>
          <option value="audio">audio</option>
          <option value="done">done</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">모든 status</option>
          <option value="pending">pending</option>
          <option value="generating">generating</option>
          <option value="done">done</option>
          <option value="failed">failed</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>제목</th><th>프로젝트</th><th>stage</th><th>status</th><th>오류</th><th>수정일</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : shorts.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>쇼츠 없음</td></tr>
            ) : shorts.map(s => {
              const sm = STAGE_META[s.stage]  || { cls: 'badge-gray', label: s.stage  };
              const st = STATUS_META[s.status] || { cls: 'badge-gray', label: s.status };
              return (
                <tr key={s.id}>
                  <td className="mono" style={{ color: 'var(--text3)', fontSize: 11 }}>{s.id}</td>
                  <td style={{ fontWeight: 500 }}>{s.title || '(제목 없음)'}</td>
                  <td className="text-muted mono" style={{ fontSize: 11 }}>{s.project_id}</td>
                  <td><span className={`badge ${sm.cls}`}>{sm.label}</span></td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td style={{ color: 'var(--rose)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.error || '-'}</td>
                  <td className="text-muted">{s.updated_at ? new Date(s.updated_at).toLocaleString('ko') : '-'}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(s.id)}>상세</button>
                      {s.status === 'failed' && (
                        <button className="btn btn-sm" style={{ background: 'var(--violet-dim)', color: 'var(--violet)' }}
                          disabled={acting === s.id + '_r'} onClick={() => retry(s.id)}>
                          {acting === s.id + '_r' ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '재시도'}
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" disabled={acting === s.id + '_d'} onClick={() => del(s.id)}>
                        {acting === s.id + '_d' ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => load(offset - LIMIT)}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)}>다음 ›</button>
        </div>
      )}
    </div>
  );
};
