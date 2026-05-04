import React from 'react';
import { api } from '../api.js';

const MEDIA_BASE = 'https://api.stepd.co.kr/api/media';
const LIMIT = 50;

const YT_STATUS_STYLE = {
  done:       { color: 'var(--mint)',   label: '✓ 게시됨' },
  uploading:  { color: 'var(--violet)', label: '⬆ 업로드 중' },
  processing: { color: 'var(--orange)', label: '⏳ 처리 중' },
  error:      { color: 'var(--rose)',   label: '✗ 오류' },
  pending:    { color: 'var(--text3)',  label: '대기 중' },
};

/* ── 토스트 ─────────────────────────────────────────────────────────── */
const Toast = ({ msg, onDone }) => {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 13, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', color: 'var(--mint)', whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  );
};

/* ── 별점 ────────────────────────────────────────────────────────────── */
const Stars = ({ score, cutKey, onDone }) => {
  const [hover,   setHover]   = React.useState(null);
  const [saving,  setSaving]  = React.useState(false);
  const [shortAvg, setShortAvg] = React.useState(null);

  const rate = async (s) => {
    setSaving(true);
    try {
      const res = await api.patch(`/cuts/${cutKey}/score`, { score: s === score ? null : s });
      onDone(s === score ? null : s);
      if (res?.short_avg != null) setShortAvg(res.short_avg);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const display = hover ?? score ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, opacity: saving ? 0.4 : 1 }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} onClick={() => !saving && rate(n)}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer', fontSize: 16, color: n <= display ? '#f59e0b' : 'var(--text4)', transition: 'color 0.1s' }}>★</span>
        ))}
      </div>
      {shortAvg != null && (
        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>이 쇼츠 평균: {shortAvg.toFixed(1)}★</div>
      )}
    </div>
  );
};

