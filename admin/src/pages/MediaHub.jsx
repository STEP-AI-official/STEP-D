import React from 'react';
import { api } from '../api.js';

const MEDIA_BASE = 'https://api.stepd.co.kr/api/media';
const LIMIT = 60;

// ── 이미지 라이트박스 ──────────────────────────────────────────────
const ImageLightbox = ({ image, onClose, onPrev, onNext }) => {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const url = image.image_path
    ? `${MEDIA_BASE}/${image.project_id}/shorts/${image.short_id}/${image.image_path}`
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 900, width: '95%' }} onClick={e => e.stopPropagation()}>

        {/* 네비게이션 + 닫기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, width: '100%' }}>
          <button className="btn btn-ghost btn-sm" onClick={onPrev}>‹ 이전</button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
            {image.cut_key || image.scene_key}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onNext}>다음 ›</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* 이미지 */}
        {url ? (
          <img src={url} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: '70vh', objectFit: 'contain', background: '#000' }} />
        ) : (
          <div style={{ width: '100%', height: 300, borderRadius: 12, background: 'var(--bg2)', display: 'grid', placeItems: 'center', color: 'var(--text4)' }}>이미지 없음</div>
        )}

        {/* 메타 */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['프로젝트', image.project_title || image.project_id], ['쇼츠', image.short_title || image.short_id], ['씬', image.scene_key], ['모델', image.model]].map(([k, v]) => v && (
            <span key={k}><span style={{ color: 'var(--text4)' }}>{k}: </span>{v}</span>
          ))}
        </div>

        {/* 프롬프트 */}
        {image.image_prompt_en && (
          <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '8px 12px', fontSize: 11, lineHeight: 1.6, color: 'var(--text2)', maxWidth: '100%', textAlign: 'left', width: '100%' }}>
            {image.image_prompt_en}
          </div>
        )}
      </div>
    </div>
  );
};

// ── 영상 모달 ─────────────────────────────────────────────────────
const VideoModal = ({ video, onClose, onPrev, onNext }) => {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const url = video.video_path
    ? `${MEDIA_BASE}/${video.project_id}/shorts/${video.short_id}/${video.video_path}`
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 860, width: '95%' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, width: '100%' }}>
          <button className="btn btn-ghost btn-sm" onClick={onPrev}>‹ 이전</button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
            {video.cut_key}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onNext}>다음 ›</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {url ? (
          <video src={url} controls autoPlay style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: '70vh' }} />
        ) : (
          <div style={{ width: '100%', height: 300, borderRadius: 12, background: 'var(--bg2)', display: 'grid', placeItems: 'center', color: 'var(--text4)' }}>영상 없음</div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['프로젝트', video.project_title || video.project_id], ['쇼츠', video.short_title || video.short_id], ['씬', video.scene_key], ['모델', video.model], ['길이', video.duration_sec ? `${video.duration_sec}s` : null]].map(([k, v]) => v && (
            <span key={k}><span style={{ color: 'var(--text4)' }}>{k}: </span>{v}</span>
          ))}
        </div>

        {video.video_prompt_en && (
          <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '8px 12px', fontSize: 11, lineHeight: 1.6, color: 'var(--text2)', maxWidth: '100%', textAlign: 'left', width: '100%' }}>
            {video.video_prompt_en}
          </div>
        )}
      </div>
    </div>
  );
};

// ── 이미지 갤러리 탭 ──────────────────────────────────────────────
const ImagesTab = () => {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lightbox, setLightbox] = React.useState(null); // index
  const [projectFilter, setProjectFilter] = React.useState('');

  const load = async (off = 0) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset: off });
      if (projectFilter) p.set('project_id', projectFilter);
      const data = await api.get(`/images?${p}`);
      setItems(data.images || data.items || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(0); }, [projectFilter]);

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  const open = (idx) => setLightbox(idx);
  const close = () => setLightbox(null);
  const prev = () => setLightbox(i => (i - 1 + items.length) % items.length);
  const next = () => setLightbox(i => (i + 1) % items.length);

  return (
    <div>
      {lightbox !== null && (
        <ImageLightbox image={items[lightbox]} onClose={close} onPrev={prev} onNext={next} />
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="프로젝트 ID 필터"
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <span className="text-muted" style={{ fontSize: 12 }}>전체 {total.toLocaleString()}개</span>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}><span className="spinner" /></div>
      )}

      {error && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--rose)', fontSize: 13 }}>
          {error.includes('404') || error.includes('405')
            ? '백엔드에 /admin/images 엔드포인트가 없습니다'
            : error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>이미지 없음</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {items.map((img, idx) => {
            const url = img.image_path
              ? `${MEDIA_BASE}/${img.project_id}/shorts/${img.short_id}/${img.image_path}`
              : null;
            return (
              <div key={img.id || idx}
                onClick={() => open(idx)}
                style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', background: 'var(--bg2)', position: 'relative', aspectRatio: '16/9' }}>
                {url ? (
                  <img src={url} alt="" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text4)', fontSize: 12 }}>없음</div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  padding: '16px 8px 6px', fontSize: 10, color: '#fff',
                }}>
                  {img.scene_key || img.cut_key}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => load(offset - LIMIT)}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)}>다음 ›</button>
        </div>
      )}
    </div>
  );
};

