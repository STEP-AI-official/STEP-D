import React from 'react';
import { api } from '../api.js';

const CAT_BADGE = {
  docu_ko: 'badge-blue',
  docu_en: 'badge-violet',
  interview: 'badge-orange',
  narration: 'badge-mint',
};

const CATEGORIES = ['docu_ko', 'docu_en', 'interview', 'narration'];
const LIMIT = 100;
const CHUNK_LIMIT = 50;

// ── 통계 카드 ─────────────────────────────────────────────────────────────
const StatsCards = ({ stats }) => {
  if (!stats || typeof stats !== 'object') return null;
  const entries = Object.entries(stats);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      {entries.map(([cat, s]) => (
        <div key={cat} className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
          <span className={`badge ${CAT_BADGE[cat] || 'badge-gray'}`} style={{ marginBottom: 8, display: 'inline-block' }}>{cat}</span>
          <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>{s.sources ?? '-'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>소스</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>{s.chunks ?? '-'}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>청크</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── 청크 단건 모달 ────────────────────────────────────────────────────────
const ChunkDetailModal = ({ chunk, onClose }) => {
  if (!chunk) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className={`badge ${CAT_BADGE[chunk.category] || 'badge-gray'}`}>{chunk.category}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>청크 #{chunk.chunk_index}</span>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{chunk.source_title} — {chunk.channel}</div>
        <a href={chunk.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--blue)', wordBreak: 'break-all', display: 'block', marginBottom: 14 }}>{chunk.source_url}</a>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', fontSize: 13, lineHeight: 1.75, color: 'var(--text1)', whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto', marginBottom: 14 }}>
          {chunk.chunk_text}
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text3)' }}>
          <span>글자수 <span className="mono" style={{ color: 'var(--text2)' }}>{chunk.char_count ?? chunk.chunk_text?.length ?? '-'}</span></span>
          <span>임베딩 차원 <span className="mono" style={{ color: 'var(--mint)' }}>{chunk.embedding_dim ?? '-'}</span></span>
          <span>수집일 <span style={{ color: 'var(--text2)' }}>{chunk.created_at ? new Date(chunk.created_at).toLocaleString('ko') : '-'}</span></span>
        </div>
      </div>
    </div>
  );
};

// ── 청크 드로어 ───────────────────────────────────────────────────────────
const ChunksDrawer = ({ source, onClose }) => {
  const [chunks, setChunks] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [loadingDetail, setLoadingDetail] = React.useState(null);

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const data = await api.get(`/rag/sources/${source.url_hash}/chunks?limit=${CHUNK_LIMIT}&offset=${off}`);
      setChunks(data.chunks || []);
      setTotal(data.total_chunks ?? 0);
      setOffset(off);
    } catch (e) { console.error(e); }
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
  const page = Math.floor(offset / CHUNK_LIMIT) + 1;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{source.source_title || source.source_url}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{source.channel} · <span className={`badge ${CAT_BADGE[source.category] || 'badge-gray'}`}>{source.category}</span> · 총 {total}청크</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>

          {/* 청크 목록 */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div>
            ) : chunks.length === 0 ? (
              <div className="text-muted" style={{ textAlign: 'center', padding: 32 }}>청크 없음</div>
            ) : chunks.map(c => (
              <div key={c.id} onClick={() => openChunk(c.chunk_index)}
                style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', opacity: loadingDetail === c.chunk_index ? 0.5 : 1, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', minWidth: 28 }}>#{c.chunk_index}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.chunk_text?.length ?? '-'}자</span>
                  {loadingDetail === c.chunk_index && <span className="spinner" style={{ width: 10, height: 10 }} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {c.chunk_text}
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => load(offset - CHUNK_LIMIT)}>‹ 이전</button>
              <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={offset + CHUNK_LIMIT >= total} onClick={() => load(offset + CHUNK_LIMIT)}>다음 ›</button>
            </div>
          )}
        </div>
      </div>

      {detail && <ChunkDetailModal chunk={detail} onClose={() => setDetail(null)} />}
    </>
  );
};

