import React from 'react';
import { Icon } from './Icons';
import { api } from '../api';

export const RenderView = ({ project, short, onShortUpdate }) => {
  const pid = project?.id;
  const sid = short?.id;
  const shortStage  = short?.stage;
  const shortStatus = short?.status;

  const [scenes,   setScenes]   = React.useState([]);
  const [cuts,     setCuts]     = React.useState([]);
  const [clips,    setClips]    = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState(null);
  const [selectedKey, setSelectedKey] = React.useState(null);

  // ── 로드 ─────────────────────────────────────────────────────────────
  const loadAll = React.useCallback(async () => {
    if (!pid || !sid) return;
    try {
      const [sceneRes, cutRes, clipRes] = await Promise.all([
        api.get(`/api/projects/${pid}/shorts/${sid}/scenario`),
        api.get(`/api/projects/${pid}/shorts/${sid}/cuts`),
        api.get(`/api/projects/${pid}/shorts/${sid}/clips`).catch(() => ({ clips: [] })),
      ]);
      const sceneList = sceneRes?.scenes || sceneRes?.screenplay?.scenes || [];
      setScenes(sceneList);
      setCuts(cutRes?.cuts || []);
      const clipList = clipRes?.clips || [];
      setClips(clipList);
      setSelectedKey(prev => prev || sceneList[0]?.scene_key || null);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [pid, sid]);

  React.useEffect(() => { setLoading(true); loadAll(); }, [loadAll]);

  // 생성 중 폴링 — short 상태 또는 개별 clip이 generating이면 계속 폴링
  const hasActiveClip = clips.some(c => c.status === 'generating');
  const globalGenerating = shortStage === 'scene_video' && shortStatus === 'generating';
  React.useEffect(() => {
    if (!hasActiveClip && !globalGenerating) return;
    const t = setInterval(loadAll, 3000);
    return () => clearInterval(t);
  }, [hasActiveClip, globalGenerating, loadAll]);

  // ── 헬퍼 ─────────────────────────────────────────────────────────────
  const cutMap  = React.useMemo(() => Object.fromEntries(cuts.map(c => [c.scene_key, c])), [cuts]);
  const clipMap = React.useMemo(() => Object.fromEntries(clips.map(c => [c.scene_key || c.key, c])), [clips]);

  const resolveUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('/api')) return path;
    return `/api/media/${pid}/${path}`;
  };

  const selectedScene = scenes.find(s => s.scene_key === selectedKey);
  const selectedCut   = selectedKey ? cutMap[selectedKey] : null;
  const selectedClip  = selectedKey ? clipMap[selectedKey] : null;

  const doneCount = clips.filter(c => c.status === 'done').length;
  const isGenerating = globalGenerating || hasActiveClip;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-4)' }}>
      <span className="spinner" style={{ width:24, height:24, borderWidth:3 }} />
      <span style={{ fontSize:13 }}>데이터 로드 중...</span>
    </div>
  );

  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 300px', height:'100%', overflow:'hidden' }}>

      {/* ── 왼쪽: 씬 목록 ── */}
      <SceneList
        scenes={scenes} cutMap={cutMap} clipMap={clipMap}
        selectedKey={selectedKey} onSelect={setSelectedKey}
        doneCount={doneCount} isGenerating={isGenerating}
        shortStage={shortStage} shortStatus={shortStatus}
        pid={pid} sid={sid}
        resolveUrl={resolveUrl}
        onReloaded={loadAll}
        onShortUpdate={onShortUpdate}
        setError={setError}
      />

      {/* ── 중앙: 영상 미리보기 ── */}
      <VideoPreview
        scene={selectedScene} cut={selectedCut} clip={selectedClip}
        pid={pid} sid={sid}
        resolveUrl={resolveUrl}
        isGenerating={isGenerating}
        onReloaded={loadAll}
        setError={setError}
      />

      {/* ── 오른쪽: 씬 설정 + 생성 ── */}
      <ScenePanel
        scene={selectedScene} cut={selectedCut} clip={selectedClip}
        pid={pid} sid={sid}
        resolveUrl={resolveUrl}
        isGenerating={isGenerating}
        onReloaded={loadAll}
        setError={setError}
      />

      {error && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'color-mix(in oklch, var(--rose) 15%, var(--surface))', border:'1px solid var(--rose)', borderRadius:8, padding:'10px 16px', fontSize:12, color:'var(--rose)', zIndex:100 }}>
          {error}
        </div>
      )}
    </div>
  );
};


