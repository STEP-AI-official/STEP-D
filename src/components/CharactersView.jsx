import React from 'react';
import { Icon, Avatar } from './Icons';
import { http as api, apiBase } from '../api';
import { getCandidates, selectCandidate, regenerateCandidates, uploadCharacterReference, setCharacterReferenceByUrl, deleteCharacterReference } from '../api/characters';
import { useToast, NetworkBlockModal } from './Toast';

const resolveMediaUrl = (url, bust) => {
  if (!url) return null;
  if (bust) {
    if (url.startsWith('http')) return url + (url.includes('?') ? `&v=${bust}` : `?v=${bust}`);
    const base = url.startsWith('/api') ? apiBase.replace(/\/api$/, '') + url : url;
    return `${base}${base.includes('?') ? '&' : '?'}v=${bust}`;
  }
  if (url.startsWith('http')) return url;
  return url.startsWith('/api') ? apiBase.replace(/\/api$/, '') + url : url;
};

// URL에 캐시버스터 타임스탬프를 고정 삽입
const bustUrl = (url) => {
  if (!url) return url;
  const t = Date.now();
  if (url.startsWith('http')) return url + (url.includes('?') ? `&v=${t}` : `?v=${t}`);
  const base = url.startsWith('/api') ? apiBase.replace(/\/api$/, '') + url : url;
  return `${base}${base.includes('?') ? '&' : '?'}v=${t}`;
};

// 키프레임 1회 주입
if (typeof document !== 'undefined' && !document.getElementById('char-sheet-styles')) {
  const s = document.createElement('style');
  s.id = 'char-sheet-styles';
  s.textContent = `
    @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
    @keyframes cc-slideIn { from { transform:translateX(20px); opacity:0 } to { transform:translateX(0); opacity:1 } }
    .cc-cast-card:hover { filter: brightness(1.04); }
    .cc-chip-btn:hover { border-color: rgba(167,139,255,0.5) !important; color: #c4b1ff !important; }
    .cc-chip-btn-mint:hover { border-color: rgba(111,245,200,0.5) !important; color: #a8ffe0 !important; }
    .cc-section-btn:hover { background: rgba(255,255,255,0.03) !important; }
    .cc-add-char-btn:hover { border-color: rgba(167,139,255,0.6) !important; color: #c4b1ff !important; background: rgba(167,139,255,0.06) !important; }
  `;
  document.head.appendChild(s);
}

const CHIPS = ['mint', 'violet', 'blue', 'orange', 'rose'];

const IMAGE_MODELS = [
  { v: 'gpt-image-2', l: 'GPT Image 2' },
  { v: 'flux-pro',     l: 'Flux Pro (고품질)' },
  { v: 'flux-kontext', l: 'Flux Kontext (일관성)' },
  { v: 'dall-e-3',     l: 'DALL·E 3' },
];

const ModelSelect = ({ value, onChange, style = {} }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      fontSize: 11, fontFamily: 'var(--font-mono)',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '4px 8px', color: 'var(--text-3)',
      cursor: 'pointer', ...style,
    }}
  >
    {IMAGE_MODELS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
  </select>
);

/* ── 캐릭터 아바타 이니셜 ── */
const InitialAvatar = ({ name, color = 'mint', size = 40 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: `color-mix(in oklch, var(--${color}) 25%, var(--surface-2))`, color: `var(--${color})`, display: 'grid', placeItems: 'center', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0 }}>
    {name?.[0] || '?'}
  </div>
);

/* ── 완성도 링 ── */
const ProgressRing = ({ value = 0, size = 22, stroke = 2.4, color = 'var(--mint)' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s' }} />
    </svg>
  );
};

/* ── CAST 카드 색상 팔레트 ── */
const CC_COLORS = [
  { bg: 'rgba(167,139,255,0.15)', text: 'var(--violet-bright,#c4b1ff)', border: 'rgba(167,139,255,0.35)' },
  { bg: 'rgba(111,245,200,0.13)', text: 'var(--mint,#6ff5c8)',           border: 'rgba(111,245,200,0.30)' },
  { bg: 'rgba(255,122,184,0.13)', text: '#ffb0d4',                       border: 'rgba(255,122,184,0.30)' },
  { bg: 'rgba(255,198,111,0.13)', text: '#ffd98a',                       border: 'rgba(255,198,111,0.30)' },
  { bg: 'rgba(109,178,255,0.13)', text: '#a0cbff',                       border: 'rgba(109,178,255,0.30)' },
];


/* ── 오른쪽 패널: NEW CHARACTER 폼 ── */
const NewCharacterPanel = ({ pid, onGenerated }) => {
  const [form, setForm] = React.useState({ name_ko: '', role_ko: '', age_ko: '', appearance_ko: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [saved, setSaved] = React.useState(false);
  const [refFile, setRefFile] = React.useState(null);
  const [refPreview, setRefPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefFile(file);
    setRefPreview(URL.createObjectURL(file));
  };

  const clearRef = () => {
    setRefFile(null);
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addCharacter = async () => {
    if (!form.name_ko.trim()) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await api.post(`/api/projects/${pid}/characters`, {
        name_ko: form.name_ko.trim(), role_ko: form.role_ko.trim(),
        age_ko: form.age_ko.trim(), appearance_ko: form.appearance_ko.trim(),
      });
      if (refFile && res?.char_key) {
        try { await uploadCharacterReference(pid, res.char_key, refFile); } catch {}
      }
      setForm({ name_ko: '', role_ko: '', age_ko: '', appearance_ko: '' });
      clearRef(); setSaved(true);
      if (onGenerated) onGenerated();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'oklch(0.09 0.005 280)', width: 270, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="user" size={13} style={{ color: 'rgba(167,139,255,0.8)' }} />
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)' }}>NEW CHARACTER</span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* 이름 */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '-0.005em', marginBottom: 7 }}>
            이름 <span style={{ color: '#a78bff' }}>*</span>
          </div>
          <input value={form.name_ko} onChange={e => set('name_ko', e.target.value)} placeholder="예: 박지수"
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'rgba(167,139,255,0.55)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
            onKeyDown={e => e.key === 'Enter' && addCharacter()} />
        </div>

        {/* 역할 + 연령대 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ k: 'role_ko', label: '역할', ph: '주인공' }, { k: 'age_ko', label: '연령대', ph: '30대' }].map(({ k, label, ph }) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 7 }}>{label}</div>
              <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '9px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'rgba(167,139,255,0.55)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'} />
            </div>
          ))}
        </div>

        {/* 레퍼런스 사진 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Icon name="image" size={12} style={{ color: '#a78bff' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>레퍼런스 이미지</span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)' }}>(선택)</span>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) { setRefFile(f); setRefPreview(URL.createObjectURL(f)); } }}
            onClick={() => !refPreview && fileInputRef.current?.click()}
            style={{
              position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: refPreview ? 'default' : 'pointer',
              border: `1.5px dashed ${dragOver ? '#a78bff' : refPreview ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
              background: dragOver ? 'rgba(167,139,255,0.08)' : refPreview ? 'transparent' : 'rgba(255,255,255,0.02)',
              minHeight: refPreview ? 'auto' : 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {refPreview ? (
              <>
                <img src={refPreview} alt="미리보기" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', objectPosition: 'top', display: 'block', borderRadius: 8 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transition: 'opacity 0.15s, background 0.15s', borderRadius: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                  <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: '#fff', padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>교체</button>
                  <button onClick={e => { e.stopPropagation(); clearRef(); }}
                    style={{ background: 'rgba(255,80,80,0.25)', border: 'none', borderRadius: 6, color: '#ff9090', padding: '5px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>삭제</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 16, pointerEvents: 'none' }}>
                <Icon name="image" size={18} style={{ color: 'rgba(167,139,255,0.5)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>드래그 / 클릭</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>PNG · JPG · WEBP</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </div>

        {/* 외모 설명 */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 7 }}>외모 / 성격 설명</div>
          <textarea value={form.appearance_ko} onChange={e => set('appearance_ko', e.target.value)}
            placeholder="예: 단발머리, 베이지 트렌치, 무심한 표정"
            rows={3} style={{ width: '100%', resize: 'none', lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'rgba(167,139,255,0.55)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'} />
        </div>

        {error && <div style={{ fontSize: 11.5, color: '#ff8a8a', padding: '7px 10px', background: 'rgba(255,107,107,0.08)', borderRadius: 7, border: '1px solid rgba(255,107,107,0.2)' }}>{error}</div>}

        {/* 추가 버튼 */}
        <button
          onClick={addCharacter}
          disabled={saving || !form.name_ko.trim()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '10px', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
            background: saved
              ? 'linear-gradient(180deg, #4ee0a8, #2bc28a)'
              : 'linear-gradient(180deg, #7d5cff, #6342f5)',
            border: saved ? '1px solid rgba(111,245,200,0.55)' : '1px solid rgba(167,139,255,0.6)',
            color: saved ? '#06241b' : '#fff',
            boxShadow: saved
              ? '0 0 0 1px rgba(111,245,200,0.35) inset, 0 4px 14px rgba(46,216,160,0.25)'
              : '0 0 0 1px rgba(167,139,255,0.3) inset, 0 4px 14px rgba(109,76,255,0.3)',
            borderRadius: 10, cursor: saving || !form.name_ko.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !form.name_ko.trim() ? 0.55 : 1,
            transition: 'all 0.15s', marginTop: 'auto',
          }}
        >
          {saving ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />저장 중...</>
            : saved ? <><Icon name="check" size={14} />추가됨!</>
            : <><Icon name="user" size={14} />인물 추가</>}
        </button>

        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, textAlign: 'center' }}>
          추가 후 왼쪽 목록에서 선택해<br />외모를 설정하고 이미지를 생성하세요
        </div>
      </div>
    </div>
  );
};

/* ── 중앙: CAST SHEET ── */

