import React from 'react';
import { api } from '../api.js';

const CAT_BADGE = {
  docu_ko:       'badge-blue',
  docu_en:       'badge-violet',
  background_ko: 'badge-gray',
};
const CHUNK_TYPES = ['narration', 'interview', 'dialogue', 'broll'];
const LIMIT      = 100;
const CHUNK_LIMIT = 50;
const SCORE_LABEL = { 0: '비활성', 1: '기본', 2: '우수' };
const SCORE_BADGE = { 0: 'badge-gray', 1: 'badge-blue', 2: 'badge-mint' };


/* ── 공통 컴포넌트 ─────────────────────────────────────────────────────── */
const ScoreButtons = ({ score, onSet, saving }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[0, 1, 2].map(s => (
      <button key={s} className={`btn btn-sm ${score === s ? 'btn-primary' : 'btn-ghost'}`}
        disabled={saving} onClick={e => { e.stopPropagation(); onSet(s); }}>
        {SCORE_LABEL[s]}
      </button>
    ))}
  </div>
);

const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  totalPages > 1 ? (
    <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 14 }}>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={onPrev}>‹ 이전</button>
      <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
      <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={onNext}>다음 ›</button>
    </div>
  ) : null
);

/* ── 통계 바 ───────────────────────────────────────────────────────────── */
const StatsBar = ({ stats }) => {
  if (!stats || typeof stats !== 'object' || Object.keys(stats).length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
      {Object.entries(stats).map(([cat, s]) => (
        <div key={cat} className="card" style={{ flex: '1 1 160px', padding: '12px 16px' }}>
          <span className={`badge ${CAT_BADGE[cat] || 'badge-gray'}`} style={{ marginBottom: 8, display: 'inline-block' }}>{cat}</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{s.sources ?? '-'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>소스</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{s.chunks ?? '-'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>청크</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── 청크 타입 뱃지 ──────────────────────────────────────────────────── */
const CHUNK_TYPE_STYLE = {
  narration: { bg: 'var(--mint-dim)',   color: 'var(--mint)',   label: '나레이션' },
  interview: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: '인터뷰' },
  dialogue:  { bg: 'var(--violet-dim)', color: 'var(--violet)', label: '대화' },
  broll:     { bg: 'var(--bg3)',        color: 'var(--text3)',  label: 'B-roll' },
  unknown:   { bg: 'var(--bg3)',        color: 'var(--text4)',  label: '미분류' },
};
const ChunkTypeBadge = ({ type }) => {
  const s = CHUNK_TYPE_STYLE[type] || CHUNK_TYPE_STYLE.unknown;
  return (
    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  );
};

/* ── 소스 품질 슬라이더 ─────────────────────────────────────────────── */
const SourceQualitySlider = ({ urlHash, initialScore }) => {
  const [val,    setVal]    = React.useState(initialScore ?? 1.0);
  const [saving, setSaving] = React.useState(false);
  const [saved,  setSaved]  = React.useState(false);

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.patch(`/rag/sources/${urlHash}/quality`, { source_quality_score: val });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 72, height: 4, borderRadius: 2, background: 'var(--bg3)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(val / 2) * 100}%`, background: 'var(--mint)', borderRadius: 2 }} />
        <input type="range" min={0} max={2} step={0.1} value={val}
          onChange={e => { setVal(parseFloat(e.target.value)); setSaved(false); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', margin: 0 }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: 'var(--mint)', minWidth: 26 }}>{val.toFixed(1)}×</span>
      <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 6px' }} disabled={saving} onClick={save}>
        {saving ? <span className="spinner" style={{ width: 8, height: 8 }} /> : saved ? '✓' : '저장'}
      </button>
    </div>
  );
};

/* ── 청크 타입 재분류 패널 ─────────────────────────────────────────── */
const BackfillPanel = () => {
  const [useLlm,   setUseLlm]   = React.useState(true);
  const [running,  setRunning]  = React.useState(false);
  const [result,   setResult]   = React.useState(null);

  const run = async () => {
    setRunning(true); setResult(null);
    try {
      const r = await api.post(`/rag/backfill-chunk-types?use_llm=${useLlm}`);
      setResult(r);
    } catch (e) { setResult({ error: e.message }); }
    finally { setRunning(false); }
  };

  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>청크 타입 재분류</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={useLlm} onChange={e => setUseLlm(e.target.checked)} style={{ width: 'auto' }} />
          LLM 2차 분류 (unknown → gpt-4o-mini)
        </label>
        <button className="btn btn-ghost btn-sm" disabled={running} onClick={run}>
          {running ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 분류 중...</> : '재분류 실행'}
        </button>
        {result && !result.error && (
          <div style={{ fontSize: 12, color: 'var(--mint)' }}>
            ✓ {result.updated}개 업데이트
            {result.by_type && (
              <span style={{ marginLeft: 8, color: 'var(--text3)' }}>
                {Object.entries(result.by_type).map(([t, n]) => `${t}:${n}`).join(' · ')}
              </span>
            )}
          </div>
        )}
        {result?.error && <div style={{ fontSize: 12, color: 'var(--rose)' }}>{result.error}</div>}
      </div>
    </div>
  );
};

/* ══ TAB 1: 소스 (수집 + 목록) ═════════════════════════════════════════ */
const SourcesTab = ({ onStatsChange }) => {
  const [sources, setSources]           = React.useState([]);
  const [total, setTotal]               = React.useState(0);
  const [offset, setOffset]             = React.useState(0);
  const [loading, setLoading]           = React.useState(true);
  const [urlsText, setUrlsText]         = React.useState('');
  const [force, setForce]               = React.useState(false);
  const [ingesting, setIngesting]       = React.useState(false);
  const [ingestResults, setIngestResults] = React.useState(null);
  const [forceConfirm, setForceConfirm] = React.useState(false);
  const [drawerSource, setDrawerSource] = React.useState(null);
  const [deleting, setDeleting]         = React.useState(null);
  const [channelFilter, setChannelFilter] = React.useState('');
  const [channelSearch, setChannelSearch] = React.useState('');
  const [typeFilter, setTypeFilter]       = React.useState('');

  const [showBg, setShowBg] = React.useState(false);

  const loadSources = React.useCallback(async (off = 0, typeF = typeFilter, bg = showBg) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: LIMIT, offset: off });
      if (typeF) qs.set('chunk_type', typeF);
      if (!bg) qs.set('exclude_category', 'background_ko');
      const data = await api.get(`/rag/sources?${qs}`);
      setSources(data.sources || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [typeFilter, showBg]);

  React.useEffect(() => { loadSources(); }, [loadSources]);

  const ingest = async () => {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setIngesting(true); setIngestResults(null);
    try {
      const r = await api.post('/rag/ingest', { urls, force });
      setIngestResults(r.results || []);
      setUrlsText('');
      loadSources();
      if (onStatsChange) onStatsChange();
    } catch (e) { setIngestResults([{ ok: false, error: e.message }]); }
    finally { setIngesting(false); }
  };

  const delSource = async (hash) => {
    if (!confirm('이 소스와 모든 청크를 삭제할까요?')) return;
    setDeleting(hash);
    try { await api.del(`/rag/sources/${hash}`); loadSources(offset); if (onStatsChange) onStatsChange(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  // 채널 필터 — 로드된 소스 기반 프론트 필터링
  const channels = React.useMemo(() => {
    const set = new Set(sources.map(s => s.channel).filter(Boolean));
    return [...set].sort();
  }, [sources]);

  const filteredSources = React.useMemo(() => {
    let result = sources;
    if (channelFilter) result = result.filter(s => s.channel === channelFilter);
    if (channelSearch.trim()) {
      const q = channelSearch.trim().toLowerCase();
      result = result.filter(s => (s.channel || '').toLowerCase().includes(q) || (s.source_title || '').toLowerCase().includes(q));
    }
    return result;
  }, [sources, channelFilter, channelSearch]);

  const totalPages = Math.ceil(total / LIMIT);
  const page       = Math.floor(offset / LIMIT) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 수집 폼 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>URL 수집</div>
        <textarea
          value={urlsText}
          onChange={e => setUrlsText(e.target.value)}
          placeholder={'YouTube URL 입력 (줄바꿈으로 여러 개)\nhttps://youtube.com/watch?v=abc'}
          style={{ minHeight: 90, marginBottom: 10 }}
        />
        <div className="flex gap-8" style={{ marginBottom: 10, alignItems: 'center' }}>
          <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} style={{ width: 'auto' }} />
            force 재수집
          </label>
          <button className="btn btn-primary btn-sm ml-auto"
            disabled={ingesting || !urlsText.trim()}
            onClick={() => force ? setForceConfirm(true) : ingest()}>
            {ingesting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 수집 중...</> : '수집 시작'}
          </button>
        </div>
        {ingestResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {ingestResults.map((r, i) => (
              <div key={i} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12,
                background: r.ok ? 'var(--mint-dim)' : 'var(--rose-dim)',
                color:      r.ok ? 'var(--mint)'    : 'var(--rose)' }}>
                {r.ok ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>✓ {r.title} ({r.chunks}청크)</span>
                    {r.by_type && Object.entries(r.by_type).map(([t, n]) => (
                      <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.12)' }}>
                        {t} {n}
                      </span>
                    ))}
                  </div>
                ) : `✗ ${r.error}`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 소스 목록 */}
      <div className="card">
        <div className="flex" style={{ marginBottom: 10, alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600 }}>
            수집된 소스 <span className="mono" style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 13 }}>({total})</span>
            {(channelFilter || channelSearch) && (
              <span className="mono" style={{ color: 'var(--mint)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                → {filteredSources.length}개 표시
              </span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* chunk_type 서버 필터 */}
            {['', ...CHUNK_TYPES, 'unknown'].map(t => (
              <button key={t || 'all'}
                className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => { setTypeFilter(t); loadSources(0, t); }}>
                {t || '전체'}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
            {/* background 토글 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text3)', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={showBg} onChange={e => { setShowBg(e.target.checked); loadSources(0, typeFilter, e.target.checked); }} style={{ width: 'auto' }} />
              배경 포함
            </label>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
            {/* 채널 드롭다운 */}
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', borderRadius: 6, background: 'var(--bg2)', border: `1px solid ${channelFilter ? 'var(--mint)' : 'var(--border)'}`, color: 'var(--text1)', maxWidth: 180 }}>
              <option value="">전체 채널</option>
              {channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
            {/* 제목/채널 텍스트 검색 */}
            <input value={channelSearch} onChange={e => setChannelSearch(e.target.value)}
              placeholder="채널·제목 검색..."
              style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, background: 'var(--bg2)', border: `1px solid ${channelSearch ? 'var(--mint)' : 'var(--border)'}`, color: 'var(--text1)', width: 160 }} />
            {(channelFilter || channelSearch) && (
              <button className="btn btn-ghost btn-sm"
                onClick={() => { setChannelFilter(''); setChannelSearch(''); }}>초기화</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => loadSources(offset)}>새로고침</button>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr><th>제목</th><th>채널</th><th>청크 / 타입</th><th>수집일</th><th>품질</th><th></th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
                : filteredSources.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>{sources.length === 0 ? '소스 없음' : '필터 결과 없음'}</td></tr>
                : filteredSources.map(s => (
                  <tr key={s.url_hash}>
                    <td style={{ maxWidth: 240 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{s.source_title || '(제목 없음)'}</div>
                      <a href={s.source_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: 'var(--blue)', wordBreak: 'break-all' }}>{s.source_url}</a>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.channel || '-'}</td>
                    <td>
                      <span className="mono">{s.chunk_count ?? '-'}</span>
                      {s.by_type && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                          {Object.entries(s.by_type).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
                            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <ChunkTypeBadge type={t} />
                              <span className="mono" style={{ fontSize: 10, color: 'var(--text3)' }}>{n}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{s.ingested_at ? new Date(s.ingested_at).toLocaleString('ko') : '-'}</td>
                    <td>
                      <SourceQualitySlider urlHash={s.url_hash} initialScore={s.source_quality_score ?? 1.0} />
                    </td>
                    <td>
                      <div className="flex gap-8">
                        <button className="btn btn-ghost btn-sm" onClick={() => setDrawerSource(s)}>청크 보기</button>
                        <button className="btn btn-danger btn-sm" disabled={deleting === s.url_hash}
                          onClick={() => delSource(s.url_hash)}>
                          {deleting === s.url_hash ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages}
          onPrev={() => loadSources(offset - LIMIT)} onNext={() => loadSources(offset + LIMIT)} />
      </div>

      {/* 청크 타입 재분류 */}
      <BackfillPanel />

      {drawerSource && <ChunksDrawer source={drawerSource} onClose={() => setDrawerSource(null)} />}

      {forceConfirm && (
        <div className="modal-backdrop" onClick={() => setForceConfirm(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>force 재수집 확인</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.65 }}>
              force 옵션은 기존 청크를 <span style={{ color: 'var(--rose)' }}>전부 삭제</span>한 뒤 재수집합니다. 계속할까요?
            </div>
            <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setForceConfirm(false)}>취소</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setForceConfirm(false); ingest(); }}>force 수집</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══ TAB 2: 검색 테스트 ════════════════════════════════════════════════ */
const SearchTab = () => {
  const [query,      setQuery]      = React.useState('');
  const [searchN,    setSearchN]    = React.useState(5);
  const [searchType, setSearchType] = React.useState('');
  const [searching,  setSearching]  = React.useState(false);
  const [results,    setResults]    = React.useState(null);
  const [errMsg,     setErrMsg]     = React.useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults(null); setErrMsg(null);
    try {
      const body = { query: query.trim(), n: searchN };
      if (searchType) body.chunk_type = searchType;
      const r = await api.post('/rag/search', body);
      setResults(r.results || []);
    } catch (e) { setErrMsg(e.message); }
    finally { setSearching(false); }
  };

  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <div style={{ fontWeight: 600, marginBottom: 14 }}>RAG 검색 테스트</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="검색 쿼리..."
          style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && search()} />
        <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ width: 120 }}>
          <option value="">전체 타입</option>
          {CHUNK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={searchN} onChange={e => setSearchN(Number(e.target.value))} style={{ width: 80 }}>
          {[3, 5, 10].map(n => <option key={n} value={n}>top {n}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" disabled={searching || !query.trim()} onClick={search}>
          {searching ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '검색'}
        </button>
      </div>

      {errMsg && <div style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 8 }}>{errMsg}</div>}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {results.length === 0
            ? <div className="text-muted" style={{ textAlign: 'center', padding: 24 }}>결과 없음</div>
            : results.map((r, i) => {
              const pct = (r.score ?? r.similarity ?? 0) * 100;
              return (
                <div key={i} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div className="flex gap-8" style={{ marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {r.chunk_type && r.chunk_type !== 'unknown' && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text3)' }}>{r.chunk_type}</span>
                    )}
                    {r.source_quality_score != null && r.source_quality_score !== 1 && (
                      <span style={{ fontSize: 10, color: r.source_quality_score >= 1.5 ? 'var(--mint)' : 'var(--rose)' }}>품질 {r.source_quality_score.toFixed(1)}×</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.source_title}</span>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--bg3)', overflow: 'hidden', margin: '0 4px' }}>
                      <div style={{ height: '100%', width: `${pct.toFixed(1)}%`, background: 'var(--mint)' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--mint)', minWidth: 38, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text2)' }}>{r.chunk_text}</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

/* ══ TAB 3: Gold Scenarios ══════════════════════════════════════════════ */

/* 인라인 점수 + 피드백 입력 행 */
const ScoreRow = ({ item, onPatched, onDelete, deleting }) => {
  const [score,    setScore]    = React.useState(item.quality_score ?? 1);
  const [notes,    setNotes]    = React.useState(item.feedback_notes ?? '');
  const [expanded, setExpanded] = React.useState(false);
  const [saving,   setSaving]   = React.useState(false);

  const patch = async (newScore) => {
    const s = newScore ?? score;
    setSaving(true);
    try {
      await api.patch(`/rag/gold-scenarios/${item.id}/score`, { quality_score: s, feedback_notes: notes });
      onPatched(item.id, s, notes);
      setExpanded(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const SCORE_COLOR = { 0: 'var(--text4)', 1: 'var(--mint)', 2: '#f59e0b' };

  return (
    <>
      <tr style={{ opacity: score === 0 ? 0.45 : 1 }}>
        <td style={{ fontSize: 13, fontWeight: 500, maxWidth: 240 }}>
          {item.title || '(제목 없음)'}
          {item.feedback_notes && (
            <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {item.feedback_notes}
            </div>
          )}
        </td>
        <td>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(item.topic_tags || []).map(t => <span key={t} className="badge badge-gray" style={{ fontSize: 10 }}>{t}</span>)}
          </div>
        </td>
        <td style={{ whiteSpace: 'nowrap' }}>
          {/* 0/1/2 버튼 */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { v: 0, label: '비활성' },
              { v: 1, label: '기본' },
              { v: 2, label: '우수' },
            ].map(({ v, label }) => (
              <button key={v}
                className={`btn btn-sm ${score === v ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 10, padding: '2px 8px', color: score === v ? undefined : SCORE_COLOR[v] }}
                disabled={saving}
                onClick={e => { e.stopPropagation(); setScore(v); setExpanded(true); }}>
                {label}
              </button>
            ))}
          </div>
        </td>
        <td className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString('ko') : '-'}
        </td>
        <td>
          <button className="btn btn-danger btn-sm" disabled={deleting}
            onClick={e => { e.stopPropagation(); onDelete(item.id); }}>
            {deleting ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
          </button>
        </td>
      </tr>
      {/* 피드백 입력 확장 행 */}
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0 12px 10px', background: 'color-mix(in srgb, var(--mint) 4%, transparent)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="피드백 메모 (선택)"
                style={{ flex: 1, minHeight: 54, fontSize: 12, resize: 'vertical', padding: '6px 8px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(false)}>취소</button>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => patch()}>
                  {saving ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '저장'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const GoldScenarioModal = ({ id, onClose }) => {
  const [data,    setData]    = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab,     setTab]     = React.useState('summary');

  React.useEffect(() => {
    api.get(`/rag/gold-scenarios/${id}`)
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex" style={{ marginBottom: 14, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>구조 상세</div>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>✕</button>
        </div>

        {loading
          ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
          : !data
          ? <div className="text-muted" style={{ textAlign: 'center', padding: 40 }}>불러오기 실패</div>
          : <>
            <div style={{ marginBottom: 10, flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{data.title || '(제목 없음)'}</div>
              {data.topic_tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {data.topic_tags.map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                </div>
              )}
              <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                {data.created_at ? new Date(data.created_at).toLocaleString('ko') : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexShrink: 0 }}>
              {['summary', 'json'].map(t => (
                <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
                  {t === 'summary' ? '구조 요약' : 'JSON'}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px' }}>
              {tab === 'summary'
                ? <pre style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{data.structure_summary || '(없음)'}</pre>
                : <pre style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--mono)' }}>{JSON.stringify(data.scenario_json, null, 2)}</pre>
              }
            </div>
          </>
        }
      </div>
    </div>
  );
};

const GoldList = ({ pending }) => {
  const [items,   setItems]   = React.useState([]);
  const [total,   setTotal]   = React.useState(0);
  const [offset,  setOffset]  = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(null);
  const [detailId, setDetailId] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching,   setSearching]   = React.useState(false);
  const [searchRes,   setSearchRes]   = React.useState(null);
  const PAGE = 50;

  const load = React.useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE, offset: off, pending_review: pending });
      const data = await api.get(`/rag/gold-scenarios?${params}`);
      setItems(data.items || []);
      setTotal(data.total ?? 0);
      setOffset(off);
    } catch { /* 실패 무시 */ }
    finally { setLoading(false); }
  }, [pending]);

  React.useEffect(() => { load(0); }, [load]);

  const del = async (id) => {
    if (!confirm('삭제할까요?')) return;
    setDeleting(id);
    try { await api.del(`/rag/gold-scenarios/${id}`); load(offset); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const search = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setSearchRes(null);
    try {
      const r = await api.post('/rag/gold-scenarios/search', { query: searchQuery.trim(), n: 10 });
      setSearchRes(r.results || []);
    } catch { setSearchRes([]); }
    finally { setSearching(false); }
  };

  const handlePatched = (id, score, notes) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, quality_score: score, feedback_notes: notes } : it));

  const totalPages = Math.ceil(total / PAGE);
  const page       = Math.floor(offset / PAGE) + 1;
  const rows       = searchRes ?? items;

  return (
    <div>
      {/* 툴바 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>총 {total}개</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="유사 검색..." style={{ width: 180, padding: '5px 10px', fontSize: 12, borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text1)' }} />
          <button className="btn btn-ghost btn-sm" disabled={searching || !searchQuery.trim()} onClick={search}>
            {searching ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '검색'}
          </button>
          {searchRes && <button className="btn btn-ghost btn-sm" onClick={() => { setSearchRes(null); setSearchQuery(''); }}>초기화</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => load(offset)}>새로고침</button>
        </div>
      </div>

      {searchRes && (
        <div style={{ marginBottom: 10, padding: '5px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: 12, color: 'var(--text3)' }}>
          유사 검색 {searchRes.length}건 — 코사인 유사도 순
        </div>
      )}

      <div className="table-wrap" style={{ border: 'none' }}>
        <table>
          <thead>
            <tr><th>제목</th><th>주제 태그</th><th>품질 점수</th><th>생성일</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
              : rows.length === 0
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>없음</td></tr>
              : rows.map(it => (
                <ScoreRow key={it.id} item={it}
                  onPatched={handlePatched}
                  onDelete={del}
                  deleting={deleting === it.id} />
              ))
            }
          </tbody>
        </table>
      </div>

      {!searchRes && (
        <Pagination page={page} totalPages={totalPages}
          onPrev={() => load(offset - PAGE)} onNext={() => load(offset + PAGE)} />
      )}

      {detailId && <GoldScenarioModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
};

const GoldTab = () => {
  const [subTab, setSubTab]         = React.useState('pending');
  const [pendingCount, setPendingCount] = React.useState(null);

  React.useEffect(() => {
    api.get('/rag/gold-scenarios?pending_review=true&limit=1')
      .then(d => setPendingCount(d.total ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Gold Scenarios</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'pending',   label: '미검토', count: pendingCount },
            { id: 'reviewed',  label: '검토 완료' },
          ].map(t => (
            <button key={t.id}
              className={`btn btn-sm ${subTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSubTab(t.id)}
              style={{ position: 'relative' }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--rose)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 5px', fontWeight: 700 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'pending'  && <GoldList pending={true}  key="pending" />}
      {subTab === 'reviewed' && <GoldList pending={false} key="reviewed" />}
    </div>
  );
};

/* ══ TAB 4: AI Hub 배경 데이터셋 ═══════════════════════════════════════ */
const BackgroundTab = ({ onStatsChange }) => {
  const [dataRoot, setDataRoot]     = React.useState(null);
  const [path, setPath]             = React.useState('');
  const [sampleSize, setSampleSize] = React.useState(50000);
  const [shuffle, setShuffle]       = React.useState(true);
  const [force, setForce]           = React.useState(false);
  const [bgStats, setBgStats]       = React.useState(null);
  const [job, setJob]               = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg]     = React.useState(null);

  const loadDataRoot = async () => {
    try { const r = await api.get('/rag/background/data-root'); setDataRoot(r); }
    catch { /* 경고 생략 */ }
  };
  const loadBgStats = async () => {
    try { const r = await api.get('/rag/background/stats'); setBgStats(r); }
    catch { /* 경고 생략 */ }
  };

  React.useEffect(() => { loadDataRoot(); loadBgStats(); }, []);

  React.useEffect(() => {
    if (!job?.id || job?.status === 'done' || job?.status === 'error') return;
    const t = setInterval(async () => {
      try {
        const j = await api.get(`/rag/background/jobs/${job.id}`);
        setJob(j);
        if (j.status === 'done' || j.status === 'error') {
          loadBgStats();
          if (onStatsChange) onStatsChange();
        }
      } catch { /* 폴링 실패 무시 */ }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.status]);

  const start = async () => {
    if (!path.trim()) { setErrorMsg('경로를 입력하세요'); return; }
    setSubmitting(true); setErrorMsg(null); setJob(null);
    try {
      const r = await api.post('/rag/background/ingest-path', {
        path: path.trim(), sample_size: sampleSize > 0 ? sampleSize : null, shuffle, force,
      });
      const j = await api.get(`/rag/background/jobs/${r.job_id}`);
      setJob(j);
    } catch (e) { setErrorMsg(e.message); }
    finally { setSubmitting(false); }
  };

  const isRunning = job && (job.status === 'pending' || job.status === 'running');
  const prog = job?.progress || {};
  const processedFiles = prog.processed_files ?? 0;
  const totalFiles     = prog.total_files     ?? 0;
  const insertedNow    = prog.inserted        ?? 0;
  const skippedNow     = prog.skipped         ?? 0;
  const filePct   = totalFiles > 0 ? (processedFiles * 100 / totalFiles) : 0;
  const samplePct = sampleSize > 0 && insertedNow > 0 ? Math.min(100, insertedNow * 100 / sampleSize) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      {/* 현황 카드 */}
      {bgStats && (
        <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <span className="badge badge-gray">background_ko</span>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>
            청크 <span className="mono" style={{ color: 'var(--mint)', fontWeight: 700 }}>{(bgStats.chunks ?? 0).toLocaleString()}</span>
            <span style={{ margin: '0 8px', color: 'var(--border)' }}>·</span>
            소스 <span className="mono" style={{ color: 'var(--text2)' }}>{bgStats.sources ?? 0}</span>
          </span>
        </div>
      )}

      {/* 데이터 루트 상태 */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>AI Hub 배경 데이터셋 임포트</div>

        {dataRoot === null ? (
          <div className="text-muted" style={{ fontSize: 12 }}>데이터 루트 확인 중...</div>
        ) : !dataRoot.configured ? (
          <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
            BG_RAG_DATA_ROOT 환경변수가 설정되지 않았습니다.
          </div>
        ) : !dataRoot.exists ? (
          <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
            경로가 존재하지 않습니다: <span className="mono">{dataRoot.root}</span>
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
            <div style={{ color: 'var(--text3)', marginBottom: 6 }}>
              루트: <span className="mono" style={{ color: 'var(--text2)' }}>{dataRoot.root}</span>
            </div>
            {dataRoot.entries?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {dataRoot.entries.slice(0, 16).map(e => (
                  <button key={e.name} className="btn btn-ghost btn-sm" onClick={() => setPath(e.name)}
                    title={e.is_dir ? '디렉토리' : `${e.size?.toLocaleString()} bytes`}
                    style={{ fontSize: 11, padding: '3px 8px' }}>
                    {e.is_dir ? '📁 ' : '📄 '}{e.name}
                  </button>
                ))}
                {dataRoot.entries.length > 16 && (
                  <span className="text-muted" style={{ fontSize: 11, alignSelf: 'center' }}>+{dataRoot.entries.length - 16}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 입력 폼 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8, marginBottom: 10 }}>
          <input value={path} onChange={e => setPath(e.target.value)}
            placeholder="경로 (예: aihub_71784/Training/label)" disabled={isRunning} />
          <input type="number" min={0} step={1000} value={sampleSize}
            onChange={e => setSampleSize(parseInt(e.target.value) || 0)}
            placeholder="샘플 크기 (0=전체)" disabled={isRunning} />
        </div>

        <div className="flex gap-8" style={{ marginBottom: 10 }}>
          <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} disabled={isRunning} style={{ width: 'auto' }} />파일 셔플
          </label>
          <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} disabled={isRunning} style={{ width: 'auto' }} />force 재적재
          </label>
          <button className="btn btn-primary btn-sm ml-auto" disabled={submitting || isRunning || !path.trim()} onClick={start}>
            {submitting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 시작 중...</>
              : isRunning ? '진행 중...' : '임포트 시작'}
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 6, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>
            {errorMsg}
          </div>
        )}

        {/* 진행률 */}
        {job && (
          <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '12px 14px', fontSize: 12 }}>
            <div className="flex" style={{ marginBottom: 10, alignItems: 'center' }}>
              <span className={`badge ${job.status === 'done' ? 'badge-mint' : job.status === 'error' ? 'badge-orange' : 'badge-blue'}`}>
                {job.status}
              </span>
              <span className="mono ml-auto" style={{ color: 'var(--text3)', fontSize: 10 }}>{job.id}</span>
            </div>
            {totalFiles > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div className="flex" style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                  <span>파일 {processedFiles.toLocaleString()} / {totalFiles.toLocaleString()}</span>
                  <span className="ml-auto mono">{filePct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${filePct}%`, background: 'var(--blue)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {sampleSize > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div className="flex" style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                  <span>적재 {insertedNow.toLocaleString()} / {sampleSize.toLocaleString()}</span>
                  <span className="ml-auto mono">{samplePct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${samplePct}%`, background: 'var(--mint)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
              <span>적재 <span className="mono" style={{ color: 'var(--mint)' }}>{insertedNow.toLocaleString()}</span></span>
              <span>스킵 <span className="mono">{skippedNow.toLocaleString()}</span></span>
              {prog.phase && <span>phase <span className="mono">{prog.phase}</span></span>}
            </div>
            {job.status === 'done' && job.result && (
              <div style={{ marginTop: 8, color: 'var(--mint)' }}>
                ✓ 완료 — files={job.result.total_files?.toLocaleString()}, inserted={job.result.total_inserted?.toLocaleString()}, skipped={job.result.total_skipped?.toLocaleString()}
                {job.result.stopped_early && ' (샘플 도달로 조기 종료)'}
              </div>
            )}
            {job.status === 'error' && (
              <div style={{ marginTop: 8, color: 'var(--rose)' }}>✗ {job.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══ 청크 드로어 / 청크 모달 (소스 탭에서 사용) ═════════════════════════ */
const ChunkDetailModal = ({ chunk, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ChunkTypeBadge type={chunk.chunk_type} />
        {chunk.scene_position && (
          <span style={{ fontSize: 10, color: 'var(--text4)', padding: '1px 6px', borderRadius: 4, background: 'var(--bg3)' }}>{chunk.scene_position}</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>청크 #{chunk.chunk_index}</span>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>✕</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{chunk.source_title} — {chunk.channel}</div>
      <a href={chunk.source_url} target="_blank" rel="noreferrer"
        style={{ fontSize: 11, color: 'var(--blue)', wordBreak: 'break-all', display: 'block', marginBottom: 12 }}>
        {chunk.source_url}
      </a>
      <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>
        {chunk.chunk_text}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
        <span>글자수 <span className="mono">{chunk.char_count ?? chunk.chunk_text?.length ?? '-'}</span></span>
        <span>임베딩 차원 <span className="mono" style={{ color: 'var(--mint)' }}>{chunk.embedding_dim ?? '-'}</span></span>
        <span>수집일 {chunk.created_at ? new Date(chunk.created_at).toLocaleDateString('ko') : '-'}</span>
      </div>
    </div>
  </div>
);

const ChunksDrawer = ({ source, onClose }) => {
  const [chunks, setChunks]             = React.useState([]);
  const [total, setTotal]               = React.useState(0);
  const [offset, setOffset]             = React.useState(0);
  const [loading, setLoading]           = React.useState(true);
  const [detail, setDetail]             = React.useState(null);
  const [loadingDetail, setLoadingDetail] = React.useState(null);

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const data = await api.get(`/rag/sources/${source.url_hash}/chunks?limit=${CHUNK_LIMIT}&offset=${off}`);
      setChunks(data.chunks || []);
      setTotal(data.total_chunks ?? 0);
      setOffset(off);
    } catch { /* 에러 무시 */ }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(0); }, [source.url_hash]);

  const openChunk = async (chunkIndex) => {
    setLoadingDetail(chunkIndex);
    try {
      const data = await api.get(`/rag/sources/${source.url_hash}/chunks/${chunkIndex}`);
      setDetail(data);
    } catch (e) { alert(e.message); }
    finally { setLoadingDetail(null); }
  };

  const totalPages = Math.ceil(total / CHUNK_LIMIT);
  const page       = Math.floor(offset / CHUNK_LIMIT) + 1;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 660, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex" style={{ alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{source.source_title || source.source_url}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {source.channel} · 총 {total}청크
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {loading
              ? <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div>
              : chunks.length === 0
              ? <div className="text-muted" style={{ textAlign: 'center', padding: 32 }}>청크 없음</div>
              : chunks.map(c => (
                <div key={c.id} onClick={() => openChunk(c.chunk_index)}
                  style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', opacity: loadingDetail === c.chunk_index ? 0.5 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text4)', minWidth: 24 }}>#{c.chunk_index}</span>
                    <ChunkTypeBadge type={c.chunk_type} />
                    <span style={{ fontSize: 10, color: 'var(--text4)', marginLeft: 'auto' }}>{c.chunk_text?.length ?? '-'}자</span>
                    {loadingDetail === c.chunk_index && <span className="spinner" style={{ width: 10, height: 10 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {c.chunk_text}
                  </div>
                </div>
              ))
            }
          </div>

          <Pagination page={page} totalPages={totalPages}
            onPrev={() => load(offset - CHUNK_LIMIT)} onNext={() => load(offset + CHUNK_LIMIT)} />
        </div>
      </div>
      {detail && <ChunkDetailModal chunk={detail} onClose={() => setDetail(null)} />}
    </>
  );
};

/* ══ 메인 페이지 ════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'sources',    label: '소스' },
  { id: 'search',     label: '검색 테스트' },
  { id: 'gold',       label: 'Gold Scenarios' },
  { id: 'background', label: '배경 데이터' },
];

export const Rag = () => {
  const [stats, setStats] = React.useState(null);
  const [tab,   setTab]   = React.useState('sources');

  const loadStats = React.useCallback(async () => {
    try {
      const data = await api.get('/rag/stats');
      setStats(data.by_category ?? {});
    } catch { /* 통계 없으면 숨김 */ }
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">RAG 관리</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={loadStats}>새로고침</button>
      </div>
      <div className="page-sub">유튜브 소스 수집 · 검색 테스트 · Gold Scenarios · 배경 데이터셋</div>

      <StatsBar stats={stats} />

      {/* 탭 헤더 */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '6px 6px 0 0', borderBottom: tab === t.id ? '2px solid var(--mint)' : '2px solid transparent', marginBottom: -1 }}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === 'sources'    && <SourcesTab    onStatsChange={loadStats} />}
      {tab === 'search'     && <SearchTab />}
      {tab === 'gold'       && <GoldTab />}
      {tab === 'background' && <BackgroundTab onStatsChange={loadStats} />}
    </div>
  );
};
