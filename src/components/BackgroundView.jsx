import React from 'react';
import { Icon } from './Icons';
import { api, apiBase } from '../api';
import { useToast, NetworkBlockModal } from './Toast';

/* ── 상태 뱃지 ── */
const STATUS = {
  generating: { label: '생성중', color: '#f59e0b', spinner: true },
  done:       { label: '완료됨', color: '#00d4a0', spinner: false },
  failed:     { label: '실패',   color: 'var(--rose)', spinner: false },
  pending:    { label: '대기중', color: 'var(--text-4)', spinner: false },
};
const StatusBadge = ({ status }) => {
  const b = STATUS[status];
  if (!b) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: b.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
      {b.spinner && <span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: b.color, borderTopColor: 'transparent' }} />}
      {b.label}
    </div>
  );
};

const LBL = { fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 3 };

/* ── SCELA 필드 표시 ── */
const ScelajRow = ({ label, value }) => {
  if (!value || (Array.isArray(value) && !value.length)) return null;
  const text = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div style={{ display: 'flex', gap: 10, paddingBottom: 7, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', minWidth: 110, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>{text}</div>
    </div>
  );
};

/* ── LLM 생성 폼 ── */
const LLMGenerateForm = ({ onGenerate, loading }) => {
  const [keyword, setKeyword] = React.useState('');
  const [extra, setExtra]     = React.useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={LBL}>배경 키워드 (한국어)</div>
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="예: 새벽 한강변, 빈 사무실, 골목길 편의점..."
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', outline: 'none' }}
          onKeyDown={e => { if (e.key === 'Enter' && keyword.trim()) onGenerate(keyword.trim(), extra.trim()); }}
        />
      </div>
      <div>
        <div style={LBL}>추가 지시사항 (선택)</div>
        <textarea
          value={extra}
          onChange={e => setExtra(e.target.value)}
          placeholder="예: 비 오는 날씨, 파란빛 분위기, 일본풍..."
          rows={2}
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>
      <button
        className="btn sm primary"
        style={{ background: '#00d4a0', color: '#000', border: 'none', alignSelf: 'flex-end', fontWeight: 700, fontSize: 12 }}
        onClick={() => keyword.trim() && onGenerate(keyword.trim(), extra.trim())}
        disabled={loading || !keyword.trim()}
      >
        {loading
          ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />LLM 생성 중...</>
          : <><Icon name="sparkles" size={11} />AI로 배경 생성</>}
      </button>
    </div>
  );
};

/* ── 라이트박스 ── */
const Lightbox = ({ src, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
    <img src={src} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', cursor: 'default' }} />
    <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18, display: 'grid', placeItems: 'center' }}>✕</button>
  </div>
);

/* ── 배경 카드 (사이드바) ── */
const LocationCard = ({ loc, selected, onClick, onDelete, pid }) => {
  const bust = loc._bust || Date.now();
  const imgUrl = loc.image_url
    ? loc.image_url + (loc.image_url.includes('?') ? `&v=${bust}` : `?v=${bust}`)
    : (loc.image_path ? `${apiBase}/media/${pid}/${loc.image_path}?v=${bust}` : null);
  return (
    <div
      onClick={onClick}
      style={{ borderRadius: 8, cursor: 'pointer', border: `1px solid ${selected ? 'var(--mint)' : 'var(--border)'}`, background: selected ? 'color-mix(in oklch, var(--mint) 6%, var(--surface))' : 'var(--surface)', transition: 'all 0.1s', overflow: 'hidden', position: 'relative' }}
      onMouseEnter={e => { const b = e.currentTarget.querySelector('.del-loc'); if (b) b.style.opacity = '1'; }}
      onMouseLeave={e => { const b = e.currentTarget.querySelector('.del-loc'); if (b) b.style.opacity = '0'; }}
    >
      {/* 썸네일 */}
      <div style={{ height: 80, background: 'var(--surface-2)', overflow: 'hidden', position: 'relative' }}>
        {imgUrl
          ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-4)' }}><Icon name="camera" size={18} /></div>}
      </div>
      <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginBottom: 1 }}>{loc.loc_key}</div>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name_ko || '(배경 없음)'}</div>
        </div>
        <StatusBadge status={loc.image_status} />
      </div>
      <button className="del-loc"
        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 4, color: 'var(--rose)', padding: '3px 5px', cursor: 'pointer', opacity: 0, transition: 'opacity 0.1s', fontSize: 0, lineHeight: 1 }}
        onClick={e => { e.stopPropagation(); onDelete(); }}>
        <Icon name="trash" size={10} />
      </button>
    </div>
  );
};