// ── 빌더 슬롯 데이터 ──
const SLOT_DATA = {
  basic: {
    label: '기본 정보',
    weight: 20,
    groups: [
      { key: 'gender',   label: '성별',  chips: ['남성', '여성', '중성적'] },
      { key: 'age_group', label: '나이대', chips: ['10대', '20대', '30대', '40대', '50대', '60대 이상'] },
    ],
  },
  face: {
    label: '얼굴',
    weight: 20,
    groups: [
      { key: 'face_shape', label: '얼굴형', chips: ['갸름한', '둥근', '각진', '달걀형', '넓은'] },
      { key: 'skin_tone',  label: '피부톤', chips: ['밝은', '자연스러운', '건강한', '어두운'] },
      { key: 'makeup',     label: '메이크업', chips: ['없음', '자연스러운', '진한'] },
    ],
  },
  hair: {
    label: '헤어',
    weight: 20,
    groups: [
      { key: 'hair_length', label: '길이', chips: ['초단발', '단발', '중단발', '장발', '매우 긴'] },
      { key: 'hair_style',  label: '스타일', chips: ['직모', '웨이브', '곱슬', '올림머리', '포니테일'] },
      { key: 'hair_color',  label: '색상', colorDot: true, chips: ['검정', '짙은 갈색', '갈색', '금발', '회색', '빨강', '흰색'] },
    ],
  },
  outfit: {
    label: '의상',
    weight: 25,
    groups: [
      { key: 'outfit_type',  label: '종류', chips: ['블레이저', '정장', '캐주얼 셔츠', '후드티', '코트', '유니폼'] },
      { key: 'outfit_color', label: '색상', colorDot: true, chips: ['네이비', '검정', '흰색', '베이지', '회색', '카키'] },
    ],
  },
  expression: {
    label: '표정 / 분위기',
    weight: 20,
    groups: [
      { key: 'expression', label: '표정', chips: ['차분한', '자신감 있는', '따뜻한', '진지한', '활기찬', '우수에 찬'] },
    ],
  },
  distinctive: {
    label: '식별 특징',
    weight: 15,
    multi: true,
    groups: [
      { key: 'distinctive', label: '특징', chips: ['없음', '안경', '선글라스', '수염', '점', '흉터', '마스크', '귀걸이'] },
    ],
  },
};

const SLOT_ORDER = ['basic', 'face', 'hair', 'outfit', 'expression', 'distinctive'];

// 색상 도트 맵
const COLOR_DOT_MAP = {
  '검정': '#111', '짙은 갈색': '#3b1f0d', '갈색': '#7b4a1e', '금발': '#e6c86e',
  '회색': '#888', '빨강': '#c0392b', '흰색': '#f0f0f0',
  '네이비': '#1a2a4a', '흰색(의상)': '#f0f0f0', '베이지': '#c8a97e', '카키': '#6b6b3a',
};
const getDotColor = (chip) => COLOR_DOT_MAP[chip] || '#888';

// 한국어 프롬프트 조립
const buildPromptKo = (sel, character) => {
  const age = sel.age_group || character?.age_ko || '';
  const gender = sel.gender || '';
  const parts = [];
  if (gender) parts.push(gender);
  if (age) parts.push(age);
  const face = [sel.face_shape, sel.skin_tone && sel.skin_tone + ' 피부', sel.makeup && sel.makeup !== '없음' && sel.makeup + ' 메이크업'].filter(Boolean).join(', ');
  if (face) parts.push(face);
  const hair = [sel.hair_length, sel.hair_style, sel.hair_color && sel.hair_color + ' 헤어'].filter(Boolean).join(' ');
  if (hair) parts.push(hair);
  const outfit = [sel.outfit_color, sel.outfit_type].filter(Boolean).join(' ');
  if (outfit) parts.push(outfit);
  if (sel.expression) parts.push(sel.expression + ' 표정');
  const dist = (sel.distinctive || []).filter(d => d !== '없음');
  if (dist.length) parts.push(dist.join(', '));
  return parts.join(', ');
};

// 영어 프롬프트 조립
const EN_MAP = {
  face_shape: { '갸름한': 'oval face', '둥근': 'round face', '각진': 'square jaw', '달걀형': 'egg-shaped face', '넓은': 'broad face' },
  skin_tone:  { '밝은': 'fair skin', '자연스러운': 'natural skin tone', '건강한': 'warm skin tone', '어두운': 'dark skin' },
  makeup:     { '없음': '', '자연스러운': 'natural makeup', '진한': 'bold makeup' },
  hair_length:{ '초단발': 'buzz cut', '단발': 'short hair', '중단발': 'shoulder-length hair', '장발': 'long hair', '매우 긴': 'very long hair' },
  hair_style: { '직모': 'straight', '웨이브': 'wavy', '곱슬': 'curly', '올림머리': 'updo', '포니테일': 'ponytail' },
  hair_color: { '검정': 'black', '짙은 갈색': 'dark brown', '갈색': 'brown', '금발': 'blonde', '회색': 'gray', '빨강': 'red', '흰색': 'white' },
  outfit_type:{ '블레이저': 'blazer', '정장': 'formal suit', '캐주얼 셔츠': 'casual shirt', '후드티': 'hoodie', '코트': 'coat', '유니폼': 'uniform' },
  outfit_color:{ '네이비': 'navy', '검정': 'black', '흰색': 'white', '베이지': 'beige', '회색': 'gray', '카키': 'khaki' },
  expression: { '차분한': 'calm', '자신감 있는': 'confident', '따뜻한': 'warm', '진지한': 'serious', '활기찬': 'energetic', '우수에 찬': 'melancholic' },
  distinctive:{ '안경': 'wearing glasses', '선글라스': 'wearing sunglasses', '수염': 'beard', '점': 'beauty mark', '흉터': 'scar', '마스크': 'wearing mask', '귀걸이': 'earrings' },
};
const EN_GENDER = { '남성': 'male', '여성': 'female', '중성적': 'androgynous' };
const EN_AGE    = { '10대': 'teenage', '20대': 'twenties', '30대': 'thirties', '40대': 'forties', '50대': 'fifties', '60대 이상': 'elderly' };

const buildPromptEn = (sel, character) => {
  const age    = EN_AGE[sel.age_group] || character?.age_ko || 'adult';
  const gender = EN_GENDER[sel.gender] || '';
  const parts = [`Korean ${[age, gender].filter(Boolean).join(' ')} person`];
  if (sel.face_shape) parts.push(EN_MAP.face_shape[sel.face_shape] || sel.face_shape);
  if (sel.skin_tone) parts.push(EN_MAP.skin_tone[sel.skin_tone] || sel.skin_tone);
  if (sel.makeup && sel.makeup !== '없음') parts.push(EN_MAP.makeup[sel.makeup] || sel.makeup);
  const hairParts = [
    sel.hair_color ? (EN_MAP.hair_color[sel.hair_color] || sel.hair_color) : '',
    sel.hair_style ? (EN_MAP.hair_style[sel.hair_style] || sel.hair_style) : '',
    sel.hair_length ? (EN_MAP.hair_length[sel.hair_length] || sel.hair_length) : '',
  ].filter(Boolean);
  if (hairParts.length) parts.push(hairParts.join(' ') + ' hair');
  const outfitParts = [
    sel.outfit_color ? (EN_MAP.outfit_color[sel.outfit_color] || sel.outfit_color) : '',
    sel.outfit_type  ? (EN_MAP.outfit_type[sel.outfit_type] || sel.outfit_type) : '',
  ].filter(Boolean);
  if (outfitParts.length) parts.push(outfitParts.join(' '));
  if (sel.expression) parts.push((EN_MAP.expression[sel.expression] || sel.expression) + ' expression');
  const dist = (sel.distinctive || []).filter(d => d !== '없음').map(d => EN_MAP.distinctive[d] || d);
  if (dist.length) parts.push(dist.join(', '));
  parts.push('cinematic portrait, photorealistic, soft studio lighting');
  return parts.join(', ');
};

// 완성도 계산
const calcCompleteness = (sel) => {
  let score = 0;
  // basic: gender + age_group
  if (sel.gender && sel.age_group) score += SLOT_DATA.basic.weight;
  else if (sel.gender || sel.age_group) score += Math.round(SLOT_DATA.basic.weight * 0.5);
  // face: face_shape OR skin_tone OR makeup
  if (sel.face_shape || sel.skin_tone || sel.makeup) score += SLOT_DATA.face.weight;
  // hair: at least 2 of 3
  const hairFilled = [sel.hair_length, sel.hair_style, sel.hair_color].filter(Boolean).length;
  if (hairFilled >= 2) score += SLOT_DATA.hair.weight;
  else if (hairFilled === 1) score += Math.round(SLOT_DATA.hair.weight * 0.4);
  // outfit: outfit_type
  if (sel.outfit_type) score += SLOT_DATA.outfit.weight;
  else if (sel.outfit_color) score += Math.round(SLOT_DATA.outfit.weight * 0.4);
  // expression
  if (sel.expression) score += SLOT_DATA.expression.weight;
  // distinctive
  if ((sel.distinctive || []).length > 0) score += SLOT_DATA.distinctive.weight;
  return Math.min(100, score);
};

// 초기 selections을 appearance_en에서 복원 시도
const parseSelectionsFromAppearance = (character) => {
  const base = {};
  if (!character) return base;
  // appearance_en 딕셔너리에서 최대한 복원
  const ae = character.appearance_en
    ? (typeof character.appearance_en === 'string'
      ? (() => { try { return JSON.parse(character.appearance_en); } catch { return null; } })()
      : character.appearance_en)
    : null;
  if (ae && typeof ae === 'object') {
    // chip selections 직접 저장된 경우 그대로 복원
    if (ae._selections) return { ...ae._selections };
    // 성별 / 나이대
    if (ae.gender) {
      const gMap = { male: '남성', female: '여성', androgynous: '중성적' };
      base.gender = gMap[ae.gender] || ae.gender;
    }
    if (ae.age) {
      const aMap = { teenage: '10대', twenties: '20대', thirties: '30대', forties: '40대', fifties: '50대', elderly: '60대 이상' };
      base.age_group = aMap[ae.age] || ae.age;
    }
    // hair 복원
    if (ae.hair) {
      const h = ae.hair;
      Object.entries(EN_MAP.hair_color).forEach(([ko, en]) => { if (h.toLowerCase().includes(en)) base.hair_color = ko; });
      Object.entries(EN_MAP.hair_style).forEach(([ko, en]) => { if (h.toLowerCase().includes(en)) base.hair_style = ko; });
      Object.entries(EN_MAP.hair_length).forEach(([ko, en]) => { if (h.toLowerCase().includes(en)) base.hair_length = ko; });
    }
    if (ae.outfit) {
      const o = ae.outfit;
      Object.entries(EN_MAP.outfit_type).forEach(([ko, en]) => { if (o.toLowerCase().includes(en)) base.outfit_type = ko; });
      Object.entries(EN_MAP.outfit_color).forEach(([ko, en]) => { if (o.toLowerCase().includes(en)) base.outfit_color = ko; });
    }
    if (ae.expression) {
      Object.entries(EN_MAP.expression).forEach(([ko, en]) => { if (ae.expression.toLowerCase().includes(en)) base.expression = ko; });
    }
    // face: face_shape + skin_tone + makeup 복원
    if (ae.face) {
      const f = ae.face.toLowerCase();
      Object.entries(EN_MAP.face_shape).forEach(([ko, en]) => { if (f.includes(en)) base.face_shape = ko; });
      Object.entries(EN_MAP.skin_tone).forEach(([ko, en]) => { if (f.includes(en)) base.skin_tone = ko; });
      Object.entries(EN_MAP.makeup).forEach(([ko, en]) => { if (en && f.includes(en)) base.makeup = ko; });
    }
    // distinctive 복원 (multi)
    if (ae.distinctive) {
      const d = ae.distinctive.toLowerCase();
      const matched = [];
      Object.entries(EN_MAP.distinctive).forEach(([ko, en]) => { if (en && d.includes(en.toLowerCase())) matched.push(ko); });
      if (matched.length) base.distinctive = matched;
    }
  }
  return base;
};

