import React from 'react';
import { Icon } from './Icons';
import { api, apiBase } from '../api';

/* ── 씬 이미지 생성 뷰
 * 흐름: 씬 선택 → 등장인물/배경/텍스트 확인·선택 → [씬 이미지 생성] → 결과 확인 → 확정→영상생성
 */

const NATIONALITIES = [
  { value: 'Korean',   label: '🇰🇷 한국' },
  { value: 'Japanese', label: '🇯🇵 일본' },
  { value: 'Chinese',  label: '🇨🇳 중국' },
  { value: 'American', label: '🇺🇸 미국' },
  { value: 'European', label: '🇪🇺 유럽' },
  { value: 'Black',    label: '흑인' },
  { value: 'Latino',   label: '라틴계' },
];

export const SceneImageView = ({ project, short, onShortUpdate, setView }) => {
  const pid = project?.id;
  const sid = short?.id;

  // 전체 데이터
  const [scenes,       setScenes]       = React.useState([]);
  const [cuts,         setCuts]         = React.useState([]);
  const [characters,   setCharacters]   = React.useState([]);
  const [locations,    setLocations]    = React.useState([]);
  const [nationality,  setNationality]  = React.useState(project?.nationality || 'Korean');

  const [selectedSceneKey, setSelectedSceneKey] = React.useState(null);
  const [selectedLoc,      setSelectedLoc]      = React.useState(null);  // 씬별 선택 배경
  const [selectedChars,    setSelectedChars]    = React.useState([]);    // 씬별 선택 등장인물
  const [loading,  setLoading]  = React.useState(true);
  const [approving, setApproving] = React.useState(false);
  const [error,    setError]    = React.useState(null);

  const shortStage  = short?.stage;
  const shortStatus = short?.status;
  const canApprove  = shortStage === 'scene_image' && shortStatus === 'choosing';
  const isDone      = shortStage === 'scene_video' || shortStage === 'done';

  // ── 데이터 로드 ──────────────────────────────────────────────────────
  const saveNationality = async (val) => {
    setNationality(val);
    try { await api.patch(`/api/projects/${pid}`, { nationality: val }); } catch {}
  };

  const loadAll = React.useCallback(async () => {
    if (!pid || !sid) return;
    try {
      const [sceneRes, cutRes, charRes, locRes, projRes, shortRes] = await Promise.all([
        api.get(`/api/projects/${pid}/shorts/${sid}/scenario`),
        api.get(`/api/projects/${pid}/shorts/${sid}/cuts`),
        api.get(`/api/projects/${pid}/characters`),
        api.get(`/api/projects/${pid}/locations`),
        api.get(`/api/projects/${pid}`),
        api.get(`/api/projects/${pid}/shorts/${sid}`),
      ]);
      const sceneList = sceneRes?.scenes || sceneRes?.screenplay?.scenes || [];
      setScenes(sceneList);
      setCuts(cutRes?.cuts || []);
      setCharacters(charRes?.characters || []);
      setLocations(locRes?.locations || []);
      if (projRes?.nationality) setNationality(projRes.nationality);
      if (shortRes && onShortUpdate) onShortUpdate(shortRes);
      setSelectedSceneKey(prev => prev || (sceneList.length ? sceneList[0].scene_key : null));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [pid, sid]);

  React.useEffect(() => { setLoading(true); loadAll(); }, [loadAll]);

  // 생성 중 폴링 — short status 또는 개별 컷 generating 중 하나라도 있으면 폴링
  const hasGeneratingCut = cuts.some(c => c.status === 'generating');
  React.useEffect(() => {
    const isGen = (shortStage === 'scene_image' && shortStatus === 'generating') || hasGeneratingCut;
    if (!isGen) return;
    const t = setInterval(loadAll, 3000);
    return () => clearInterval(t);
  }, [shortStage, shortStatus, hasGeneratingCut, loadAll]);

  // ── 헬퍼 ─────────────────────────────────────────────────────────────
  const charMap = React.useMemo(() =>
    Object.fromEntries(characters.map(c => [c.char_key || c.key, c])),
    [characters]);
  const locMap = React.useMemo(() =>
    Object.fromEntries(locations.map(l => [l.loc_key || l.key, l])),
    [locations]);
  // scene_key → 컷 배열 (cut_order 순)
  const cutsByScene = React.useMemo(() => {
    const map = {};
    for (const c of cuts) {
      if (!map[c.scene_key]) map[c.scene_key] = [];
      map[c.scene_key].push(c);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.cut_order || 0) - (b.cut_order || 0));
    }
    return map;
  }, [cuts]);

  // 씬 목록 카드용 — 씬의 첫 번째 컷 (썸네일/상태 표시)
  const cutMap = React.useMemo(() =>
    Object.fromEntries(Object.entries(cutsByScene).map(([sk, arr]) => [sk, arr[0]])),
    [cutsByScene]);

  const [selectedCutKey, setSelectedCutKey] = React.useState(null);
  const [cutBustMap, setCutBustMap] = React.useState({}); // cut_key → timestamp

  const resolveUrl = (path, cutKey) => {
    if (!path || path === '') return null;
    const t = cutKey ? (cutBustMap[cutKey] || Date.now()) : Date.now();
    if (path.startsWith('http')) return `${path}${path.includes('?') ? '&' : '?'}v=${t}`;
    if (path.startsWith('/api')) return `${apiBase.replace(/\/api$/, '')}${path}?v=${t}`;
    return `${apiBase}/media/${pid}/${path}?v=${t}`;
  };

  const selectedScene = scenes.find(s => s.scene_key === selectedSceneKey);
  const sceneCuts     = selectedScene ? (cutsByScene[selectedScene.scene_key] || []) : [];
  const selectedCut   = sceneCuts.find(c => c.cut_key === selectedCutKey) || sceneCuts[0] || null;

  // 씬 바뀌면 배경·등장인물·컷 선택 초기화
  React.useEffect(() => {
    if (!selectedScene) return;
    setSelectedLoc(selectedScene.location_key || null);
    setSelectedChars(selectedScene.char_keys || selectedScene.characters_in_scene || []);
    setSelectedCutKey(null);
  }, [selectedSceneKey]);

  const doneCount = cuts.filter(c => c.status === 'done').length;
  const totalCuts = cuts.length;

  // ── 전체 씬 이미지 생성 시작 (cast/approve → scene_image stage) ──
  const startAllGenerate = async () => {
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/cast/approve`, {
        video_model: 'fal-ai/kling-video/v3/standard/image-to-video',
      });
      const u = await api.get(`/api/projects/${pid}/shorts/${sid}`);
      if (onShortUpdate) onShortUpdate(u);
    } catch (e) { setError(e.message); }
  };

  // SSE 씬 이미지 완료 이벤트 → 해당 컷 캐시버스터 갱신
  React.useEffect(() => {
    const handler = (e) => {
      const obj = e.detail;
      if (!obj || obj.type !== 'cut' || !obj.key) return;
      setCutBustMap(prev => ({ ...prev, [obj.key]: Date.now() }));
    };
    window.addEventListener('short:image_event', handler);
    return () => window.removeEventListener('short:image_event', handler);
  }, []);

  // ── 씬 확정 → 영상 생성 ─────────────────────────────────────────────
  const approve = async () => {
    setApproving(true); setError(null);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/scene-image/approve`);
      const u = await api.get(`/api/projects/${pid}/shorts/${sid}`);
      if (onShortUpdate) onShortUpdate(u);
      if (setView) setView('render');
    } catch (e) { setError(e.message); }
    finally { setApproving(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'var(--text-4)' }}>
      <span className="spinner" style={{ width:24, height:24, borderWidth:3 }} />
      <span style={{ fontSize:13 }}>데이터 로드 중...</span>
    </div>
  );

  const isGenerating = shortStage === 'scene_image' && shortStatus === 'generating';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 320px', gridTemplateRows:'auto 1fr', height:'100%', minHeight:0, overflow:'hidden' }}>

      {/* ── 최상단 국적 선택 바 ── */}
      <div style={{ gridColumn:'1/-1', padding:'8px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-2)', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>국적</span>
        <select value={nationality} onChange={e => saveNationality(e.target.value)}
          style={{ fontSize:12, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', padding:'3px 8px', cursor:'pointer' }}>
          {NATIONALITIES.map(n => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </select>
        <span style={{ fontSize:11, color:'var(--text-4)' }}>— 이미지 생성 시 캐릭터 인종에 적용됩니다</span>
      </div>

      {/* ── 왼쪽: 씬 목록 ── */}
      <SceneList
        scenes={scenes} cuts={cuts} cutMap={cutMap}
        selectedSceneKey={selectedSceneKey} onSelect={setSelectedSceneKey}
        isGenerating={isGenerating}
        doneCount={doneCount} totalCuts={totalCuts}
        shortStage={shortStage} shortStatus={shortStatus}
        canApprove={canApprove} isDone={isDone}
        onStartAll={startAllGenerate}
        onApprove={approve} approving={approving}
        setView={setView}
        resolveUrl={resolveUrl}
      />

      {/* ── 중앙: 씬 이미지 결과 ── */}
      <ScenePreview
        scene={selectedScene} cut={selectedCut}
        sceneCuts={sceneCuts} selectedCutKey={selectedCutKey} onSelectCut={setSelectedCutKey}
        pid={pid} sid={sid}
        resolveUrl={resolveUrl}
        isGenerating={isGenerating}
        onReloaded={loadAll}
        onClearCut={cutKey => setCuts(prev => prev.map(c => c.cut_key === cutKey ? { ...c, image_path: '', status: 'generating' } : c))}
        onBustCut={cutKey => setCutBustMap(prev => ({ ...prev, [cutKey]: Date.now() }))}
        setError={setError}
        selectedLoc={selectedLoc}
        locMap={locMap}
        selectedChars={selectedChars}
        bgImageUrl={(() => {
          if (!selectedLoc) return null;
          const loc = locMap[selectedLoc];
          return loc ? resolveUrl(loc.image_path || loc.image_url) : null;
        })()}
      />

      {/* ── 오른쪽: 씬 설정 (등장인물 + 배경 + 텍스트) ── */}
      <ScenePanel
        scene={selectedScene} cut={selectedCut} sceneCuts={sceneCuts}
        charMap={charMap} locMap={locMap}
        pid={pid} sid={sid}
        resolveUrl={resolveUrl}
        isGenerating={isGenerating}
        onReloaded={loadAll}
        onClearCut={cutKey => setCuts(prev => prev.map(c => c.cut_key === cutKey ? { ...c, image_path: '', status: 'generating' } : c))}
        setError={setError}
        selectedLoc={selectedLoc}
        setSelectedLoc={setSelectedLoc}
        selectedChars={selectedChars}
        setSelectedChars={setSelectedChars}
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
const SceneList = ({ scenes, cutMap, selectedSceneKey, onSelect, isGenerating,
                     doneCount, totalCuts, shortStage, shortStatus, canApprove, isDone,
                     onStartAll, onApprove, approving, setView, resolveUrl }) => (
  <div style={{ borderRight:'1px solid var(--border)', background:'oklch(0.12 0.005 280)', display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
    {/* 헤더 */}
    <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
      <Icon name="image" size={13} style={{ color:'var(--mint)' }} />
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', fontFamily:'var(--font-mono)' }}>씬 이미지</span>
      <span style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginLeft:'auto' }}>{doneCount}/{totalCuts || scenes.length}컷</span>
    </div>

    {/* 씬 목록 */}
    <div style={{ flex:1, overflowY:'auto', padding:'6px' }}>
      {scenes.map((scene, i) => {
        const cut = cutMap[scene.scene_key];
        const imgUrl = cut?.image_path ? resolveUrl(cut.image_path, cut.cut_key) : null;
        const isActive = selectedSceneKey === scene.scene_key;
        const status = cut?.status || 'pending';
        return (
          <div key={scene.scene_key} onClick={() => onSelect(scene.scene_key)}
            style={{ borderRadius:8, overflow:'hidden', cursor:'pointer', marginBottom:4,
              border:`2px solid ${isActive ? 'var(--mint)' : 'transparent'}`,
              background:'var(--surface)', transition:'border-color 0.1s' }}>
            <div style={{ display:'flex', gap:8, padding:'8px 10px', alignItems:'center' }}>
              {/* 썸네일 */}
              <div style={{ width:36, height:50, borderRadius:4, overflow:'hidden', background:'var(--surface-2)', flexShrink:0, display:'grid', placeItems:'center' }}>
                {imgUrl
                  ? <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : status === 'generating'
                    ? <span className="spinner" style={{ width:12, height:12, borderWidth:2, borderColor:'var(--violet)', borderTopColor:'transparent' }} />
                    : <Icon name="image" size={14} style={{ color:'var(--text-4)' }} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>S{String(i+1).padStart(2,'0')}</div>
                <div style={{ fontSize:11, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                  {scene.title_ko || scene.scene_key}
                </div>
                <StatusDot status={status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* 하단 버튼 */}
    <div style={{ padding:'10px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
      {shortStage === 'cast' && shortStatus === 'choosing' && (
        <button className="btn primary" style={{ width:'100%', justifyContent:'center', fontSize:12, fontWeight:700, background:'var(--violet)', border:'none', color:'#fff' }}
          onClick={onStartAll}>
          <Icon name="sparkles" size={13} />전체 씬 이미지 생성
        </button>
      )}
      {canApprove && (
        <button className="btn primary" style={{ width:'100%', justifyContent:'center', fontSize:12, fontWeight:700, background:'var(--mint)', color:'#000' }}
          onClick={onApprove} disabled={approving}>
          {approving
            ? <span className="spinner" style={{ width:11, height:11, borderWidth:2 }} />
            : <Icon name="check" size={13} />}
          확정 → 영상 생성
        </button>
      )}
      {isDone && setView && (
        <button className="btn primary" style={{ width:'100%', justifyContent:'center', fontSize:12 }}
          onClick={() => setView('render')}>
          다음: 씬 영상 →
        </button>
      )}
    </div>
  </div>
);

const StatusDot = ({ status }) => {
  const map = { done:['var(--mint)','✓ 완료'], failed:['var(--rose)','✗ 실패'], generating:['var(--violet)','생성 중...'], pending:['var(--text-4)','대기'] };
  const [color, label] = map[status] || map.pending;
  return <div style={{ fontSize:10, color, marginTop:2, fontFamily:'var(--font-mono)' }}>{label}</div>;
};


/* ══ 중앙: 씬 이미지 결과 ════════════════════════════════════════════════ */
const ScenePreview = ({ scene, cut, sceneCuts, selectedCutKey, onSelectCut,
                        pid, sid, resolveUrl, isGenerating, onReloaded, onClearCut, onBustCut, setError,
                        selectedLoc, locMap, selectedChars, bgImageUrl }) => {
  const [lightbox, setLightbox]       = React.useState(false);
  const [regenLoading, setRegenLoading] = React.useState(false);
  const [regenOpen, setRegenOpen]     = React.useState(false);
  const [regenPrompt, setRegenPrompt] = React.useState('');
  const [clipLoading, setClipLoading] = React.useState({}); // cut_key → bool
  const [clipPreview, setClipPreview] = React.useState(null); // { url, cut_key } 미리보기 모달
  const [promptEdit, setPromptEdit]   = React.useState(false);
  const [promptDraft, setPromptDraft] = React.useState('');
  const [promptSaving, setPromptSaving] = React.useState(false);
  const [cutRegenLoading, setCutRegenLoading] = React.useState(false);
  const [cutRegenOpen, setCutRegenOpen] = React.useState(false);
  const [cutRegenNotes, setCutRegenNotes] = React.useState('');

  React.useEffect(() => {
    setPromptEdit(false);
    setPromptDraft(cut?.prompt_en || '');
  }, [cut?.cut_key]);

  const savePrompt = async () => {
    if (!cut) return;
    setPromptSaving(true);
    try {
      await api.patch(`/api/projects/${pid}/shorts/${sid}/cuts/${cut.cut_key}`, { prompt_en: promptDraft });
      // 로컬 cuts 목록 갱신
      const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts`);
      if (onReloaded) onReloaded(data);
      setPromptEdit(false);
    } catch (e) { setError && setError(e.message); }
    finally { setPromptSaving(false); }
  };

  const generateCutClip = async (cutKey) => {
    setClipLoading(l => ({ ...l, [cutKey]: true }));
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/clips/regenerate`, { cut_key: cutKey });
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          await onReloaded();
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts`);
            const c = (data.cuts || []).find(c => c.cut_key === cutKey);
            if ((c?.video_status === 'done' || c?.video_status === 'failed') || attempts >= 120) {
              clearInterval(poll); resolve();
            }
          } catch { clearInterval(poll); resolve(); }
        }, 2000);
      });
    } catch (e) { setError(e.message); }
    finally { setClipLoading(l => ({ ...l, [cutKey]: false })); }
  };

  // 씬 바뀌면 팝오버 닫기
  React.useEffect(() => {
    setRegenOpen(false); setRegenPrompt('');
    setCutRegenOpen(false); setCutRegenNotes('');
  }, [scene?.scene_key]);

  // 컷 바뀌면 이미지 재생성 팝오버 닫기
  React.useEffect(() => { setRegenOpen(false); setRegenPrompt(''); }, [cut?.cut_key]);

  const regenSceneCuts = async () => {
    if (!scene) return;
    setCutRegenOpen(false);
    setCutRegenLoading(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${sid}/scenes/${scene.scene_key}/regenerate-cuts`, {
        notes: cutRegenNotes.trim(),
      });
      setCutRegenNotes('');
      // 폴링: 컷이 새로 생길 때까지 대기 (최대 30초)
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts`);
            const sceneCutsNew = (data.cuts || []).filter(c => c.scene_key === scene.scene_key);
            if (sceneCutsNew.length > 0 || attempts >= 15) {
              clearInterval(poll);
              if (onReloaded) onReloaded(data);
              resolve();
            }
          } catch { clearInterval(poll); resolve(); }
        }, 2000);
      });
    } catch (e) { setError && setError(e.message); }
    finally { setCutRegenLoading(false); }
  };

  const imgUrl = cut?.image_path ? resolveUrl(cut.image_path, cut.cut_key) : null;

  const regen = async () => {
    if (!cut) return;
    const cutKey = cut.cut_key;
    setRegenOpen(false);
    if (onClearCut) onClearCut(cutKey);
    setRegenLoading(true);
    try {
      const bgLoc = selectedLoc && locMap ? locMap[selectedLoc] : null;
      const body = {
        model: 'gpt-image-2',
        char_keys: selectedChars || [],
        background_image_path: bgLoc?.image_path || '',
      };
      if (regenPrompt.trim()) body.extra_prompt = regenPrompt.trim();
      await api.post(`/api/projects/${pid}/shorts/${sid}/cuts/${cutKey}/generate`, body);
      setRegenPrompt('');
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          await onReloaded();
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts`);
            const updated = (data.cuts || []).find(c => c.cut_key === cutKey);
            if ((updated?.image_path && updated?.status === 'done') || updated?.status === 'failed' || attempts >= 60) {
              if (updated?.status === 'done' && onBustCut) onBustCut(cutKey);
              clearInterval(poll); resolve();
            }
          } catch { clearInterval(poll); resolve(); }
        }, 2000);
      });
    } catch (e) { setError(e.message); }
    finally { setRegenLoading(false); }
  };

  if (!scene) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-4)', flexDirection:'column', gap:12 }}>
      <Icon name="image" size={40} />
      <span style={{ fontSize:13 }}>왼쪽에서 씬을 선택하세요</span>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0, background:'oklch(0.13 0.008 280)', height:'100%' }}>
      {/* 헤더 */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-2)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:700 }}>{scene.title_ko || scene.scene_key}</span>
        {cut && <StatusDot status={cut.status} />}

        {/* 컷 LLM 재생성 버튼 (씬 단위) */}
        <div style={{ position:'relative' }}>
          <button className="btn sm"
            onClick={() => { if (!cutRegenLoading && !isGenerating) setCutRegenOpen(o => !o); }}
            disabled={cutRegenLoading || isGenerating}
            title="LLM으로 이 씬의 컷 목록을 새로 생성"
            style={{ fontSize:10, color:'var(--text-3)', borderColor:'rgba(167,139,255,0.35)', background:'rgba(167,139,255,0.07)' }}>
            {cutRegenLoading
              ? <span className="spinner" style={{ width:9, height:9, borderWidth:1.5 }} />
              : <Icon name="sparkles" size={10} />}
            {cutRegenLoading ? '생성 중...' : '컷 재생성'}
          </button>

          {cutRegenOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:50,
              background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8,
              padding:'10px', width:240, boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
              display:'flex', flexDirection:'column', gap:8,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--violet)' }}>LLM 컷 재생성</div>
              <div style={{ fontSize:10, color:'var(--text-4)', lineHeight:1.5 }}>이 씬의 컷 전체를 AI가 다시 구성합니다. 기존 이미지는 삭제됩니다.</div>
              <textarea
                autoFocus
                value={cutRegenNotes}
                onChange={e => setCutRegenNotes(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) regenSceneCuts(); if (e.key === 'Escape') setCutRegenOpen(false); }}
                placeholder="추가 지시 (선택) — 예: B-ROLL 위주로, 클로즈업 많이..."
                rows={2}
                style={{
                  width:'100%', boxSizing:'border-box', resize:'none', fontSize:10,
                  fontFamily:'var(--font-mono)', lineHeight:1.6,
                  background:'var(--surface)', border:'1px solid var(--border)',
                  borderRadius:6, padding:'6px 8px', color:'var(--text)', outline:'none',
                }}
              />
              <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                <button className="btn ghost" style={{ fontSize:10, padding:'3px 10px' }}
                  onClick={() => setCutRegenOpen(false)}>취소</button>
                <button className="btn primary" style={{ fontSize:10, padding:'4px 12px', background:'var(--violet)', border:'none', color:'#fff' }}
                  onClick={regenSceneCuts}>
                  <Icon name="sparkles" size={10} />재생성
                </button>
              </div>
              <div style={{ fontSize:9, color:'var(--text-4)', textAlign:'right' }}>Ctrl+Enter로 바로 실행</div>
            </div>
          )}
        </div>

        {/* 이미지가 이미 있을 때만 이미지 재생성 버튼 표시 */}
        {cut?.image_path && (
          <div style={{ marginLeft:'auto', position:'relative' }}>
            <button className="btn sm"
              onClick={() => { if (!regenLoading && cut?.status !== 'generating' && !isGenerating) setRegenOpen(o => !o); }}
              disabled={regenLoading || cut?.status === 'generating' || isGenerating}
            >
              {regenLoading || cut?.status === 'generating'
                ? <span className="spinner" style={{ width:10, height:10, borderWidth:1.5 }} />
                : <Icon name="refresh" size={11} />}
              {cut?.status === 'generating' ? '생성 중...' : '재생성'}
            </button>

            {regenOpen && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50,
                background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8,
                padding:'10px', width:260, boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
                display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)' }}>수정 프롬프트</div>
                <textarea
                  autoFocus
                  value={regenPrompt}
                  onChange={e => setRegenPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) regen(); if (e.key === 'Escape') setRegenOpen(false); }}
                  placeholder="예: 조명을 더 어둡게, 인물 표정을 놀란 표정으로..."
                  rows={3}
                  style={{
                    width:'100%', boxSizing:'border-box', resize:'vertical', fontSize:11,
                    fontFamily:'var(--font-mono)', lineHeight:1.6,
                    background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:6, padding:'7px 9px', color:'var(--text)', outline:'none',
                  }}
                />
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button className="btn ghost" style={{ fontSize:11, padding:'4px 10px' }}
                    onClick={() => setRegenOpen(false)}>취소</button>
                  <button className="btn primary" style={{ fontSize:11, padding:'4px 12px', background:'var(--violet)', border:'none', color:'#fff' }}
                    onClick={regen}>
                    <Icon name="refresh" size={11} />재생성
                  </button>
                </div>
                <div style={{ fontSize:9, color:'var(--text-4)', textAlign:'right' }}>Ctrl+Enter로 바로 실행</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 메인 이미지 */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 16px 8px', minHeight:0 }}>
        <div style={{ position:'relative', aspectRatio:'16/9', height:'100%', maxHeight:460, maxWidth:816, borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', cursor: imgUrl ? 'zoom-in' : 'default', background:'var(--surface-2)' }}
          onClick={() => imgUrl && setLightbox(true)}>
          {imgUrl ? (
            <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : cut?.status === 'generating' ? (
            <>
              {bgImageUrl && <img src={bgImageUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.35 }} />}
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                <span className="spinner" style={{ width:36, height:36, borderWidth:3, borderColor:'var(--violet)', borderTopColor:'transparent' }} />
                <span style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>GENERATING...</span>
              </div>
            </>
          ) : bgImageUrl ? (
            <>
              <img src={bgImageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.5)' }} />
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon name="sparkles" size={22} style={{ color:'var(--violet)' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:'var(--font-mono)' }}>배경 선택됨 · 생성 버튼 클릭</span>
              </div>
            </>
          ) : (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text-4)' }}>
              <Icon name="image" size={40} />
              <span style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>이미지 없음</span>
            </div>
          )}
          {imgUrl && (
            <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.6)', borderRadius:6, padding:'3px 8px', fontSize:10, color:'var(--mint)', fontFamily:'var(--font-mono)' }}>✓ DONE</div>
          )}
        </div>
      </div>

      {/* 컷 라벨 + 프롬프트 */}
      {cut && (
        <div style={{ padding:'6px 16px 8px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
            <div style={{ fontSize:10, color:'var(--violet)', fontFamily:'var(--font-mono)', fontWeight:700 }}>
              CUT {cut.cut_order || 1} — {cut.subject || cut.cut_key}
            </div>
            {!promptEdit && (
              <button onClick={() => { setPromptDraft(cut.prompt_en || ''); setPromptEdit(true); }}
                style={{ fontSize:9, color:'var(--text-4)', background:'none', border:'1px solid var(--border)', borderRadius:4, padding:'1px 6px', cursor:'pointer', fontFamily:'var(--font-mono)' }}>
                편집
              </button>
            )}
          </div>
          {promptEdit ? (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <textarea
                value={promptDraft}
                onChange={e => setPromptDraft(e.target.value)}
                rows={5}
                style={{ fontSize:10, lineHeight:1.5, width:'100%', boxSizing:'border-box',
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(167,139,255,0.4)',
                  borderRadius:6, padding:'6px 8px', color:'var(--text-2)', resize:'vertical',
                  outline:'none', fontFamily:'inherit' }}
                onFocus={e => e.target.style.borderColor = 'rgba(167,139,255,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(167,139,255,0.4)'}
              />
              <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                <button onClick={() => setPromptEdit(false)} disabled={promptSaving}
                  style={{ fontSize:10, padding:'3px 10px', borderRadius:5, cursor:'pointer', background:'none', border:'1px solid var(--border)', color:'var(--text-4)', fontFamily:'inherit' }}>
                  취소
                </button>
                <button onClick={savePrompt} disabled={promptSaving}
                  style={{ fontSize:10, padding:'3px 10px', borderRadius:5, cursor:'pointer',
                    background:'rgba(167,139,255,0.15)', border:'1px solid rgba(167,139,255,0.4)',
                    color:'#c4b1ff', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                  {promptSaving ? <span className="spinner" style={{ width:8, height:8, borderWidth:1.5 }} /> : null}
                  저장
                </button>
              </div>
            </div>
          ) : cut.prompt_en ? (
            <div onClick={() => { setPromptDraft(cut.prompt_en || ''); setPromptEdit(true); }}
              style={{ fontSize:10, color:'var(--text-4)', lineHeight:1.5, maxHeight:56, overflow:'hidden',
                display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical',
                cursor:'text', borderRadius:4, padding:'2px 4px', margin:'0 -4px',
                transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cut.prompt_en}
            </div>
          ) : (
            <div onClick={() => setPromptEdit(true)}
              style={{ fontSize:10, color:'rgba(255,255,255,0.2)', lineHeight:1.5, cursor:'text',
                padding:'2px 4px', borderRadius:4, fontStyle:'italic' }}>
              프롬프트 없음 — 클릭해서 입력
            </div>
          )}
        </div>
      )}

      {/* 컷 스트립 — 이미지 + 개별 클립 생성 버튼 */}
      {sceneCuts.length > 0 && (
        <div style={{ padding:'6px 16px 12px', flexShrink:0, borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)', fontWeight:700, marginBottom:6, letterSpacing:'0.08em' }}>
            CUTS — {sceneCuts.length}개
          </div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {sceneCuts.map((c, idx) => {
              const imgSrc = c.image_path ? resolveUrl(c.image_path, c.cut_key) : null;
              const clipSrc = c.video_path ? resolveUrl(c.video_path, true) || `${apiBase}/media/${pid}/shorts/${sid}/${c.video_path}` : null;
              const isActive = c.cut_key === (selectedCutKey || sceneCuts[0]?.cut_key);
              const isClipLoading = clipLoading[c.cut_key] || c.video_status === 'generating';
              const hasClip = c.video_status === 'done' && c.video_path;

              return (
                <div key={c.cut_key}
                  style={{ flexShrink:0, width:110, borderRadius:8, overflow:'hidden', background:'var(--surface-2)',
                    border:`2px solid ${isActive ? 'var(--violet)' : 'var(--border)'}`, transition:'border-color 0.1s' }}>
                  {/* 썸네일 */}
                  <div onClick={() => onSelectCut(c.cut_key)}
                    style={{ aspectRatio:'16/9', position:'relative', display:'grid', placeItems:'center', cursor:'pointer', background:'var(--surface)' }}>
                    {imgSrc
                      ? <img src={imgSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : c.status === 'generating'
                        ? <span className="spinner" style={{ width:10, height:10, borderWidth:1.5, borderColor:'var(--violet)', borderTopColor:'transparent' }} />
                        : <Icon name="image" size={12} style={{ color:'var(--text-4)' }} />}
                    {/* 클립 완료 배지 */}
                    {hasClip && (
                      <div style={{ position:'absolute', top:3, right:3, background:'rgba(0,212,160,0.85)', borderRadius:4, padding:'1px 4px', fontSize:8, color:'#000', fontFamily:'var(--font-mono)', fontWeight:700 }}>
                        ▶
                      </div>
                    )}
                  </div>

                  {/* 라벨 */}
                  <div style={{ padding:'3px 6px 2px' }}>
                    <div style={{ fontSize:9, color: isActive ? 'var(--violet)' : 'var(--text-4)', fontFamily:'var(--font-mono)', fontWeight:700 }}>C{idx+1}</div>
                    <div style={{ fontSize:9, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {c.subject || c.cut_key}
                    </div>
                  </div>

                  {/* 버튼 행 */}
                  <div style={{ display:'flex', gap:3, padding:'3px 5px 5px' }}>
                    {/* 클립 미리보기 */}
                    {hasClip && (
                      <button
                        onClick={() => setClipPreview({ url: clipSrc, cut_key: c.cut_key, label: `C${idx+1}` })}
                        style={{ flex:1, fontSize:8, padding:'3px 0', borderRadius:4, border:'1px solid color-mix(in oklch, var(--mint) 40%, transparent)',
                          background:'color-mix(in oklch, var(--mint) 10%, var(--surface))', color:'var(--mint)', cursor:'pointer', fontWeight:700 }}>
                        ▶ 보기
                      </button>
                    )}
                    {/* 클립 생성/재생성 */}
                    {imgSrc && (
                      <button
                        onClick={() => generateCutClip(c.cut_key)}
                        disabled={isClipLoading || isGenerating}
                        style={{ flex:1, fontSize:8, padding:'3px 0', borderRadius:4, border:'1px solid var(--border)',
                          background: isClipLoading ? 'var(--surface)' : hasClip ? 'var(--surface-2)' : 'color-mix(in oklch, var(--rose) 15%, var(--surface))',
                          color: isClipLoading ? 'var(--text-4)' : hasClip ? 'var(--text-3)' : 'var(--rose)',
                          cursor: isClipLoading || isGenerating ? 'not-allowed' : 'pointer' }}>
                        {isClipLoading
                          ? <span className="spinner" style={{ width:7, height:7, borderWidth:1.5, display:'inline-block', verticalAlign:'middle' }} />
                          : hasClip ? '재생성' : '클립'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      {lightbox && imgUrl && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}
          onClick={() => setLightbox(false)}>
          <img src={imgUrl} alt="" style={{ maxHeight:'90vh', maxWidth:'90vw', objectFit:'contain', borderRadius:10 }} onClick={e => e.stopPropagation()} />
          <button style={{ position:'absolute', top:20, right:24, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'#fff', padding:'6px 10px', cursor:'pointer', fontSize:18 }}
            onClick={() => setLightbox(false)}>✕</button>
        </div>
      )}

      {/* 컷 클립 미리보기 모달 */}
      {clipPreview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1001, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}
          onClick={() => setClipPreview(null)}>
          <div style={{ fontSize:11, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>{clipPreview.label} 클립 미리보기</div>
          <video
            src={clipPreview.url}
            style={{ maxHeight:'80vh', maxWidth:'90vw', borderRadius:10, border:'1px solid var(--border)' }}
            controls autoPlay loop
            onClick={e => e.stopPropagation()}
          />
          <button style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, color:'#fff', padding:'6px 16px', cursor:'pointer', fontSize:12 }}
            onClick={() => setClipPreview(null)}>닫기</button>
        </div>
      )}
    </div>
  );
};


/* ══ 오른쪽: 씬 설정 패널 (등장인물 + 배경 + 텍스트 + 생성버튼) ═════════ */
const ScenePanel = ({ scene, cut, sceneCuts, charMap, locMap, pid, sid, resolveUrl, isGenerating, onReloaded, onClearCut, setError, selectedLoc, setSelectedLoc, selectedChars, setSelectedChars }) => {
  const [generating, setGenerating] = React.useState(false);

  const toggleChar = (key) => {
    setSelectedChars(prev => (prev || []).includes(key) ? (prev || []).filter(k => k !== key) : [...(prev || []), key]);
  };

  const generate = async () => {
    if (!scene) return;
    const cutsToGen = sceneCuts?.length ? sceneCuts : (cut ? [cut] : []);
    if (!cutsToGen.length) return;

    const selectedBg = bgItems.find(b => b.id === selectedLoc);
    const bgPath = selectedBg?.bgImagePath || '';

    // 모든 컷 기존 이미지 즉시 제거
    cutsToGen.forEach(c => { if (onClearCut) onClearCut(c.cut_key); });
    setGenerating(true);

    try {
      // 모든 컷 생성 요청을 병렬로 발사
      await Promise.all(cutsToGen.map(c =>
        api.post(`/api/projects/${pid}/shorts/${sid}/cuts/${c.cut_key}/generate`, {
          model: 'gpt-image-2',
          char_keys: selectedChars,
          background_image_path: bgPath,
        })
      ));

      // 폴링: 모든 컷이 done/failed 될 때까지 대기
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          await onReloaded();
          try {
            const data = await api.get(`/api/projects/${pid}/shorts/${sid}/cuts`);
            const allDone = cutsToGen.every(c => {
              const updated = (data.cuts || []).find(u => u.cut_key === c.cut_key);
              return (updated?.image_path && updated?.status === 'done') || updated?.status === 'failed';
            });
            if (allDone || attempts >= 90) { clearInterval(poll); resolve(); }
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

  // 씬 텍스트 (시나리오에서)
  const actionText  = scene.action_ko || '';
  const dialogues   = scene.dialogue_ko || scene.dialogue_json || [];
  const moodText    = scene.mood_ko || '';
  const shotType    = scene.shot_type_ko || '';

  // 모든 캐릭터 목록
  const allChars = Object.values(charMap);
  // 배경: locations 단일 소스
  const bgItems = Object.values(locMap).map(l => ({
    id:         l.loc_key || l.key,
    label:      l.name_ko || l.loc_key || l.key,
    subLabel:   l.image_status === 'done' ? '완료됨' : (l.image_status === 'generating' ? '생성중' : '이미지 없음'),
    imgUrl:     resolveUrl(l.image_url || l.image_path),
    bgImagePath: l.image_path || null,
  }));

  return (
    <div style={{ borderLeft:'1px solid var(--border)', background:'var(--bg-2)', overflowY:'auto', display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* 헤더 */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <Icon name="settings" size={13} style={{ color:'var(--text-3)' }} />
        <span style={{ fontSize:12, fontWeight:700 }}>씬 설정</span>
        <span style={{ fontSize:10, color:'var(--text-4)', fontFamily:'var(--font-mono)', marginLeft:4 }}>{scene.scene_key}</span>
      </div>

      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:18 }}>

        {/* ① 시나리오 텍스트 */}
        <Section label="① 시나리오 텍스트">
          {shotType && (
            <div style={{ fontSize:10, color:'var(--violet)', fontFamily:'var(--font-mono)', marginBottom:4 }}>{shotType}</div>
          )}
          {actionText && (
            <div style={{ fontSize:12, lineHeight:1.7, color:'var(--text-2)', background:'var(--surface)', padding:'8px 10px', borderRadius:6, border:'1px solid var(--border)' }}>
              {actionText}
            </div>
          )}
          {dialogues.length > 0 && (
            <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:4 }}>
              {dialogues.map((d, i) => (
                <div key={i} style={{ fontSize:11, lineHeight:1.6, padding:'6px 10px', background:'var(--surface-2)', borderRadius:6, border:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-4)', fontFamily:'var(--font-mono)', marginRight:6 }}>{d.char_key || d.speaker}</span>
                  <span style={{ color:'var(--text)' }}>{d.line || d.text}</span>
                </div>
              ))}
            </div>
          )}
          {moodText && (
            <div style={{ fontSize:10, color:'var(--orange)', fontFamily:'var(--font-mono)', marginTop:4 }}>분위기: {moodText}</div>
          )}
        </Section>

        {/* ② 등장인물 선택 */}
        <Section label="② 등장인물">
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {allChars.length === 0 && (
              <div style={{ fontSize:11, color:'var(--text-4)' }}>등장인물 없음</div>
            )}
            {allChars.map(c => {
              const key = c.char_key || c.key;
              const isSelected = selectedChars.includes(key);
              const isFromScenario = (scene.char_keys || scene.characters_in_scene || []).includes(key);
              const imgUrl = resolveUrl(c.image_url || c.image_path);
              return (
                <div key={key} onClick={() => toggleChar(key)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                    border:`2px solid ${isSelected ? 'var(--mint)' : 'var(--border)'}`,
                    background: isSelected ? 'color-mix(in oklch, var(--mint) 8%, var(--surface))' : 'var(--surface)',
                    transition:'all 0.1s' }}>
                  {/* 캐릭터 이미지 */}
                  <div style={{ width:40, height:40, borderRadius:6, overflow:'hidden', background:'var(--surface-2)', flexShrink:0, display:'grid', placeItems:'center' }}>
                    {imgUrl
                      ? <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }} />
                      : <Icon name="user" size={18} style={{ color:'var(--text-4)' }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{c.name_ko || key}</div>
                    <div style={{ fontSize:10, color:'var(--text-4)' }}>{c.role_ko || ''}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                    {isSelected && <Icon name="check" size={14} style={{ color:'var(--mint)' }} />}
                    {isFromScenario && !isSelected && (
                      <span style={{ fontSize:9, color:'var(--text-4)', fontFamily:'var(--font-mono)' }}>시나리오</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ③ 배경 선택 */}
        <Section label="③ 배경">
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {/* 배경 없음 옵션 */}
            <div onClick={() => setSelectedLoc(null)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:8, cursor:'pointer',
                border:`2px solid ${selectedLoc === null ? 'var(--text-3)' : 'var(--border)'}`,
                background: selectedLoc === null ? 'var(--surface-2)' : 'var(--surface)', transition:'all 0.1s' }}>
              <div style={{ width:40, height:40, borderRadius:6, background:'var(--surface-2)', display:'grid', placeItems:'center' }}>
                <Icon name="x" size={16} style={{ color:'var(--text-4)' }} />
              </div>
              <span style={{ fontSize:11, color:'var(--text-3)' }}>배경 없음 (텍스트만)</span>
              {selectedLoc === null && <Icon name="check" size={13} style={{ color:'var(--text-3)', marginLeft:'auto' }} />}
            </div>

            {bgItems.map(bg => {
              const isSelected = selectedLoc === bg.id;
              const imgUrl = bg.imgUrl || null;
              return (
                <div key={bg.id} onClick={() => setSelectedLoc(bg.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, cursor:'pointer',
                    border:`2px solid ${isSelected ? 'var(--violet)' : 'var(--border)'}`,
                    background: isSelected ? 'color-mix(in oklch, var(--violet) 8%, var(--surface))' : 'var(--surface)',
                    transition:'all 0.1s' }}>
                  <div style={{ width:40, height:40, borderRadius:6, overflow:'hidden', background:'var(--surface-2)', flexShrink:0, display:'grid', placeItems:'center' }}>
                    {imgUrl
                      ? <img src={imgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <Icon name="camera" size={16} style={{ color:'var(--text-4)' }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bg.label}</div>
                    <div style={{ fontSize:9, color:'var(--violet)', fontFamily:'var(--font-mono)' }}>{bg.subLabel}</div>
                  </div>
                  {isSelected && <Icon name="check" size={14} style={{ color:'var(--violet)', flexShrink:0 }} />}
                </div>
              );
            })}
          </div>
        </Section>

      </div>

      {/* 생성 버튼 (하단 고정) */}
      <div style={{ marginTop:'auto', padding:'12px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <button
          className="btn primary"
          style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:13, fontWeight:700,
            background: generating || cut?.status === 'generating' ? 'var(--surface-2)' : 'var(--violet)',
            border:'none', color: generating || cut?.status === 'generating' ? 'var(--text-3)' : '#fff',
            borderRadius:8, letterSpacing:'0.04em' }}
          onClick={generate}
          disabled={generating || sceneCuts?.some(c => c.status === 'generating')}
        >
          {generating || sceneCuts?.some(c => c.status === 'generating')
            ? <><span className="spinner" style={{ width:13, height:13, borderWidth:2 }} />생성 중...</>
            : <><Icon name="sparkles" size={14} />씬 이미지 생성{sceneCuts?.length > 1 ? ` (${sceneCuts.length}컷)` : ''}</>}
        </button>
        {selectedChars.length === 0 && selectedLoc === null && (
          <div style={{ fontSize:10, color:'var(--text-4)', textAlign:'center', marginTop:6 }}>
            등장인물 또는 배경을 선택하면 더 정확한 이미지가 생성됩니다
          </div>
        )}
      </div>
    </div>
  );
};


/* ── 섹션 래퍼 ── */
const Section = ({ label, children }) => (
  <div>
    <div style={{ fontSize:10, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'var(--font-mono)', marginBottom:8 }}>
      {label}
    </div>
    {children}
  </div>
);
