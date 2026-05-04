import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';
import { publishToYouTube, getPublishJob, listPublishes, listYouTubeChannels } from '../api/publish';
import {
  getEditorState, putEditorState, uploadClip,
  transcribeClip, startRender, getRenderStatus,
} from '../api/editor';

/* ══════════════════════════════════════════════════════════════════════════
 * 풀-피처 영상 편집기
 *
 * 기능:
 *   - 클립 자르기 (trim in/out)
 *   - 클립 순서 변경 (드래그앤드롭)
 *   - 나레이션 배치 (타임라인 드래그)
 *   - 자동 자막 (Whisper)
 *   - 사용자 영상 업로드 (외부 클립)
 *   - 인트로 / 아웃트로 슬롯
 *   - BGM 추가 + 볼륨 조절
 *   - 속도 조절 (0.25x ~ 4x)
 *   - 전환 효과 (fade / wipeleft / dissolve / none)
 *   - 자동편집 (AI 컷 순서 최적화)
 *   - 백엔드 FFmpeg 최종 렌더
 *   - YouTube 업로드
 * ══════════════════════════════════════════════════════════════════════════ */

const PX_PER_SEC  = 80;
const CLIP_H      = 52;
const NAR_H       = 36;
const SUB_H       = 28;
const BGM_H       = 24;
const RULER_H     = 28;
const TRACK_LABEL = 56; // 왼쪽 트랙 이름 영역 너비