// ── 칩 컴포넌트 ── (cc-primitives 디자인)
const Chip = ({ label, selected, onClick, colorDot, accent = 'violet' }) => {
  const accentStyles = {
    violet: {
      bg: 'rgba(167,139,255,0.14)', border: 'rgba(167,139,255,0.55)', text: '#c4b1ff',
      glow: '0 0 0 1px rgba(167,139,255,0.55), 0 0 10px rgba(167,139,255,0.20)',
    },
    mint: {
      bg: 'rgba(111,245,200,0.12)', border: 'rgba(111,245,200,0.50)', text: '#a8ffe0',
      glow: '0 0 0 1px rgba(111,245,200,0.50), 0 0 10px rgba(111,245,200,0.18)',
    },
  };
  const a = accentStyles[accent] || accentStyles.violet;
  return (
    <button
      onClick={onClick}
      className={selected ? '' : (accent === 'mint' ? 'cc-chip-btn-mint' : 'cc-chip-btn')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999, fontSize: 11.5, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.12s', whiteSpace: 'nowrap',
        background: selected ? a.bg : 'rgba(255,255,255,0.025)',
        border: `1px solid ${selected ? 'transparent' : 'rgba(255,255,255,0.10)'}`,
        color: selected ? a.text : 'rgba(255,255,255,0.6)',
        boxShadow: selected ? a.glow : 'none',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {colorDot && (
        <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
          background: getDotColor(label), border: '1px solid rgba(255,255,255,0.2)' }} />
      )}
      {label}
    </button>
  );
};

// ── 빌더 탭 ──
// ── 이미지 웹 검색 모달 (API 키 준비 전 비활성화) ──
// const ImageSearchModal = ({ pid, onSelect, onClose, initialQuery = '' }) => {
//   const [engine, setEngine]   = React.useState('google');
//   const [query, setQuery]     = React.useState(initialQuery);
//   const [results, setResults] = React.useState([]);
//   const [loading, setLoading] = React.useState(false);
//   const [page, setPage]       = React.useState(1);
//   const [error, setError]     = React.useState(null);
//   const inputRef = React.useRef(null);
//
//   React.useEffect(() => {
//     inputRef.current?.focus();
//     if (initialQuery) {
//       const t = setTimeout(() => search(1, initialQuery), 100);
//       return () => clearTimeout(t);
//     }
//   }, []);
//
//   const search = async (p = 1, q = query) => {
//     const term = (q || query).trim();
//     if (!term) return;
//     setLoading(true); setError(null);
//     try {
//       const res = await api.post(`/api/projects/${pid}/image-search`, { q: term, engine, page: p });
//       if (p === 1) setResults(res.results || []);
//       else setResults(prev => [...prev, ...(res.results || [])]);
//       setPage(p);
//     } catch (e) {
//       setError(e.message || '검색 실패');
//     } finally { setLoading(false); }
//   };
//
//   return (
//     <div style={{
//       position: 'fixed', inset: 0, zIndex: 9999,
//       background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
//       display: 'flex', alignItems: 'center', justifyContent: 'center',
//       padding: 20,
//     }} onClick={e => e.target === e.currentTarget && onClose()}>
//       <div style={{
//         width: '100%', maxWidth: 860, maxHeight: '88vh',
//         background: 'var(--surface)', border: '1px solid var(--border-strong)',
//         borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden',
//         boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
//       }}>
//         <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
//           <Icon name="image" size={14} style={{ color: '#a78bff' }} />
//           <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>이미지 웹 검색</span>
//           <span style={{ fontSize: 11, color: 'var(--text-4)' }}>레퍼런스로 사용할 이미지를 선택하세요</span>
//           <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
//             <Icon name="x" size={16} />
//           </button>
//         </div>
//         <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
//           <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
//             {['google', 'naver'].map(e => (
//               <button key={e} onClick={() => setEngine(e)}
//                 style={{
//                   padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
//                   background: engine === e ? 'var(--accent)' : 'transparent',
//                   color: engine === e ? '#0a0a0f' : 'var(--text-3)',
//                   transition: 'all 0.15s',
//                 }}>
//                 {e === 'google' ? 'Google' : 'Naver'}
//               </button>
//             ))}
//           </div>
//           <input ref={inputRef}
//             placeholder={`${engine === 'google' ? 'Google' : '네이버'} 이미지 검색...`}
//             value={query}
//             onChange={e => setQuery(e.target.value)}
//             onKeyDown={e => e.key === 'Enter' && search(1)}
//             style={{
//               flex: 1, fontSize: 13, padding: '6px 12px', borderRadius: 8,
//               background: 'var(--surface-2)', border: '1px solid var(--border)',
//               color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
//             }}
//           />
//           <button onClick={() => search(1)} disabled={loading || !query.trim()}
//             style={{
//               padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading || !query.trim() ? 'default' : 'pointer',
//               background: 'var(--mint)', color: '#0a0a0f', border: 'none', fontFamily: 'inherit',
//               opacity: !query.trim() ? 0.45 : 1, flexShrink: 0,
//             }}>
//             {loading && page === 1 ? '검색 중...' : '검색'}
//           </button>
//         </div>
//         <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
//           {error && (
//             <div style={{ padding: '20px', textAlign: 'center', color: 'var(--rose)', fontSize: 13 }}>{error}</div>
//           )}
//           {!error && results.length === 0 && !loading && (
//             <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
//               {query ? '검색 결과가 없습니다' : '검색어를 입력하고 엔터를 눌러주세요'}
//             </div>
//           )}
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
//             {results.map((item, i) => (
//               <div key={i} onClick={() => onSelect(item.image_url)}
//                 style={{
//                   position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
//                   cursor: 'pointer', border: '1.5px solid var(--border)',
//                   transition: 'border-color 0.15s, transform 0.15s',
//                   background: 'var(--surface-2)',
//                 }}
//                 onMouseEnter={e => { e.currentTarget.style.borderColor = '#a78bff'; e.currentTarget.style.transform = 'scale(1.03)'; }}
//                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
//               >
//                 <img src={item.thumb_url || item.image_url} alt={item.title}
//                   style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
//                   onError={e => { e.currentTarget.style.display = 'none'; }}
//                 />
//                 <div style={{
//                   position: 'absolute', inset: 0, background: 'rgba(124,111,247,0)',
//                   display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   transition: 'background 0.15s',
//                 }}
//                   onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,111,247,0.25)'; }}
//                   onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,111,247,0)'; }}
//                 >
//                   <div style={{
//                     padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
//                     background: 'rgba(0,0,0,0.7)', color: '#fff', opacity: 0,
//                     transition: 'opacity 0.15s', pointerEvents: 'none',
//                   }} className="img-select-hint">선택</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           {results.length > 0 && results.length % 10 === 0 && (
//             <div style={{ textAlign: 'center', marginTop: 16 }}>
//               <button onClick={() => search(page + 1)} disabled={loading}
//                 style={{
//                   padding: '8px 24px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
//                   background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'inherit',
//                 }}>
//                 {loading ? '불러오는 중...' : '더 보기'}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

