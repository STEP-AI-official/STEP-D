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
  const [seedLibOpen, setSeedLibOpen] = React.useState(false);
  const [seedLibTarget, setSeedLibTarget] = React.useState(null); // { scene, cut, onGenerate }

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
      setClips(clipRes?.clips || []);
      setSelectedKey(prev => prev || sceneList[0]?.scene_key || null);
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [pid, sid]);

  React.useEffect(() => { setLoading(true); loadAll(); }, [loadAll]);

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

  const openSeedLib = (scene, cut, onGenerate) => {
    setSeedLibTarget({ scene, cut, onGenerate });
    setSeedLibOpen(true);
  };

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
        onOpenSeedLib={openSeedLib}
      />

      {error && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:'color-mix(in oklch, var(--rose) 15%, var(--surface))', border:'1px solid var(--rose)', borderRadius:8, padding:'10px 16px', fontSize:12, color:'var(--rose)', zIndex:100 }}>
          {error}
        </div>
      )}

      {seedLibOpen && seedLibTarget && (
        <SeedLibraryModal
          pid={pid} sid={sid}
          scene={seedLibTarget.scene}
          cut={seedLibTarget.cut}
          onGenerate={seedLibTarget.onGenerate}
          onClose={() => { setSeedLibOpen(false); setSeedLibTarget(null); }}
        />
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
const SEED_MODES = [
  { id: 'random',  label: '새 랜덤' },
  { id: 'fixed',   label: '시드 고정' },
  { id: 'library', label: '라이브러리' },
];

const ScenePanel = ({ scene, cut, clip, pid, sid, resolveUrl, isGenerating, onReloaded, setError, onOpenSeedLib }) => {
  const [generating, setGenerating] = React.useState(false);
  const [seedMode,   setSeedMode]   = React.useState('random');
  const [showVersions, setShowVersions] = React.useState(false);

  // 영상 완료 시 자동으로 버전 패널 열기
  React.useEffect(() => {
    if (clip?.status === 'done') setShowVersions(true);
  }, [clip?.status]);

  // 씬 바뀌면 seedMode 초기화
  React.useEffect(() => { setSeedMode('random'); }, [scene?.scene_key]);

  const generate = async (seedParam) => {
    if (!scene) return;
    setGenerating(true);
    const sceneKey = scene.scene_key;
    try {
      const body = {};
      if (seedParam !== undefined) body.video_seed = seedParam;
      await api.post(`/api/projects/${pid}/shorts/${sid}/cuts/${sceneKey}/generate-video`, body);
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          await onReloaded();
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/clips`);
            const updated = (data.clips || []).find(c => c.scene_key === sceneKey || c.key === sceneKey);
            if (updated?.status === 'done' || updated?.status === 'failed' || attempts >= 90) {
              clearInterval(poll); resolve();
            }
          } catch { clearInterval(poll); resolve(); }
        }, 2000);
      });
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const handleGenerate = () => {
    if (seedMode === 'random') return generate(-1);
    if (seedMode === 'fixed') return generate(undefined); // 기존 시드 유지 (파라미터 생략)
    if (seedMode === 'library') {
      onOpenSeedLib(scene, cut, ({ seed, model }) => generate(seed));
    }
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

        {cut?.image_path && (
          <Section label="씬 이미지 (참고)">
            <img src={resolveUrl(cut.image_path)} alt="" style={{ width:'100%', borderRadius:8, border:'1px solid var(--border)', objectFit:'contain', background:'var(--surface-2)', display:'block' }} />
          </Section>
        )}

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

        {/* 버전 히스토리 */}
        {showVersions && (
          <VersionHistoryPanel
            pid={pid} sid={sid} sceneKey={scene.scene_key}
            resolveUrl={resolveUrl}
            setError={setError}
          />
        )}
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
        {/* 시드 모드 선택 */}
        <div style={{ display:'flex', gap:4 }}>
          {SEED_MODES.map(m => (
            <button key={m.id}
              className={`btn ${seedMode === m.id ? 'primary' : 'ghost'} sm`}
              style={{ flex:1, justifyContent:'center', fontSize:10, padding:'5px 4px',
                background: seedMode === m.id ? 'var(--rose)' : undefined,
                border: seedMode === m.id ? 'none' : undefined,
                color: seedMode === m.id ? '#fff' : 'var(--text-3)' }}
              onClick={() => setSeedMode(m.id)}
              disabled={isRunning}>
              {m.label}
            </button>
          ))}
        </div>

        {/* 시드 고정 설명 */}
        {seedMode === 'fixed' && clip?.seed != null && (
          <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', textAlign:'center' }}>
            시드 {clip.seed} 유지
          </div>
        )}
        {seedMode === 'fixed' && clip?.seed == null && (
          <div style={{ fontSize:10, color:'var(--orange)', textAlign:'center' }}>
            현재 버전에 시드 정보 없음 — 랜덤으로 생성됩니다
          </div>
        )}

        <button
          className="btn primary"
          style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:13, fontWeight:700,
            background: isRunning ? 'var(--surface-2)' : 'var(--rose)',
            border:'none', color: isRunning ? 'var(--text-3)' : '#fff', borderRadius:8 }}
          onClick={handleGenerate}
          disabled={isRunning || isGenerating}
        >
          {isRunning
            ? <><span className="spinner" style={{ width:13, height:13, borderWidth:2 }} />생성 중...</>
            : seedMode === 'library'
              ? <><Icon name="film" size={14} />라이브러리에서 시드 선택</>
              : <><Icon name="film" size={14} />이 씬 영상 생성</>}
        </button>

        <button
          className="btn ghost sm"
          style={{ width:'100%', justifyContent:'center', fontSize:11 }}
          onClick={() => setShowVersions(v => !v)}>
          <Icon name="film" size={11} />버전 히스토리 {showVersions ? '숨기기' : '보기'}
        </button>
      </div>
    </div>
  );
};


/* ══ 버전 히스토리 패널 ═════════════════════════════════════════════════ */
const StarRating = ({ rating, onChange, disabled }) => (
  <div style={{ display:'flex', gap:2 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n}
        style={{ background:'none', border:'none', padding:'1px 2px', cursor: disabled ? 'default' : 'pointer',
          fontSize:14, color: n <= (rating || 0) ? 'var(--orange)' : 'var(--text-4)', lineHeight:1 }}
        disabled={disabled}
        onClick={() => onChange(n)}>
        ★
      </button>
    ))}
  </div>
);

const SaveSeedModal = ({ pid, sid, sceneKey, version, onClose }) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [categories, setCategories] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.get('/api/seed-presets/categories')
      .then(data => { setCategories(data || []); setCategory(data?.[0] || ''); })
      .catch(() => { setCategories(['인물','배경','액션','감정','기타']); setCategory('인물'); });
  }, []);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/cuts/${sceneKey}/versions/${version}/save-seed`, {
        version, name: name.trim(), category, memo: memo.trim() || undefined,
      });
      onClose(true);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, width:360, display:'flex', flexDirection:'column', gap:14 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:14, fontWeight:700 }}>시드 라이브러리에 저장</div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-4)', marginBottom:4 }}>이름 <span style={{ color:'var(--rose)' }}>*</span></div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예) 도심 야경 달리인"
              style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--text)', boxSizing:'border-box' }} />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-4)', marginBottom:4 }}>카테고리</div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--text)' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-4)', marginBottom:4 }}>메모 (선택)</div>
            <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예) kling v2.1 잘나옴"
              style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:7, background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--text)', boxSizing:'border-box' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn ghost sm" onClick={() => onClose(false)}>취소</button>
          <button className="btn primary sm"
            style={{ background:'var(--mint)', color:'#000' }}
            disabled={!name.trim() || saving}
            onClick={save}>
            {saving ? <><span className="spinner" style={{ width:10, height:10, borderWidth:2 }} />저장 중...</> : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VersionHistoryPanel = ({ pid, sid, sceneKey, resolveUrl, setError }) => {
  const [versions, setVersions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [savingModal, setSavingModal] = React.useState(null); // version number
  const [ratingBusy, setRatingBusy] = React.useState({});
  const [playingVer, setPlayingVer] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!pid || !sid || !sceneKey) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts/${sceneKey}/versions`);
      setVersions(data.versions || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [pid, sid, sceneKey, setError]);

  React.useEffect(() => { load(); }, [load]);

  const handleRate = async (ver, rating) => {
    setRatingBusy(p => ({ ...p, [ver]: true }));
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/cuts/${sceneKey}/versions/${ver}/rate`, { version: ver, rating });
      setVersions(prev => prev.map(v => v.version === ver ? { ...v, rating } : v));
    } catch (e) { setError(e.message); }
    finally { setRatingBusy(p => { const n = { ...p }; delete n[ver]; return n; }); }
  };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'16px 0' }}>
      <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
    </div>
  );

  if (versions.length === 0) return (
    <div style={{ fontSize:11, color:'var(--text-4)', textAlign:'center', padding:'12px 0' }}>버전 없음</div>
  );

  return (
    <Section label={`버전 히스토리 (${versions.length})`}>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[...versions].reverse().map(ver => {
          const videoUrl = resolveUrl(`${ver.video_path}`);
          const isPlaying = playingVer === ver.version;
          const hasSeed = ver.seed != null;

          return (
            <div key={ver.version}
              style={{ borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', overflow:'hidden' }}>

              {/* 비디오 미리보기 */}
              {videoUrl && (
                <div style={{ position:'relative', aspectRatio:'16/9', background:'var(--surface-2)' }}>
                  <video key={videoUrl} src={videoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    loop playsInline
                    ref={el => { if (el) { if (isPlaying) el.play().catch(() => {}); else { el.pause(); el.currentTime = 0; } } }}
                  />
                  <button
                    style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.25)', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}
                    onClick={() => setPlayingVer(isPlaying ? null : ver.version)}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.85)', display:'grid', placeItems:'center' }}>
                      <Icon name={isPlaying ? 'pause' : 'play'} size={15} style={{ color:'#000' }} />
                    </div>
                  </button>
                  <div style={{ position:'absolute', top:6, left:8, fontSize:10, color:'#fff', fontFamily:'var(--font-mono)', background:'rgba(0,0,0,0.55)', borderRadius:4, padding:'2px 6px' }}>
                    v{ver.version}
                  </div>
                </div>
              )}

              <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:6 }}>
                {/* 모델 + 시드 */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {ver.video_model && (
                    <span style={{ fontSize:9, padding:'2px 6px', background:'var(--bg-2)', borderRadius:4, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>
                      {ver.video_model.split('/').pop()}
                    </span>
                  )}
                  <span style={{ fontSize:9, padding:'2px 6px', background: hasSeed ? 'color-mix(in oklch, var(--violet) 15%, var(--surface))' : 'var(--bg-2)', borderRadius:4, color: hasSeed ? 'var(--violet)' : 'var(--text-4)', fontFamily:'var(--font-mono)' }}>
                    {hasSeed ? `시드 ${ver.seed}` : '시드 없음'}
                  </span>
                </div>

                {/* 별점 */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <StarRating rating={ver.rating} onChange={r => handleRate(ver.version, r)} disabled={!!ratingBusy[ver.version]} />
                  {ver.rating && <span style={{ fontSize:10, color:'var(--text-4)' }}>{ver.rating}/5</span>}
                </div>

                {/* 저장 버튼 */}
                <button
                  className="btn ghost sm"
                  style={{ fontSize:10, padding:'4px 8px', opacity: hasSeed ? 1 : 0.4 }}
                  disabled={!hasSeed}
                  title={hasSeed ? '시드 라이브러리에 저장' : '시드 정보 없음 — 저장 불가'}
                  onClick={() => setSavingModal(ver.version)}>
                  ⭐ 라이브러리 저장
                </button>

                {/* 생성 시간 */}
                {ver.created_at && (
                  <div style={{ fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>
                    {new Date(ver.created_at).toLocaleString('ko')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {savingModal != null && (
        <SaveSeedModal
          pid={pid} sid={sid} sceneKey={sceneKey} version={savingModal}
          onClose={(saved) => { setSavingModal(null); if (saved) load(); }}
        />
      )}
    </Section>
  );
};


/* ══ 시드 라이브러리 모달 ═══════════════════════════════════════════════ */
const SeedLibraryModal = ({ pid, sid, scene, cut, onGenerate, onClose }) => {
  const [categories, setCategories] = React.useState([]);
  const [activeCategory, setActiveCategory] = React.useState('전체');
  const [presets, setPresets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(null);
  const [playingId, setPlayingId] = React.useState(null);

  const SAMPLE_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/seed-presets/sample/';

  React.useEffect(() => {
    api.get('/api/seed-presets/categories')
      .then(data => setCategories(['전체', ...(data || [])]))
      .catch(() => setCategories(['전체','인물','배경','액션','감정','기타']));
  }, []);

  const loadPresets = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeCategory !== '전체' ? `?category=${encodeURIComponent(activeCategory)}` : '';
      const data = await api.get(`/api/seed-presets${qs}`);
      setPresets(data || []);
    } catch { setPresets([]); }
    finally { setLoading(false); }
  }, [activeCategory]);

  React.useEffect(() => { loadPresets(); }, [loadPresets]);

  const apply = async (preset) => {
    setApplying(preset.id);
    try {
      await api.post(`/api/seed-presets/${preset.id}/use`);
    } catch { /* used_count 실패는 무시 */ }
    onClose();
    onGenerate({ seed: preset.seed, model: preset.model });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:680, maxHeight:'85vh', display:'flex', flexDirection:'column' }}
        onClick={e => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:700 }}>시드 라이브러리</span>
          <span style={{ fontSize:11, color:'var(--text-4)' }}>{scene?.title_ko || scene?.scene_key}</span>
          <button style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', fontSize:18, padding:'0 4px' }} onClick={onClose}>✕</button>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ padding:'10px 16px 0', display:'flex', gap:6, borderBottom:'1px solid var(--border)', flexWrap:'wrap', flexShrink:0 }}>
          {categories.map(cat => (
            <button key={cat}
              className={`btn sm ${activeCategory === cat ? 'primary' : 'ghost'}`}
              style={{ fontSize:11, padding:'4px 12px',
                background: activeCategory === cat ? 'var(--violet)' : undefined,
                border: activeCategory === cat ? 'none' : undefined,
                color: activeCategory === cat ? '#fff' : undefined,
                borderRadius:'6px 6px 0 0' }}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* 프리셋 목록 */}
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:40 }}><span className="spinner" style={{ width:20, height:20, borderWidth:3 }} /></div>
          ) : presets.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-4)', fontSize:13 }}>저장된 시드 없음</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {presets.map(p => {
                const sampleUrl = p.sample_video_path ? `${SAMPLE_BASE}${p.sample_video_path.split('/').pop()}` : null;
                const isPlay = playingId === p.id;
                return (
                  <div key={p.id}
                    style={{ borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-2)', overflow:'hidden' }}>

                    {/* 샘플 영상 또는 플레이스홀더 */}
                    <div style={{ position:'relative', aspectRatio:'16/9', background:'var(--surface-2)' }}>
                      {sampleUrl ? (
                        <>
                          <video key={sampleUrl} src={sampleUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            loop playsInline
                            ref={el => { if (el) { if (isPlay) el.play().catch(() => {}); else { el.pause(); el.currentTime = 0; } } }}
                          />
                          <button
                            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.2)', border:'none', cursor:'pointer', display:'grid', placeItems:'center' }}
                            onClick={() => setPlayingId(isPlay ? null : p.id)}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.85)', display:'grid', placeItems:'center' }}>
                              <Icon name={isPlay ? 'pause' : 'play'} size={12} style={{ color:'#000' }} />
                            </div>
                          </button>
                        </>
                      ) : (
                        <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'var(--text-4)', fontSize:11 }}>
                          샘플 없음
                        </div>
                      )}
                    </div>

                    <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <span style={{ fontSize:9, padding:'2px 6px', background:'color-mix(in oklch, var(--violet) 15%, transparent)', color:'var(--violet)', borderRadius:4 }}>{p.category}</span>
                        <span style={{ fontSize:9, padding:'2px 6px', background:'var(--surface)', color:'var(--text-4)', borderRadius:4, fontFamily:'var(--font-mono)' }}>
                          {p.model?.split('/').pop() || '?'}
                        </span>
                      </div>
                      <div style={{ fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>
                        시드 {p.seed} · 사용 {p.used_count ?? 0}회
                      </div>
                      {p.memo && <div style={{ fontSize:10, color:'var(--text-3)' }}>{p.memo}</div>}
                      <button
                        className="btn primary sm"
                        style={{ width:'100%', justifyContent:'center', fontSize:11, marginTop:2,
                          background:'var(--violet)', border:'none', color:'#fff' }}
                        disabled={applying === p.id}
                        onClick={() => apply(p)}>
                        {applying === p.id
                          ? <><span className="spinner" style={{ width:10, height:10, borderWidth:2 }} />적용 중...</>
                          : '이 시드로 생성'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