const fmt = (sec) => {
  const s  = Math.floor(sec);
  const ms = Math.round((sec - s) * 10);
  const m  = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${ms}`;
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── 초기 편집 상태 빌더 ── */
const buildInitialState = (scenes, clips) => {
  const clipMap = Object.fromEntries(clips.map(c => [c.scene_key || c.key, c]));
  let order = 1;
  const builtClips = scenes.map(s => {
    const c = clipMap[s.scene_key];
    return {
      id:           s.scene_key,
      type:         'scene',
      video_key:    c?.video_key || c?.video_path || null,
      video_url:    c?.video_url || null,
      thumbnail_url: c?.thumbnail_url || c?.image_url || null,
      label:        s.title_ko || s.scene_key,
      duration_sec: s.duration_sec || 5,
      trim_in:      0,
      trim_out:     null,
      speed:        1.0,
      order:        order++,
      status:       c?.status || 'pending',
    };
  });
  return {
    clips:               builtClips,
    narrations:          [],
    subtitles:           [],
    bgm_key:             null,
    bgm_volume:          0.15,
    transition:          'none',
    transition_duration: 0.5,
    auto_subtitle:       false,
  };
};


/* ══ 메인 컴포넌트 ══════════════════════════════════════════════════════════ */
export const ExportView = ({ project, short }) => {
  const pid = project?.id;
  const sid = short?.id;

  // ── 편집 상태
  const [edState, setEdState]   = React.useState(null);    // EditorState
  const [loading, setLoading]   = React.useState(true);
  const [dirty,   setDirty]     = React.useState(false);   // 저장 필요 여부
  const [saving,  setSaving]    = React.useState(false);

  // ── 재생
  const videoRef    = React.useRef(null);
  const rafRef      = React.useRef(null);
  const timelineRef = React.useRef(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [playing, setPlaying]         = React.useState(false);

  // ── 선택
  const [selectedId,    setSelectedId]    = React.useState(null); // clip id
  const [selectedNarId, setSelectedNarId] = React.useState(null);
  const [selectedSubId, setSelectedSubId] = React.useState(null);
  const [activePanel,   setActivePanel]   = React.useState('clip'); // clip|nar|sub|bgm|settings

  // ── 렌더
  const [rendering,     setRendering]     = React.useState(false);
  const [renderJob,     setRenderJob]     = React.useState(null);
  const renderPollRef = React.useRef(null);

  // ── YouTube
  const [ytOpen,      setYtOpen]      = React.useState(false);
  const [ytChannels,  setYtChannels]  = React.useState([]);
  const [ytChannelId, setYtChannelId] = React.useState('');
  const [ytTitle,     setYtTitle]     = React.useState(short?.title || '');
  const [ytDesc,      setYtDesc]      = React.useState('');
  const [ytTags,      setYtTags]      = React.useState('');
  const [ytPrivacy,   setYtPrivacy]   = React.useState('private');
  const [ytNotify,    setYtNotify]    = React.useState(false);
  const [ytJob,       setYtJob]       = React.useState(null);
  const [ytUploading, setYtUploading] = React.useState(false);
  const [ytHistory,   setYtHistory]   = React.useState([]);
  const ytPollRef = React.useRef(null);

  // ── 자막 생성 중
  const [transcribing, setTranscribing] = React.useState(false);

  // ── 드래그 (나레이션)
  const narDragRef = React.useRef(null);

  // ── 클립 드래그앤드롭 순서
  const dragClipRef = React.useRef(null);

  // ── 데이터 로드
  const load = React.useCallback(async () => {
    if (!pid || !sid) return;
    setLoading(true);
    try {
      const [edRes, sceneRes, clipRes] = await Promise.all([
        getEditorState(pid, sid).catch(() => null),
        api.get(`/api/projects/${pid}/shorts/${sid}/scenario`),
        api.get(`/api/projects/${pid}/shorts/${sid}/clips`).catch(() => ({ clips: [] })),
      ]);

      const scenes   = sceneRes?.scenes || sceneRes?.screenplay?.scenes || [];
      const clips    = clipRes?.clips || [];
      const saved    = edRes?.state;

      if (saved && saved.clips && saved.clips.length > 0) {
        // 저장된 상태에 새 씬 클립 병합 (새로 생성된 씬 추가)
        const existingIds = new Set(saved.clips.map(c => c.id));
        const clipMap     = Object.fromEntries(clips.map(c => [c.scene_key || c.key, c]));
        let maxOrder      = Math.max(...saved.clips.map(c => c.order || 0), 0);
        const newClips    = scenes
          .filter(s => !existingIds.has(s.scene_key))
          .map(s => {
            const c = clipMap[s.scene_key] || {};
            return {
              id: s.scene_key, type: 'scene',
              video_key: c.video_key || c.video_path || null,
              video_url: c.video_url || null,
              thumbnail_url: c.thumbnail_url || c.image_url || null,
              label: s.title_ko || s.scene_key,
              duration_sec: s.duration_sec || 5,
              trim_in: 0, trim_out: null, speed: 1.0,
              order: ++maxOrder, status: c.status || 'pending',
            };
          });
        saved.clips = [...saved.clips, ...newClips];
        setEdState(saved);
      } else {
        setEdState(buildInitialState(scenes, clips));
      }
    } catch (e) {
      console.error('editor load error:', e);
    } finally {
      setLoading(false);
    }
  }, [pid, sid]);

  React.useEffect(() => { load(); }, [load]);

  // ── 자동 저장 (dirty → 2초 후)
  React.useEffect(() => {
    if (!dirty || !edState) return;
    const t = setTimeout(async () => {
      setSaving(true);
      try { await putEditorState(pid, sid, edState); setDirty(false); }
      catch (e) { console.error('auto-save failed:', e); }
      finally   { setSaving(false); }
    }, 2000);
    return () => clearTimeout(t);
  }, [dirty, edState, pid, sid]);

  // ── 편집 상태 업데이트 헬퍼
  const updateState = (patch) => {
    setEdState(prev => ({ ...prev, ...patch }));
    setDirty(true);
  };
  const updateClip = (id, patch) => {
    setEdState(prev => ({
      ...prev,
      clips: prev.clips.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
    setDirty(true);
  };
  const updateNar = (id, patch) => {
    setEdState(prev => ({
      ...prev,
      narrations: prev.narrations.map(n => n.id === id ? { ...n, ...patch } : n),
    }));
    setDirty(true);
  };
  const updateSub = (id, patch) => {
    setEdState(prev => ({
      ...prev,
      subtitles: prev.subtitles.map(s => s.id === id ? { ...s, ...patch } : s),
    }));
    setDirty(true);
  };

  // ── 정렬된 클립
  const sortedClips = React.useMemo(() => {
    if (!edState) return [];
    return [...edState.clips].sort((a, b) => a.order - b.order);
  }, [edState]);

  // ── 타임라인 오프셋 계산
  const sceneOffsets = React.useMemo(() => {
    let offset = 0;
    return sortedClips.map(c => {
      const start    = offset;
      const trimIn   = c.trim_in || 0;
      const trimOut  = c.trim_out ?? c.duration_sec;
      const duration = Math.max(0.1, (trimOut - trimIn) / (c.speed || 1));
      offset += duration;
      return { id: c.id, start, duration, rawDuration: c.duration_sec };
    });
  }, [sortedClips]);

  const totalDuration = React.useMemo(() =>
    sceneOffsets.reduce((acc, o) => acc + o.duration, 0),
  [sceneOffsets]);

  const offsetById = React.useMemo(() =>
    Object.fromEntries(sceneOffsets.map(o => [o.id, o])),
  [sceneOffsets]);

  // ── 현재 재생 씬
  const activeClipId = React.useMemo(() => {
    const entry = sceneOffsets.find(o => currentTime >= o.start && currentTime < o.start + o.duration);
    return entry?.id || sceneOffsets[0]?.id || null;
  }, [currentTime, sceneOffsets]);

  const activeClip = sortedClips.find(c => c.id === activeClipId);
  const activeVideoUrl = activeClip?.video_url
    ? (activeClip.video_url.startsWith('http') ? activeClip.video_url : `/api/media/${pid}/${activeClip.video_url}`)
    : null;

  // ── RAF 재생 추적
  React.useEffect(() => {
    const tick = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const entry      = sceneOffsets.find(o => o.id === activeClipId);
        const clipOffset = entry?.start ?? 0;
        setCurrentTime(clipOffset + videoRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeClipId, sceneOffsets]);

  // ── seek
  const seekTo = (sec) => {
    const clamped = clamp(sec, 0, totalDuration);
    setCurrentTime(clamped);
    const entry = sceneOffsets.find(o => clamped >= o.start && clamped < o.start + o.duration);
    if (entry && videoRef.current) {
      videoRef.current.currentTime = clamped - entry.start;
    }
  };

  const handleTimelineClick = (e) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - TRACK_LABEL + (timelineRef.current?.scrollLeft || 0);
    seekTo(x / PX_PER_SEC);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else                          { videoRef.current.pause(); setPlaying(false); }
  };

  // ── 나레이션 드래그
  const onNarMouseDown = (e, nar) => {
    e.stopPropagation();
    setSelectedNarId(nar.id);
    setSelectedId(null);
    narDragRef.current = { id: nar.id, startX: e.clientX, origStart: nar.start_sec };
    const onMove = (ev) => {
      if (!narDragRef.current) return;
      const dx       = ev.clientX - narDragRef.current.startX;
      const newStart = Math.max(0, narDragRef.current.origStart + dx / PX_PER_SEC);
      updateNar(narDragRef.current.id, { start_sec: newStart });
    };
    const onUp = () => {
      narDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── 클립 드래그앤드롭 (순서 변경)
  const onClipDragStart = (e, clipId) => {
    dragClipRef.current = clipId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onClipDragOver = (e, targetId) => {
    e.preventDefault();
    if (!dragClipRef.current || dragClipRef.current === targetId) return;
    const src = edState.clips.find(c => c.id === dragClipRef.current);
    const tgt = edState.clips.find(c => c.id === targetId);
    if (!src || !tgt) return;
    const srcOrder = src.order;
    setEdState(prev => ({
      ...prev,
      clips: prev.clips.map(c => {
        if (c.id === dragClipRef.current) return { ...c, order: tgt.order };
        if (c.id === targetId)            return { ...c, order: srcOrder };
        return c;
      }),
    }));
    setDirty(true);
  };
  const onClipDrop = () => { dragClipRef.current = null; };

  // ── 인트로/아웃트로 슬롯 추가
  const addSlot = (type) => {
    const id       = `${type}_${Date.now()}`;
    const isIntro  = type === 'intro';
    const newClip  = {
      id, type, video_key: null, video_url: null, thumbnail_url: null,
      label: isIntro ? '인트로' : '아웃트로',
      duration_sec: 5, trim_in: 0, trim_out: null, speed: 1.0,
      order: isIntro ? 0 : 9999, status: 'empty',
    };
    setEdState(prev => {
      const clips = [...prev.clips, newClip];
      // 순서 정규화
      const sorted = [...clips].sort((a, b) => a.order - b.order)
        .map((c, i) => ({ ...c, order: i + 1 }));
      return { ...prev, clips: sorted };
    });
    setDirty(true);
    setSelectedId(id);
    setActivePanel('clip');
  };

  // ── 외부 영상 업로드
  const onUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadClip(pid, sid, file);
      const newClip = {
        id: res.id, type: 'upload',
        video_key: res.video_key, video_url: res.video_url,
        thumbnail_url: null, label: res.label,
        duration_sec: res.duration_sec, trim_in: 0, trim_out: null,
        speed: 1.0, order: (edState?.clips.length || 0) + 1, status: 'done',
      };
      setEdState(prev => ({ ...prev, clips: [...prev.clips, newClip] }));
      setDirty(true);
      setSelectedId(res.id);
      setActivePanel('clip');
    } catch (err) {
      alert('업로드 실패: ' + err.message);
    }
    e.target.value = '';
  };

  // ── 자동 자막
  const runTranscribe = async () => {
    const clip = selectedId ? edState?.clips.find(c => c.id === selectedId) : null;
    if (!clip?.video_key) { alert('자막을 생성할 클립을 먼저 선택하세요'); return; }
    setTranscribing(true);
    try {
      const res = await transcribeClip(pid, sid, clip.video_key);
      const subs = res.subtitles || [];
      const offset = offsetById[clip.id]?.start || 0;
      const adjusted = subs.map(s => ({
        ...s,
        start_sec: s.start_sec + offset,
        end_sec:   s.end_sec   + offset,
      }));
      setEdState(prev => ({ ...prev, subtitles: [...(prev.subtitles || []), ...adjusted] }));
      setDirty(true);
      setActivePanel('sub');
    } catch (err) {
      alert('자막 생성 실패: ' + err.message);
    } finally {
      setTranscribing(false);
    }
  };

  // ── 자동 편집 (AI 컷 순서)
  const autoEdit = async () => {
    if (!edState) return;
    try {
      const sceneSummaries = sortedClips
        .filter(c => c.type === 'scene')
        .map((c, i) => `${i + 1}. ${c.label} (${c.duration_sec}s)`).join('\n');

      const { default: llm } = await import('../api').then(() => ({ default: api }));
      const res = await llm.post(`/api/projects/${pid}/shorts/${sid}/auto-edit`, {
        clips: sortedClips.map(c => ({ id: c.id, label: c.label, duration_sec: c.duration_sec })),
      }).catch(() => null);

      if (res?.order) {
        setEdState(prev => {
          const orderMap = Object.fromEntries(res.order.map((id, i) => [id, i + 1]));
          return {
            ...prev,
            clips: prev.clips.map(c => ({
              ...c,
              order: orderMap[c.id] ?? c.order,
            })),
          };
        });
        setDirty(true);
      }
    } catch (e) {
      console.error('auto-edit failed', e);
    }
  };

  // ── 렌더
  const startRenderJob = async () => {
    if (!edState) return;
    setRendering(true);
    setRenderJob(null);
    try {
      const res = await startRender(pid, sid, edState);
      setRenderJob({ ...res, status: 'pending' });
      renderPollRef.current = setInterval(async () => {
        const job = await getRenderStatus(pid, sid, res.job_id).catch(() => null);
        if (!job) return;
        setRenderJob(job);
        if (job.status === 'done' || job.status === 'failed') {
          clearInterval(renderPollRef.current);
          setRendering(false);
        }
      }, 3000);
    } catch (e) {
      alert('렌더 실패: ' + e.message);
      setRendering(false);
    }
  };

  React.useEffect(() => () => clearInterval(renderPollRef.current), []);

  // ── YouTube
  const openYtPanel = async () => {
    setYtOpen(true);
    try {
      const [chRes, histRes] = await Promise.all([
        listYouTubeChannels().catch(() => ({ channels: [] })),
        listPublishes(pid, sid).catch(() => ({ publishes: [] })),
      ]);
      setYtChannels(chRes.channels || []);
      setYtHistory(histRes.publishes || []);
      if (chRes.channels?.length) setYtChannelId(chRes.channels[0].id);
    } catch {}
  };

  React.useEffect(() => {
    if (!ytJob?.job_id || ytJob.status === 'done' || ytJob.status === 'error') return;
    ytPollRef.current = setInterval(async () => {
      const j = await getPublishJob(pid, sid, ytJob.job_id).catch(() => null);
      if (!j) return;
      setYtJob(j);
      if (j.status === 'done') {
        setYtHistory(prev => [j, ...prev.filter(h => h.job_id !== j.job_id)]);
        clearInterval(ytPollRef.current);
      }
      if (j.status === 'error') clearInterval(ytPollRef.current);
    }, 3000);
    return () => clearInterval(ytPollRef.current);
  }, [ytJob?.job_id, ytJob?.status]);

  const uploadToYouTube = async () => {
    if (!renderJob?.output_url) { alert('렌더를 먼저 완료하세요'); return; }
    setYtUploading(true);
    try {
      const tags = ytTags.split(',').map(t => t.trim()).filter(Boolean);
      const res  = await publishToYouTube(pid, sid, {
        title: ytTitle || short?.title || '제목 없음',
        description: ytDesc, tags,
        privacy_status: ytPrivacy,
        channel_id: ytChannelId || null,
        notify_subscribers: ytNotify,
      });
      const job = await getPublishJob(pid, sid, res.job_id);
      setYtJob(job);
    } catch (e) {
      alert('업로드 실패: ' + e.message);
    } finally {
      setYtUploading(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-4)' }}>
      <span className="spinner" style={{ width:24, height:24, borderWidth:3 }} />
      <span style={{ fontSize:13 }}>편집기 로드 중...</span>
    </div>
  );
  if (!edState) return null;

  const timelineWidth = Math.max(totalDuration * PX_PER_SEC + 120, 600);
  const headLeft      = currentTime * PX_PER_SEC;
  const selectedClip  = selectedId ? edState.clips.find(c => c.id === selectedId) : null;
  const selectedNar   = selectedNarId ? edState.narrations.find(n => n.id === selectedNarId) : null;
  const selectedSub   = selectedSubId ? edState.subtitles.find(s => s.id === selectedSubId) : null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', height:'100%', overflow:'hidden', background:'var(--bg)' }}>

      {/* ── 왼쪽: 프리뷰 + 타임라인 ── */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* 툴바 */}
        <EditorToolbar
          saving={saving} dirty={dirty}
          onAddIntro={() => addSlot('intro')}
          onAddOutro={() => addSlot('outro')}
          onUpload={onUploadFile}
          onAutoEdit={autoEdit}
          onTranscribe={runTranscribe}
          transcribing={transcribing}
          selectedClipKey={selectedId}
        />

        {/* 프리뷰 */}
        <div style={{ flex:'0 0 auto', background:'oklch(0.09 0.005 280)', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px 20px 10px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ position:'relative', aspectRatio:'9/16', height:'min(50vh,320px)', borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', background:'#000', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
            {activeVideoUrl ? (
              <video
                key={activeVideoUrl}
                ref={videoRef}
                src={activeVideoUrl}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                playsInline
                onEnded={() => setPlaying(false)}
              />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text-4)' }}>
                <Icon name="film" size={32} />
                <span style={{ fontSize:11, fontFamily:'var(--font-mono)', textAlign:'center', padding:'0 16px' }}>씬 영상을 먼저 생성하거나<br/>클립을 업로드하세요</span>
              </div>
            )}
            <button onClick={togglePlay} style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.65)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:24, padding:'6px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#fff', backdropFilter:'blur(4px)' }}>
              <Icon name={playing ? 'pause' : 'play'} size={14} style={{ color:'#fff' }} />
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', letterSpacing:'0.05em' }}>{fmt(currentTime)} / {fmt(totalDuration)}</span>
            </button>
            {activeClip && (
              <div style={{ position:'absolute', top:8, left:10, background:'rgba(0,0,0,0.55)', borderRadius:5, padding:'3px 8px', fontSize:10, color:'rgba(255,255,255,0.7)', fontFamily:'var(--font-mono)', backdropFilter:'blur(2px)' }}>
                {activeClip.label}
              </div>
            )}
            {/* 자막 오버레이 */}
            <SubtitleOverlay subtitles={edState.subtitles} currentTime={currentTime} />
          </div>
        </div>

        {/* 타임라인 */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{ flex:1, overflowX:'auto', overflowY:'auto', position:'relative', cursor:'crosshair', userSelect:'none', background:'oklch(0.10 0.006 280)', minHeight:0 }}
        >
          <div style={{ width: TRACK_LABEL + timelineWidth, position:'relative', minHeight: RULER_H + CLIP_H + NAR_H + SUB_H + BGM_H + 16 }}>

            {/* 트랙 레이블 (고정) */}
            <TrackLabels />

            {/* 눈금 */}
            <div style={{ position:'absolute', top:0, left:TRACK_LABEL, right:0 }}>
              <TimeRuler totalDuration={totalDuration} />
            </div>

            {/* 클립 트랙 */}
            <div style={{ position:'absolute', top:RULER_H, left:TRACK_LABEL, height:CLIP_H, width:timelineWidth }}>
              <TrackBg />
              {sceneOffsets.map(({ id, start, duration }) => {
                const clip      = sortedClips.find(c => c.id === id);
                if (!clip) return null;
                const isSelected = selectedId === id;
                const trimIn    = clip.trim_in || 0;
                const trimOut   = clip.trim_out ?? clip.duration_sec;
                return (
                  <ClipBlock
                    key={id}
                    clip={clip}
                    left={start * PX_PER_SEC}
                    width={duration * PX_PER_SEC}
                    isSelected={isSelected}
                    pid={pid}
                    onSelect={() => { setSelectedId(id); setSelectedNarId(null); setSelectedSubId(null); setActivePanel('clip'); }}
                    onDragStart={e => onClipDragStart(e, id)}
                    onDragOver={e => onClipDragOver(e, id)}
                    onDrop={onClipDrop}
                    onTrimIn={dx => updateClip(id, { trim_in: clamp(trimIn + dx / PX_PER_SEC, 0, trimOut - 0.1) })}
                    onTrimOut={dx => updateClip(id, { trim_out: clamp(trimOut + dx / PX_PER_SEC, trimIn + 0.1, clip.duration_sec) })}
                  />
                );
              })}
            </div>

            {/* 나레이션 트랙 */}
            <div style={{ position:'absolute', top:RULER_H + CLIP_H, left:TRACK_LABEL, height:NAR_H, width:timelineWidth }}>
              <TrackBg />
              {edState.narrations.map(nar => {
                const isSelected = selectedNarId === nar.id;
                return (
                  <NarBlock
                    key={nar.id}
                    nar={nar}
                    isSelected={isSelected}
                    onMouseDown={e => onNarMouseDown(e, nar)}
                    onClick={e => { e.stopPropagation(); setSelectedNarId(nar.id); setSelectedId(null); setSelectedSubId(null); setActivePanel('nar'); }}
                  />
                );
              })}
            </div>

            {/* 자막 트랙 */}
            <div style={{ position:'absolute', top:RULER_H + CLIP_H + NAR_H, left:TRACK_LABEL, height:SUB_H, width:timelineWidth }}>
              <TrackBg />
              {edState.subtitles.map(sub => (
                <SubBlock
                  key={sub.id}
                  sub={sub}
                  isSelected={selectedSubId === sub.id}
                  onClick={e => { e.stopPropagation(); setSelectedSubId(sub.id); setSelectedId(null); setSelectedNarId(null); setActivePanel('sub'); }}
                />
              ))}
            </div>

            {/* BGM 트랙 */}
            <div style={{ position:'absolute', top:RULER_H + CLIP_H + NAR_H + SUB_H, left:TRACK_LABEL, height:BGM_H, width:timelineWidth }}>
              <TrackBg />
              {edState.bgm_key && (
                <div style={{ position:'absolute', left:0, top:4, height:BGM_H-8, width:timelineWidth - 8, borderRadius:3, background:'color-mix(in oklch, var(--blue) 20%, var(--surface))', border:'1px solid color-mix(in oklch, var(--blue) 40%, transparent)', display:'flex', alignItems:'center', padding:'0 8px', gap:6, cursor:'pointer', fontSize:9, color:'var(--blue)', fontFamily:'var(--font-mono)' }}
                  onClick={() => setActivePanel('bgm')}>
                  <Icon name="music" size={8} />
                  BGM · vol {Math.round(edState.bgm_volume * 100)}%
                </div>
              )}
            </div>

            {/* 플레이헤드 */}
            <div style={{ position:'absolute', top:0, left: TRACK_LABEL + headLeft, width:2, height:'100%', background:'var(--rose)', pointerEvents:'none', zIndex:20 }}>
              <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'7px solid var(--rose)' }} />
            </div>

          </div>
        </div>
      </div>

      {/* ── 오른쪽 패널 ── */}
      <div style={{ borderLeft:'1px solid var(--border)', background:'var(--bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* 패널 탭 */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {[
            { key:'clip',     label:'클립' },
            { key:'nar',      label:'나레이션' },
            { key:'sub',      label:'자막' },
            { key:'bgm',      label:'BGM' },
            { key:'settings', label:'설정' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActivePanel(tab.key)}
              style={{ flex:1, padding:'9px 4px', fontSize:10, fontWeight:600, fontFamily:'var(--font-mono)', cursor:'pointer', border:'none', background:'transparent', color: activePanel === tab.key ? 'var(--mint)' : 'var(--text-4)', borderBottom: activePanel === tab.key ? '2px solid var(--mint)' : '2px solid transparent', transition:'all 0.1s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* ── 클립 패널 ── */}
          {activePanel === 'clip' && (
            <ClipPanel
              clip={selectedClip}
              pid={pid}
              onUpdate={(patch) => selectedId && updateClip(selectedId, patch)}
              onDelete={() => {
                if (!selectedId) return;
                setEdState(prev => ({ ...prev, clips: prev.clips.filter(c => c.id !== selectedId) }));
                setSelectedId(null);
                setDirty(true);
              }}
              onUploadVideo={async (file) => {
                if (!selectedId) return;
                const res = await uploadClip(pid, sid, file);
                updateClip(selectedId, { video_key: res.video_key, video_url: res.video_url, duration_sec: res.duration_sec, status: 'done' });
              }}
              clips={sortedClips}
              onReorder={(id, dir) => {
                const sorted = [...sortedClips];
                const idx    = sorted.findIndex(c => c.id === id);
                const target = idx + dir;
                if (target < 0 || target >= sorted.length) return;
                const aOrder = sorted[idx].order;
                const bOrder = sorted[target].order;
                setEdState(prev => ({
                  ...prev,
                  clips: prev.clips.map(c => {
                    if (c.id === sorted[idx].id)    return { ...c, order: bOrder };
                    if (c.id === sorted[target].id) return { ...c, order: aOrder };
                    return c;
                  }),
                }));
                setDirty(true);
              }}
            />
          )}

          {/* ── 나레이션 패널 ── */}
          {activePanel === 'nar' && (
            <NarPanel
              nar={selectedNar}
              narrations={edState.narrations}
              totalDuration={totalDuration}
              currentTime={currentTime}
              onUpdate={(patch) => selectedNarId && updateNar(selectedNarId, patch)}
              onDelete={() => {
                if (!selectedNarId) return;
                setEdState(prev => ({ ...prev, narrations: prev.narrations.filter(n => n.id !== selectedNarId) }));
                setSelectedNarId(null);
                setDirty(true);
              }}
              onAdd={() => {
                const id = `nar_${Date.now()}`;
                setEdState(prev => ({ ...prev, narrations: [...prev.narrations, { id, text: '', start_sec: currentTime, duration_sec: 4 }] }));
                setSelectedNarId(id);
                setDirty(true);
              }}
            />
          )}

          {/* ── 자막 패널 ── */}
          {activePanel === 'sub' && (
            <SubPanel
              sub={selectedSub}
              subtitles={edState.subtitles}
              onUpdate={(patch) => selectedSubId && updateSub(selectedSubId, patch)}
              onDelete={() => {
                if (!selectedSubId) return;
                setEdState(prev => ({ ...prev, subtitles: prev.subtitles.filter(s => s.id !== selectedSubId) }));
                setSelectedSubId(null);
                setDirty(true);
              }}
              onAdd={() => {
                const id = `sub_${Date.now()}`;
                setEdState(prev => ({ ...prev, subtitles: [...prev.subtitles, { id, start_sec: currentTime, end_sec: currentTime + 3, text: '' }] }));
                setSelectedSubId(id);
                setDirty(true);
              }}
              onSelect={(id) => setSelectedSubId(id)}
              onTranscribe={runTranscribe}
              transcribing={transcribing}
              selectedClipKey={selectedId}
            />
          )}

          {/* ── BGM 패널 ── */}
          {activePanel === 'bgm' && (
            <BgmPanel
              bgmKey={edState.bgm_key}
              bgmVolume={edState.bgm_volume}
              onUpdate={(patch) => updateState(patch)}
              pid={pid}
              sid={sid}
            />
          )}

          {/* ── 설정 패널 ── */}
          {activePanel === 'settings' && (
            <SettingsPanel
              transition={edState.transition}
              transitionDuration={edState.transition_duration}
              onUpdate={(patch) => updateState(patch)}
            />
          )}

        </div>

        {/* 렌더 + YouTube 영역 */}
        <RenderFooter
          rendering={rendering}
          renderJob={renderJob}
          ytOpen={ytOpen}
          setYtOpen={setYtOpen}
          onRender={startRenderJob}
          onOpenYt={openYtPanel}
          ytChannels={ytChannels}
          ytChannelId={ytChannelId} setYtChannelId={setYtChannelId}
          ytTitle={ytTitle}         setYtTitle={setYtTitle}
          ytDesc={ytDesc}           setYtDesc={setYtDesc}
          ytTags={ytTags}           setYtTags={setYtTags}
          ytPrivacy={ytPrivacy}     setYtPrivacy={setYtPrivacy}
          ytNotify={ytNotify}       setYtNotify={setYtNotify}
          ytJob={ytJob}
          ytUploading={ytUploading}
          ytHistory={ytHistory}
          onYtUpload={uploadToYouTube}
        />
      </div>

    </div>
  );
};


/* ══ 서브 컴포넌트들 ════════════════════════════════════════════════════════ */

const EditorToolbar = ({ saving, dirty, onAddIntro, onAddOutro, onUpload, onAutoEdit, onTranscribe, transcribing, selectedClipKey }) => {
  const fileRef = React.useRef(null);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderBottom:'1px solid var(--border)', background:'var(--bg)', flexShrink:0, flexWrap:'wrap' }}>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginRight:4 }}>편집기</span>
      {saving && <span style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>저장 중...</span>}
      {!saving && !dirty && <span style={{ fontSize:10, color:'var(--mint)', fontFamily:'var(--font-mono)' }}>저장됨</span>}
      <div style={{ flex:1 }} />

      <button className="btn ghost sm" onClick={onAddIntro} title="인트로 슬롯 추가">
        <Icon name="film" size={11} /> 인트로
      </button>
      <button className="btn ghost sm" onClick={onAddOutro} title="아웃트로 슬롯 추가">
        <Icon name="film" size={11} /> 아웃트로
      </button>
      <button className="btn ghost sm" onClick={() => fileRef.current?.click()} title="외부 영상 업로드">
        <Icon name="upload" size={11} /> 영상 추가
      </button>
      <input ref={fileRef} type="file" accept="video/*" style={{ display:'none' }} onChange={onUpload} />
      <button className="btn ghost sm" onClick={onAutoEdit} title="AI 자동 편집">
        <Icon name="sparkles" size={11} /> AI 편집
      </button>
      <button className="btn ghost sm" onClick={onTranscribe} disabled={transcribing || !selectedClipKey} title="선택한 클립 자동 자막">
        {transcribing ? <span className="spinner" style={{ width:10, height:10, borderWidth:2 }} /> : <Icon name="mic" size={11} />}
        {' '}자막
      </button>
    </div>
  );
};


const TrackLabels = () => (
  <div style={{ position:'sticky', left:0, zIndex:10, width:TRACK_LABEL, pointerEvents:'none' }}>
    {[
      { top: RULER_H,                              label:'CLIP',  color:'var(--violet)', height:CLIP_H },
      { top: RULER_H + CLIP_H,                     label:'NAR',   color:'var(--mint)',   height:NAR_H },
      { top: RULER_H + CLIP_H + NAR_H,             label:'SUB',   color:'var(--orange)', height:SUB_H },
      { top: RULER_H + CLIP_H + NAR_H + SUB_H,     label:'BGM',   color:'var(--blue)',   height:BGM_H },
    ].map(t => (
      <div key={t.label} style={{ position:'absolute', top:t.top, left:0, width:TRACK_LABEL, height:t.height, display:'flex', alignItems:'center', justifyContent:'center', background:'oklch(0.10 0.006 280)', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:8, fontFamily:'var(--font-mono)', fontWeight:700, color:t.color, letterSpacing:'0.1em' }}>{t.label}</span>
      </div>
    ))}
  </div>
);


const TrackBg = () => (
  <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.015)', borderBottom:'1px solid var(--border)' }} />
);


const ClipBlock = ({ clip, left, width, isSelected, pid, onSelect, onDragStart, onDragOver, onDrop, onTrimIn, onTrimOut }) => {
  const hasVideo = clip.status === 'done';
  const thumbUrl = clip.thumbnail_url
    ? (clip.thumbnail_url.startsWith('http') ? clip.thumbnail_url : `/api/media/${pid}/${clip.thumbnail_url}`)
    : null;
  const typeColor = {
    intro:  'var(--blue)',
    outro:  'var(--orange)',
    upload: 'var(--mint)',
    scene:  'var(--violet)',
  }[clip.type] || 'var(--violet)';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ position:'absolute', left, top:6, height:CLIP_H - 12, width: Math.max(width - 2, 20), cursor:'grab', userSelect:'none' }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
    >
      <div style={{
        position:'absolute', inset:0, borderRadius:5, overflow:'hidden',
        border:`2px solid ${isSelected ? 'var(--rose)' : hasVideo ? `color-mix(in oklch, ${typeColor} 60%, transparent)` : 'var(--border)'}`,
        background: hasVideo ? `color-mix(in oklch, ${typeColor} 12%, var(--surface))` : 'var(--surface-2)',
        boxShadow: isSelected ? `0 0 0 1px var(--rose)` : 'none',
      }}>
        {thumbUrl && <img src={thumbUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.3, pointerEvents:'none' }} />}
        <div style={{ position:'relative', padding:'3px 6px', fontSize:9, color: hasVideo ? 'var(--text-2)' : 'var(--text-4)', fontFamily:'var(--font-mono)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:700 }}>
          {clip.type !== 'scene' && <span style={{ color:typeColor, marginRight:3 }}>[{clip.type.toUpperCase()}]</span>}
          {clip.label}
        </div>
        {clip.speed !== 1.0 && (
          <div style={{ position:'absolute', bottom:3, left:5, fontSize:8, color:'var(--orange)', fontFamily:'var(--font-mono)' }}>{clip.speed}x</div>
        )}
        <div style={{ position:'absolute', bottom:3, right:5, fontSize:9, color: hasVideo ? typeColor : 'var(--text-4)', fontFamily:'var(--font-mono)' }}>
          {hasVideo ? `${(width / PX_PER_SEC).toFixed(1)}s` : clip.type === 'empty' ? '비어있음' : '미생성'}
        </div>
      </div>
      {isSelected && (
        <>
          <TrimHandle side="in"  x={0}     onDrag={onTrimIn} />
          <TrimHandle side="out" x={width} onDrag={onTrimOut} />
        </>
      )}
    </div>
  );
};


const NarBlock = ({ nar, isSelected, onMouseDown, onClick }) => (
  <div
    onMouseDown={onMouseDown}
    onClick={onClick}
    style={{
      position:'absolute',
      left: nar.start_sec * PX_PER_SEC,
      top: 4, height: NAR_H - 8,
      width: Math.max((nar.duration_sec || 3) * PX_PER_SEC, 24),
      borderRadius:4, cursor:'grab', overflow:'hidden',
      background: isSelected ? 'color-mix(in oklch, var(--mint) 25%, var(--surface))' : 'color-mix(in oklch, var(--mint) 12%, var(--surface))',
      border:`1.5px solid ${isSelected ? 'var(--mint)' : 'color-mix(in oklch, var(--mint) 40%, transparent)'}`,
      fontSize:9, color:'var(--mint)', fontFamily:'var(--font-mono)',
      padding:'3px 6px', whiteSpace:'nowrap', textOverflow:'ellipsis', userSelect:'none',
    }}>
    <Icon name="mic" size={8} style={{ display:'inline', marginRight:3, verticalAlign:'middle' }} />
    {nar.text?.slice(0, 40)}{nar.text?.length > 40 ? '…' : ''}
  </div>
);


const SubBlock = ({ sub, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      position:'absolute',
      left: sub.start_sec * PX_PER_SEC,
      top: 3, height: SUB_H - 6,
      width: Math.max((sub.end_sec - sub.start_sec) * PX_PER_SEC, 20),
      borderRadius:3, overflow:'hidden', cursor:'pointer',
      background: isSelected ? 'color-mix(in oklch, var(--orange) 25%, var(--surface))' : 'color-mix(in oklch, var(--orange) 12%, var(--surface))',
      border:`1.5px solid ${isSelected ? 'var(--orange)' : 'color-mix(in oklch, var(--orange) 40%, transparent)'}`,
      fontSize:9, color:'var(--orange)', fontFamily:'var(--font-mono)',
      padding:'2px 5px', whiteSpace:'nowrap', textOverflow:'ellipsis', userSelect:'none',
    }}>
    {sub.text?.slice(0, 30)}{sub.text?.length > 30 ? '…' : ''}
  </div>
);


const SubtitleOverlay = ({ subtitles, currentTime }) => {
  const active = subtitles.filter(s => currentTime >= s.start_sec && currentTime <= s.end_sec);
  if (!active.length) return null;
  return (
    <div style={{ position:'absolute', bottom:40, left:0, right:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, pointerEvents:'none' }}>
      {active.map(s => (
        <div key={s.id} style={{ background:'rgba(0,0,0,0.75)', color:'#fff', fontSize:14, padding:'4px 12px', borderRadius:4, textAlign:'center', maxWidth:'90%', lineHeight:1.4, textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}>
          {s.text}
        </div>
      ))}
    </div>
  );
};


/* ── 패널들 ── */

const ClipPanel = ({ clip, pid, onUpdate, onDelete, onUploadVideo, clips, onReorder }) => {
  const fileRef = React.useRef(null);
  const idx     = clips.findIndex(c => c.id === clip?.id);

  if (!clip) return (
    <div style={{ color:'var(--text-4)', fontSize:12, textAlign:'center', paddingTop:20 }}>
      <Icon name="film" size={24} style={{ display:'block', margin:'0 auto 8px', opacity:0.4 }} />
      클립을 선택하세요
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <PanelSection label={`✂ ${clip.label}`} accent="var(--violet)">
        <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginBottom:8 }}>
          {clip.type.toUpperCase()} · {clip.duration_sec.toFixed(1)}s 원본
        </div>

        {/* 순서 이동 */}
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          <button className="btn ghost sm" style={{ flex:1 }} onClick={() => onReorder(clip.id, -1)} disabled={idx <= 0}>◀ 앞으로</button>
          <button className="btn ghost sm" style={{ flex:1 }} onClick={() => onReorder(clip.id, +1)} disabled={idx >= clips.length - 1}>뒤로 ▶</button>
        </div>

        {/* Trim In */}
        <TrimSlider label="시작 (Trim In)" value={clip.trim_in || 0} min={0} max={clip.duration_sec - 0.1} step={0.1}
          onChange={v => onUpdate({ trim_in: v })} color="var(--rose)" />

        {/* Trim Out */}
        <TrimSlider label="끝 (Trim Out)" value={clip.trim_out ?? clip.duration_sec} min={0.1} max={clip.duration_sec} step={0.1}
          onChange={v => onUpdate({ trim_out: v })} color="var(--violet)" />

        {/* 속도 */}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10, color:'var(--text-4)' }}>
            <span>속도</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--orange)' }}>{clip.speed || 1.0}x</span>
          </div>
          <input type="range" min={0.25} max={4.0} step={0.25} value={clip.speed || 1.0}
            onChange={e => onUpdate({ speed: parseFloat(e.target.value) })}
            style={{ width:'100%', accentColor:'var(--orange)', cursor:'pointer' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>
            <span>0.25x</span><span>1x</span><span>4x</span>
          </div>
        </div>

        {/* 클립 없을 때 업로드 */}
        {!clip.video_key && (
          <>
            <button className="btn ghost sm" style={{ width:'100%', justifyContent:'center', marginBottom:6 }}
              onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={11} /> 영상 업로드
            </button>
            <input ref={fileRef} type="file" accept="video/*" style={{ display:'none' }}
              onChange={async e => { const f = e.target.files?.[0]; if (f) await onUploadVideo(f); e.target.value = ''; }} />
          </>
        )}

        <button className="btn ghost sm"
          style={{ width:'100%', justifyContent:'center', color:'var(--rose)', borderColor:'color-mix(in oklch, var(--rose) 40%, transparent)' }}
          onClick={onDelete}>
          삭제
        </button>
      </PanelSection>
    </div>
  );
};


const NarPanel = ({ nar, narrations, totalDuration, currentTime, onUpdate, onDelete, onAdd }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    <button className="btn ghost sm" style={{ width:'100%', justifyContent:'center' }} onClick={onAdd}>
      <Icon name="plus" size={12} /> 현재 위치에 나레이션 추가
    </button>
    {nar ? (
      <PanelSection label="🎙 나레이션 편집" accent="var(--mint)">
        <textarea
          value={nar.text || ''}
          onChange={e => onUpdate({ text: e.target.value })}
          rows={4}
          style={{ width:'100%', resize:'vertical', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', padding:'8px 10px', fontSize:12, fontFamily:'inherit', lineHeight:1.65 }}
          placeholder="나레이션 텍스트..."
        />
        <TrimSlider label="시작 시간" value={nar.start_sec} min={0} max={Math.max(0, totalDuration - 1)} step={0.1}
          onChange={v => onUpdate({ start_sec: v })} color="var(--mint)" />
        <TrimSlider label="길이" value={nar.duration_sec || 3} min={0.5} max={30} step={0.5}
          onChange={v => onUpdate({ duration_sec: v })} color="var(--mint)" />
        <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginBottom:8 }}>
          {fmt(nar.start_sec)} → {fmt((nar.start_sec || 0) + (nar.duration_sec || 3))}
        </div>
        <button className="btn ghost sm"
          style={{ width:'100%', justifyContent:'center', color:'var(--rose)', borderColor:'color-mix(in oklch, var(--rose) 40%, transparent)' }}
          onClick={onDelete}>삭제</button>
      </PanelSection>
    ) : (
      <div style={{ fontSize:11, color:'var(--text-4)', textAlign:'center' }}>
        나레이션 블록을 클릭하거나 추가하세요
      </div>
    )}
    {narrations.length > 0 && (
      <PanelSection label="전체 나레이션" accent="var(--text-4)">
        {narrations.map(n => (
          <div key={n.id} style={{ fontSize:11, color:'var(--text-3)', padding:'4px 0', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-mono)' }}>
            {fmt(n.start_sec)} · {n.text?.slice(0, 30) || '(비어있음)'}
          </div>
        ))}
      </PanelSection>
    )}
  </div>
);


const SubPanel = ({ sub, subtitles, onUpdate, onDelete, onAdd, onSelect, onTranscribe, transcribing, selectedClipKey }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    <div style={{ display:'flex', gap:6 }}>
      <button className="btn ghost sm" style={{ flex:1, justifyContent:'center' }} onClick={onAdd}>
        <Icon name="plus" size={11} /> 자막 추가
      </button>
      <button className="btn ghost sm" style={{ flex:1, justifyContent:'center' }} onClick={onTranscribe} disabled={transcribing || !selectedClipKey}>
        {transcribing ? <span className="spinner" style={{ width:10, height:10, borderWidth:2 }} /> : <Icon name="mic" size={11} />}
        {' '}자동 생성
      </button>
    </div>
    {sub ? (
      <PanelSection label="자막 편집" accent="var(--orange)">
        <textarea
          value={sub.text || ''}
          onChange={e => onUpdate({ text: e.target.value })}
          rows={3}
          style={{ width:'100%', resize:'vertical', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', padding:'8px 10px', fontSize:12, fontFamily:'inherit', lineHeight:1.65 }}
          placeholder="자막 텍스트..."
        />
        <TrimSlider label="시작" value={sub.start_sec} min={0} max={sub.end_sec - 0.1} step={0.1}
          onChange={v => onUpdate({ start_sec: v })} color="var(--orange)" />
        <TrimSlider label="끝" value={sub.end_sec} min={sub.start_sec + 0.1} max={sub.start_sec + 30} step={0.1}
          onChange={v => onUpdate({ end_sec: v })} color="var(--orange)" />
        <button className="btn ghost sm"
          style={{ width:'100%', justifyContent:'center', color:'var(--rose)', borderColor:'color-mix(in oklch, var(--rose) 40%, transparent)' }}
          onClick={onDelete}>삭제</button>
      </PanelSection>
    ) : (
      <div style={{ fontSize:11, color:'var(--text-4)', textAlign:'center' }}>
        {selectedClipKey ? '자막을 선택하거나 자동 생성하세요' : '클립을 선택 후 자동 생성'}
      </div>
    )}
    {subtitles.length > 0 && (
      <PanelSection label={`자막 ${subtitles.length}개`} accent="var(--text-4)">
        <div style={{ maxHeight:160, overflowY:'auto' }}>
          {subtitles.map(s => (
            <div key={s.id} onClick={() => onSelect(s.id)}
              style={{ fontSize:10, color:'var(--text-3)', padding:'4px 6px', borderRadius:4, cursor:'pointer', marginBottom:2, background: sub?.id === s.id ? 'color-mix(in oklch, var(--orange) 10%, var(--surface))' : 'transparent', fontFamily:'var(--font-mono)' }}>
              {fmt(s.start_sec)}–{fmt(s.end_sec)} · {s.text?.slice(0, 25)}
            </div>
          ))}
        </div>
      </PanelSection>
    )}
  </div>
);


const BgmPanel = ({ bgmKey, bgmVolume, onUpdate, pid, sid }) => {
  const fileRef = React.useRef(null);

  const onUploadBgm = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('auth_token');
    const form  = new FormData();
    form.append('file', file);
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const res  = await fetch(`${base}/api/projects/${pid}/shorts/${sid}/editor/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (data.video_key) onUpdate({ bgm_key: data.video_key });
    e.target.value = '';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <PanelSection label="🎵 배경음악" accent="var(--blue)">
        {bgmKey ? (
          <div style={{ fontSize:11, color:'var(--text-3)', padding:'6px 8px', background:'var(--surface)', borderRadius:6, marginBottom:8, fontFamily:'var(--font-mono)', wordBreak:'break-all' }}>
            {bgmKey.split('/').pop()}
          </div>
        ) : (
          <div style={{ fontSize:11, color:'var(--text-4)', marginBottom:8 }}>BGM 없음</div>
        )}
        <button className="btn ghost sm" style={{ width:'100%', justifyContent:'center', marginBottom:6 }}
          onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={11} /> {bgmKey ? 'BGM 교체' : 'BGM 업로드'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*,video/mp4" style={{ display:'none' }} onChange={onUploadBgm} />
        {bgmKey && (
          <>
            <TrimSlider label="볼륨" value={bgmVolume} min={0} max={1} step={0.05}
              onChange={v => onUpdate({ bgm_volume: v })} color="var(--blue)" />
            <button className="btn ghost sm"
              style={{ width:'100%', justifyContent:'center', color:'var(--rose)', borderColor:'color-mix(in oklch, var(--rose) 40%, transparent)' }}
              onClick={() => onUpdate({ bgm_key: null })}>
              BGM 제거
            </button>
          </>
        )}
      </PanelSection>
    </div>
  );
};