/* ── 레퍼런스 이미지 패널 (외모 참고용) ── */
const ReferenceImagePanel = ({ pid, charKey, refUrl, onChange, autoQuery = '' }) => {
  const fileInputRef = React.useRef(null);
  const [urlInput, setUrlInput]   = React.useState('');
  const [busy, setBusy]           = React.useState(false);
  const [busyType, setBusyType]   = React.useState(null); // 'file'|'url'|'remove'
  const [error, setError]         = React.useState(null);
  const [success, setSuccess]     = React.useState(null);
  const [dragOver, setDragOver]   = React.useState(false);
  const [cacheBust, setCacheBust] = React.useState(() => Date.now());
  // const [searchOpen, setSearchOpen] = React.useState(false); // 웹검색 비활성화

  // // 레퍼런스 없을 때 자동으로 검색 모달 열기 (캐릭터 선택 시)
  // const autoQueryRef = React.useRef('');
  // React.useEffect(() => {
  //   if (!refUrl && autoQuery && autoQuery !== autoQueryRef.current) {
  //     autoQueryRef.current = autoQuery;
  //     const t = setTimeout(() => setSearchOpen(true), 300);
  //     return () => clearTimeout(t);
  //   }
  //   if (refUrl) autoQueryRef.current = autoQuery;
  // }, [charKey, autoQuery, refUrl]);

  const previewUrl = refUrl ? resolveMediaUrl(refUrl, cacheBust) : null;

  const showSuccess = (msg) => {
    setSuccess(msg); setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const doUpload = async (file) => {
    if (!file || !pid || !charKey) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) { setError('PNG, JPG, WEBP만 가능합니다'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('파일이 너무 큽니다 (최대 8MB)'); return; }
    setBusy(true); setBusyType('file'); setError(null);
    try {
      const res = await uploadCharacterReference(pid, charKey, file);
      setCacheBust(Date.now());
      if (onChange) onChange(res.reference_image_url || res.reference_image_path);
      showSuccess('업로드 완료');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) { setError(e.message); }
    finally { setBusy(false); setBusyType(null); }
  };

  const handleUrl = async () => {
    const url = urlInput.trim();
    if (!url || !pid || !charKey) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('http(s):// 로 시작하는 URL을 입력하세요'); return;
    }
    setBusy(true); setBusyType('url'); setError(null);
    try {
      const res = await setCharacterReferenceByUrl(pid, charKey, url);
      setCacheBust(Date.now());
      if (onChange) onChange(res.reference_image_url || res.reference_image_path);
      setUrlInput('');
      showSuccess('이미지 등록 완료');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); setBusyType(null); }
  };

  // const handleSearchSelect = async (imageUrl) => {  // 웹검색 비활성화
  //   setSearchOpen(false);
  //   setBusy(true); setBusyType('url'); setError(null);
  //   try {
  //     const res = await setCharacterReferenceByUrl(pid, charKey, imageUrl);
  //     setCacheBust(Date.now());
  //     if (onChange) onChange(res.reference_image_url || res.reference_image_path);
  //     showSuccess('이미지 등록 완료');
  //   } catch (e) { setError('이미지 등록 실패 — URL을 직접 입력해 보세요'); }
  //   finally { setBusy(false); setBusyType(null); }
  // };

  const handleRemove = async () => {
    if (!pid || !charKey) return;
    setBusy(true); setBusyType('remove'); setError(null);
    try {
      await deleteCharacterReference(pid, charKey);
      setCacheBust(Date.now());
      if (onChange) onChange('');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); setBusyType(null); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div style={{ background: 'rgba(167,139,255,0.05)', border: '1px solid rgba(167,139,255,0.18)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* 검색 모달 — 웹검색 비활성화 */}
      {false && null}

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name="image" size={12} style={{ color: '#a78bff' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em' }}>레퍼런스 이미지</span>
        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)' }}>외모 참고</span>
        {success && (
          <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#6ff5c8', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="check" size={10} />{success}
          </span>
        )}
        {/* 웹 검색 버튼 — 비활성화 */}
      </div>

      {previewUrl ? (
        /* ── 이미지 있음: 썸네일 + 액션 가로 배치 ── */
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {/* 썸네일 */}
          <div style={{
            width: 72, height: 72, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(167,139,255,0.25)', position: 'relative', cursor: busy ? 'default' : 'pointer',
          }}
            onClick={() => !busy && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <img src={previewUrl} alt="reference"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
            {dragOver && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,111,247,0.5)', display: 'grid', placeItems: 'center' }}>
                <Icon name="image" size={16} style={{ color: '#fff' }} />
              </div>
            )}
            {busyType === 'file' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center' }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#a78bff', borderTopColor: 'transparent' }} />
              </div>
            )}
          </div>
          {/* 액션 영역 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
              이미지를 클릭하거나 드래그해서 교체
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={busy}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '5px 0', fontSize: 11, fontWeight: 500, borderRadius: 7, cursor: busy ? 'default' : 'pointer',
                  background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.28)', color: '#a78bff',
                  fontFamily: 'inherit', transition: 'background 0.15s' }}>
                {busyType === 'file'
                  ? <><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />중</>
                  : <><Icon name="refresh" size={9} />교체</>}
              </button>
              <button onClick={handleRemove} disabled={busy}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '5px 0', fontSize: 11, fontWeight: 500, borderRadius: 7, cursor: busy ? 'default' : 'pointer',
                  background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.2)', color: '#ff8080',
                  fontFamily: 'inherit', transition: 'background 0.15s' }}>
                {busyType === 'remove'
                  ? <><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />중</>
                  : <><Icon name="x" size={9} />삭제</>}
              </button>
            </div>
            {/* URL 입력 */}
            <div style={{ display: 'flex', gap: 5 }}>
              <input
                placeholder="이미지 URL"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setError(null); }}
                onKeyDown={e => e.key === 'Enter' && handleUrl()}
                style={{ flex: 1, fontSize: 10.5, padding: '4px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${error && urlInput ? 'var(--rose)' : 'rgba(255,255,255,0.09)'}`,
                  color: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: 'inherit' }}
                disabled={busy}
              />
              <button disabled={busy || !urlInput.trim()} onClick={handleUrl}
                style={{ padding: '4px 9px', fontSize: 10.5, borderRadius: 6, cursor: busy || !urlInput.trim() ? 'default' : 'pointer',
                  background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.25)', color: '#a78bff',
                  fontFamily: 'inherit', opacity: !urlInput.trim() ? 0.45 : 1, whiteSpace: 'nowrap' }}>
                {busyType === 'url' ? '...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── 이미지 없음: 드롭존 ── */
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !busy && fileInputRef.current?.click()}
          style={{
            borderRadius: 8, cursor: busy ? 'default' : 'pointer',
            border: `1.5px dashed ${dragOver ? '#7c6ff7' : 'rgba(124,111,247,0.25)'}`,
            background: dragOver ? 'rgba(124,111,247,0.08)' : 'rgba(255,255,255,0.01)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {busyType === 'file' ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#7c6ff7', borderTopColor: 'transparent', flexShrink: 0 }} />
          ) : (
            <Icon name="image" size={18} style={{ color: 'rgba(124,111,247,0.45)', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {busyType === 'file' ? '업로드 중...' : '클릭하거나 드래그해서 업로드'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>PNG · JPG · WEBP · 최대 8MB</div>
          </div>
        </div>
      )}

      {/* 이미지 없을 때 URL 입력 */}
      {!previewUrl && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            placeholder="또는 이미지 URL 붙여넣기"
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && handleUrl()}
            style={{ flex: 1, fontSize: 11, padding: '6px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${error && urlInput ? 'var(--rose)' : 'rgba(255,255,255,0.09)'}`,
              color: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: 'inherit' }}
            disabled={busy}
          />
          <button disabled={busy || !urlInput.trim()} onClick={handleUrl}
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 7, cursor: busy || !urlInput.trim() ? 'default' : 'pointer',
              background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.25)', color: '#a78bff',
              fontFamily: 'inherit', opacity: !urlInput.trim() ? 0.45 : 1 }}>
            {busyType === 'url'
              ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} />
              : '등록'}
          </button>
        </div>
      )}

      <input
        ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={e => doUpload(e.target.files?.[0])}
      />

      {/* 에러 */}
      {error && (
        <div style={{ fontSize: 10.5, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="x" size={10} />{error}
        </div>
      )}
    </div>
  );
};