// ── AI Hub 배경 데이터셋 임포트 패널 ──────────────────────────────────────
//
// 서버 디스크의 BG_RAG_DATA_ROOT 아래 디렉토리/파일을 지정해 background_ko 임포트.
// 백엔드 worker thread가 처리하며 job_id를 1.5초 간격으로 폴링해 진행률 표시.
const BackgroundIngestPanel = ({ onFinished }) => {
  const [dataRoot, setDataRoot]   = React.useState(null);
  const [path, setPath]           = React.useState('');
  const [sampleSize, setSampleSize] = React.useState(50000);
  const [shuffle, setShuffle]     = React.useState(true);
  const [force, setForce]         = React.useState(false);
  const [bgStats, setBgStats]     = React.useState(null);

  const [job, setJob]         = React.useState(null);   // 현재 폴링 중인 job
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg]     = React.useState(null);

  const loadDataRoot = async () => {
    try {
      const r = await api.get('/rag/background/data-root');
      setDataRoot(r);
    } catch (e) { console.error(e); }
  };

  const loadBgStats = async () => {
    try {
      const r = await api.get('/rag/background/stats');
      setBgStats(r);
    } catch (e) { console.error(e); }
  };

  React.useEffect(() => { loadDataRoot(); loadBgStats(); }, []);

  // ── 작업 폴링 ──
  React.useEffect(() => {
    if (!job?.id || job?.status === 'done' || job?.status === 'error') return;
    const t = setInterval(async () => {
      try {
        const j = await api.get(`/rag/background/jobs/${job.id}`);
        setJob(j);
        if (j.status === 'done' || j.status === 'error') {
          loadBgStats();
          if (onFinished) onFinished();
        }
      } catch (e) { console.error(e); }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.status]);

  const start = async () => {
    if (!path.trim()) { setErrorMsg('경로를 입력하세요'); return; }
    setSubmitting(true); setErrorMsg(null); setJob(null);
    try {
      const r = await api.post('/rag/background/ingest-path', {
        path:        path.trim(),
        sample_size: sampleSize > 0 ? sampleSize : null,
        shuffle:     shuffle,
        force:       force,
      });
      const j = await api.get(`/rag/background/jobs/${r.job_id}`);
      setJob(j);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isRunning = job && (job.status === 'pending' || job.status === 'running');
  const progress  = job?.progress || {};
  const processedFiles = progress.processed_files ?? 0;
  const totalFiles     = progress.total_files     ?? 0;
  const insertedNow    = progress.inserted        ?? 0;
  const skippedNow     = progress.skipped         ?? 0;
  const filePct = totalFiles > 0 ? (processedFiles * 100 / totalFiles) : 0;
  const samplePct = (sampleSize > 0 && insertedNow > 0)
    ? Math.min(100, insertedNow * 100 / sampleSize) : 0;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="flex" style={{ marginBottom: 12, alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>AI Hub 배경 데이터셋 임포트 (background_ko)</div>
        {bgStats && (
          <div className="ml-auto" style={{ fontSize: 12, color: 'var(--text3)' }}>
            현재 청크 <span className="mono" style={{ color: 'var(--mint)' }}>{bgStats.chunks?.toLocaleString() ?? 0}</span>
            {' · '}소스 <span className="mono" style={{ color: 'var(--text2)' }}>{bgStats.sources ?? 0}</span>
          </div>
        )}
      </div>

      {/* 데이터 루트 안내 */}
      {dataRoot === null ? (
        <div className="text-muted" style={{ fontSize: 12 }}>데이터 루트 확인 중...</div>
      ) : !dataRoot.configured ? (
        <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
          BG_RAG_DATA_ROOT 환경변수가 설정되지 않았습니다. 서버에 데이터를 올린 후 환경변수를 지정하세요.
        </div>
      ) : !dataRoot.exists ? (
        <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
          BG_RAG_DATA_ROOT 경로가 존재하지 않습니다: <span className="mono">{dataRoot.root}</span>
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', borderRadius: 6, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
          <div style={{ color: 'var(--text3)', marginBottom: 6 }}>데이터 루트: <span className="mono" style={{ color: 'var(--text2)' }}>{dataRoot.root}</span></div>
          {dataRoot.entries?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {dataRoot.entries.slice(0, 16).map(e => (
                <button key={e.name} className="btn btn-ghost btn-sm" onClick={() => setPath(e.name)}
                  title={e.is_dir ? '디렉토리' : `${e.size?.toLocaleString()} bytes`}
                  style={{ fontSize: 11, padding: '3px 8px' }}>
                  {e.is_dir ? '📁 ' : '📄 '}{e.name}
                </button>
              ))}
              {dataRoot.entries.length > 16 && <span className="text-muted" style={{ fontSize: 11 }}>+{dataRoot.entries.length - 16} more</span>}
            </div>
          )}
        </div>
      )}

      {/* 입력 폼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginBottom: 10 }}>
        <input
          value={path}
          onChange={e => setPath(e.target.value)}
          placeholder="데이터 경로 (예: aihub_71784/Training/label)"
          disabled={isRunning}
        />
        <input
          type="number" min={0} step={1000}
          value={sampleSize}
          onChange={e => setSampleSize(parseInt(e.target.value) || 0)}
          placeholder="샘플 크기 (0=전체)"
          disabled={isRunning}
        />
      </div>

      <div className="flex gap-8" style={{ marginBottom: 10 }}>
        <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
          <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} disabled={isRunning} style={{ width: 'auto' }} />
          파일 셔플 (샘플 편향 감소)
        </label>
        <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} disabled={isRunning} style={{ width: 'auto' }} />
          force 재적재
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
          <div className="flex" style={{ marginBottom: 8, alignItems: 'center' }}>
            <span className={`badge ${job.status === 'done' ? 'badge-mint' : job.status === 'error' ? 'badge-orange' : 'badge-blue'}`}>
              {job.status}
            </span>
            <span className="mono ml-auto" style={{ color: 'var(--text3)', fontSize: 11 }}>{job.id}</span>
          </div>

          {/* 파일 진행 */}
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

          {/* 샘플(또는 적재) 진행 */}
          {sampleSize > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="flex" style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>
                <span>적재 {insertedNow.toLocaleString()} / 목표 {sampleSize.toLocaleString()}</span>
                <span className="ml-auto mono">{samplePct.toFixed(1)}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${samplePct}%`, background: 'var(--mint)', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
            <span>적재 <span className="mono" style={{ color: 'var(--mint)' }}>{insertedNow.toLocaleString()}</span></span>
            <span>스킵 <span className="mono" style={{ color: 'var(--text2)' }}>{skippedNow.toLocaleString()}</span></span>
            {progress.phase && <span>phase <span className="mono">{progress.phase}</span></span>}
          </div>

          {job.status === 'done' && job.result && (
            <div style={{ marginTop: 8, color: 'var(--mint)' }}>
              ✓ 완료 — files={job.result.total_files?.toLocaleString()}, inserted={job.result.total_inserted?.toLocaleString()}, skipped={job.result.total_skipped?.toLocaleString()}
              {job.result.stopped_early && ' (샘플 도달로 조기 종료)'}
            </div>
          )}
          {job.status === 'error' && (
            <div style={{ marginTop: 8, color: 'var(--rose)' }}>✗ 오류: {job.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export const Rag = () => {
  // 통계
  const [stats, setStats] = React.useState(null);

  // 소스 목록
  const [sources, setSources] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // 수집 폼
  const [urlsText, setUrlsText] = React.useState('');
  const [force, setForce] = React.useState(false);
  const [ingesting, setIngesting] = React.useState(false);
  const [ingestResults, setIngestResults] = React.useState(null);
  const [forceConfirm, setForceConfirm] = React.useState(false);

  // 검색
  const [query, setQuery] = React.useState('');
  const [searchN, setSearchN] = React.useState(5);
  const [searchCat, setSearchCat] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchRes, setSearchRes] = React.useState(null);

  // 드로어 / 삭제
  const [drawerSource, setDrawerSource] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);

  // ── 로드 ──
  const loadStats = async () => {
    try {
      const data = await api.get('/rag/stats');
      setStats(data.by_category ?? {});
    } catch (e) { console.error(e); }
  };

  const loadSources = async (off = 0) => {
    setLoading(true);
    try {
      const data = await api.get(`/rag/sources?limit=${LIMIT}&offset=${off}`);
      setSources(data.sources || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    loadStats();
    loadSources();
  }, []);

  // ── 수집 ──
  const ingest = async () => {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setIngesting(true); setIngestResults(null);
    try {
      const r = await api.post('/rag/ingest', { urls, force });
      setIngestResults(r.results || []);
      setUrlsText('');
      loadStats();
      loadSources();
    } catch (e) { setIngestResults([{ ok: false, error: e.message }]); }
    finally { setIngesting(false); }
  };

  const handleIngestClick = () => {
    if (force) { setForceConfirm(true); return; }
    ingest();
  };

  // ── 검색 ──
  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchRes(null);
    try {
      const body = { query: query.trim(), n: searchN };
      if (searchCat) body.category = searchCat;
      const r = await api.post('/rag/search', body);
      setSearchRes(r.results || []);
    } catch (e) { setSearchRes({ error: e.message }); }
    finally { setSearching(false); }
  };

  // ── 삭제 ──
  const delSource = async (hash) => {
    if (!confirm('이 소스와 모든 청크를 삭제할까요?')) return;
    setDeleting(hash);
    try { await api.del(`/rag/sources/${hash}`); loadStats(); loadSources(offset); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      <div className="page-title">RAG 관리</div>
      <div className="page-sub">유튜브 소스 수집 · 청크 탐색 · 검색 테스트</div>

      {/* 통계 카드 */}
      <StatsCards stats={stats} />

      {/* AI Hub 배경 데이터셋 임포트 (background_ko) */}
      <BackgroundIngestPanel onFinished={loadStats} />

      {/* 수집 + 검색 2열 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* 수집 폼 */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>URL 수집</div>
          <textarea
            value={urlsText}
            onChange={e => setUrlsText(e.target.value)}
            placeholder={'URL 입력 (줄바꿈으로 여러 개)\nhttps://youtube.com/watch?v=abc'}
            style={{ minHeight: 100, marginBottom: 10 }}
          />
          <div className="flex gap-8" style={{ marginBottom: 10 }}>
            <label className="flex gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} style={{ width: 'auto' }} />
              force 재수집
            </label>
            <button className="btn btn-primary btn-sm ml-auto" disabled={ingesting || !urlsText.trim()} onClick={handleIngestClick}>
              {ingesting ? <><span className="spinner" style={{ width: 10, height: 10 }} /> 수집 중...</> : '수집 시작'}
            </button>
          </div>
          {ingestResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ingestResults.map((r, i) => (
                <div key={i} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, background: r.ok ? 'var(--mint-dim)' : 'var(--rose-dim)', color: r.ok ? 'var(--mint)' : 'var(--rose)' }}>
                  {r.ok ? `✓ ${r.title} (${r.chunks}청크)` : `✗ ${r.error}`}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 검색 패널 */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>RAG 검색 테스트</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="검색 쿼리..."
            style={{ marginBottom: 8 }}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <div className="flex gap-8" style={{ marginBottom: 10 }}>
            <select value={searchCat} onChange={e => setSearchCat(e.target.value)} style={{ flex: 1 }}>
              <option value="">전체 카테고리</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={searchN} onChange={e => setSearchN(Number(e.target.value))} style={{ width: 74 }}>
              {[3, 5, 10].map(n => <option key={n} value={n}>top {n}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" disabled={searching || !query.trim()} onClick={search}>
              {searching ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '검색'}
            </button>
          </div>
          {searchRes && (
            Array.isArray(searchRes) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {searchRes.length === 0
                  ? <span className="text-muted">결과 없음</span>
                  : searchRes.map((r, i) => {
                    const pct = (r.score ?? r.similarity ?? 0) * 100;
                    return (
                      <div key={i} style={{ background: 'var(--bg2)', borderRadius: 6, padding: '10px 12px' }}>
                        <div className="flex gap-8" style={{ marginBottom: 6, alignItems: 'center' }}>
                          <span className={`badge ${CAT_BADGE[r.category] || 'badge-gray'}`}>{r.category}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg3)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct.toFixed(1)}%`, background: 'var(--mint)', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--mint)', minWidth: 38, textAlign: 'right' }} className="mono">{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{r.source_title} — {r.channel}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--text2)' }}>{r.chunk_text}</div>
                      </div>
                    );
                  })}
              </div>
            ) : <div style={{ color: 'var(--rose)', fontSize: 12 }}>{searchRes.error}</div>
          )}
        </div>
      </div>

      {/* 소스 목록 */}
      <div className="flex" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>수집된 소스 ({total}개)</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => { loadStats(); loadSources(offset); }}>새로고침</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>채널</th>
              <th>카테고리</th>
              <th>청크</th>
              <th>수집일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
            ) : sources.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>소스 없음</td></tr>
            ) : sources.map(s => (
              <tr key={s.url_hash}>
                <td style={{ maxWidth: 240 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{s.source_title || '(제목 없음)'}</div>
                  <a href={s.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--blue)', wordBreak: 'break-all' }}>{s.source_url}</a>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{s.channel || '-'}</td>
                <td><span className={`badge ${CAT_BADGE[s.category] || 'badge-gray'}`}>{s.category || '-'}</span></td>
                <td className="mono">{s.chunk_count ?? '-'}</td>
                <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{s.ingested_at ? new Date(s.ingested_at).toLocaleString('ko') : '-'}</td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-sm" onClick={() => setDrawerSource(s)}>청크 보기</button>
                    <button className="btn btn-danger btn-sm" disabled={deleting === s.url_hash} onClick={() => delSource(s.url_hash)}>
                      {deleting === s.url_hash ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => loadSources(offset - LIMIT)}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => loadSources(offset + LIMIT)}>다음 ›</button>
        </div>
      )}

      {/* 청크 드로어 */}
      {drawerSource && <ChunksDrawer source={drawerSource} onClose={() => setDrawerSource(null)} />}

      {/* force 재수집 확인 모달 */}
      {forceConfirm && (
        <div className="modal-backdrop" onClick={() => setForceConfirm(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>force 재수집 확인</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.65 }}>
              force 옵션을 사용하면 기존 청크가 <span style={{ color: 'var(--rose)' }}>전부 삭제</span>된 후 재수집됩니다. 계속하시겠습니까?
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