// ── 영상 갤러리 탭 ────────────────────────────────────────────────
const VideosTab = () => {
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [modal, setModal] = React.useState(null); // index
  const [scoreFilter, setScoreFilter] = React.useState('');
  const [playing, setPlaying] = React.useState(null); // cut_key of inline-playing card

  const load = async (off = 0) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset: off });
      if (scoreFilter) p.set('score', scoreFilter);
      const data = await api.get(`/videos?${p}`);
      setItems(data.videos || data.items || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(0); }, [scoreFilter]);

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  const open = (idx) => { setPlaying(null); setModal(idx); };
  const close = () => setModal(null);
  const prev = () => setModal(i => (i - 1 + items.length) % items.length);
  const next = () => setModal(i => (i + 1) % items.length);

  return (
    <div>
      {modal !== null && (
        <VideoModal video={items[modal]} onClose={close} onPrev={prev} onNext={next} />
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ width: 150 }}>
          <option value="">전체 점수</option>
          <option value="unrated">미평가</option>
          <option value="1">★ 1점</option>
          <option value="2">★★ 2점</option>
          <option value="3">★★★ 3점</option>
          <option value="4">★★★★ 4점</option>
          <option value="5">★★★★★ 5점</option>
        </select>
        <span className="text-muted" style={{ fontSize: 12 }}>전체 {total.toLocaleString()}개</span>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>

      {loading && (
        <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}><span className="spinner" /></div>
      )}

      {error && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--rose)', fontSize: 13 }}>{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>영상 없음</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {items.map((v, idx) => {
            const url = v.video_path
              ? `${MEDIA_BASE}/${v.project_id}/shorts/${v.short_id}/${v.video_path}`
              : null;
            const isPlaying = playing === v.cut_key;

            return (
              <div key={v.id || idx} style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                {/* 썸네일 / 인라인 플레이어 */}
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000', cursor: 'pointer' }}
                  onClick={() => {
                    if (!url) return;
                    if (isPlaying) setPlaying(null);
                    else setPlaying(v.cut_key);
                  }}>
                  {isPlaying && url ? (
                    <video src={url} controls autoPlay style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                      onClick={e => e.stopPropagation()} />
                  ) : (
                    <>
                      {url ? (
                        <video src={url} muted preload="metadata"
                          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', pointerEvents: 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text4)', fontSize: 12 }}>없음</div>
                      )}
                      {url && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                          background: 'rgba(0,0,0,0.3)',
                        }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {v.duration_sec && !isPlaying && (
                    <div style={{ position: 'absolute', bottom: 5, right: 7, fontSize: 10, color: '#fff', background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 5px' }}>
                      {v.duration_sec}s
                    </div>
                  )}
                </div>

                {/* 메타 + 전체화면 */}
                <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.cut_key}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.short_title || v.short_id} · {v.model?.split('/').pop() || '-'}
                    </div>
                  </div>
                  {v.score && (
                    <span style={{ fontSize: 10, color: '#f59e0b', whiteSpace: 'nowrap' }}>
                      {'★'.repeat(v.score)}
                    </span>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => open(idx)}>
                    ⛶
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => load(offset - LIMIT)}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)}>다음 ›</button>
        </div>
      )}
    </div>
  );
};

// ── 메인 MediaHub ─────────────────────────────────────────────────
export const MediaHub = () => {
  const [tab, setTab] = React.useState('videos');

  const tabs = [
    { id: 'videos', label: '영상' },
    { id: 'images', label: '이미지' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">미디어 허브</div>
      </div>
      <div className="page-sub">생성된 모든 씬 이미지·컷 영상을 한 곳에서 조회</div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--mint)' : '2px solid transparent',
              color: tab === t.id ? 'var(--mint)' : 'var(--text3)',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'videos' && <VideosTab />}
      {tab === 'images' && <ImagesTab />}
    </div>
  );
};