const BuilderTab = ({ selections, setSelections, character, extraPrompt, setExtraPrompt, pid, onCharacterUpdate }) => {
  const [openSlot, setOpenSlot] = React.useState('basic');

  const set = (key, val, multi) => {
    setSelections(prev => {
      if (multi) {
        const cur = prev[key] || [];
        if (val === '없음') return { ...prev, [key]: ['없음'] };
        const without = cur.filter(v => v !== '없음');
        if (without.includes(val)) {
          const next = without.filter(v => v !== val);
          return { ...prev, [key]: next.length ? next : [] };
        }
        return { ...prev, [key]: [...without, val] };
      }
      return { ...prev, [key]: prev[key] === val ? undefined : val };
    });
  };

  const completeness = calcCompleteness(selections);
  const promptKo = buildPromptKo(selections, character);
  const promptEn = buildPromptEn(selections, character);

  const hintSlots = SLOT_ORDER.filter(sKey => {
    const s = SLOT_DATA[sKey];
    const grpKeys = s.groups.map(g => g.key);
    if (s.multi) return !(selections[grpKeys[0]] || []).length;
    return grpKeys.every(k => !selections[k]);
  });
  const hint = hintSlots.length > 0
    ? `${hintSlots.map(k => SLOT_DATA[k].label).slice(0, 2).join(', ')} 추가하면 더 좋아요`
    : '완성도가 높습니다!';

  const barColor = completeness >= 80 ? '#00d4a0' : completeness >= 40 ? '#7c6ff7' : '#ff6b6b';

  const charKey = character?.char_key || character?.key;
  const refUrl = character?.reference_image_url || character?.reference_image_path || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 레퍼런스 이미지 (외모 참고) */}
      {charKey && (
        <ReferenceImagePanel
          pid={pid}
          charKey={charKey}
          refUrl={refUrl}
          // autoQuery={[character?.role_ko, character?.name_ko].filter(Boolean).join(' ')}  // 웹검색 비활성화
          onChange={(url) => onCharacterUpdate && onCharacterUpdate(charKey, {
            reference_image_url: url || null,
            reference_image_path: url ? (url.split('/media/')[1]?.split('/').slice(1).join('/') || '') : '',
          })}
        />
      )}

      {/* 슬롯 아코디언 — cc-primitives Section 스타일 */}
      {SLOT_ORDER.map(sKey => {
        const slot = SLOT_DATA[sKey];
        const isOpen = openSlot === sKey;
        const grpKeys = slot.groups.map(g => g.key);
        const selCount = slot.multi
          ? (selections[grpKeys[0]] || []).length
          : grpKeys.filter(k => selections[k]).length;
        const totalCount = grpKeys.length;
        const accentColor = ['hair', 'expression'].includes(sKey) ? 'mint' : 'violet';
        const accentBorder = accentColor === 'mint' ? 'rgba(111,245,200,0.28)' : 'rgba(167,139,255,0.28)';
        const accentBg = accentColor === 'mint' ? 'rgba(111,245,200,0.05)' : 'rgba(167,139,255,0.05)';
        const iconMap = { basic: 'user', face: 'eye', hair: 'image', outfit: 'layers', expression: 'sparkles', distinctive: 'circle' };

        return (
          <div key={sKey} style={{
            background: isOpen ? `linear-gradient(180deg, ${accentBg}, rgba(0,0,0,0) 40%), rgba(255,255,255,0.03)` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isOpen ? accentBorder : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
          }}>
            <button
              className="cc-section-btn"
              onClick={() => setOpenSlot(isOpen ? null : sKey)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isOpen ? (accentColor === 'mint' ? 'rgba(111,245,200,0.14)' : 'rgba(167,139,255,0.14)') : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isOpen ? (accentColor === 'mint' ? 'rgba(111,245,200,0.40)' : 'rgba(167,139,255,0.40)') : 'rgba(255,255,255,0.09)'}`,
                display: 'grid', placeItems: 'center',
                color: isOpen ? (accentColor === 'mint' ? '#a8ffe0' : '#c4b1ff') : 'rgba(255,255,255,0.4)',
              }}>
                <Icon name={iconMap[sKey] || 'star'} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>{slot.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  <span style={{ color: selCount > 0 ? (accentColor === 'mint' ? '#6ff5c8' : '#a78bff') : 'rgba(255,255,255,0.35)' }}>{selCount}</span>
                  {' / '}{totalCount} 선택됨
                </div>
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {isOpen && (
              <div style={{ padding: '4px 15px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {slot.groups.map(grp => (
                  <div key={grp.key} style={{ paddingTop: 10 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.005em', marginBottom: 9 }}>{grp.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {grp.chips.map(chip => {
                        const curVal = selections[grp.key];
                        const selected = slot.multi ? (curVal || []).includes(chip) : curVal === chip;
                        return <Chip key={chip} label={chip} selected={selected} colorDot={grp.colorDot} accent={accentColor} onClick={() => set(grp.key, chip, slot.multi)} />;
                      })}
                    </div>
                    <input
                      value={selections[`${grp.key}_custom`] || ''}
                      onChange={e => setSelections(prev => ({ ...prev, [`${grp.key}_custom`]: e.target.value }))}
                      placeholder="직접 입력..."
                      style={{ marginTop: 8, width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '7px 11px', fontSize: 12, color: 'rgba(255,255,255,0.7)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor = accentColor === 'mint' ? 'rgba(111,245,200,0.45)' : 'rgba(167,139,255,0.45)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 추가 프롬프트 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="edit" size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>추가 프롬프트</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>자유 입력</span>
        </div>
        <textarea
          value={extraPrompt}
          onChange={e => setExtraPrompt(e.target.value)}
          placeholder="예: 배경에 도시 야경, 손에 커피컵을 들고 있음..."
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', padding: '0 15px 14px', background: 'transparent', border: 'none', resize: 'vertical', fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, fontFamily: 'inherit', outline: 'none' }}
        />
      </div>

      {/* 합성 프롬프트 미리보기 */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 700, color: 'rgba(167,139,255,0.8)', letterSpacing: '0.10em' }}>
          SYNTHESIZED PROMPT
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            {promptKo || character?.appearance_ko || <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.25)' }}>슬롯을 선택하면 자동으로 조합됩니다</span>}
          </div>
          {(promptEn || character?.prompt_en) && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                {promptEn || character?.prompt_en}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── CANDIDATE GRID (v1~v4 선택) ──
const CandidateGrid = ({ pid, charKey, character, imageGenLoading, isStreaming, onSelected, onRegenerated, imageModel, buildPromptArgs }) => {
  const toast = useToast();
  const [candidates, setCandidates] = React.useState([]);         // { version, url, exists }
  const [selected, setSelected]     = React.useState(null);       // 선택된 version
  const [confirming, setConfirming] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [lightboxV, setLightboxV]   = React.useState(null);       // 확대 version

  const loading = imageGenLoading || isStreaming || regenerating;

  // 후보 목록 로드
  const loadCandidates = React.useCallback(async () => {
    if (!pid || !charKey) return;
    try {
      const data = await getCandidates(pid, charKey);
      setCandidates(data.candidates || []);
      // 이미 DB에 선택된 버전이 있으면 초기 선택
      if (character?.image_path) {
        const m = character.image_path.match(/_v(\d)\.png$/);
        if (m) setSelected(Number(m[1]));
      }
    } catch {}
  }, [pid, charKey]);

  React.useEffect(() => { loadCandidates(); }, [loadCandidates]);

  // 생성 시작 시 기존 후보 즉시 초기화
  React.useEffect(() => {
    if (imageGenLoading) {
      setCandidates([]);
      setSelected(null);
    }
  }, [imageGenLoading]);

  // 생성 완료 시 후보 갱신 (generating→choosing)
  React.useEffect(() => {
    if (!imageGenLoading && !isStreaming && !regenerating) loadCandidates();
  }, [imageGenLoading, isStreaming, regenerating]);

  const confirm = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await selectCandidate(pid, charKey, selected);
      if (onSelected) onSelected(selected);
      if (onRegenerated) onRegenerated();
    } catch (e) { toast.error('선택 실패: ' + e.message); }
    finally { setConfirming(false); }
  };

  const regen = async () => {
    setRegenerating(true);
    setSelected(null);
    setCandidates([]);
    try {
      const { koText, enText } = buildPromptArgs?.() || {};
      await regenerateCandidates(pid, charKey, { appearance_ko: koText, prompt_en: enText });
      // 폴링: choosing 상태가 될 때까지
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await getCandidates(pid, charKey);
            const existsAny = (data.candidates || []).some(c => c.exists);
            if (existsAny || attempts >= 90) { setCandidates(data.candidates || []); clearInterval(poll); resolve(); }
          } catch {}
        }, 2000);
      });
    } catch (e) { toast.error('재생성 실패: ' + e.message); }
    finally { setRegenerating(false); }
  };

  const confirmedVersion = (() => {
    if (!character?.image_path) return null;
    const m = character.image_path.match(/_v(\d)\.png$/);
    return m ? Number(m[1]) : null;
  })();

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
          CANDIDATES
          {loading && <span style={{ marginLeft: 6, color: '#f59e0b' }}>· 생성 중</span>}
          {!loading && candidates.filter(c => c.exists).length > 0 && (
            <span style={{ marginLeft: 6, color: 'var(--text-4)' }}>· {candidates.filter(c => c.exists).length}/4 완료</span>
          )}
        </div>
        <button
          className="btn sm"
          style={{ fontSize: 10, padding: '3px 9px', background: 'rgba(124,111,247,0.1)', border: '1px solid rgba(124,111,247,0.3)', color: '#7c6ff7' }}
          disabled={loading}
          onClick={regen}
        >
          {regenerating ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> : <Icon name="sparkles" size={10} />}
          재생성
        </button>
      </div>

      {/* 2x2 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[1, 2, 3, 4].map(v => {
          const c = candidates.find(c => c.version === v);
          const url = c?.url ? `${resolveMediaUrl(c.url)}?t=${Date.now()}` : null;
          const exists = c?.exists ?? false;
          const isSelected = selected === v;
          const isConfirmed = confirmedVersion === v;

          return (
            <div
              key={v}
              onClick={() => exists && setSelected(v)}
              style={{
                aspectRatio: '3/2', borderRadius: 10, overflow: 'hidden',
                position: 'relative', background: 'var(--surface-2)',
                border: isConfirmed
                  ? '2px solid #00d4a0'
                  : isSelected
                    ? '2px solid #7c6ff7'
                    : '1px solid rgba(255,255,255,0.08)',
                cursor: exists ? 'pointer' : 'default',
                transition: 'border-color 0.15s',
              }}
            >
              {/* 버전 라벨 */}
              <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 2, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                v{v}
              </div>

              {/* 이미지 */}
              {exists && url ? (
                <CandidateImg url={url} onZoom={() => setLightboxV(v)} />
              ) : loading ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(0,212,160,0.4)', borderTopColor: '#00d4a0' }} />
                  <div style={{ fontSize: 9, color: '#00d4a0', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>생성 중...</div>
                  <div style={{ width: '50%', height: 3, borderRadius: 3, background: 'rgba(0,212,160,0.15)', animation: `pulse 1.4s ease-in-out ${v * 0.2}s infinite` }} />
                </div>
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-4)' }}>
                  <Icon name="image" size={16} />
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>v{v}</span>
                </div>
              )}

              {/* 선택/확정 배지 */}
              {(isSelected || isConfirmed) && (
                <div style={{
                  position: 'absolute', bottom: 6, right: 6,
                  background: isConfirmed ? '#00d4a0' : '#7c6ff7',
                  borderRadius: 6, padding: '2px 7px',
                  fontSize: 9, color: isConfirmed ? '#000' : '#fff',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  {isConfirmed ? <><Icon name="check" size={8} />확정</> : '선택됨'}
                </div>
              )}

              {/* 줌 버튼 */}
              {exists && (
                <button
                  onClick={e => { e.stopPropagation(); setLightboxV(v); }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 4, color: '#fff', padding: '3px 5px', cursor: 'pointer', fontSize: 0, opacity: 0, transition: 'opacity 0.1s' }}
                  className="zoom-btn"
                >
                  <Icon name="eye" size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 확정 버튼 */}
      {selected && selected !== confirmedVersion && (
        <button
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: '#7c6ff7', color: '#fff', padding: '9px', border: 'none', borderRadius: 8 }}
          onClick={confirm}
          disabled={confirming}
        >
          {confirming
            ? <><span className="spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />저장 중...</>
            : <><Icon name="check" size={12} />v{selected} 선택 확정 · DB 저장</>}
        </button>
      )}
      {confirmedVersion && selected === confirmedVersion && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#00d4a0', fontFamily: 'var(--font-mono)', padding: '6px 0' }}>
          ✓ v{confirmedVersion} 확정됨
        </div>
      )}

      {/* 라이트박스 */}
      {lightboxV && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setLightboxV(null)}
        >
          <img
            src={bustUrl(resolveMediaUrl(candidates.find(c => c.version === lightboxV)?.url)) || ''}
            alt={`v${lightboxV}`}
            style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: 12, boxShadow: '0 8px 48px rgba(0,0,0,0.8)', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
            v{lightboxV} · 클릭으로 닫기
          </div>
        </div>
      )}
    </div>
  );
};

// 후보 이미지 셀 (hover 줌버튼 표시)
const CandidateImg = ({ url, onZoom }) => {
  const [ok, setOk] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={url}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: ok ? 'block' : 'none' }}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
      />
      {hover && ok && (
        <button
          onClick={e => { e.stopPropagation(); onZoom(); }}
          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 4, color: '#fff', padding: '4px 6px', cursor: 'pointer', fontSize: 0 }}
        >
          <Icon name="eye" size={11} />
        </button>
      )}
    </div>
  );
};

// ── 각도 썸네일 ──

// ── 정보 탭 ──
const InfoTab = ({ character, currentImageUrl, pid, charKey, onRegenerated, onCharacterUpdate, streaming, imageGenLoading, setLightbox, setActiveTab }) => {
  const toast = useToast();
  const [deleting, setDeleting] = React.useState(false);
  const [promptDraft, setPromptDraft] = React.useState(null); // null = 보기모드, string = 편집모드
  const [regenLoading, setRegenLoading] = React.useState(false);
  const [grading, setGrading] = React.useState(() => character.image_grading || null);
  const [gradingOpen, setGradingOpen] = React.useState(false);
  const [gradingSaving, setGradingSaving] = React.useState(false);

  // character가 바뀌면 저장된 색감값 복원
  React.useEffect(() => {
    setGrading(character.image_grading || null);
  }, [character.char_key]);

  const ae = character.appearance_en
    ? (typeof character.appearance_en === 'string'
      ? (() => { try { return JSON.parse(character.appearance_en); } catch { return null; } })()
      : character.appearance_en)
    : null;

  const KO_KEYS = { age: '나이', gender: '성별', ethnicity: '인종', hair: '헤어', face: '얼굴', eyes: '눈', outfit: '의상', body_type: '체형', expression: '표정', extra: '기타' };
  const aeLines = ae && typeof ae === 'object'
    ? Object.entries(ae).filter(([k, v]) => v && k !== 'style_ref' && k !== '_selections').map(([k, v]) => `${KO_KEYS[k] || k}: ${v}`)
    : [];

  const appearance_ko = character.appearance_ko || '';
  const prompt_en = character.prompt_en || '';


  const filterStr = grading
    ? `brightness(${1 + (grading.brightness ?? 0)}) contrast(${grading.contrast ?? 1}) saturate(${grading.saturation ?? 1})`
    : '';

  const saveGrading = async () => {
    setGradingSaving(true);
    try {
      await api.patch(`/api/projects/${pid}/characters/${charKey}`, { image_grading: grading || null });
      onCharacterUpdate?.({ ...character, image_grading: grading || null });
    } catch (e) { console.error(e); }
    finally { setGradingSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 큰 이미지 프리뷰 ── */}
      <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentImageUrl ? 'zoom-in' : 'default', flexShrink: 0 }}
        onClick={() => currentImageUrl && setLightbox(true)}>
        {currentImageUrl
          ? <img src={currentImageUrl} alt={character.name_ko} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: filterStr }} />
          : (streaming || imageGenLoading)
            ? <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3, borderColor: 'var(--violet)', borderTopColor: 'transparent' }} />
            : <Icon name="image" size={36} style={{ color: 'var(--text-4)' }} />}
      </div>

      {/* ── 이름 + 상태 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{character.name_ko}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{character.role_ko || '등장인물'}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '3px 8px', borderRadius: 10,
          background: currentImageUrl ? 'rgba(0,212,160,0.1)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${currentImageUrl ? 'rgba(0,212,160,0.3)' : 'rgba(255,255,255,0.1)'}`,
          color: currentImageUrl ? '#00d4a0' : 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          {currentImageUrl ? <><Icon name="check" size={9} />완성</> : '이미지 없음'}
        </div>
      </div>

      {/* ── 색감 조절 (항상 표시, 이미지 있을 때) ── */}
      {currentImageUrl && (
        <div style={{ padding: '14px', borderRadius: 10, border: '1px solid rgba(0,212,160,0.2)', background: 'rgba(0,212,160,0.03)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mint)' }}>색감 조절</span>
            <button onClick={() => setGrading(null)}
              style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)' }}>
              초기화
            </button>
          </div>
          {[
            { key: 'brightness', label: '밝기',  min: -1,  max: 1,  step: 0.01, default: 0 },
            { key: 'contrast',   label: '대비',  min: -1,  max: 2,  step: 0.01, default: 1 },
            { key: 'saturation', label: '채도',  min: 0,   max: 3,  step: 0.01, default: 1 },
          ].map(p => {
            const val = grading?.[p.key] ?? p.default;
            return (
              <div key={p.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.label}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--mint)' }}>{val.toFixed(2)}</span>
                </div>
                <input type="range" min={p.min} max={p.max} step={p.step} value={val}
                  onChange={e => setGrading(g => ({ ...(g || {}), [p.key]: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--mint)', cursor: 'pointer' }} />
              </div>
            );
          })}
          <button onClick={saveGrading} disabled={gradingSaving}
            style={{ padding: '8px 0', borderRadius: 7, border: 'none', background: 'var(--mint)',
              color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: gradingSaving ? 0.7 : 1 }}>
            {gradingSaving
              ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: '#000', borderTopColor: 'transparent' }} />저장 중...</>
              : <><Icon name="check" size={11} />색감 저장</>}
          </button>
        </div>
      )}

      {/* ── 프로필 카드 (기존 정보) ── */}
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>

        {/* 프롬프트 설정 */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>프롬프트 설정</div>

          {appearance_ko && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', fontSize: 10, color: 'var(--text-4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>한국어 설명</div>
              <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{appearance_ko}</div>
            </div>
          )}

          {prompt_en && (
            <div style={{ border: '1px solid rgba(124,111,247,0.25)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(124,111,247,0.08)', fontSize: 10, color: 'rgba(124,111,247,0.85)', borderBottom: '1px solid rgba(124,111,247,0.12)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>생성 프롬프트 (EN)</span>
                <button
                  className="btn sm ghost"
                  style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 7px', color: 'rgba(124,111,247,0.85)', border: '1px solid rgba(124,111,247,0.25)' }}
                  onClick={() => setPromptDraft(promptDraft === null ? prompt_en : null)}
                >
                  {promptDraft === null ? <><Icon name="edit" size={9} />편집</> : '취소'}
                </button>
              </div>
              {promptDraft === null ? (
                <div style={{ padding: '8px 10px', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>{prompt_en}</div>
              ) : (
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    value={promptDraft}
                    onChange={e => setPromptDraft(e.target.value)}
                    rows={5}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(124,111,247,0.05)', border: '1px solid rgba(124,111,247,0.2)',
                      borderRadius: 6, color: 'var(--text)', fontSize: 11,
                      fontFamily: 'var(--font-mono)', padding: '8px 10px',
                      resize: 'vertical', lineHeight: 1.65, outline: 'none',
                    }}
                    autoFocus
                  />
                  <button
                    className="btn sm primary"
                    style={{ alignSelf: 'flex-end', background: '#7c6ff7', color: '#fff', border: 'none', fontWeight: 700, fontSize: 11 }}
                    disabled={regenLoading || !promptDraft.trim()}
                    onClick={async () => {
                      if (!pid || !charKey || !promptDraft.trim()) return;
                      setRegenLoading(true);
                      try {
                        // 수정된 프롬프트 DB 저장 후 이미지 재생성
                        await api.patch(`/api/projects/${pid}/characters/${charKey}`, {
                          name_ko: character.name_ko || '',
                          role_ko: character.role_ko || '',
                          prompt_en: promptDraft.trim(),
                        });
                        if (onCharacterUpdate) onCharacterUpdate(charKey, { prompt_en: promptDraft.trim() });
                        await api.post(`/api/projects/${pid}/characters/${charKey}/generate-image`, {
                          prompt_en: promptDraft.trim(),
                        });
                        setPromptDraft(null);
                        if (onRegenerated) onRegenerated();
                      } catch (e) { toast.error('재생성 실패: ' + e.message); }
                      finally { setRegenLoading(false); }
                    }}
                  >
                    {regenLoading
                      ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />재생성 중...</>
                      : <><Icon name="sparkles" size={10} />이 프롬프트로 재생성</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {aeLines.length > 0 && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', fontSize: 10, color: 'var(--text-4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>appearance_en 필드</div>
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {aeLines.map((line, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {!appearance_ko && !prompt_en && aeLines.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic', padding: '6px 0' }}>외모 정보가 없습니다. 빌더 탭에서 설정하세요.</div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', gap: 8 }}>
          <button
            className="btn sm"
            style={{ fontSize: 11, background: 'rgba(124,111,247,0.12)', border: '1px solid rgba(124,111,247,0.3)', color: '#7c6ff7' }}
            onClick={() => setActiveTab('builder')}
          >
            <Icon name="edit" size={10} />재설정
          </button>
          <button
            className="btn sm"
            style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)' }}
            onClick={() => setActiveTab('builder')}
          >
            <Icon name="image" size={10} />이미지 변경
          </button>
          <button
            className="btn sm"
            style={{ fontSize: 11, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff6b6b', marginLeft: 'auto' }}
            disabled={deleting}
            onClick={async () => {
              if (!confirm(`"${character.name_ko}" 등장인물을 삭제할까요?`)) return;
              setDeleting(true);
              try {
                await api.del(`/api/projects/${pid}/characters/${charKey}`);
                if (onRegenerated) onRegenerated();
              } catch (e) { toast.error('삭제 실패: ' + e.message); }
              finally { setDeleting(false); }
            }}
          >
            {deleting ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> : <Icon name="x" size={10} />}
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

// ── CAST SHEET 메인 ──
const CastSheet = ({ character, streaming, pid, onRegenerated, onCharacterUpdate, imageGenLoading, setImageGenLoading }) => {
  const [localImages, setLocalImages] = React.useState({});
  const [lightbox, setLightbox] = React.useState(false);
  const [imageModel, setImageModel] = React.useState('gpt-image-2');
  const [nameEdit, setNameEdit] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState('');
  const [nameSaving, setNameSaving] = React.useState(false);
  const [selections, setSelections] = React.useState({});
  const [extraPrompt, setExtraPrompt] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('builder'); // 'builder' | 'info'
  const nameInputRef = React.useRef(null);

  const charKey = character?.char_key || character?.key;

  // 캐릭터 바뀌면 상태 동기화
  React.useEffect(() => {
    if (!character) return;
    setLocalImages({});
    setNameEdit(false);
    setNameDraft(character.name_ko || '');
    // selections + extraPrompt 복원
    const parsed = parseSelectionsFromAppearance(character);
    setSelections(parsed);
    setExtraPrompt(parsed._extra || '');
    // 탭 자동 전환: 이미지 있으면 정보 탭, 없으면 빌더 탭
    const hasImage = !!(character.image_url || character.image_path);
    setActiveTab(hasImage ? 'info' : 'builder');
  }, [charKey]);

  // 이름 저장 후 헤더 즉시 반영 (편집 중이 아닐 때만)
  React.useEffect(() => {
    if (!nameEdit) setNameDraft(character?.name_ko || '');
  }, [character?.name_ko]); // eslint-disable-line react-hooks/exhaustive-deps

  // 이름 편집 시작 시 input 포커스
  React.useEffect(() => {
    if (nameEdit && nameInputRef.current) nameInputRef.current.focus();
  }, [nameEdit]);

  const saveName = async () => {
    if (!pid || !charKey || !nameDraft.trim()) { setNameEdit(false); return; }
    if (nameDraft === character.name_ko) { setNameEdit(false); return; }
    setNameSaving(true);
    try {
      await api.patch(`/api/projects/${pid}/characters/${charKey}/name`, { name_ko: nameDraft.trim() });
      if (onCharacterUpdate) onCharacterUpdate(charKey, { name_ko: nameDraft.trim() });
    } catch (e) { console.error(e); }
    finally { setNameSaving(false); setNameEdit(false); }
  };

  // appearance_ko + chip selections 저장
  const saveAppearance = async (koText, enText, sels) => {
    if (!pid || !charKey) return;
    try {
      const appearance_en = sels ? JSON.stringify({ _selections: sels }) : undefined;
      const patch = {
        name_ko:       character.name_ko || '',
        role_ko:       character.role_ko || '',
        age_ko:        sels?.age_group || character.age_ko || '',
        tags:          character.tags    || [],
        appearance_ko: koText,
        ...(enText ? { prompt_en: enText } : {}),
        ...(appearance_en ? { appearance_en } : {}),
      };
      await api.patch(`/api/projects/${pid}/characters/${charKey}`, patch);
      if (onCharacterUpdate) onCharacterUpdate(charKey, { appearance_ko: koText, ...(enText ? { prompt_en: enText } : {}), ...(appearance_en ? { appearance_en } : {}) });
    } catch (e) { console.error(e); }
  };

  // 이미지 생성 (chip selections 기반)
  const generateImage = async () => {
    if (!pid || !charKey) return;
    const capturedKey = charKey; // 클로저: 생성 시작 시점 key 고정
    setImageGenLoading(true, capturedKey);
    // 기존 이미지 즉시 제거 — 생성 중 스켈레톤만 보이도록
    setLocalImages(prev => ({ ...prev, [capturedKey]: null }));
    try {
      const koText = buildPromptKo(selections, character) + (extraPrompt ? `, ${extraPrompt}` : '');
      const enText = buildPromptEn(selections, character) + (extraPrompt ? `. ${extraPrompt}` : '');
      await saveAppearance(koText, enText, { ...selections, _extra: extraPrompt });
      await api.post(`/api/projects/${pid}/characters/${capturedKey}/generate-image`, {
        model: imageModel,
        appearance_ko: koText,
        prompt_en: enText,
      });
      // 폴링: generating 확인 후 done이 될 때까지 대기
      let attempts = 0;
      let seenGenerating = false;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await api.get(`/api/projects/${pid}/characters`);
            const chars = data.characters || [];
            const updated = chars.find(c => (c.char_key || c.key) === capturedKey);
            const status = updated?.image_status;
            const hasUrl = updated?.image_url || updated?.image_path;
            if (status && onCharacterUpdate) {
              onCharacterUpdate(capturedKey, { image_status: status, image_url: updated.image_url, image_path: updated.image_path });
            }
            if (status === 'generating') seenGenerating = true;
            if (seenGenerating && status === 'done' && hasUrl) {
              const url = bustUrl(updated.image_url) || bustUrl(api.mediaUrl(pid, updated.image_path));
              setLocalImages(prev => ({ ...prev, [capturedKey]: url }));
              if (onRegenerated) onRegenerated();
              clearInterval(poll);
              resolve();
            } else if (seenGenerating && status === 'failed') {
              clearInterval(poll);
              if (onRegenerated) onRegenerated();
              resolve();
            } else if (attempts >= 60) {
              clearInterval(poll);
              if (onRegenerated) onRegenerated();
              resolve();
            }
          } catch { /* 무시 */ }
        }, 2000);
      });
    } catch (e) { console.error(e); }
    finally { setImageGenLoading(false, capturedKey); }
  };

  if (!character) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-4)' }}>
      <Icon name="user" size={40} />
      <span style={{ fontSize: 13 }}>왼쪽에서 캐릭터를 선택하세요</span>
    </div>
  );

  const isStreaming = character.status !== 'done' && streaming;

  const resolveUrl = (url) => {
    if (!url) return null;
    return bustUrl(resolveMediaUrl(url) || api.mediaUrl(pid, url));
  };
  // localImages[charKey]가 null이면 생성 중 — 기존 이미지 숨김
  const currentImageUrl = charKey in localImages
    ? resolveUrl(localImages[charKey])
    : resolveUrl(character.image_url);

  const completeness = calcCompleteness(selections);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'oklch(0.08 0.005 280)' }}>
      {/* 헤더 — cc-form FormHeader 스타일 */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'oklch(0.10 0.005 280)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px 12px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: 'rgba(167,139,255,0.18)', color: '#c4b1ff',
            display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 17,
            border: '1px solid rgba(167,139,255,0.40)',
            boxShadow: '0 0 18px rgba(167,139,255,0.18)',
          }}>{(nameDraft || character.name_ko)?.[0] || '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 3 }}>
              CAST SHEET · {character.role_ko || '등장인물'}
            </div>
            {nameEdit ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input ref={nameInputRef} value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setNameEdit(false); }}
                  onBlur={saveName}
                  style={{ fontSize: 20, fontWeight: 800, background: 'rgba(167,139,255,0.08)', border: '1px solid rgba(167,139,255,0.5)', borderRadius: 7, padding: '2px 10px', color: '#f4f4f8', outline: 'none', width: 180, letterSpacing: '-0.02em' }} />
                {nameSaving && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setNameEdit(true)}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f4f4f8', letterSpacing: '-0.02em' }}>{nameDraft || character.name_ko}</span>
                <Icon name="edit" size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setActiveTab('builder')} style={{ appearance: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', padding: '5px 9px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
              <Icon name="refresh" size={11} />초기화
            </button>
          </div>
        </div>

        {/* 탭 바 + 완성도 링 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 22px', height: 38, position: 'relative' }}>
          {[{ id: 'builder', label: '빌더', icon: 'settings' }, { id: 'info', label: '정보', icon: 'doc' }].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                appearance: 'none', background: 'transparent', border: 'none',
                padding: '0 4px', marginRight: 16, height: '100%', display: 'flex', alignItems: 'center', gap: 6,
                color: active ? '#f4f4f8' : 'rgba(255,255,255,0.35)',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: 'pointer', position: 'relative',
              }}>
                <Icon name={tab.icon} size={12} />
                {tab.label}
                {active && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#a78bff', borderRadius: 2, boxShadow: '0 0 8px rgba(167,139,255,0.6)' }} />}
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
            <ProgressRing value={completeness} size={22} stroke={2.4} color={completeness >= 80 ? '#6ff5c8' : '#a78bff'} />
            <span style={{ fontSize: 11.5, color: completeness >= 80 ? '#6ff5c8' : '#a78bff', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{completeness}%</span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)' }}>완성</span>
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeTab === 'builder' && (
          <>
            <BuilderTab selections={selections} setSelections={setSelections} character={character} extraPrompt={extraPrompt} setExtraPrompt={setExtraPrompt} pid={pid} onCharacterUpdate={onCharacterUpdate} />

            {/* 이미지 생성 푸터 — cc-preview generate footer 스타일 */}
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                <span>모델 선택</span>
                <ModelSelect value={imageModel} onChange={setImageModel} />
              </div>
              <button
                onClick={generateImage}
                disabled={imageGenLoading || completeness < 40}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em',
                  background: completeness >= 40 ? 'linear-gradient(180deg, #7d5cff, #6342f5)' : 'rgba(109,76,255,0.2)',
                  border: completeness >= 40 ? '1px solid rgba(167,139,255,0.6)' : '1px solid rgba(167,139,255,0.2)',
                  color: completeness >= 40 ? '#fff' : 'rgba(167,139,255,0.4)',
                  boxShadow: completeness >= 40 ? '0 0 0 1px rgba(167,139,255,0.3) inset, 0 4px 18px rgba(109,76,255,0.3)' : 'none',
                  borderRadius: 10, cursor: completeness >= 40 && !imageGenLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {imageGenLoading
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />생성 중...</>
                  : <><Icon name="sparkles" size={14} />이 시안으로 캐릭터 생성</>}
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setSelections({}); setExtraPrompt(''); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11.5, fontFamily: 'inherit' }}>
                  <Icon name="refresh" size={11} />초기화
                </button>
              </div>
            </div>

            {/* CANDIDATE GRID — v1~v4 선택 */}
            <CandidateGrid
              pid={pid}
              charKey={charKey}
              character={character}
              imageGenLoading={imageGenLoading}
              isStreaming={isStreaming}
              imageModel={imageModel}
              buildPromptArgs={() => ({
                koText: buildPromptKo(selections, character) + (extraPrompt ? `, ${extraPrompt}` : ''),
                enText: buildPromptEn(selections, character) + (extraPrompt ? `. ${extraPrompt}` : ''),
              })}
              onSelected={(v) => {
                if (onCharacterUpdate) onCharacterUpdate(charKey, {
                  image_path: `characters/${charKey}_v${v}.png`,
                  image_status: 'done',
                });
              }}
              onRegenerated={onRegenerated}
            />
          </>
        )}

        {activeTab === 'info' && (
          <InfoTab
            character={character}
            currentImageUrl={currentImageUrl}
            pid={pid}
            charKey={charKey}
            onRegenerated={onRegenerated}
            onCharacterUpdate={onCharacterUpdate}
            streaming={isStreaming}
            imageGenLoading={imageGenLoading}
            setLightbox={setLightbox}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {/* 라이트박스 */}
      {lightbox && currentImageUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={currentImageUrl}
            alt={character.name_ko}
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 10, boxShadow: '0 8px 48px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
            onClick={() => setLightbox(false)}
          >✕</button>
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
            {character.name_ko} · {character.role_ko}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── 메인 ── */
export const CharactersView = ({ project, short, onShortUpdate, setView }) => {
  const toast = useToast();
  const [castData, setCastData] = React.useState(null);
  const [selectedChar, setSelectedChar] = React.useState(null);
  const [streaming, setStreaming] = React.useState(false);
  const [approving, setApproving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sseActive, setSseActive] = React.useState(false);
  // charKey별 이미지 생성 로딩 상태 — 다른 인물 탭으로 이동해도 유지
  const [genLoadingMap, setGenLoadingMap] = React.useState({});

  const pid = project?.id;
  const shortStage  = short?.stage;
  const shortStatus = short?.status;
  const activeShortId = short?.id;

  // cast 로드 — 프로젝트 레벨 캐릭터 목록
  const loadCast = React.useCallback(async () => {
    if (!pid) return;
    setLoading(true);
    try {
      const data = activeShortId
        ? await api.get(`/api/projects/${pid}/shorts/${activeShortId}/cast`)
        : await api.get(`/api/projects/${pid}/characters`).then(r => ({ characters: r.characters || [], locations: [] }));
      setCastData(data);
      const chars = data.characters || [];
      const getKey = c => c.char_key || c.key;
      setSelectedChar(s => s ? (chars.find(c => getKey(c) === getKey(s)) || chars[0] || null) : (chars[0] || null));
    } catch { setCastData(null); }
    finally { setLoading(false); }
  }, [pid, activeShortId]);

  React.useEffect(() => { setCastData(null); setSelectedChar(null); loadCast(); }, [loadCast]);

  // App.jsx SSE에서 dispatch된 이미지 이벤트 수신 → 즉시 반영 (화면 이탈 없이 이미지 업데이트)
  React.useEffect(() => {
    const handler = (e) => {
      const obj = e.detail;
      if (!obj || !obj.key) return;
      if (obj.type === 'character_candidates') {
        setCastData(prev => {
          if (!prev) return prev;
          const upd = list => list.map(it => (it.char_key || it.key) === obj.key ? { ...it, image_status: 'choosing' } : it);
          return { ...prev, characters: upd(prev.characters || []) };
        });
      } else if (obj.type === 'location' && obj.url) {
        const bustedUrl = bustUrl(obj.url);
        setCastData(prev => {
          if (!prev) return prev;
          const upd = list => list.map(it => (it.loc_key || it.key) === obj.key ? { ...it, image_url: bustedUrl, image_status: 'done' } : it);
          return { ...prev, locations: upd(prev.locations || []) };
        });
      }
    };
    window.addEventListener('short:image_event', handler);
    return () => window.removeEventListener('short:image_event', handler);
  }, []);

  // SSE — shortStage 조건 OR sseActive(직접 생성 버튼) 둘 다 처리
  const shouldStream = sseActive || (shortStage === 'cast' && shortStatus === 'generating');
  React.useEffect(() => {
    if (!pid || !shouldStream) return;
    setStreaming(true);

    const finish = () => {
      setStreaming(false); setSseActive(false); loadCast();
      if (activeShortId) {
        api.get(`/api/projects/${pid}/shorts/${activeShortId}`)
          .then(u => { if (onShortUpdate) onShortUpdate(u); }).catch(() => {});
      }
    };

    const es = api.sse(`/api/projects/${pid}/cast/stream`, obj => {
      if (obj.done) {
        finish();
      } else if (obj.type === 'character_candidates' && obj.key) {
        // 후보 생성 완료 → image_status를 choosing으로 변경 (CandidateGrid가 자체 reload)
        setCastData(prev => {
          if (!prev) return prev;
          const upd = list => list.map(it => (it.char_key || it.key) === obj.key ? { ...it, image_status: 'choosing' } : it);
          return { ...prev, characters: upd(prev.characters || []) };
        });
      } else if (obj.url && obj.key) {
        const bustedUrl = bustUrl(obj.url);
        setCastData(prev => {
          if (!prev) return prev;
          const upd = list => list.map(it => (it.char_key || it.key) === obj.key ? { ...it, image_url: bustedUrl, status: 'done' } : it);
          if (obj.type === 'location') return { ...prev, locations: upd(prev.locations || []) };
          return { ...prev, characters: upd(prev.characters || []), locations: upd(prev.locations || []) };
        });
      }
    }, () => finish());

    // 120초 후 자동 종료 (백엔드 done 이벤트가 안 와도 멈춤)
    const timeout = setTimeout(() => { es.close(); finish(); }, 120_000);

    return () => { es.close(); clearTimeout(timeout); };
  }, [pid, shouldStream, loadCast]);

  const approve = async () => {
    setApproving(true);
    try {
      await api.post(`/api/projects/${pid}/shorts/${activeShortId}/cast/approve`, { video_model: 'fal-ai/kling-video/v3/standard/image-to-video' });
      const u = await api.get(`/api/projects/${pid}/shorts/${activeShortId}`);
      if (onShortUpdate) onShortUpdate(u);
      if (setView) setView('scene-image');
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const characters = castData?.characters || [];
  const canApprove  = shortStage === 'cast' && shortStatus === 'choosing';
  const confirmed   = shortStage !== 'cast' && shortStage !== 'scenario';

  // 연결 끊김 감지 — 이미지 생성 중일 때만 블로킹 모달 표시
  const [offline, setOffline] = React.useState(() => !navigator.onLine);
  React.useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  const isGeneratingAny = sseActive || shortStatus === 'generating' ||
    Object.values(genLoadingMap).some(Boolean) ||
    characters.some(c => c.image_status === 'generating' || c.image_status === 'choosing');
  const blockNetwork = offline && isGeneratingAny;

  return (
    <>
    <NetworkBlockModal visible={blockNetwork} message="잠깐만 기다려주세요" />
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr 270px', height: '100%', overflow: 'hidden' }}>

      {/* ── 왼쪽: CAST 패널 — cc-cast 스타일 ── */}
      <aside style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'oklch(0.10 0.005 280)', display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>CAST</span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', fontFamily: 'var(--font-mono)' }}>
              {String(characters.length).padStart(2, '0')}
            </span>
          </div>
          {loading && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />}
        </div>

        {/* 인물 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {characters.map((c, i) => {
            const cc = CC_COLORS[i % CC_COLORS.length];
            const cKey = c.char_key || c.key;
            const isActive = (selectedChar?.char_key || selectedChar?.key) === cKey;
            const completeness = calcCompleteness(parseSelectionsFromAppearance(c));
            const imgUrl = c.image_status === 'done' ? c.image_url : null;
            const isLocalGen = genLoadingMap[cKey] === true;
            return (
              <button
                key={cKey || i}
                type="button"
                className="cc-cast-card"
                onClick={() => setSelectedChar(c)}
                style={{
                  appearance: 'none', display: 'block', width: '100%', textAlign: 'left', fontFamily: 'inherit',
                  background: isActive ? 'linear-gradient(180deg, rgba(167,139,255,0.10), rgba(167,139,255,0.02))' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(167,139,255,0.45)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, padding: 11, marginBottom: 6, cursor: 'pointer', color: 'inherit',
                  boxShadow: isActive ? '0 0 0 3px rgba(167,139,255,0.08)' : 'none',
                  transition: 'all 0.15s', position: 'relative',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {imgUrl ? (
                    <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
                      <img src={resolveMediaUrl(imgUrl)} alt={c.name_ko} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                    </div>
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: cc.bg, color: cc.text, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, border: `1px solid ${cc.border}`, flexShrink: 0 }}>
                      {c.name_ko?.[0] || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f8', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{c.name_ko}</span>
                      {c.role_ko && <span style={{ fontSize: 10, fontWeight: 600, color: cc.text, padding: '1px 5px', borderRadius: 3, background: cc.bg, flexShrink: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role_ko}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.appearance_ko || '외모 미설정'}
                    </div>
                  </div>
                </div>
                {/* 완성도 바 + 상태 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${completeness}%`, height: '100%', background: completeness >= 80 ? 'linear-gradient(90deg, #2ed8a0, #6ff5c8)' : 'linear-gradient(90deg, #6342f5, #a78bff)', boxShadow: completeness >= 80 ? '0 0 5px rgba(111,245,200,0.4)' : '0 0 5px rgba(167,139,255,0.4)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', minWidth: 28, textAlign: 'right' }}>{completeness}%</span>
                  {(isLocalGen || c.image_status === 'generating') && (
                    <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5, flexShrink: 0 }} />
                  )}
                  {!isLocalGen && c.image_status === 'choosing' && (
                    <span style={{ fontSize: 9, color: '#a78bff', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>선택 대기</span>
                  )}
                  {!isLocalGen && c.image_status === 'done' && (
                    <Icon name="lock" size={11} style={{ color: '#6ff5c8', flexShrink: 0 }} />
                  )}
                </div>
                {/* 삭제 버튼 (hover) */}
                <button className="del-btn"
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,80,80,0.15)', border: 'none', borderRadius: 4, color: '#ff8a8a', padding: '2px 4px', cursor: 'pointer', opacity: 0, transition: 'opacity 0.1s', fontSize: 0 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`"${c.name_ko}" 등장인물을 삭제할까요?`)) return;
                    try {
                      await api.del(`/api/projects/${pid}/characters/${cKey}`);
                      if (selectedChar && (selectedChar.char_key || selectedChar.key) === cKey) setSelectedChar(null);
                      loadCast();
                    } catch (err) { toast.error('삭제 실패: ' + err.message); }
                  }}>
                  <Icon name="x" size={10} />
                </button>
              </button>
            );
          })}

          {!loading && characters.length === 0 && (
            <div style={{ padding: '24px 12px', fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.7 }}>
              오른쪽에서 인물을 추가하세요
            </div>
          )}
        </div>

        {/* CONSISTENCY LOCK 푸터 */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="lock" size={12} style={{ color: '#6ff5c8' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>CONSISTENCY LOCK</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.45 }}>
            모든 씬에서 잠긴 인물의 외모를 유지합니다
          </div>
        </div>

        {/* 확정 / 다음 버튼 */}
        {canApprove && !streaming && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={approve} disabled={approving}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', fontSize: 12.5, fontWeight: 700, background: 'linear-gradient(180deg, #4ee0a8, #2bc28a)', border: '1px solid rgba(111,245,200,0.55)', color: '#06241b', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px rgba(46,216,160,0.25)' }}>
              {approving ? <span className="spinner" style={{ width: 11, height: 11, borderWidth: 2, borderColor: '#06241b', borderTopColor: 'transparent' }} /> : <Icon name="check" size={13} />}
              확정 → 씬 이미지 생성
            </button>
          </div>
        )}
        {confirmed && setView && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setView('scene-image')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', fontSize: 12.5, fontWeight: 600, background: 'rgba(167,139,255,0.12)', border: '1px solid rgba(167,139,255,0.30)', color: '#c4b1ff', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
              다음: 씬 이미지 →
            </button>
          </div>
        )}
      </aside>

      {/* ── 중앙: CAST SHEET ── */}
      <CastSheet
        character={selectedChar}
        streaming={streaming}
        pid={pid}
        onRegenerated={loadCast}
        onCharacterUpdate={(key, patch) => {
          setCastData(prev => {
            if (!prev) return prev;
            const upd = list => list.map(c => (c.char_key || c.key) === key ? { ...c, ...patch } : c);
            return { ...prev, characters: upd(prev.characters || []) };
          });
        }}
        imageGenLoading={genLoadingMap[(selectedChar?.char_key || selectedChar?.key)] ?? false}
        setImageGenLoading={(val, fixedKey) => {
          const key = fixedKey || selectedChar?.char_key || selectedChar?.key;
          if (!key) return;
          setGenLoadingMap(prev => ({ ...prev, [key]: val }));
        }}
      />

      {/* ── 오른쪽: NEW CHARACTER ── */}
      <NewCharacterPanel
        pid={pid}
        onGenerated={loadCast}
      />
    </div>
    </>
  );
};