const TRANSITIONS = [
  { value:'none',      label:'없음' },
  { value:'fade',      label:'페이드' },
  { value:'wipeleft',  label:'와이프 ←' },
  { value:'wiperight', label:'와이프 →' },
  { value:'dissolve',  label:'디졸브' },
];

const SettingsPanel = ({ transition, transitionDuration, onUpdate }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
    <PanelSection label="⚙ 전환 효과" accent="var(--text-3)">
      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
        {TRANSITIONS.map(t => (
          <button key={t.value}
            onClick={() => onUpdate({ transition: t.value })}
            style={{ padding:'7px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'left',
              border:`1.5px solid ${transition === t.value ? 'var(--mint)' : 'var(--border)'}`,
              background: transition === t.value ? 'color-mix(in oklch, var(--mint) 10%, var(--surface))' : 'var(--surface)',
              color: transition === t.value ? 'var(--mint)' : 'var(--text-3)' }}>
            {t.label}
          </button>
        ))}
      </div>
      {transition !== 'none' && (
        <TrimSlider label="전환 길이" value={transitionDuration} min={0.1} max={2.0} step={0.1}
          onChange={v => onUpdate({ transition_duration: v })} color="var(--mint)" />
      )}
    </PanelSection>
  </div>
);


const RENDER_STATUS_LABEL = { pending:'대기 중', running:'렌더 중...', done:'✓ 완료', failed:'✗ 실패' };
const RENDER_STATUS_COLOR = { pending:'var(--text-4)', running:'var(--violet)', done:'var(--mint)', failed:'var(--rose)' };

