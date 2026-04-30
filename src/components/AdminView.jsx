import React from 'react';
import { Icon } from './Icons';
import { api, apiBase } from '../api';

const SCORE_LABELS = { 1: '최하', 2: '하', 3: '중', 4: '상', 5: '최상' };
const SCORE_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e' };

const resolveVideoUrl = (projectId, shortId, videoPath) => {
  if (!videoPath) return null;
  if (videoPath.startsWith('http')) return videoPath;
  return `${apiBase}/media/${projectId}/shorts/${shortId}/${videoPath}`;
};

const StarRating = ({ score, cutKey, onScore }) => {
  const [hover, setHover] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const handleClick = async (s) => {
    const next = score === s ? null : s;
    setSaving(true);
    try {
      await api.patch(`/api/admin/cuts/${cutKey}/score`, { score: next });
      onScore(cutKey, next);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {saving && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: 'var(--violet)', borderTopColor: 'transparent', marginRight: 4 }} />}
      {[1, 2, 3, 4, 5].map(s => {
        const active = (hover ?? score) >= s;
        return (
          <button key={s}
            title={`${s}점 — ${SCORE_LABELS[s]}`}
            onClick={() => handleClick(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(null)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 1px',
              fontSize: 16, lineHeight: 1,
              color: active ? (SCORE_COLORS[hover ?? score] || '#eab308') : 'var(--border)',
              transition: 'color 0.1s',
            }}>
            ★
          </button>
        );
      })}
      {score && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: SCORE_COLORS[score], marginLeft: 4 }}>
          {score}점
        </span>
      )}
    </div>
  );
};

const VideoCard = ({ video, onScore }) => {
  const [playing, setPlaying] = React.useState(false);
  const videoRef = React.useRef();
  const url = resolveVideoUrl(video.project_id, video.short_id, video.video_path);

  const toggle = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play().catch(() => {});
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* 영상 미리보기 */}
      <div style={{ position: 'relative', aspectRatio: '9/16', background: '#0a0a0a', cursor: 'pointer' }}
        onClick={toggle}>
        {url
          ? <video ref={videoRef} src={url} loop playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Icon name="film" size={24} style={{ color: 'var(--text-4)' }} />
            </div>
        }
        {url && !playing && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', display: 'grid', placeItems: 'center' }}>
              <Icon name="play" size={16} style={{ color: '#000' }} />
            </div>
          </div>
        )}
        {video.score && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.72)', borderRadius: 6, padding: '2px 7px', fontSize: 12, fontWeight: 700, color: SCORE_COLORS[video.score] }}>
            {'★'.repeat(video.score)}
          </div>
        )}
      </div>

      {/* 메타 + 점수 */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.project_title} · {video.short_title}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.cut_key}
        </div>
        {video.video_prompt_en && (
          <div style={{ fontSize: 10, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={video.video_prompt_en}>
            {video.video_prompt_en}
          </div>
        )}
        <StarRating score={video.score} cutKey={video.cut_key} onScore={onScore} />
      </div>
    </div>
  );
};

/* ══ RAG 관리 탭 ══════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { value: 'docu_ko',       label: '한국 다큐',   color: 'var(--mint)',   desc: '나레이터 해설 중심 — KBS·MBC·EBS·JTBC 류' },
  { value: 'docu_en',       label: '영어 다큐',   color: 'var(--violet)', desc: 'BBC·Netflix·NatGeo 류' },
  { value: 'interview',     label: '인터뷰',      color: 'var(--rose)',   desc: '진행자↔게스트 대화 구조' },
  { value: 'narration',     label: '나레이션',    color: '#f59e0b',       desc: '보이스오버 중심 해설 영상' },
  { value: 'background_ko', label: '배경 묘사',   color: '#64748b',       desc: '한국 공간·배경 설명 (AIHub 류)' },
];

const CHUNK_TYPES = [
  { value: 'narration', label: '나레이션', color: '#a78bfa' },
  { value: 'interview', label: '인터뷰',   color: '#34d399' },
  { value: 'broll',     label: 'B-ROLL',   color: '#60a5fa' },
  { value: 'unknown',   label: '미분류',   color: 'var(--text-4)' },
];

/* ── chunk_type 뱃지 ─────────────────────────────────────────────────────── */
const ChunkTypeBadge = ({ type, ctMap }) => {
  const ctm = ctMap[type] || { label: type || '?', color: 'var(--text-4)' };
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
      color: ctm.color, background: `${ctm.color}18`,
      border: `1px solid ${ctm.color}44`,
      borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
    }}>{ctm.label}</span>
  );
};