/* ── 배경 상세 패널 ── */
const LocationDetail = ({ loc, pid, generating, onGenerateImage, onEditImage, onLightbox, onRegenDesc, descLoading }) => {
  const toast = useToast();
  const [extraPrompt, setExtraPrompt] = React.useState('');
  const [promptDraft, setPromptDraft] = React.useState(null); // null=보기, string=편집
  const [promptRegenLoading, setPromptRegenLoading] = React.useState(false);
  const [useRag, setUseRag] = React.useState(true);
  const [mode, setMode] = React.useState('generate'); // 'generate' | 'edit'
  const [editPrompt, setEditPrompt] = React.useState('');
  const bust = loc._bust || Date.now();
  const imgUrl = loc.image_url
    ? loc.image_url + (loc.image_url.includes('?') ? `&v=${bust}` : `?v=${bust}`)
    : (loc.image_path ? `${apiBase}/media/${pid}/${loc.image_path}?v=${bust}` : null);
  const desc   = typeof loc.description_en === 'object' ? loc.description_en : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 헤더 */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>{loc.loc_key} · LOCATION</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{loc.name_ko}</div>
      </div>

      {/* 이미지 영역 */}
      <div>
        {/* 헤더 행 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={LBL}>BACKGROUND IMAGE</div>
          <StatusBadge status={generating ? 'generating' : loc.image_status} />
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', width: 'fit-content' }}>
          {[['generate', '새로 생성'], ['edit', '이미지 편집']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              disabled={generating || (key === 'edit' && !imgUrl)}
              style={{
                padding: '5px 14px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: mode === key ? 'var(--mint)' : 'transparent',
                color: mode === key ? '#000' : (key === 'edit' && !imgUrl ? 'var(--text-4)' : 'var(--text-3)'),
                transition: 'all 0.15s',
                opacity: key === 'edit' && !imgUrl ? 0.4 : 1,
              }}
              title={key === 'edit' && !imgUrl ? '먼저 이미지를 생성하세요' : ''}
            >
              {key === 'generate' ? <><Icon name="sparkles" size={10} /> {label}</> : <><Icon name="edit" size={10} /> {label}</>}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠: 새로 생성 */}
        {mode === 'generate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {/* RAG 토글 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setUseRag(v => !v)}
                disabled={generating}
                style={{
                  fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer', border: 'none',
                  background: useRag ? 'color-mix(in oklch, #22c55e 15%, var(--surface))' : 'var(--surface-2)',
                  color: useRag ? '#22c55e' : 'var(--text-4)',
                  transition: 'all 0.15s',
                }}
              >
                {useRag ? '✦ AI Hub 참고' : '— AI Hub 미사용'}
              </button>
              <button
                className="btn sm primary"
                style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--mint)', color: '#000', border: 'none', fontWeight: 700 }}
                onClick={() => onGenerateImage('', '', useRag)}
                disabled={generating}
              >
                {generating
                  ? <><span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} />생성 중...</>
                  : <><Icon name="sparkles" size={10} />생성</>}
              </button>
            </div>
            {/* AI Hub 참고 내용 */}
            {loc.rag_hint && (
              <div style={{
                padding: '8px 12px',
                background: 'color-mix(in oklch, #22c55e 6%, var(--surface))',
                border: '1px solid color-mix(in oklch, #22c55e 25%, transparent)',
                borderRadius: 7,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>
                  ✦ AI HUB 참고 데이터
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', lineHeight: 1.55 }}>
                  {loc.rag_hint}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 탭 콘텐츠: 이미지 편집 */}
        {mode === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              기존 이미지를 유지하면서 추가 지시만 반영합니다.
            </div>
            <textarea
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="편집 지시 — 예: change to rainy night, add neon reflections, make it darker"
              disabled={generating}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text)', fontSize: 11,
                fontFamily: 'var(--font-mono)', padding: '8px 10px',
                resize: 'vertical', lineHeight: 1.5, outline: 'none',
                opacity: generating ? 0.5 : 1,
              }}
            />
            <button
              className="btn sm primary"
              style={{ alignSelf: 'flex-end', fontSize: 11, background: 'var(--violet)', color: '#fff', border: 'none', fontWeight: 700 }}
              onClick={() => onEditImage(editPrompt)}
              disabled={generating || !editPrompt.trim()}
            >
              {generating
                ? <><span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} />편집 중...</>
                : <><Icon name="edit" size={10} />편집 적용</>}
            </button>
          </div>
        )}

        {/* 이미지 */}
        {imgUrl ? (
          <img src={imgUrl} alt="" onClick={() => onLightbox(imgUrl)}
            style={{ width: '100%', aspectRatio: '3/2', borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover', background: 'var(--surface-2)', display: 'block', cursor: 'zoom-in' }} />
        ) : (
          <div style={{ width: '100%', height: 140, borderRadius: 8, border: '1px dashed var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text-4)', fontSize: 11 }}>
            이미지 없음 — 새로 생성 탭에서 생성하세요
          </div>
        )}
      </div>

      {/* SCELA 설명 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ ...LBL, marginBottom: 0 }}>SCELA 정보</div>
          <button className="btn sm ghost" style={{ marginLeft: 'auto', fontSize: 10 }} onClick={onRegenDesc} disabled={descLoading}>
            {descLoading
              ? <><span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} />AI 재생성...</>
              : <><Icon name="sparkles" size={10} />AI 재생성</>}
          </button>
        </div>
        {Object.keys(desc).length === 0
          ? <div style={{ fontSize: 11, color: 'var(--text-4)' }}>설명 없음 — AI 재생성 버튼으로 생성하세요</div>
          : <>
            <ScelajRow label="SUBJECT"       value={desc.subject} />
            <ScelajRow label="LOCATION TYPE" value={desc.location_type} />
            <ScelajRow label="CAMERA"        value={desc.camera} />
            <ScelajRow label="TIME OF DAY"   value={desc.time_of_day} />
            <ScelajRow label="WEATHER"       value={desc.weather} />
            <ScelajRow label="LIGHTING"      value={desc.lighting} />
            <ScelajRow label="ATMOSPHERE"    value={desc.atmosphere} />
            <ScelajRow label="COLOR PALETTE" value={desc.color_palette} />
            <ScelajRow label="KEY ELEMENTS"  value={desc.key_elements} />
            <ScelajRow label="STYLE REF"     value={desc.style_ref} />
          </>}
      </div>

      {/* GENERATED PROMPT — 편집 + 재생성 */}
      {loc.prompt && (
        <div style={{ background: 'color-mix(in oklch, var(--violet) 6%, var(--surface))', border: '1px solid color-mix(in oklch, var(--violet) 20%, transparent)', borderRadius: 8, overflow: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: promptDraft !== null ? '1px solid color-mix(in oklch, var(--violet) 15%, transparent)' : 'none' }}>
            <div style={{ ...LBL, marginBottom: 0, color: 'var(--violet)' }}>GENERATED PROMPT</div>
            <button
              className="btn sm ghost"
              style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 7px', color: 'var(--violet)', border: '1px solid color-mix(in oklch, var(--violet) 30%, transparent)' }}
              onClick={() => setPromptDraft(promptDraft === null ? loc.prompt : null)}
              disabled={generating || promptRegenLoading}
            >
              {promptDraft === null ? <><Icon name="edit" size={9} />편집</> : '취소'}
            </button>
          </div>

          {promptDraft === null ? (
            <div style={{ padding: '10px 14px', fontSize: 11, lineHeight: 1.65, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{loc.prompt}</div>
          ) : (
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={promptDraft}
                onChange={e => setPromptDraft(e.target.value)}
                rows={5}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'color-mix(in oklch, var(--violet) 4%, var(--surface))',
                  border: '1px solid color-mix(in oklch, var(--violet) 25%, transparent)',
                  borderRadius: 6, color: 'var(--text)', fontSize: 11,
                  fontFamily: 'var(--font-mono)', padding: '8px 10px',
                  resize: 'vertical', lineHeight: 1.65, outline: 'none',
                }}
              />
              <button
                className="btn sm primary"
                style={{ alignSelf: 'flex-end', background: 'var(--violet)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 11 }}
                disabled={promptRegenLoading || !promptDraft.trim()}
                onClick={async () => {
                  if (!promptDraft.trim()) return;
                  setPromptRegenLoading(true);
                  try {
                    // promptEn을 두 번째 인자로 전달 — handleGenerateImage에서 API 호출 + 폴링
                    await onGenerateImage('', promptDraft.trim(), useRag);
                    setPromptDraft(null);
                  } catch (e) { toast.error('재생성 실패: ' + e.message); }
                  finally { setPromptRegenLoading(false); }
                }}
              >
                {promptRegenLoading
                  ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />재생성 중...</>
                  : <><Icon name="sparkles" size={10} />이 프롬프트로 재생성</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── 메인 ── */
export const BackgroundView = ({ project, short, onShortUpdate, setView }) => {
  const toast = useToast();
  const [locations,    setLocations]    = React.useState([]);
  const [loading, setLoading]           = React.useState(true);
  const [selected, setSelected]         = React.useState(null);
  const [lightboxSrc, setLightboxSrc]   = React.useState(null);
  const [generatingKey, setGeneratingKey] = React.useState(null);
  const [descLoading, setDescLoading]   = React.useState(null); // loc_key
  const [llmLoading, setLlmLoading]     = React.useState(false);
  const [showAddForm, setShowAddForm]   = React.useState(false);
  const [bustMap, setBustMap]           = React.useState({}); // loc_key → timestamp

  const bustUrl = (url, locKey) => {
    if (!url) return url;
    const t = bustMap[locKey] || '';
    if (!t) return url;
    return url + (url.includes('?') ? `&v=${t}` : `?v=${t}`);
  };

  // 연결 끊김 감지 — 이미지 생성 중일 때만 블로킹 모달 표시
  const [offline, setOffline] = React.useState(() => !navigator.onLine);
  React.useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const isGeneratingAny = !!generatingKey ||
    locations.some(l => l.image_status === 'generating');
  const blockNetwork = offline && isGeneratingAny;

  const pid = project?.id;

  const load = React.useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/projects/${pid}/locations`);
      const list = data.locations || [];
      setLocations(list);
      setSelected(s => s ? (list.find(l => l.loc_key === s.loc_key) || list[0] || null) : (list[0] || null));
    } catch { /* 무시 */ }
    finally { setLoading(false); }
  }, [pid]);

  React.useEffect(() => { load(); }, [load]);

  /* ── 이미지 생성 ── */
  const handleGenerateImage = async (loc, extraPrompt = '', promptEn = '', useRag = true) => {  // promptEn: 직접 편집한 프롬프트 전체 문자열
    const key = loc.loc_key;
    setGeneratingKey(key);
    try {
      await api.post(`/api/projects/${pid}/locations/${key}/generate-image`, {
        model: 'gpt-image-1',
        use_rag: useRag,
        ...(promptEn.trim() ? { prompt_en: promptEn.trim() } : { extra_prompt: extraPrompt.trim() }),
      });
      // 폴링 — generating 확인 후 done이 될 때까지 대기
      let attempts = 0;
      let seenGenerating = false;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await api.get(`/api/projects/${pid}/locations`);
            const list = data.locations || [];
            const updated = list.find(l => l.loc_key === key);
            setLocations(list);
            setSelected(s => s?.loc_key === key ? (list.find(l => l.loc_key === key) || s) : s);
            const status = updated?.image_status;
            if (status === 'generating') seenGenerating = true;
            // generating을 한 번이라도 본 뒤에 done/failed이면 완료
            if (seenGenerating && (status === 'done' || status === 'failed')) {
              if (status === 'done') setBustMap(prev => ({ ...prev, [key]: Date.now() }));
              clearInterval(poll); resolve();
            }
            // 타임아웃 (2분)
            if (attempts >= 60) { clearInterval(poll); resolve(); }
          } catch { /* 무시 */ }
        }, 2000);
      });
    } catch (e) { toast.error('이미지 생성 실패: ' + e.message); }
    finally { setGeneratingKey(null); }
  };

  /* ── 이미지 편집 (기존 이미지 ref로 사용) ── */
  const handleEditImage = async (loc, editPrompt) => {
    const key = loc.loc_key;
    setGeneratingKey(key);
    try {
      await api.post(`/api/projects/${pid}/locations/${key}/edit-image`, {
        extra_prompt: editPrompt.trim(),
      });
      let attempts = 0, seenGenerating = false;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await api.get(`/api/projects/${pid}/locations`);
            const list = data.locations || [];
            const updated = list.find(l => l.loc_key === key);
            setLocations(list);
            setSelected(s => s?.loc_key === key ? (list.find(l => l.loc_key === key) || s) : s);
            const status = updated?.image_status;
            if (status === 'generating') seenGenerating = true;
            if (seenGenerating && (status === 'done' || status === 'failed')) {
              if (status === 'done') setBustMap(prev => ({ ...prev, [key]: Date.now() }));
              clearInterval(poll); resolve();
            }
            if (attempts >= 60) { clearInterval(poll); resolve(); }
          } catch { /* 무시 */ }
        }, 2000);
      });
    } catch (e) { toast.error('이미지 편집 실패: ' + e.message); }
    finally { setGeneratingKey(null); }
  };

  /* ── AI 설명 재생성 (기존 배경) ── */
  const handleRegenDesc = async (loc) => {
    const key = loc.loc_key;
    setDescLoading(key);
    try {
      const res = await api.post(`/api/projects/${pid}/locations/${key}/generate-description`, {
        keyword: loc.name_ko || key,
        extra: '',
      });
      const updated = res.location;
      setLocations(prev => prev.map(l => l.loc_key === key ? { ...l, ...updated } : l));
      setSelected(s => s?.loc_key === key ? { ...s, ...updated } : s);
      toast.success('AI 설명이 업데이트됐습니다');
    } catch (e) { toast.error('AI 생성 실패: ' + e.message); }
    finally { setDescLoading(null); }
  };

  /* ── 새 배경 LLM 생성 ── */
  const handleNewLocation = async (keyword, extra) => {
    setLlmLoading(true);
    try {
      const res = await api.post(`/api/projects/${pid}/locations/generate-description`, { keyword, extra });
      const newLoc = res.location;
      setLocations(prev => [...prev, newLoc]);
      setSelected(newLoc);
      setShowAddForm(false);
      toast.success(`"${newLoc.name_ko}" 배경이 추가됐습니다`);
    } catch (e) { toast.error('배경 생성 실패: ' + e.message); }
    finally { setLlmLoading(false); }
  };

  /* ── 삭제 ── */
  const handleDelete = async (loc) => {
    if (!confirm(`"${loc.name_ko}" 배경을 삭제할까요?`)) return;
    try {
      await api.del(`/api/projects/${pid}/locations/${loc.loc_key}`);
      setLocations(prev => {
        const next = prev.filter(l => l.loc_key !== loc.loc_key);
        setSelected(s => s?.loc_key === loc.loc_key ? next[0] || null : s);
        return next;
      });
      toast.success('배경이 삭제됐습니다');
    } catch (e) { toast.error('삭제 실패: ' + e.message); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }} />
      <span style={{ color: 'var(--text-3)', fontSize: 13 }}>배경 불러오는 중...</span>
    </div>
  );

  return (
    <>
    <NetworkBlockModal visible={blockNetwork} message="잠깐만 기다려주세요" />
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100%', overflow: 'hidden' }}>

      {/* ── 왼쪽: 배경 목록 ── */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'oklch(0.10 0.005 280)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>LOCATIONS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{String(locations.length).padStart(2, '0')}</span>
            <button
              style={{ marginLeft: 'auto', width: 28, height: 28, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-3)' }}
              onClick={() => { setShowAddForm(true); setSelected(null); }}
              title="새 배경 추가"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {locations.length === 0 && !showAddForm && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-4)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              배경 없음<br />
              <button className="btn sm ghost" style={{ marginTop: 10, fontSize: 10 }} onClick={() => setShowAddForm(true)}>
                <Icon name="plus" size={10} />새 배경 추가
              </button>
            </div>
          )}
          {locations.map(loc => {
            const locWithBust = bustMap[loc.loc_key] ? { ...loc, _bust: bustMap[loc.loc_key] } : loc;
            return (
              <LocationCard key={loc.loc_key} loc={locWithBust} selected={!showAddForm && selected?.loc_key === loc.loc_key}
                onClick={() => { setSelected(locWithBust); setShowAddForm(false); }}
                onDelete={() => handleDelete(loc)}
                pid={pid}
              />
            );
          })}
        </div>
      </div>

      {/* ── 오른쪽: 상세/추가 폼 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 툴바 */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>
            BACKGROUND · 배경 이미지
          </div>
          {setView && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm ghost" style={{ fontSize: 11 }} onClick={() => setView('characters')}>← 등장인물</button>
              <button className="btn sm primary" style={{ fontSize: 11, background: 'var(--mint)', color: '#000', border: 'none' }} onClick={() => setView('render')}>다음: 영상 생성 →</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {showAddForm ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4a0' }}>+ 새 배경 AI 생성</div>
                  <button className="btn sm ghost" style={{ marginLeft: 'auto', fontSize: 10 }} onClick={() => setShowAddForm(false)}>취소</button>
                </div>
                <LLMGenerateForm onGenerate={handleNewLocation} loading={llmLoading} />
              </div>
            ) : selected ? (
              <LocationDetail
                loc={bustMap[selected.loc_key] ? { ...selected, _bust: bustMap[selected.loc_key] } : selected}
                pid={pid}
                generating={generatingKey === selected.loc_key}
                onGenerateImage={(extraPrompt, promptEn, useRag) => handleGenerateImage(selected, extraPrompt, promptEn, useRag)}
                onEditImage={(editPrompt) => handleEditImage(selected, editPrompt)}
                onLightbox={setLightboxSrc}
                onRegenDesc={() => handleRegenDesc(selected)}
                descLoading={descLoading === selected.loc_key}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 14, color: 'var(--text-4)' }}>
                <Icon name="camera" size={32} />
                <div style={{ fontSize: 13 }}>배경을 선택하거나 새로 추가하세요</div>
                <button className="btn sm ghost" style={{ fontSize: 11 }} onClick={() => setShowAddForm(true)}>
                  <Icon name="plus" size={11} />새 배경 AI 생성
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
};