const RenderFooter = ({
  rendering, renderJob, ytOpen, setYtOpen,
  onRender, onOpenYt,
  ytChannels, ytChannelId, setYtChannelId,
  ytTitle, setYtTitle, ytDesc, setYtDesc,
  ytTags, setYtTags, ytPrivacy, setYtPrivacy,
  ytNotify, setYtNotify,
  ytJob, ytUploading, ytHistory, onYtUpload,
}) => (
  <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>

    {/* 렌더 상태 */}
    {renderJob && (
      <div style={{ padding:'8px 10px', borderRadius:6, background:'var(--surface)', border:`1px solid ${RENDER_STATUS_COLOR[renderJob.status]}`, fontSize:11 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {renderJob.status === 'running' && <span className="spinner" style={{ width:11, height:11, borderWidth:2, borderColor:'var(--violet)', borderTopColor:'transparent' }} />}
          <span style={{ fontWeight:700, color: RENDER_STATUS_COLOR[renderJob.status] }}>
            {RENDER_STATUS_LABEL[renderJob.status] || renderJob.status}
          </span>
        </div>
        {renderJob.status === 'done' && renderJob.output_url && (
          <a href={renderJob.output_url} target="_blank" rel="noreferrer"
            style={{ display:'block', marginTop:4, color:'var(--mint)', fontSize:11, fontWeight:600 }}>
            다운로드 →
          </a>
        )}
        {renderJob.status === 'failed' && (
          <div style={{ marginTop:4, color:'var(--rose)', fontSize:10 }}>{renderJob.error}</div>
        )}
      </div>
    )}

    {/* 렌더 버튼 */}
    <button
      style={{ width:'100%', padding:'12px', borderRadius:8, border:'none', cursor: rendering ? 'not-allowed' : 'pointer',
        background: rendering ? 'var(--surface-2)' : 'var(--rose)',
        color: rendering ? 'var(--text-3)' : '#fff',
        fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
      onClick={onRender}
      disabled={rendering}>
      {rendering
        ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} />렌더 중...</>
        : <><Icon name="sparkles" size={14} style={{ color:'#fff' }} />최종 렌더</>}
    </button>

    {/* YouTube */}
    <button
      style={{ width:'100%', padding:'10px', borderRadius:8, cursor:'pointer',
        border:`1px solid ${ytOpen ? 'color-mix(in oklch, var(--rose) 50%, transparent)' : 'var(--border)'}`,
        background: ytOpen ? 'color-mix(in oklch, var(--rose) 8%, var(--surface))' : 'var(--surface)',
        color: ytOpen ? 'var(--rose)' : 'var(--text-3)',
        fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}
      onClick={() => ytOpen ? setYtOpen(false) : onOpenYt()}>
      <YouTubeIcon size={14} />
      YouTube 배포{ytOpen ? ' ▲' : ' ▼'}
    </button>

    {ytOpen && (
      <YouTubeUploadPanel
        channels={ytChannels} channelId={ytChannelId} setChannelId={setYtChannelId}
        title={ytTitle} setTitle={setYtTitle}
        desc={ytDesc} setDesc={setYtDesc}
        tags={ytTags} setTags={setYtTags}
        privacy={ytPrivacy} setPrivacy={setYtPrivacy}
        notify={ytNotify} setNotify={setYtNotify}
        job={ytJob} uploading={ytUploading} history={ytHistory}
        onUpload={onYtUpload}
        canUpload={!!(renderJob?.status === 'done' && renderJob?.output_url)}
      />
    )}
  </div>
);


/* ── 공유 컴포넌트 ── */

const TimeRuler = ({ totalDuration }) => {
  const marks = [];
  const step  = totalDuration > 60 ? 10 : totalDuration > 20 ? 5 : 2;
  for (let t = 0; t <= totalDuration + step; t += step) marks.push(t);
  return (
    <div style={{ position:'absolute', top:0, left:0, height:RULER_H, width:(totalDuration + 4) * PX_PER_SEC, pointerEvents:'none', borderBottom:'1px solid var(--border)', background:'oklch(0.11 0.005 280)' }}>
      {marks.map(t => (
        <div key={t} style={{ position:'absolute', left: t * PX_PER_SEC, top:0, height:'100%', display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
          <div style={{ width:1, height: t % (step * 2) === 0 ? 12 : 6, background:'var(--border)', marginTop: t % (step * 2) === 0 ? 0 : 4 }} />
          {t % (step * 2) === 0 && <span style={{ fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginLeft:3 }}>{fmt(t)}</span>}
        </div>
      ))}
    </div>
  );
};

const TrimHandle = ({ side, x, onDrag }) => {
  const onMouseDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const onMove = (ev) => onDrag(ev.clientX - startX);
    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  return (
    <div onMouseDown={onMouseDown}
      style={{ position:'absolute', top:0, left: x - 5, width:10, height:'100%', cursor:'ew-resize', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:3, height:'60%', borderRadius:2, background:'var(--rose)', opacity:0.9 }} />
    </div>
  );
};

const TrimSlider = ({ label, value, min, max, step, onChange, color }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:10, color:'var(--text-4)' }}>
      <span>{label}</span>
      <span style={{ fontFamily:'var(--font-mono)', color }}>{typeof value === 'number' && value < 100 ? fmt(value) : `${Math.round(value * 100)}%`}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width:'100%', accentColor: color, cursor:'pointer' }} />
  </div>
);

const PanelSection = ({ label, accent, children }) => (
  <div style={{ borderLeft:`3px solid ${accent || 'var(--border)'}`, paddingLeft:10 }}>
    <div style={{ fontSize:10, fontWeight:700, color: accent || 'var(--text-4)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', marginBottom:8, textTransform:'uppercase' }}>
      {label}
    </div>
    {children}
  </div>
);

const YouTubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
  </svg>
);

const JOB_STATUS_COLOR = { pending:'var(--text-4)', uploading:'var(--violet)', processing:'var(--orange)', done:'var(--mint)', error:'var(--rose)' };
const JOB_STATUS_LABEL = { pending:'대기 중', uploading:'업로드 중...', processing:'YouTube 처리 중...', done:'✓ 게시 완료', error:'✗ 오류' };
const PRIVACY_OPTIONS  = [{ value:'private', label:'비공개' }, { value:'unlisted', label:'미등록' }, { value:'public', label:'공개' }];

const YouTubeUploadPanel = ({ channels, channelId, setChannelId, title, setTitle, desc, setDesc, tags, setTags, privacy, setPrivacy, notify, setNotify, job, uploading, history, onUpload, canUpload }) => {
  const isActive = uploading || (job && job.status !== 'done' && job.status !== 'error');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px', background:'color-mix(in oklch, var(--rose) 4%, var(--surface))', borderRadius:8, border:'1px solid color-mix(in oklch, var(--rose) 20%, transparent)' }}>
      {channels.length > 0 && (
        <select value={channelId} onChange={e => setChannelId(e.target.value)} disabled={isActive}
          style={{ width:'100%', padding:'6px 8px', fontSize:12, borderRadius:6, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)' }}>
          {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
        </select>
      )}
      <input value={title} onChange={e => setTitle(e.target.value)} disabled={isActive} placeholder="제목 *" maxLength={100}
        style={{ width:'100%', padding:'7px 10px', fontSize:12, borderRadius:6, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)' }} />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} disabled={isActive} rows={2} placeholder="설명 (선택)"
        style={{ width:'100%', padding:'7px 10px', fontSize:12, borderRadius:6, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', resize:'vertical', fontFamily:'inherit' }} />
      <input value={tags} onChange={e => setTags(e.target.value)} disabled={isActive} placeholder="태그 (쉼표 구분)"
        style={{ width:'100%', padding:'7px 10px', fontSize:12, borderRadius:6, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)' }} />
      <div style={{ display:'flex', gap:5 }}>
        {PRIVACY_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => !isActive && setPrivacy(opt.value)}
            style={{ flex:1, padding:'6px 4px', borderRadius:6, fontSize:11, fontWeight:600, cursor: isActive ? 'not-allowed' : 'pointer',
              border:`1.5px solid ${privacy === opt.value ? 'var(--rose)' : 'var(--border)'}`,
              background: privacy === opt.value ? 'color-mix(in oklch, var(--rose) 12%, var(--surface))' : 'var(--surface)',
              color: privacy === opt.value ? 'var(--rose)' : 'var(--text-3)' }}>
            {opt.label}
          </button>
        ))}
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor: isActive ? 'not-allowed' : 'pointer', fontSize:12, color:'var(--text-3)' }}>
        <input type="checkbox" checked={notify} onChange={e => !isActive && setNotify(e.target.checked)} style={{ width:'auto', accentColor:'var(--rose)' }} />
        구독자 알림
      </label>
      {job && (
        <div style={{ padding:'8px', background:'var(--surface)', borderRadius:6, border:'1px solid var(--border)', fontSize:11 }}>
          <span style={{ fontWeight:700, color: JOB_STATUS_COLOR[job.status] }}>{JOB_STATUS_LABEL[job.status] || job.status}</span>
          {job.status === 'done' && job.youtube_url && (
            <a href={job.youtube_url} target="_blank" rel="noreferrer" style={{ display:'block', marginTop:4, color:'var(--rose)', fontSize:11 }}>YouTube에서 보기 →</a>
          )}
          {job.status === 'error' && <div style={{ marginTop:4, color:'var(--rose)' }}>{job.error}</div>}
        </div>
      )}
      <button onClick={onUpload} disabled={isActive || !canUpload || !title?.trim()}
        style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', fontSize:13, fontWeight:700,
          background: isActive || !canUpload ? 'var(--surface-2)' : '#ff0000',
          color: isActive || !canUpload ? 'var(--text-4)' : '#fff',
          cursor: isActive || !canUpload ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {isActive ? <><span className="spinner" style={{ width:13, height:13, borderWidth:2 }} />업로드 중...</> : <><YouTubeIcon size={14} />YouTube 업로드</>}
      </button>
      {!canUpload && <div style={{ fontSize:10, color:'var(--text-4)', textAlign:'center' }}>렌더 완료 후 업로드 가능합니다</div>}
    </div>
  );
};
