import React from 'react';
import { api } from '../api.js';

const MEDIA_BASE = 'https://api.stepd.co.kr/api/media';
const LIMIT = 50;

const Stars = ({ score, cutKey, onChange }) => {
  const [hover, setHover] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const rate = async (s) => {
    setSaving(true);
    try {
      await api.patch(`/cuts/${cutKey}/score`, { score: s === score ? null : s });
      onChange(s === score ? null : s);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const display = hover ?? score ?? 0;

  return (
    <div style={{ display: 'flex', gap: 2, opacity: saving ? 0.4 : 1 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => !saving && rate(n)}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}
          style={{ cursor: 'pointer', fontSize: 16, color: n <= display ? '#f59e0b' : 'var(--text4)', transition: 'color 0.1s' }}>★</span>
      ))}
    </div>
  );
};

const VideoDetailModal = ({ video, onClose, onScoreChange }) => {
  const [score, setScore] = React.useState(video.score);

  const handleScore = (s) => {
    setScore(s);
    onScoreChange(video.id, s);
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
          <Stars score={score} cutKey={video.cut_key} onChange={handleScore} />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{score ? `${score}점` : '미평가'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          {[['프로젝트', video.project_title], ['쇼츠', video.short_title], ['씬', video.scene_key], ['모델', video.model], ['시드', video.seed], ['길이', video.duration_sec ? `${video.duration_sec}s` : '-']].map(([k, v]) => (
            <div key={k} className="flex gap-8">
              <span className="text-muted" style={{ minWidth: 50 }}>{k}</span>
              <span className="mono" style={{ fontSize: 11 }}>{v || '-'}</span>
            </div>
          ))}
        </div>

        {video.video_prompt_en && (
          <div style={{ marginTop: 14, background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.65, color: 'var(--text2)' }}>
            {video.video_prompt_en}
          </div>
        )}
      </div>
    </div>
  );
};

export const Videos = () => {
  const [videos, setVideos] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [scoreFilter, setScoreFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: LIMIT, offset: off });
      if (scoreFilter) p.set('score', scoreFilter);
      const data = await api.get(`/videos?${p}`);
      setVideos(data.videos || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(0); }, [scoreFilter]);

  const handleScoreChange = (id, score) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, score } : v));
    if (detail?.id === id) setDetail(prev => ({ ...prev, score }));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      {detail && <VideoDetailModal video={detail} onClose={() => setDetail(null)} onScoreChange={handleScoreChange} />}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">영상 태깅</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>
      <div className="page-sub">완성된 컷 영상 점수 관리 · 전체 {total.toLocaleString()}개</div>

      <div className="flex gap-8 mb-16">
        <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} style={{ width: 150 }}>
          <option value="">전체</option>
          <option value="unrated">미평가</option>
          <option value="1">★ 1점</option>
          <option value="2">★★ 2점</option>
          <option value="3">★★★ 3점</option>
          <option value="4">★★★★ 4점</option>
          <option value="5">★★★★★ 5점</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>컷 키</th><th>쇼츠</th><th>프로젝트</th><th>모델</th><th>점수</th><th>길이</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : videos.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>영상 없음</td></tr>
            ) : videos.map(v => (
              <tr key={v.id}>
                <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{v.cut_key}</td>
                <td style={{ fontSize: 12, fontWeight: 500 }}>{v.short_title || '-'}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{v.project_title || '-'}</td>
                <td className="mono" style={{ fontSize: 10, color: 'var(--text4)' }}>{v.model?.split('/').pop() || '-'}</td>
                <td>
                  <Stars score={v.score} cutKey={v.cut_key} onChange={(s) => handleScoreChange(v.id, s)} />
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{v.duration_sec ? `${v.duration_sec}s` : '-'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetail(v)}>보기</button>
                </td>
              </tr>
            ))}
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