/* ── 컷 상세 모달 ────────────────────────────────────────────────────── */
const VideoDetailModal = ({ video, onClose, onScoreChange, onToast }) => {
  const [score,    setScore]    = React.useState(video.score);
  const [promoting, setPromoting] = React.useState(false);

  const handleScore = (s) => { setScore(s); onScoreChange(video.id, s); };

  const promoteToGold = async () => {
    setPromoting(true);
    try {
      const res = await api.post(`/cuts/${video.cut_key}/promote-to-gold`);
      onToast(`gold_image_prompts에 등록되었습니다 (#${res.id ?? res.gold_id ?? '?'})`);
    } catch (e) { alert(e.message); }
    finally { setPromoting(false); }
  };

  const videoUrl = video.video_path
    ? `${MEDIA_BASE}/${video.project_id}/shorts/${video.short_id}/${video.video_path}`
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{video.cut_key}</div>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>✕</button>
        </div>

        {videoUrl ? (
          <video src={videoUrl} controls style={{ width: '100%', borderRadius: 10, background: '#000', marginBottom: 14, maxHeight: 400 }} />
        ) : (
          <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--text4)', marginBottom: 14 }}>영상 없음</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <Stars score={score} cutKey={video.cut_key} onDone={handleScore} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{score ? `${score}점` : '미평가'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
          {[['프로젝트', video.project_title], ['쇼츠', video.short_title], ['씬', video.scene_key], ['모델', video.model], ['시드', video.seed], ['길이', video.duration_sec ? `${video.duration_sec}s` : '-']].map(([k, v]) => (
            <div key={k} className="flex gap-8">
              <span className="text-muted" style={{ minWidth: 50 }}>{k}</span>
              <span className="mono" style={{ fontSize: 11 }}>{v || '-'}</span>
            </div>
          ))}
        </div>

        {video.video_prompt_en && (
          <div style={{ marginBottom: 14, background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.65, color: 'var(--text2)' }}>
            {video.video_prompt_en}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button className="btn btn-ghost btn-sm" disabled={promoting} onClick={promoteToGold}
            style={{ fontSize: 12, color: 'var(--mint)', border: '1px solid var(--mint)' }}>
            {promoting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 등록 중...</> : '⭐ 이미지 Gold 등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── 소스 품질 슬라이더 ─────────────────────────────────────────────── */
const SourceQualitySlider = ({ urlHash, initialScore, onToast }) => {
  const [val,    setVal]    = React.useState(initialScore ?? 1.0);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/rag/sources/${urlHash}/quality`, { source_quality_score: val });
      onToast(`${res.chunks_updated ?? '?'}개 청크 업데이트됨`);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const pct = (val / 2) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 80, height: 4, borderRadius: 2, background: 'var(--bg3)', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: 'var(--mint)', borderRadius: 2 }} />
        <input type="range" min={0} max={2} step={0.1} value={val}
          onChange={e => setVal(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', margin: 0 }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--mint)', minWidth: 28 }}>{val.toFixed(1)}×</span>
      <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 7px' }} disabled={saving} onClick={save}>
        {saving ? <span className="spinner" style={{ width: 8, height: 8 }} /> : '저장'}
      </button>
    </div>
  );
};

/* ══ 메인 페이지 ════════════════════════════════════════════════════════ */
export const Videos = () => {
  const [videos,  setVideos]  = React.useState([]);
  const [total,   setTotal]   = React.useState(0);
  const [offset,  setOffset]  = React.useState(0);
  const [scoreFilter, setScoreFilter] = React.useState('');
  const [ytFilter,    setYtFilter]    = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [detail,  setDetail]  = React.useState(null);
  const [toast,   setToast]   = React.useState(null);

  const [publishes,      setPublishes]      = React.useState([]);
  const [publishLoading, setPublishLoading] = React.useState(true);

  // RAG 소스 (품질 슬라이더용)
  const [ragSources,      setRagSources]      = React.useState([]);
  const [ragSourcesOpen,  setRagSourcesOpen]  = React.useState(false);
  const [ragSourcesLoaded, setRagSourcesLoaded] = React.useState(false);

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset: off });
      if (scoreFilter) p.set('score', scoreFilter);
      if (ytFilter)    p.set('yt_status', ytFilter);
      const data = await api.get(`/videos?${p}`);
      setVideos(data.videos || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPublishes = async () => {
    setPublishLoading(true);
    try {
      const data = await api.get('/youtube/publishes?limit=200');
      setPublishes(data.publishes || []);
    } catch { /* YouTube 미연동 시 조용히 실패 */ }
    finally { setPublishLoading(false); }
  };

  const loadRagSources = async () => {
    try {
      const data = await api.get('/rag/sources?limit=200');
      setRagSources(data.sources || []);
      setRagSourcesLoaded(true);
    } catch { /* 실패 무시 */ }
  };

  React.useEffect(() => { load(0); }, [scoreFilter, ytFilter]);
  React.useEffect(() => { loadPublishes(); }, []);

  const handleScoreChange = (id, score) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, score } : v));
    if (detail?.id === id) setDetail(prev => ({ ...prev, score }));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  const publishByShort = React.useMemo(() => {
    const map = {};
    for (const p of publishes) {
      if (!map[p.short_id] || new Date(p.created_at) > new Date(map[p.short_id].created_at))
        map[p.short_id] = p;
    }
    return map;
  }, [publishes]);

  const ytSummary = React.useMemo(() => {
    const counts = { done: 0, uploading: 0, processing: 0, error: 0 };
    for (const p of publishes) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [publishes]);

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {detail && (
        <VideoDetailModal video={detail} onClose={() => setDetail(null)}
          onScoreChange={handleScoreChange} onToast={setToast} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">영상 태깅 · YouTube 배포</div>
        <div className="flex gap-8 ml-auto">
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setRagSourcesOpen(v => !v);
            if (!ragSourcesLoaded) loadRagSources();
          }}>
            소스 품질 {ragSourcesOpen ? '▲' : '▼'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { load(offset); loadPublishes(); }}>새로고침</button>
        </div>
      </div>
      <div className="page-sub">완성된 컷 영상 점수 관리 · YouTube 배포 현황 · 전체 {total.toLocaleString()}개</div>

      {/* RAG 소스 품질 패널 (접기/펼치기) */}
      {ragSourcesOpen && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>소스 품질 조정</div>
          {ragSources.length === 0
            ? <div style={{ color: 'var(--text4)', fontSize: 12 }}>소스 없음</div>
            : (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr><th>제목</th><th>카테고리</th><th>청크</th><th style={{ minWidth: 180 }}>품질 (0.0 ~ 2.0)</th></tr>
                  </thead>
                  <tbody>
                    {ragSources.map(s => (
                      <tr key={s.url_hash}>
                        <td style={{ fontSize: 12, maxWidth: 260 }}>
                          <div style={{ fontWeight: 500 }}>{s.source_title || '(제목 없음)'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text4)' }}>{s.channel || ''}</div>
                        </td>
                        <td><span className="badge badge-gray">{s.category || '-'}</span></td>
                        <td className="mono" style={{ fontSize: 12 }}>{s.chunk_count ?? '-'}</td>
                        <td>
                          <SourceQualitySlider
                            urlHash={s.url_hash}
                            initialScore={s.source_quality_score ?? 1.0}
                            onToast={setToast}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* YouTube 배포 현황 요약 카드 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'done',       label: '게시됨',     color: 'var(--mint)' },
          { key: 'uploading',  label: '업로드 중',  color: 'var(--violet)' },
          { key: 'processing', label: 'YT 처리 중', color: 'var(--orange)' },
          { key: 'error',      label: '오류',       color: 'var(--rose)' },
        ].map(({ key, label, color }) => (
          <div key={key} className="card" style={{ flex: '1 1 100px', padding: '12px 16px', borderLeft: `3px solid ${color}` }}>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color }}>{ytSummary[key] || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
        {!publishLoading && publishes.length === 0 && (
          <div className="card" style={{ flex: '1 1 200px', padding: '12px 16px', display: 'flex', alignItems: 'center', color: 'var(--text3)', fontSize: 12 }}>
            YouTube 배포 이력 없음
          </div>
        )}
      </div>

      {/* 게시된 영상 테이블 */}
      {publishes.filter(p => p.status === 'done' && p.youtube_url).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>게시된 영상</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>쇼츠</th><th>프로젝트</th><th>공개 설정</th><th>게시일</th><th>YouTube</th></tr>
              </thead>
              <tbody>
                {publishes.filter(p => p.status === 'done' && p.youtube_url).map(p => (
                  <tr key={p.job_id || p.short_id}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{p.short_title || p.short_id}</td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.project_title || p.project_id}</td>
                    <td>
                      <span className={`badge ${p.privacy_status === 'public' ? 'badge-mint' : p.privacy_status === 'unlisted' ? 'badge-blue' : 'badge-gray'}`}>
                        {p.privacy_status === 'public' ? '공개' : p.privacy_status === 'unlisted' ? '미등록' : '비공개'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      {p.published_at ? new Date(p.published_at).toLocaleString('ko') : '-'}
                    </td>
                    <td>
                      <a href={p.youtube_url} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
                        YouTube
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 컷 영상 테이블 */}
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>컷 영상 목록</div>
      <div className="flex gap-8 mb-16">
        <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ width: 150 }}>
          <option value="">전체 점수</option>
          <option value="unrated">미평가</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)} {n}점</option>)}
        </select>
        <select value={ytFilter} onChange={e => setYtFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">YouTube 전체</option>
          <option value="done">게시됨</option>
          <option value="uploading">업로드 중</option>
          <option value="processing">YT 처리 중</option>
          <option value="error">오류</option>
          <option value="none">미배포</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>컷 키</th><th>쇼츠</th><th>프로젝트</th><th>모델</th><th>점수</th><th>길이</th><th>YouTube</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : videos.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>영상 없음</td></tr>
            ) : videos.map(v => {
              const pub = publishByShort[v.short_id];
              const ytStyle = pub ? (YT_STATUS_STYLE[pub.status] || YT_STATUS_STYLE.pending) : null;
              return (
                <tr key={v.id}>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{v.cut_key}</td>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{v.short_title || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{v.project_title || '-'}</td>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--text4)' }}>{v.model?.split('/').pop() || '-'}</td>
                  <td>
                    <Stars score={v.score} cutKey={v.cut_key} onDone={(s) => handleScoreChange(v.id, s)} />
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{v.duration_sec ? `${v.duration_sec}s` : '-'}</td>
                  <td>
                    {pub ? (
                      pub.youtube_url
                        ? <a href={pub.youtube_url} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--rose)', fontWeight: 600, textDecoration: 'none' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
                            보기
                          </a>
                        : <span style={{ fontSize: 11, color: ytStyle?.color, fontWeight: 600 }}>{ytStyle?.label}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text4)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDetail(v)}>보기</button>
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