/* ══ 왼쪽: 씬 목록 ══════════════════════════════════════════════════════ */
const SceneList = ({ scenes, cutMap, clipMap, selectedKey, onSelect, doneCount, isGenerating,
                     shortStage, shortStatus, pid, sid, resolveUrl, onReloaded, onShortUpdate, setError }) => {
  const [startingAll, setStartingAll] = React.useState(false);

  const startAll = async () => {
    setStartingAll(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/clips/regenerate`);
      const u = await api.get(`/api/projects/${pid}/shorts/${sid}`);
      if (onShortUpdate) onShortUpdate(u);
      await onReloaded();
    } catch (e) { setError(e.message); }
    finally { setStartingAll(false); }
  };

  return (
    <div style={{ borderRight:'1px solid var(--border)', background:'oklch(0.12 0.005 280)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <Icon name="film" size={13} style={{ color:'var(--rose)' }} />
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', fontFamily:'var(--font-mono)' }}>씬 영상</span>
        <span style={{ display:'flex', alignItems:'center', gap:6, marginLeft:'auto' }}>
          {isGenerating && <span className="spinner" style={{ width:10, height:10, borderWidth:2, borderColor:'var(--violet)', borderTopColor:'transparent' }} />}
          <span style={{ fontSize:11, color: isGenerating ? 'var(--violet)' : doneCount === scenes.length && scenes.length > 0 ? 'var(--mint)' : 'var(--text-4)', fontFamily:'var(--font-mono)' }}>
            {doneCount}/{scenes.length}
          </span>
        </span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
        {scenes.map((scene, i) => {
          const clip = clipMap[scene.scene_key];
          const imgUrl = resolveUrl(clip?.thumbnail_url || clip?.image_url);
          const isActive = selectedKey === scene.scene_key;
          const status = clip?.status || 'pending';
          const statusColor = { done:'var(--mint)', failed:'var(--rose)', generating:'var(--violet)', pending:'var(--text-4)' }[status];
          return (
            <div key={scene.scene_key} onClick={() => onSelect(scene.scene_key)}
              style={{ borderRadius:8, overflow:'hidden', cursor:'pointer', marginBottom:4,
                border:`2px solid ${isActive ? 'var(--rose)' : 'transparent'}`,
                background:'var(--surface)', transition:'border-color 0.1s' }}>
              <div style={{ display:'flex', gap:8, padding:'8px 10px', alignItems:'center' }}>
                <div style={{ width:36, height:50, borderRadius:4, overflow:'hidden', background:'var(--surface-2)', flexShrink:0, display:'grid', placeItems:'center' }}>
                  {imgUrl
                    ? <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : status === 'generating'
                      ? <span className="spinner" style={{ width:12, height:12, borderWidth:2, borderColor:'var(--violet)', borderTopColor:'transparent' }} />
                      : <Icon name="film" size={14} style={{ color:'var(--text-4)' }} />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>S{String(i+1).padStart(2,'0')}</div>
                  <div style={{ fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                    {scene.title_ko || scene.scene_key}
                  </div>
                  <div style={{ fontSize:10, color:statusColor, marginTop:2, fontFamily:'var(--font-mono)' }}>
                    { status === 'done' ? '✓ 완료' : status === 'failed' ? '✗ 실패' : status === 'generating' ? '생성 중...' : '대기' }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding:'10px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <button className="btn" style={{ width:'100%', justifyContent:'center', fontSize:12, fontWeight:700,
          background:'color-mix(in oklch, var(--rose) 15%, var(--surface))', border:'1px solid color-mix(in oklch, var(--rose) 35%, transparent)', color:'var(--rose)', borderRadius:8 }}
          onClick={startAll} disabled={startingAll || isGenerating}>
          {startingAll || isGenerating
            ? <><span className="spinner" style={{ width:11, height:11, borderWidth:2 }} />생성 중...</>
            : <><Icon name="film" size={12} />전체 씬 생성</>}
        </button>
      </div>
    </div>
  );
};


/* ══ 중앙: 영상 미리보기 ════════════════════════════════════════════════ */
const VideoPreview = ({ scene, cut, clip, pid, sid, resolveUrl, isGenerating, onReloaded, setError }) => {
  const [lightbox, setLightbox] = React.useState(false);
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  // 씬 바뀌면 이전 영상 멈추고 playing 리셋
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setPlaying(false);
    setLightbox(false);
  }, [scene?.scene_key]);

  const videoUrl = clip?.video_url ? resolveUrl(clip.video_url) : null;
  const thumbUrl = clip ? resolveUrl(clip.thumbnail_url || clip.image_url) : null;
  const cutImgUrl = cut ? resolveUrl(cut.image_path) : null;
  const previewUrl = thumbUrl || cutImgUrl;

  if (!scene) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-4)', flexDirection:'column', gap:12, background:'oklch(0.13 0.008 280)' }}>
      <Icon name="film" size={40} />
      <span style={{ fontSize:13 }}>왼쪽에서 씬을 선택하세요</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'oklch(0.13 0.008 280)' }}>
      <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg-2)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:700 }}>{scene.title_ko || scene.scene_key}</span>
        {clip && (
          <span style={{ fontSize:10, color: clip.status === 'done' ? 'var(--mint)' : clip.status === 'failed' ? 'var(--rose)' : clip.status === 'generating' ? 'var(--violet)' : 'var(--text-4)', fontFamily:'var(--font-mono)' }}>
            { clip.status === 'done' ? '✓ 완료' : clip.status === 'failed' ? '✗ 실패' : clip.status === 'generating' ? '생성 중...' : '대기' }
          </span>
        )}
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:20, minHeight:0 }}>
        <div style={{ position:'relative', aspectRatio:'16/9', height:'100%', maxHeight:520, maxWidth:924,
          borderRadius:12, overflow:'hidden', border:'1px solid var(--border)', background:'var(--surface-2)',
          cursor: videoUrl || previewUrl ? 'zoom-in' : 'default' }}
          onClick={() => (videoUrl || previewUrl) && setLightbox(true)}>

          {videoUrl ? (
            <>
              <video key={videoUrl} ref={videoRef} src={videoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} loop playsInline
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
              <button onClick={e => { e.stopPropagation(); videoRef.current && (playing ? videoRef.current.pause() : videoRef.current.play()); }}
                style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', background:'rgba(0,0,0,0.2)', border:'none', cursor:'pointer' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'grid', placeItems:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.4)' }}>
                  <Icon name={playing ? 'pause' : 'play'} size={22} style={{ color:'#000' }} />
                </div>
              </button>
            </>
          ) : clip?.status === 'generating' || isGenerating ? (
            <>
              {previewUrl && <img src={previewUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.3 }} />}
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                <span className="spinner" style={{ width:36, height:36, borderWidth:3, borderColor:'var(--rose)', borderTopColor:'transparent' }} />
                <span style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>RENDERING...</span>
              </div>
            </>
          ) : previewUrl ? (
            <>
              <img src={previewUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)' }} />
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon name="film" size={24} style={{ color:'rgba(255,255,255,0.7)' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-mono)' }}>씬 이미지 있음 · 오른쪽에서 생성</span>
              </div>
            </>
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text-4)' }}>
              <Icon name="film" size={40} />
              <span style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>영상 없음</span>
            </div>
          )}

          {clip?.status === 'done' && (
            <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'3px 8px', fontSize:10, color:'var(--mint)', fontFamily:'var(--font-mono)' }}>
              ✓ DONE
            </div>
          )}
        </div>
      </div>

      {lightbox && (videoUrl || previewUrl) && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}
          onClick={() => setLightbox(false)}>
          {videoUrl
            ? <video key={videoUrl} src={videoUrl} style={{ maxHeight:'90vh', maxWidth:'90vw', borderRadius:10 }} controls autoPlay loop onClick={e => e.stopPropagation()} />
            : <img src={previewUrl} alt="" style={{ maxHeight:'90vh', maxWidth:'90vw', objectFit:'contain', borderRadius:10 }} onClick={e => e.stopPropagation()} />}
          <button style={{ position:'absolute', top:20, right:24, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'#fff', padding:'6px 10px', cursor:'pointer', fontSize:18 }}
            onClick={() => setLightbox(false)}>✕</button>
        </div>
      )}
    </div>
  );
};


/* ══ 오른쪽: 씬 설정 + 생성 ═════════════════════════════════════════════ */
const ScenePanel = ({ scene, cut, clip, pid, sid, resolveUrl, isGenerating, onReloaded, setError }) => {
  const [generating, setGenerating] = React.useState(false);

  const generate = async () => {
    if (!scene) return;
    setGenerating(true);
    const sceneKey = scene.scene_key;
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/clips/regenerate`, { key: sceneKey });
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          await onReloaded();
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/clips`);
            const updated = (data.clips || []).find(c => c.scene_key === sceneKey || c.key === sceneKey);
            if ((updated?.status === 'done') || updated?.status === 'failed' || attempts >= 90) {
              clearInterval(poll); resolve();
            }
          } catch { clearInterval(poll); resolve(); }
        }, 2000);
      });
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  if (!scene) return (
    <div style={{ borderLeft:'1px solid var(--border)', background:'var(--bg-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-4)', fontSize:13 }}>
      씬을 선택하세요
    </div>
  );

  const isRunning = generating || clip?.status === 'generating';

  return (
    <div style={{ borderLeft:'1px solid var(--border)', background:'var(--bg-2)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <Icon name="film" size={13} style={{ color:'var(--text-3)' }} />
        <span style={{ fontSize:12, fontWeight:700 }}>씬 설정</span>
        <span style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginLeft:4 }}>{scene.scene_key}</span>
      </div>

      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:16, flex:1 }}>

        {/* 씬 텍스트 */}
        <Section label="시나리오 텍스트">
          {scene.shot_type_ko && <div style={{ fontSize:10, color:'var(--violet)', fontFamily:'var(--font-mono)', marginBottom:4 }}>{scene.shot_type_ko}</div>}
          {scene.action_ko && (
            <div style={{ fontSize:12, lineHeight:1.7, color:'var(--text-2)', background:'var(--surface)', padding:'8px 10px', borderRadius:6, border:'1px solid var(--border)' }}>
              {scene.action_ko}
            </div>
          )}
          {(scene.dialogue_ko || []).map((d, i) => (
            <div key={i} style={{ fontSize:11, lineHeight:1.6, padding:'6px 10px', marginTop:4, background:'var(--surface-2)', borderRadius:6, border:'1px solid var(--border)' }}>
              <span style={{ color:'var(--text-4)', fontFamily:'var(--font-mono)', marginRight:6 }}>{d.char_key || d.speaker}</span>
              <span style={{ color:'var(--text)' }}>{d.line || d.text}</span>
            </div>
          ))}
          {scene.mood_ko && <div style={{ fontSize:10, color:'var(--orange)', fontFamily:'var(--font-mono)', marginTop:4 }}>분위기: {scene.mood_ko}</div>}
        </Section>

        {/* 씬 이미지 (컷) */}
        {cut?.image_path && (
          <Section label="씬 이미지 (참고)">
            <img src={resolveUrl(cut.image_path)} alt="" style={{ width:'100%', borderRadius:8, border:'1px solid var(--border)', objectFit:'contain', background:'var(--surface-2)', display:'block' }} />
          </Section>
        )}

        {/* 클립 정보 */}
        {clip?.prompt && (
          <Section label="영상 프롬프트">
            <div style={{ fontSize:11, lineHeight:1.6, fontFamily:'var(--font-mono)', color:'var(--text-2)', background:'var(--surface)', padding:'8px 10px', borderRadius:6, border:'1px solid var(--border)' }}>
              {clip.prompt}
            </div>
          </Section>
        )}

        {clip?.error && (
          <div style={{ padding:'10px 12px', background:'color-mix(in oklch, var(--rose) 10%, var(--surface))', border:'1px solid var(--rose)', borderRadius:8, fontSize:12, color:'var(--rose)' }}>
            {clip.error}
          </div>
        )}
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
        <button
          className="btn primary"
          style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:13, fontWeight:700,
            background: isRunning ? 'var(--surface-2)' : 'var(--rose)',
            border:'none', color: isRunning ? 'var(--text-3)' : '#fff', borderRadius:8 }}
          onClick={generate}
          disabled={isRunning || isGenerating}
        >
          {isRunning
            ? <><span className="spinner" style={{ width:13, height:13, borderWidth:2 }} />생성 중...</>
            : <><Icon name="film" size={14} />이 씬 영상 생성</>}
        </button>
        {clip?.status === 'done' && (
          <button className="btn ghost sm" style={{ width:'100%', justifyContent:'center', fontSize:11 }}
            onClick={generate} disabled={isRunning}>
            <Icon name="refresh" size={11} />재생성
          </button>
        )}
      </div>
    </div>
  );
};

const Section = ({ label, children }) => (
  <div>
    <div style={{ fontSize:10, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'var(--font-mono)', marginBottom:8 }}>
      {label}
    </div>
    {children}
  </div>
);