/* ── 소스 목록 패널 ──────────────────────────────────────────────────────── */
const SourceListPanel = ({ catMap, ctMap, onSelect, selectedHash }) => {
  const [sources, setSources] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filterCat, setFilterCat] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/rag/sources?limit=500');
      setSources(res.sources || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleDelete = async (e, hash) => {
    e.stopPropagation();
    if (!window.confirm('이 소스의 모든 청크를 삭제하시겠습니까?')) return;
    await api.del(`/api/admin/rag/sources/${hash}`);
    setSources(s => s.filter(x => x.url_hash !== hash));
    if (selectedHash === hash) onSelect(null);
  };

  const filtered = filterCat ? sources.filter(s => s.category === filterCat) : sources;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border)' }}>
      {/* 헤더 */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700 }}>소스 목록 {!loading && <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>({filtered.length})</span>}</div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ fontSize: 10, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', padding: '3px 6px' }}>
          <option value="">전체 카테고리</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16 }}><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, fontSize: 11, color: 'var(--text-4)' }}>소스 없음</div>
        ) : filtered.map(src => {
          const meta = catMap[src.category] || { label: src.category, color: 'var(--text-4)' };
          const active = src.url_hash === selectedHash;
          return (
            <div key={src.url_hash}
              onClick={() => onSelect(src)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: active ? 'color-mix(in oklch, var(--violet) 12%, var(--surface))' : 'transparent',
                borderLeft: active ? '2px solid var(--violet)' : '2px solid transparent',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)',
                  border: `1px solid ${meta.color}44`, borderRadius: 3, padding: '0 4px' }}>{meta.label}</span>
                <span style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{src.chunk_count}청크</span>
                <button onClick={e => handleDelete(e, src.url_hash)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-5)', fontSize: 11, padding: '0 2px', lineHeight: 1 }}
                  title="소스 삭제">✕</button>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}
                title={src.source_title}>{src.source_title || '(제목 없음)'}</div>
              <div style={{ fontSize: 9, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={src.source_url}>{src.channel || src.source_url}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── chunk_type 빠른 변경 버튼 ───────────────────────────────────────────── */
const QuickTypeChanger = ({ chunkId, currentType, ctMap, onChanged }) => {
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleChange = async (e, newType) => {
    e.stopPropagation();
    if (newType === currentType) { setOpen(false); return; }
    setSaving(true);
    try {
      await api.patch(`/api/admin/rag/chunks/${chunkId}/type`, { chunk_type: newType });
      onChanged(newType);
    } catch {}
    finally { setSaving(false); setOpen(false); }
  };

  return (
    <div style={{ position: 'relative', marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border)',
          background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 3 }}>
        {saving ? <span className="spinner" style={{ width: 6, height: 6, borderWidth: 1.5 }} /> : '변경'}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
          {CHUNK_TYPES.map(ct => (
            <button key={ct.value} onClick={e => handleChange(e, ct.value)}
              style={{ fontSize: 10, padding: '4px 10px', textAlign: 'left', background: currentType === ct.value ? `${ct.color}22` : 'transparent',
                border: 'none', borderRadius: 4, cursor: 'pointer', color: ct.color, fontWeight: currentType === ct.value ? 700 : 400 }}>
              {ct.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── 청크 목록 패널 ──────────────────────────────────────────────────────── */
const ChunkListPanel = ({ source, catMap, ctMap, onSelect, selectedChunkId, onTypeChanged }) => {
  const [chunks, setChunks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filterType, setFilterType] = React.useState('');
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    if (!source) { setChunks([]); setTotal(0); return; }
    setLoading(true);
    api.get(`/api/admin/rag/sources/${source.url_hash}/chunks?limit=200`)
      .then(res => { setChunks(res.chunks || []); setTotal(res.total_chunks || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [source]);

  // 타입 변경 후 로컬 업데이트
  const updateLocal = (id, newType) => {
    setChunks(cs => cs.map(c => c.id === id ? { ...c, chunk_type: newType } : c));
    onTypeChanged?.();
  };

  const filtered = filterType ? chunks.filter(c => (c.chunk_type || 'unknown') === filterType) : chunks;

  // 타입별 카운트
  const typeCounts = chunks.reduce((acc, c) => {
    const t = c.chunk_type || 'unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  if (!source) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: 12, borderRight: '1px solid var(--border)' }}>
      ← 소스를 선택하세요
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--border)' }}>
      {/* 헤더 */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={source.source_title}>{source.source_title || '(제목 없음)'}</div>
        {/* 타입별 분포 바 */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {CHUNK_TYPES.map(ct => {
            const n = typeCounts[ct.value] || 0;
            if (!n) return null;
            return (
              <button key={ct.value}
                onClick={() => setFilterType(filterType === ct.value ? '' : ct.value)}
                style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: ct.color,
                  background: filterType === ct.value ? `${ct.color}22` : 'transparent',
                  border: `1px solid ${filterType === ct.value ? ct.color : ct.color + '44'}`,
                  borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}>
                {ct.label} {n}
              </button>
            );
          })}
          {filterType && (
            <button onClick={() => setFilterType('')}
              style={{ fontSize: 9, color: 'var(--text-4)', background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', cursor: 'pointer' }}>전체</button>
          )}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          총 {total}청크{filterType ? ` · 필터: ${filtered.length}개` : ''}
        </div>
      </div>
      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16 }}><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /></div>
        ) : filtered.map(chunk => {
          const active = chunk.id === selectedChunkId;
          return (
            <div key={chunk.id}
              onClick={() => onSelect({ ...chunk, urlHash: source.url_hash })}
              style={{
                padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: active ? 'color-mix(in oklch, var(--violet) 10%, var(--surface))' : 'transparent',
                borderLeft: active ? '2px solid var(--violet)' : '2px solid transparent',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--text-5)', fontFamily: 'var(--font-mono)' }}>#{chunk.chunk_index}</span>
                <ChunkTypeBadge type={chunk.chunk_type} ctMap={ctMap} />
                <QuickTypeChanger chunkId={chunk.id} currentType={chunk.chunk_type} ctMap={ctMap} onChanged={t => updateLocal(chunk.id, t)} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {chunk.chunk_text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── 청크 상세 패널 ──────────────────────────────────────────────────────── */
const ChunkDetailPanel = ({ chunk, catMap, ctMap, onTypeChanged }) => {
  if (!chunk) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-4)', fontSize: 12 }}>
      ← 청크를 선택하세요
    </div>
  );

  const meta = catMap[chunk.category] || { label: chunk.category, color: 'var(--text-4)' };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 메타 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)',
            border: `1px solid ${meta.color}44`, borderRadius: 3, padding: '1px 5px' }}>{meta.label}</span>
          <ChunkTypeBadge type={chunk.chunk_type} ctMap={ctMap} />
          <span style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>#{chunk.chunk_index}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{chunk.source_title}</div>
        <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{chunk.channel}</div>
      </div>

      {/* chunk_type 수동 지정 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', marginBottom: 8 }}>청크 타입 분류</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHUNK_TYPES.map(ct => {
            const active = (chunk.chunk_type || 'unknown') === ct.value;
            return (
              <button key={ct.value}
                onClick={async () => {
                  if (active) return;
                  await api.patch(`/api/admin/rag/chunks/${chunk.id}/type`, { chunk_type: ct.value });
                  onTypeChanged(chunk.id, ct.value);
                }}
                style={{ fontSize: 11, padding: '5px 14px', borderRadius: 6, cursor: active ? 'default' : 'pointer',
                  border: `1px solid ${active ? ct.color : 'var(--border)'}`,
                  background: active ? `${ct.color}22` : 'var(--surface-2)',
                  color: active ? ct.color : 'var(--text-3)', fontWeight: active ? 700 : 400 }}>
                {ct.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 청크 본문 */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>청크 본문</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{chunk.chunk_text?.length || 0}자</span>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {chunk.chunk_text}
        </div>
      </div>

      {/* URL */}
      {chunk.source_url && (
        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
          {chunk.source_url}
        </div>
      )}
    </div>
  );
};

/* ── 유저 관리 탭 ────────────────────────────────────────────────────────── */
const UserCard = ({ u, onToggleRole, updating, onSelect }) => {
  const fmt = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return '오늘';
    if (diff === 1) return '어제';
    if (diff < 7)  return `${diff}일 전`;
    if (diff < 30) return `${Math.floor(diff/7)}주 전`;
    if (diff < 365) return `${Math.floor(diff/30)}개월 전`;
    return `${Math.floor(diff/365)}년 전`;
  };
  const fmtDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  const isAdmin = u.role === 'admin';
  const isActive = u.last_login_at && (Date.now() - new Date(u.last_login_at)) < 7 * 86400000;

  return (
    <div onClick={() => onSelect(u)} style={{
      background: 'var(--surface)', border: `1px solid ${isAdmin ? 'color-mix(in oklch, var(--violet) 40%, var(--border))' : 'var(--border)'}`,
      borderRadius: 12, padding: '16px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.15s',
      position: 'relative',
    }}>
      {/* 상단: 프로필 + 이름/이메일 */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {u.picture
            ? <img src={u.picture} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 20 }}>👤</div>
          }
          {/* 활성 상태 도트 */}
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: isActive ? 'var(--mint)' : 'var(--border)',
            border: '2px solid var(--surface)',
          }} title={isActive ? '최근 7일 활성' : '비활성'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {u.name || '(이름 없음)'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {u.email}
          </div>
        </div>
        {/* Role 뱃지 */}
        <button
          onClick={e => { e.stopPropagation(); onToggleRole(u); }}
          disabled={updating}
          style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 5, cursor: updating ? 'wait' : 'pointer',
            fontWeight: 700, border: 'none', flexShrink: 0,
            background: isAdmin ? 'var(--violet)' : 'var(--surface-2)',
            color: isAdmin ? '#fff' : 'var(--text-4)',
            opacity: updating ? 0.5 : 1,
          }}>
          {updating ? '…' : isAdmin ? 'ADMIN' : 'user'}
        </button>
      </div>

      {/* 통계 3칸 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
        background: 'var(--bg-2)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {[
          { label: '프로젝트', value: u.project_count ?? 0 },
          { label: '쇼츠',     value: u.shorts_count ?? '-' },
          { label: '완성 컷',  value: u.cuts_done    ?? '-' },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '8px 0', textAlign: 'center',
            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 하단: 가입일 + 마지막 로그인 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-5)', fontFamily: 'var(--font-mono)' }}>
        <span>가입 {fmtDate(u.created_at)}</span>
        <span style={{ color: isActive ? 'var(--mint)' : 'var(--text-5)' }}>
          로그인 {fmt(u.last_login_at)}
        </span>
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers]       = React.useState([]);
  const [total, setTotal]       = React.useState(0);
  const [loading, setLoading]   = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail]     = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [search, setSearch]     = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users?limit=500');
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const loadDetail = React.useCallback(async (u) => {
    setSelected(u); setDetail(null); setDetailLoading(true);
    try {
      const d = await api.get(`/api/admin/users/${u.id}/stats`);
      setDetail(d);
    } catch {}
    finally { setDetailLoading(false); }
  }, []);

  const toggleRole = async (u) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`${u.email} 의 role을 '${next}'로 변경?`)) return;
    setUpdatingId(u.id);
    try {
      await api.patch(`/api/admin/users/${u.id}/role`, { role: next });
      setUsers(us => us.map(x => x.id === u.id ? { ...x, role: next } : x));
      if (selected?.id === u.id) setSelected(s => ({ ...s, role: next }));
    } catch (e) { alert(e.message); }
    finally { setUpdatingId(null); }
  };

  const fmtDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  const filtered = users.filter(u =>
    !search || u.email?.includes(search) || u.name?.includes(search)
  );

  const summary = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.last_login_at && Date.now() - new Date(u.last_login_at) < 7 * 86400000).length,
    withProject: users.filter(u => u.project_count > 0).length,
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* 왼쪽: 유저 카드 그리드 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

        {/* 요약 바 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: '전체', value: summary.total, color: 'var(--text)' },
            { label: '어드민', value: summary.admins, color: 'var(--violet)' },
            { label: '7일 활성', value: summary.active, color: 'var(--mint)' },
            { label: '프로젝트 있음', value: summary.withProject, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-4)' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 120 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="이메일 / 이름 검색"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 11, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', color: 'var(--text)', outline: 'none' }} />
          </div>
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', cursor: 'pointer', color: 'var(--text-4)', fontSize: 11 }}>
            새로고침
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-4)', fontSize: 11 }}>
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', paddingTop: 40 }}>유저 없음</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {filtered.map(u => (
              <UserCard
                key={u.id}
                u={u}
                onToggleRole={toggleRole}
                updating={updatingId === u.id}
                onSelect={loadDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* 오른쪽: 선택 유저 상세 패널 */}
      {selected && (
        <div style={{
          width: 280, flexShrink: 0, borderLeft: '1px solid var(--border)',
          background: 'var(--bg-2)', overflowY: 'auto', padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>유저 상세</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
          </div>

          {/* 프로필 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            {selected.picture
              ? <img src={selected.picture} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--border)', display: 'grid', placeItems: 'center', fontSize: 28 }}>👤</div>
            }
            <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name || '(이름 없음)'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', wordBreak: 'break-all' }}>{selected.email}</div>
            <div style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 5, fontWeight: 700,
              background: selected.role === 'admin' ? 'var(--violet)' : 'var(--surface)',
              color: selected.role === 'admin' ? '#fff' : 'var(--text-4)',
              border: `1px solid ${selected.role === 'admin' ? 'var(--violet)' : 'var(--border)'}`,
            }}>{selected.role === 'admin' ? 'ADMIN' : 'USER'}</div>
          </div>

          {/* 날짜 정보 */}
          <div style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '가입일',         value: fmtDate(selected.created_at) },
              { label: '마지막 로그인',   value: fmtDate(selected.last_login_at) },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-4)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* 상세 통계 */}
          {detailLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            </div>
          ) : detail ? (
            <>
              <div style={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', marginBottom: 2 }}>사용 현황</div>
                {[
                  { label: '프로젝트',  value: detail.stats?.projects ?? 0 },
                  { label: '쇼츠',      value: detail.stats?.shorts   ?? 0 },
                  { label: '완성 컷',   value: detail.stats?.cuts_done ?? 0 },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-4)' }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* 최근 쇼츠 */}
              {detail.recent_shorts?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)' }}>최근 쇼츠</div>
                  {detail.recent_shorts.map(s => (
                    <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 7, border: '1px solid var(--border)', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title || '(제목 없음)'}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 9, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                          background: s.status === 'done' ? 'color-mix(in oklch, var(--mint) 15%, var(--surface))' : s.status === 'failed' ? 'color-mix(in oklch, var(--rose) 15%, var(--surface))' : 'var(--bg-2)',
                          color: s.status === 'done' ? 'var(--mint)' : s.status === 'failed' ? 'var(--rose)' : 'var(--text-4)',
                          border: `1px solid ${s.status === 'done' ? 'color-mix(in oklch, var(--mint) 30%, var(--border))' : s.status === 'failed' ? 'color-mix(in oklch, var(--rose) 30%, var(--border))' : 'var(--border)'}`,
                        }}>{s.stage} · {s.status}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-5)', fontFamily: 'var(--font-mono)' }}>{fmtDate(s.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};


/* ── 배경 임베딩 탭 ──────────────────────────────────────────────────────── */
const BgEmbedTab = () => {
  const [stats, setStats]         = React.useState(null);
  const [file, setFile]           = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult]       = React.useState(null);
  const [error, setError]         = React.useState('');
  const [force, setForce]         = React.useState(false);
  const fileRef = React.useRef();

  const loadStats = React.useCallback(async () => {
    try {
      const res = await api.get('/api/admin/rag/background/stats');
      setStats(res);
    } catch {}
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setResult(null); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const token = localStorage.getItem('auth_token');
      const apiBase = import.meta.env.DEV
        ? ''
        : (import.meta.env.VITE_API_BASE_URL ?? '');
      const url = `${apiBase}/api/admin/rag/background/ingest-json${force ? '?force=true' : ''}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      const res = await r.json();
      setResult(res);
      loadStats();
    } catch (e) {
      setError(e.message || '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 현재 통계 */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: '임베딩된 배경 묘사', value: stats?.chunks?.toLocaleString() ?? '…', color: '#64748b' },
          { label: '소스 파일 수',       value: stats?.sources?.toLocaleString() ?? '…', color: '#64748b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', minWidth: 140 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        <button onClick={loadStats} style={{ alignSelf: 'center', background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-4)', fontSize: 11 }}>
          새로고침
        </button>
      </div>

      {/* 업로드 카드 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>AI Hub 배경 묘사 JSON 업로드</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.7 }}>
          AI Hub <b>대한민국 배경영상 상세 설명문</b> JSON 파일을 업로드하면<br/>
          자동으로 텍스트를 추출해 <code style={{ background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 3 }}>background_ko</code> 카테고리로 임베딩합니다.<br/>
          배열(여러 항목) 또는 단일 객체 모두 지원합니다.
        </div>

        {/* 파일 선택 */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? 'var(--violet)' : 'var(--border)'}`,
            borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: file ? 'color-mix(in oklch, var(--violet) 5%, var(--bg-2))' : 'var(--bg-2)',
            transition: 'all 0.15s',
          }}>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(''); }} />
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>📄</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--violet)' }}>{file.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>☁️</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>JSON 파일을 클릭해서 선택하세요</span>
              <span style={{ fontSize: 10, color: 'var(--text-5)' }}>.json 파일만 지원</span>
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text-3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
          기존 항목 덮어쓰기 (force)
        </label>

        <button onClick={handleUpload} disabled={!file || uploading}
          style={{
            fontSize: 12, padding: '9px 24px', borderRadius: 8, border: 'none',
            cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
            background: (!file || uploading) ? 'var(--surface-2)' : '#64748b',
            color: (!file || uploading) ? 'var(--text-4)' : '#fff',
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
          }}>
          {uploading
            ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />임베딩 중... (시간이 걸릴 수 있습니다)</>
            : '임베딩 시작'}
        </button>

        {/* 결과 */}
        {result && !result.error && (
          <div style={{ background: 'color-mix(in oklch, var(--mint) 10%, var(--surface))', border: '1px solid color-mix(in oklch, var(--mint) 40%, var(--border))', borderRadius: 8, padding: '12px 14px', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontWeight: 700, color: 'var(--mint)' }}>✓ 완료</div>
            <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              전체 {result.total}개 항목 →
              <span style={{ color: 'var(--mint)', marginLeft: 6 }}>삽입 {result.inserted}개</span>
              <span style={{ color: 'var(--text-4)', marginLeft: 6 }}>스킵 {result.skipped}개</span>
            </div>
          </div>
        )}
        {error && (
          <div style={{ background: 'color-mix(in oklch, var(--rose) 10%, var(--surface))', border: '1px solid color-mix(in oklch, var(--rose) 30%, var(--border))', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--rose)' }}>
            ✗ {error}
          </div>
        )}
      </div>

      {/* 사용 팁 */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', maxWidth: 560 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>지원 JSON 포맷</div>
        <pre style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{`// AI Hub 공식 포맷
{ "annotation": { "description_ko": "서울 도심 빌딩 전경..." }, "location": "서울", "time_of_day": "밤" }

// 커스텀 포맷
{ "description_ko": "한강 공원 산책로...", "tags": ["한강", "공원"] }

// 배열 (여러 항목)
[ { "description_ko": "..." }, { "description_ko": "..." } ]`}</pre>
      </div>
    </div>
  );
};


/* ── RAG 관리 탭 메인 ────────────────────────────────────────────────────── */
const RagAdminTab = () => {
  const [view, setView]             = React.useState('browse');   // browse | ingest | search
  const [stats, setStats]           = React.useState({});
  const [statsLoading, setStatsLoading] = React.useState(true);

  // browse
  const [selectedSource, setSelectedSource] = React.useState(null);
  const [selectedChunk,  setSelectedChunk]  = React.useState(null);

  // ingest
  const [urls, setUrls]             = React.useState('');
  const [category, setCategory]     = React.useState('');
  const [force, setForce]           = React.useState(false);
  const [ingesting, setIngesting]   = React.useState(false);
  const [ingestResult, setIngestResult] = React.useState(null);

  // search
  const [searchQuery, setSearchQuery]   = React.useState('');
  const [searchCat, setSearchCat]       = React.useState('');
  const [searchChunkType, setSearchChunkType] = React.useState('');
  const [searchResults, setSearchResults] = React.useState(null);  // null=미검색, []=결과없음
  const [searchError, setSearchError]   = React.useState('');
  const [searching, setSearching]       = React.useState(false);

  // backfill
  const [backfilling, setBackfilling]   = React.useState(false);
  const [backfillResult, setBackfillResult] = React.useState(null);

  const loadStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/api/admin/rag/stats');
      setStats(res.by_category || {});
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);

  const handleIngest = async () => {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urlList.length) return;
    setIngesting(true); setIngestResult(null);
    try {
      const body = { urls: urlList, force };
      if (category) body.category = category;
      const res = await api.post('/api/admin/rag/ingest', body);
      setIngestResult(res.results || []);
      loadStats();
    } catch (e) { setIngestResult([{ error: e.message }]); }
    finally { setIngesting(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true); setSearchResults(null); setSearchError('');
    try {
      const body = { query: searchQuery, n: 10 };
      if (searchCat) body.category = searchCat;
      if (searchChunkType) body.chunk_type = searchChunkType;
      const res = await api.post('/api/admin/rag/search', body);
      setSearchResults(res.results || []);
    } catch (e) {
      setSearchError(e.message || '검색 실패');
      setSearchResults([]);
    }
    finally { setSearching(false); }
  };

  const handleBackfill = async (reclassifyAll = false) => {
    setBackfilling(true); setBackfillResult(null);
    try {
      const qs = reclassifyAll
        ? '/api/admin/rag/backfill-chunk-types?limit=5000&reclassify_all=true'
        : '/api/admin/rag/backfill-chunk-types?limit=5000';
      const res = await api.post(qs);
      setBackfillResult(res);
      loadStats();
    } catch (e) { setBackfillResult({ error: e.message }); }
    finally { setBackfilling(false); }
  };

  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));
  const ctMap  = Object.fromEntries(CHUNK_TYPES.map(c => [c.value, c]));
  const totalChunks = Object.values(stats).reduce((s, r) => s + (r.chunks || 0), 0);

  // chunk 타입 변경 시 selectedChunk 로컬 반영
  const handleChunkTypeChanged = (id, newType) => {
    if (selectedChunk?.id === id) setSelectedChunk(c => ({ ...c, chunk_type: newType }));
  };

  const TAB_STYLE = (active) => ({
    fontSize: 11, padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? 'var(--violet)' : 'transparent',
    color: active ? '#fff' : 'var(--text-3)', fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* 상단 바 — 통계 + 뷰 탭 */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* 통계 인라인 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          {statsLoading ? (
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
          ) : Object.entries(stats).map(([cat, s]) => {
            const meta = catMap[cat] || { label: cat, color: 'var(--text-4)' };
            const byType = s.by_type || {};
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)' }}>{meta.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>{s.chunks?.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {CHUNK_TYPES.map(ct => {
                    const n = byType[ct.value];
                    if (!n) return null;
                    return <span key={ct.value} style={{ fontSize: 8, color: ct.color, fontFamily: 'var(--font-mono)',
                      background: `${ct.color}18`, borderRadius: 3, padding: '0 3px' }}>{ct.label[0]}{n}</span>;
                  })}
                </div>
              </div>
            );
          })}
          <span style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>총 {totalChunks.toLocaleString()}</span>
        </div>

        {/* 뷰 탭 버튼 */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 8, padding: 3 }}>
          <button style={TAB_STYLE(view === 'browse')} onClick={() => setView('browse')}>브라우저</button>
          <button style={TAB_STYLE(view === 'ingest')} onClick={() => setView('ingest')}>수집</button>
          <button style={TAB_STYLE(view === 'search')} onClick={() => setView('search')}>검색</button>
        </div>

        {/* 자동분류 버튼 */}
        <button onClick={() => handleBackfill(false)} disabled={backfilling}
          style={{ fontSize: 10, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
            background: 'var(--surface)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {backfilling ? <><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />분류 중</> : '미분류 자동분류'}
        </button>
        <button onClick={() => handleBackfill(true)} disabled={backfilling}
          title=">> 마커 포함 혼합 청크 전체 재분류"
          style={{ fontSize: 10, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--violet)', cursor: 'pointer',
            background: 'var(--surface)', color: 'var(--violet)', display: 'flex', alignItems: 'center', gap: 4 }}>
          전체 재분류
        </button>
        {backfillResult && !backfillResult.error && (
          <span style={{ fontSize: 10, color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}>
            {backfillResult.updated}개 완료
          </span>
        )}
      </div>

      {/* 뷰 본문 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>

        {/* ── 브라우저 뷰: 3-패널 ── */}
        {view === 'browse' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 260px 1fr', height: '100%' }}>
            <SourceListPanel catMap={catMap} ctMap={ctMap}
              onSelect={src => { setSelectedSource(src); setSelectedChunk(null); }}
              selectedHash={selectedSource?.url_hash} />
            <ChunkListPanel source={selectedSource} catMap={catMap} ctMap={ctMap}
              onSelect={setSelectedChunk}
              selectedChunkId={selectedChunk?.id}
              onTypeChanged={loadStats} />
            <ChunkDetailPanel chunk={selectedChunk} catMap={catMap} ctMap={ctMap}
              onTypeChanged={handleChunkTypeChanged} />
          </div>
        )}

        {/* ── 수집 뷰 ── */}
        {view === 'ingest' && (
          <div style={{ overflowY: 'auto', height: '100%', padding: '20px 24px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>YouTube URL 수집</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)' }}>카테고리 <span style={{ color: 'var(--text-5)' }}>(비워두면 자동 분류)</span></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => setCategory('')}
                    style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
                      background: !category ? 'var(--violet)' : 'var(--surface-2)',
                      color: !category ? '#fff' : 'var(--text-3)', fontWeight: !category ? 700 : 400 }}>자동</button>
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setCategory(c.value)} title={c.desc}
                      style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, border: `1px solid ${category === c.value ? c.color : 'var(--border)'}`, cursor: 'pointer',
                        background: category === c.value ? `color-mix(in oklch, ${c.color} 20%, var(--surface))` : 'var(--surface-2)',
                        color: category === c.value ? c.color : 'var(--text-3)', fontWeight: category === c.value ? 700 : 400 }}>{c.label}</button>
                  ))}
                </div>
                {category && <div style={{ fontSize: 10, color: catMap[category]?.color, fontFamily: 'var(--font-mono)' }}>→ {catMap[category]?.desc}</div>}
              </div>
              <textarea value={urls} onChange={e => setUrls(e.target.value)}
                placeholder={'https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...\n(한 줄에 하나씩)'}
                rows={6}
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.6,
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px',
                  color: 'var(--text)', resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
                  기존 데이터 덮어쓰기
                </label>
                <div style={{ flex: 1 }} />
                <button onClick={handleIngest} disabled={ingesting || !urls.trim()}
                  style={{ fontSize: 11, padding: '6px 18px', borderRadius: 7, border: 'none', cursor: ingesting ? 'wait' : 'pointer',
                    background: ingesting ? 'var(--surface-2)' : 'var(--violet)', color: ingesting ? 'var(--text-4)' : '#fff', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ingesting ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />수집 중...</> : '수집 시작'}
                </button>
              </div>
              {ingestResult && (
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg)', borderRadius: 6, padding: '8px 10px', maxHeight: 160, overflowY: 'auto' }}>
                  {ingestResult.map((r, i) => (
                    <div key={i} style={{ color: r.ok === false ? 'var(--rose)' : r.skipped ? 'var(--text-4)' : 'var(--mint)', marginBottom: 2 }}>
                      {r.error ? `✗ ${r.error}` : r.skipped ? `— 이미 수집됨 (${r.title || '?'})` : `✓ ${r.title} (${r.chunks}청크, ${r.category})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 검색 뷰 ── */}
        {view === 'search' && (
          <div style={{ overflowY: 'auto', height: '100%', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="예: 서울 직장인의 하루, 공장 노동자 인터뷰"
                style={{ flex: 1, minWidth: 200, fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--bg-2)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', outline: 'none' }} />
              <select value={searchCat} onChange={e => setSearchCat(e.target.value)}
                style={{ fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px' }}>
                <option value="">카테고리 전체</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={searchChunkType} onChange={e => setSearchChunkType(e.target.value)}
                style={{ fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '5px 8px' }}>
                <option value="">타입 전체</option>
                {CHUNK_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
                style={{ fontSize: 11, padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: 'var(--mint)', color: '#000', fontWeight: 700, opacity: searching ? 0.5 : 1 }}>
                검색
              </button>
            </div>
            {searching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-4)', fontSize: 11 }}>
                <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                검색 중...
              </div>
            )}
            {searchError && (
              <div style={{ fontSize: 11, color: 'var(--rose)', background: 'color-mix(in oklch, var(--rose) 10%, var(--surface))',
                border: '1px solid color-mix(in oklch, var(--rose) 30%, var(--border))', borderRadius: 6, padding: '8px 12px' }}>
                오류: {searchError}
              </div>
            )}
            {searchResults !== null && !searching && searchResults.length === 0 && !searchError && (
              <div style={{ fontSize: 11, color: 'var(--text-4)', padding: '12px 0' }}>
                검색 결과 없음 — 다른 쿼리나 필터를 시도해보세요
              </div>
            )}
            {searchResults !== null && searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                  {searchResults.length}개 결과
                </div>
                {searchResults.map((r, i) => {
                  const meta = catMap[r.category] || { label: r.category, color: 'var(--text-4)' };
                  const scoreColor = r.score > 0.5 ? 'var(--mint)' : r.score > 0.35 ? '#f59e0b' : 'var(--text-4)';
                  return (
                    <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)',
                          border: `1px solid ${meta.color}44`, borderRadius: 3, padding: '1px 5px' }}>{meta.label}</span>
                        <ChunkTypeBadge type={r.chunk_type} ctMap={ctMap} />
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: scoreColor, fontWeight: 700 }}>
                          {(r.score * 100).toFixed(1)}%
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{r.source_title?.slice(0, 50)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.7 }}>{r.chunk_text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

/* ══ 분석 탭 ══════════════════════════════════════════════════════════════ */
const AnalyticsTab = () => {
  const [days, setDays]           = React.useState(7);
  const [errors, setErrors]       = React.useState(null);
  const [usage, setUsage]         = React.useState(null);
  const [models, setModels]       = React.useState(null);
  const [loading, setLoading]     = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [e, u, m] = await Promise.all([
        api.get(`/api/admin/analytics/errors?days=${days}`),
        api.get(`/api/admin/analytics/usage?days=${days}`),
        api.get(`/api/admin/analytics/models?days=${days}`),
      ]);
      setErrors(e); setUsage(u); setModels(m);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [days]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 기간 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>분석 대시보드</span>
        {[7, 14, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: days === d ? 'var(--violet)' : 'var(--surface-2)',
              color: days === d ? '#fff' : 'var(--text-3)', fontWeight: days === d ? 700 : 400 }}>
            {d}일
          </button>
        ))}
        {loading && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
      </div>

      {/* Stage 실패율 */}
      {errors?.stage_stats?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Stage별 실패율</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {errors.stage_stats.map(s => (
              <div key={s.stage} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{s.stage}</span>
                <div style={{ height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.fail_rate}%`, background: s.fail_rate > 20 ? 'var(--rose)' : s.fail_rate > 5 ? '#f59e0b' : 'var(--mint)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: s.fail_rate > 20 ? 'var(--rose)' : 'var(--text-4)', textAlign: 'right' }}>
                  {s.fail_rate}% ({s.failed}/{s.total})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모델별 사용 */}
      {models?.models?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>모델별 사용 현황</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 70px', gap: 0,
              background: 'var(--bg-2)', padding: '7px 12px',
              fontSize: 10, fontWeight: 700, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              <span>모델</span><span style={{textAlign:'right'}}>전체</span><span style={{textAlign:'right'}}>완료</span><span style={{textAlign:'right'}}>실패</span><span style={{textAlign:'right'}}>평균점수</span>
            </div>
            {models.models.map((m, i) => (
              <div key={m.model} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 70px', alignItems: 'center', gap: 0, padding: '8px 12px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--surface)' : 'transparent' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.model}>{m.model.split('/').slice(-2).join('/')}</span>
                <span style={{ fontSize: 11, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{m.total}</span>
                <span style={{ fontSize: 11, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--mint)' }}>{m.done}</span>
                <span style={{ fontSize: 11, textAlign: 'right', fontFamily: 'var(--font-mono)', color: m.failed > 0 ? 'var(--rose)' : 'var(--text-4)' }}>{m.failed}</span>
                <span style={{ fontSize: 11, textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--violet)' }}>{m.avg_score != null ? `★${m.avg_score}` : '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 에러 */}
      {errors?.recent_errors?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>최근 실패 ({errors.recent_errors.length}건)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {errors.recent_errors.map(e => (
              <div key={e.id} style={{ background: 'var(--bg-2)', borderRadius: 7, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontWeight: 700 }}>{e.stage}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{e.project_title}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-5)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{new Date(e.updated_at).toLocaleString('ko')}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{e.error?.slice(0, 200)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 일별 추이 요약 */}
      {usage?.shorts_daily?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>일별 쇼츠 생성 ({days}일)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {usage.shorts_daily.slice(-14).map(d => (
              <div key={d.day} style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '6px 10px', minWidth: 70 }}>
                <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{d.day.slice(5)}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{d.created}<span style={{ fontSize: 9, color: 'var(--mint)', marginLeft: 4 }}>✓{d.done}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 컷 에러 패턴 */}
      {errors?.cut_errors?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>컷 에러 패턴 (top 20)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
            {errors.cut_errors.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', gap: 8, alignItems: 'start', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.model}>{e.model?.split('/').slice(-1)[0] || '-'}</span>
                <span style={{ color: 'var(--text-3)', wordBreak: 'break-all' }}>{e.error?.slice(0, 120)}</span>
                <span style={{ color: 'var(--rose)', textAlign: 'right', fontWeight: 700 }}>{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/* ══ 컷 재생성 탭 ══════════════════════════════════════════════════════════ */
const RegenerateTab = () => {
  const [cutKey, setCutKey]     = React.useState('');
  const [detail, setDetail]     = React.useState(null);
  const [loading, setLoading]   = React.useState(false);
  const [models, setModels]     = React.useState([]);
  const [selModel, setSelModel] = React.useState('');
  const [prompt, setPrompt]     = React.useState('');
  const [seed, setSeed]         = React.useState('');
  const [regen, setRegen]       = React.useState(false);
  const [result, setResult]     = React.useState(null);
  const [err, setErr]           = React.useState('');

  React.useEffect(() => {
    api.get('/api/admin/allowed-models').then(r => setModels(r.models || [])).catch(() => {});
  }, []);

  const lookup = async () => {
    if (!cutKey.trim()) return;
    setLoading(true); setDetail(null); setErr('');
    try {
      const d = await api.get(`/api/admin/cuts/${cutKey.trim()}`);
      setDetail(d);
      setSelModel(d.model || '');
      setPrompt(d.video_prompt_en || '');
      setSeed(d.seed ? String(d.seed) : '');
    } catch (e) { setErr(`조회 실패: ${e.message}`); }
    finally { setLoading(false); }
  };

  const handleRegen = async () => {
    setRegen(true); setResult(null); setErr('');
    try {
      const body = {};
      if (selModel) body.video_model = selModel;
      if (prompt)   body.video_prompt_en = prompt;
      if (seed)     body.seed = parseInt(seed, 10);
      const r = await api.post(`/api/admin/cuts/${detail.cut_key}/regenerate`, body);
      setResult(r);
    } catch (e) { setErr(`재생성 실패: ${e.message}`); }
    finally { setRegen(false); }
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>컷 재생성 / 모델 오버라이드</div>

      {/* 컷 조회 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={cutKey} onChange={e => setCutKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="cut_key (예: ep1_sc2_cut1)"
          style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-2)',
            border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', color: 'var(--text)', outline: 'none' }} />
        <button onClick={lookup} disabled={loading}
          style={{ fontSize: 12, padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'var(--surface-2)', color: 'var(--text-3)', fontWeight: 700 }}>
          {loading ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : '조회'}
        </button>
      </div>

      {err && <div style={{ fontSize: 11, color: 'var(--rose)' }}>{err}</div>}

      {/* 컷 상세 */}
      {detail && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-4)' }}>
            {detail.project_title} › {detail.short_title} › {detail.cut_key}
          </div>

          {/* 현재 영상 */}
          {detail.video_path && (
            <video src={resolveVideoUrl(detail.project_id, detail.short_id, detail.video_path)}
              controls style={{ width: 120, aspectRatio: '9/16', borderRadius: 6, background: '#000' }} />
          )}

          {/* 모델 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>모델</label>
            <select value={selModel} onChange={e => setSelModel(e.target.value)}
              style={{ fontSize: 11, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '6px 8px' }}>
              <option value="">변경 안함 (현재: {detail.model || '미설정'})</option>
              {models.map(m => <option key={m} value={m}>{m.split('/').slice(-2).join('/')}</option>)}
            </select>
          </div>

          {/* 프롬프트 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>Video Prompt (선택)</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
              style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--bg-2)',
                border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px',
                color: 'var(--text)', resize: 'vertical', outline: 'none' }} />
          </div>

          {/* 시드 */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>Seed (선택)</label>
              <input value={seed} onChange={e => setSeed(e.target.value)} type="number"
                placeholder={`현재: ${detail.seed ?? '없음'}`}
                style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--bg-2)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px',
                  color: 'var(--text)', width: 160, outline: 'none' }} />
            </div>
            <button onClick={handleRegen} disabled={regen}
              style={{ marginTop: 18, fontSize: 12, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: regen ? 'wait' : 'pointer',
                background: regen ? 'var(--surface-2)' : 'var(--rose)', color: regen ? 'var(--text-4)' : '#fff', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6 }}>
              {regen ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />재생성 중...</> : '재생성'}
            </button>
          </div>

          {result && (
            <div style={{ fontSize: 11, color: 'var(--mint)', background: 'color-mix(in oklch, var(--mint) 10%, var(--surface))', border: '1px solid color-mix(in oklch, var(--mint) 30%, var(--border))', borderRadius: 7, padding: '10px 14px' }}>
              ✓ 재생성 큐 추가됨 — cut_key: {result.cut_key}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


/* ══ 메인 AdminView ════════════════════════════════════════════════════════ */

export const AdminView = () => {
  const [tab, setTab]               = React.useState('videos');  // videos | rag | bg
  const [videos, setVideos]         = React.useState([]);
  const [total, setTotal]           = React.useState(0);
  const [loading, setLoading]       = React.useState(true);
  const [filter, setFilter]         = React.useState('all');  // all|unrated|1|2|3|4|5
  const [page, setPage]             = React.useState(0);
  const PER_PAGE = 24;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PER_PAGE, offset: page * PER_PAGE });
      if (filter !== 'all') params.set('score', filter);
      const res = await api.get(`/api/admin/videos?${params}`);
      setVideos(res.videos || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { setPage(0); }, [filter]);

  const handleScore = (cutKey, score) => {
    setVideos(prev => prev.map(v => v.cut_key === cutKey ? { ...v, score } : v));
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  const FILTERS = [
    { key: 'all', label: '전체' },
    { key: 'unrated', label: '미태깅' },
    { key: '5', label: '★★★★★' },
    { key: '4', label: '★★★★' },
    { key: '3', label: '★★★' },
    { key: '2', label: '★★' },
    { key: '1', label: '★' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 탭 */}
        <button onClick={() => setTab('videos')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'videos' ? 'var(--rose)' : 'var(--surface-2)',
            color: tab === 'videos' ? '#fff' : 'var(--text-3)' }}>
          <Icon name="film" size={11} style={{ marginRight: 4 }} />영상 태깅
        </button>
        <button onClick={() => setTab('rag')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'rag' ? 'var(--violet)' : 'var(--surface-2)',
            color: tab === 'rag' ? '#fff' : 'var(--text-3)' }}>
          <Icon name="database" size={11} style={{ marginRight: 4 }} />RAG 관리
        </button>
        <button onClick={() => setTab('bg')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'bg' ? '#64748b' : 'var(--surface-2)',
            color: tab === 'bg' ? '#fff' : 'var(--text-3)' }}>
          🏞️ 배경 임베딩
        </button>
        <button onClick={() => setTab('users')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'users' ? 'var(--mint)' : 'var(--surface-2)',
            color: tab === 'users' ? '#000' : 'var(--text-3)' }}>
          👥 유저 관리
        </button>
        <button onClick={() => setTab('analytics')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'analytics' ? '#f59e0b' : 'var(--surface-2)',
            color: tab === 'analytics' ? '#000' : 'var(--text-3)' }}>
          📊 분석
        </button>
        <button onClick={() => setTab('regen')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'regen' ? 'var(--rose)' : 'var(--surface-2)',
            color: tab === 'regen' ? '#fff' : 'var(--text-3)' }}>
          🔁 재생성
        </button>

        <div style={{ flex: 1 }} />

        {/* 영상 태깅 탭 필터 */}
        {tab === 'videos' && <>
          <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>총 {total}개</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer', border: 'none',
                  background: filter === f.key ? 'var(--rose)' : 'var(--surface-2)',
                  color: filter === f.key ? '#fff' : 'var(--text-3)',
                  fontWeight: filter === f.key ? 700 : 400,
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 6 }}>
            <Icon name="refresh" size={13} />
          </button>
        </>}
      </div>

      {/* RAG 탭 */}
      {tab === 'rag' && <RagAdminTab />}

      {/* 배경 임베딩 탭 */}
      {tab === 'bg' && <BgEmbedTab />}

      {/* 유저 관리 탭 */}
      {tab === 'users' && <UsersTab />}

      {/* 분석 탭 */}
      {tab === 'analytics' && <AnalyticsTab />}

      {/* 재생성 탭 */}
      {tab === 'regen' && <RegenerateTab />}

      {/* 영상 태깅 그리드 */}
      {tab === 'videos' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--text-4)' }}>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              <span style={{ fontSize: 12 }}>불러오는 중...</span>
            </div>
          ) : videos.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--text-4)' }}>
              <Icon name="film" size={28} />
              <span style={{ fontSize: 12 }}>영상이 없습니다</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {videos.map(v => (
                <VideoCard key={v.cut_key} video={v} onScore={handleScore} />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                이전
              </button>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-4)', lineHeight: '28px' }}>
                {page + 1} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: '5px 12px', fontSize: 11, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
