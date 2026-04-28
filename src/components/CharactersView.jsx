import React from 'react';
import { Icon, Avatar } from './Icons';
import { api } from '../api';
import { getCandidates, selectCandidate, regenerateCandidates } from '../api/characters';

// pulse 키프레임 1회 주입
if (typeof document !== 'undefined' && !document.getElementById('char-sheet-styles')) {
  const s = document.createElement('style');
  s.id = 'char-sheet-styles';
  s.textContent = `@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`;
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


/* ── 오른쪽 패널: NEW CHARACTER 폼 ── */
const NewCharacterPanel = ({ pid, onGenerated }) => {
  const [form, setForm] = React.useState({ name_ko: '', role_ko: '', age_ko: '', appearance_ko: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [saved, setSaved] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addCharacter = async () => {
    if (!form.name_ko.trim()) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.post(`/api/projects/${pid}/characters`, {
        name_ko: form.name_ko.trim(),
        role_ko: form.role_ko.trim(),
        age_ko:  form.age_ko.trim(),
        appearance_ko: form.appearance_ko.trim(),
      });
      setForm({ name_ko: '', role_ko: '', age_ko: '', appearance_ko: '' });
      setSaved(true);
      if (onGenerated) onGenerated();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-2)', width: 260, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="user" size={14} style={{ color: 'var(--mint)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>NEW CHARACTER</span>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* 이름 */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>이름 *</div>
          <input value={form.name_ko} onChange={e => set('name_ko', e.target.value)} placeholder="예: 민주" style={{ width: '100%' }}
            onKeyDown={e => e.key === 'Enter' && addCharacter()} />
        </div>

        {/* 역할 + 연령대 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>역할</div>
            <input value={form.role_ko} onChange={e => set('role_ko', e.target.value)} placeholder="주인공" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>연령대</div>
            <input value={form.age_ko} onChange={e => set('age_ko', e.target.value)} placeholder="40대" />
          </div>
        </div>

        {/* 외모 설명 */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>외모 / 성격 설명</div>
          <textarea value={form.appearance_ko} onChange={e => set('appearance_ko', e.target.value)}
            placeholder="예: 단발머리, 베이지 트렌치, 무심한 표정. 책을 좋아하고 말수가 적음."
            rows={5} style={{ width: '100%', resize: 'none', lineHeight: 1.6 }} />
        </div>

        {error && <div style={{ fontSize: 12, color: 'var(--rose)', padding: '7px 10px', background: 'color-mix(in oklch, var(--rose) 8%, transparent)', borderRadius: 6 }}>{error}</div>}

        <button
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 13, fontWeight: 700, marginTop: 'auto', letterSpacing: '0.04em', background: saved ? 'var(--mint)' : 'var(--mint)', color: '#000' }}
          disabled={saving || !form.name_ko.trim()}
          onClick={addCharacter}
        >
          {saving
            ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />저장 중...</>
            : saved
              ? <><Icon name="check" size={14} />추가됨!</>
              : <><Icon name="user" size={14} />인물 추가</>}
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
          추가 후 왼쪽 목록에서 선택해 이미지를 생성하세요
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
  }
  return base;
};

// ── 칩 컴포넌트 ──
const Chip = ({ label, selected, onClick, colorDot }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 0.12s',
      background: selected ? 'rgba(0,212,160,0.12)' : 'rgba(255,255,255,0.04)',
      border: selected ? '1px solid #00d4a0' : '1px solid rgba(255,255,255,0.12)',
      color: selected ? '#00d4a0' : 'var(--text-3)',
      fontWeight: selected ? 600 : 400,
    }}
  >
    {colorDot && (
      <span style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
        background: getDotColor(label), border: '1px solid rgba(255,255,255,0.2)',
      }} />
    )}
    {label}
  </button>
);

// ── 빌더 탭 ──
const BuilderTab = ({ selections, setSelections, character, extraPrompt, setExtraPrompt }) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 완성도 바 */}
      <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>{completeness}% 완성</span>
          <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{hint}</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completeness}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s, background 0.3s' }} />
        </div>
      </div>

      {/* 슬롯 아코디언 */}
      {SLOT_ORDER.map(sKey => {
        const slot = SLOT_DATA[sKey];
        const isOpen = openSlot === sKey;
        // 슬롯 완성 여부
        const grpKeys = slot.groups.map(g => g.key);
        const isDone = slot.multi
          ? (selections[grpKeys[0]] || []).length > 0
          : grpKeys.some(k => selections[k]);

        return (
          <div key={sKey} style={{ border: `1px solid ${isOpen ? 'rgba(0,212,160,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <button
              onClick={() => setOpenSlot(isOpen ? null : sKey)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isOpen ? 'rgba(0,212,160,0.06)' : 'rgba(255,255,255,0.03)', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{slot.label}</span>
                {isDone && <span style={{ fontSize: 9, background: '#00d4a0', color: '#000', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-4)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}>▼</span>
            </button>

            {isOpen && (
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                {slot.groups.map(grp => (
                  <div key={grp.key}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{grp.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {grp.chips.map(chip => {
                        const curVal = selections[grp.key];
                        const selected = slot.multi
                          ? (curVal || []).includes(chip)
                          : curVal === chip;
                        return (
                          <Chip
                            key={chip}
                            label={chip}
                            selected={selected}
                            colorDot={grp.colorDot}
                            onClick={() => set(grp.key, chip, slot.multi)}
                          />
                        );
                      })}
                    </div>
                    {/* 기타 직접 입력 */}
                    <input
                      value={selections[`${grp.key}_custom`] || ''}
                      onChange={e => setSelections(prev => ({ ...prev, [`${grp.key}_custom`]: e.target.value }))}
                      placeholder="기타 직접 입력..."
                      style={{
                        marginTop: 6, width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '5px 10px', fontSize: 11,
                        color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 추가 프롬프트 자유 입력 */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(255,165,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(255,165,0,0.06)', borderBottom: '1px solid rgba(255,165,0,0.1)', fontSize: 10, fontWeight: 700, color: 'rgba(255,165,0,0.85)', letterSpacing: '0.06em' }}>
          추가 프롬프트 (자유 입력)
        </div>
        <textarea
          value={extraPrompt}
          onChange={e => setExtraPrompt(e.target.value)}
          placeholder="예: 배경에 도시 야경, 손에 커피컵을 들고 있음, 측면에서 바라보는 구도..."
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 12px',
            background: 'transparent', border: 'none', resize: 'vertical',
            fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* 프롬프트 미리보기 */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(124,111,247,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', background: 'rgba(124,111,247,0.08)', borderBottom: '1px solid rgba(124,111,247,0.1)', fontSize: 10, fontWeight: 700, color: 'rgba(124,111,247,0.9)', letterSpacing: '0.06em' }}>
          PROMPT PREVIEW
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>
              한국어 설명
              {!promptKo && character?.appearance_ko && (
                <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--text-4)', opacity: 0.6 }}>(기존 저장값)</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {promptKo || character?.appearance_ko || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>슬롯을 선택하면 자동으로 조합됩니다</span>}
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>생성 프롬프트 (EN)</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
              {promptEn || character?.prompt_en || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CANDIDATE GRID (v1~v4 선택) ──
const CandidateGrid = ({ pid, charKey, character, imageGenLoading, isStreaming, onSelected, onRegenerated, imageModel, buildPromptArgs }) => {
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
    } catch (e) { alert('선택 실패: ' + e.message); }
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
    } catch (e) { alert('재생성 실패: ' + e.message); }
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
          const url = c?.url ? `${c.url}?t=${Date.now()}` : null;
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
            src={candidates.find(c => c.version === lightboxV)?.url || ''}
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
const AngleThumb = ({ label, url }) => {
  const [ok, setOk] = React.useState(true);
  const [light, setLight] = React.useState(false);
  if (!ok) return null;
  return (
    <>
      <div
        style={{ position: 'relative', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'zoom-in' }}
        onClick={() => setLight(true)}
      >
        <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setOk(false)} />
        <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{label}</div>
      </div>
      {light && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLight(false)}>
          <img src={url} alt={label} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
        </div>
      )}
    </>
  );
};

// ── 정보 탭 ──
const InfoTab = ({ character, currentImageUrl, pid, charKey, onRegenerated, onCharacterUpdate, streaming, imageGenLoading, setLightbox, setActiveTab }) => {
  const [deleting, setDeleting] = React.useState(false);

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

  // 4방향 뷰 이미지 URL 조립
  const ANGLE_KEYS = ['front', 'side_left', 'side_right', 'three_quarter'];
  const ANGLE_LABELS = { front: '정면', side_left: '좌측', side_right: '우측', three_quarter: '3/4' };
  const basePath = character.image_path ? character.image_path.replace(/\.png$/, '') : null;
  const angleUrls = basePath ? ANGLE_KEYS.map(k => ({
    label: ANGLE_LABELS[k],
    url: k === 'front'
      ? api.mediaUrl(pid, `${basePath}.png`)
      : api.mediaUrl(pid, `${basePath}_${k}.png`),
  })) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 프로필 카드 */}
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
        {/* 헤더 */}
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          CHARACTER PROFILE
        </div>
        {/* 상단: 썸네일 + 기본 정보 */}
        <div style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            style={{ width: 72, aspectRatio: '16/9', flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentImageUrl ? 'zoom-in' : 'default' }}
            onClick={() => currentImageUrl && setLightbox(true)}
          >
            {currentImageUrl
              ? <img src={currentImageUrl} alt={character.name_ko} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (streaming || imageGenLoading)
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2.5, borderColor: 'var(--violet)', borderTopColor: 'transparent' }} />
                : <Icon name="image" size={20} style={{ color: 'var(--text-4)' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{character.name_ko}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>{character.role_ko || '등장인물'}</div>
            {(character.age_ko || ae?._selections?.gender) && (
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 6, display: 'flex', gap: 8 }}>
                {ae?._selections?.gender && <span>성별: {ae._selections.gender}</span>}
                {(ae?._selections?.age_group || character.age_ko) && <span>나이: {ae?._selections?.age_group || character.age_ko}</span>}
              </div>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '3px 8px', borderRadius: 10, background: currentImageUrl ? 'rgba(0,212,160,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${currentImageUrl ? 'rgba(0,212,160,0.3)' : 'rgba(255,255,255,0.1)'}`, color: currentImageUrl ? '#00d4a0' : 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              {currentImageUrl ? <><Icon name="check" size={9} />완성</> : '이미지 없음'}
            </div>
          </div>
        </div>

        {/* PROMPT SETTINGS */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 4방향 레퍼런스 시트 */}
          {angleUrls.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>REFERENCE SHEET</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {angleUrls.map(({ label, url }) => (
                  <AngleThumb key={label} label={label} url={url} />
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>PROMPT SETTINGS</div>

          {appearance_ko && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', fontSize: 10, color: 'var(--text-4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>한국어 설명</div>
              <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{appearance_ko}</div>
            </div>
          )}

          {prompt_en && (
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', fontSize: 10, color: 'var(--text-4)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>생성 프롬프트 (EN)</div>
              <div style={{ padding: '8px 10px', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>{prompt_en}</div>
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
              } catch (e) { alert('삭제 실패: ' + e.message); }
              finally { setDeleting(false); }
            }}
          >
            {deleting ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} /> : <Icon name="trash" size={10} />}
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
      // 폴링: image_status가 'done'으로 바뀌면 새 이미지로 반영
      let attempts = 0;
      await new Promise(resolve => {
        const poll = setInterval(async () => {
          attempts++;
          try {
            const data = await api.get(`/api/projects/${pid}/characters`);
            const chars = data.characters || [];
            const updated = chars.find(c => (c.char_key || c.key) === capturedKey);
            const isDone = updated?.image_status === 'done';
            const hasUrl = updated?.image_url || updated?.image_path;
            if (updated?.image_status && onCharacterUpdate) {
              onCharacterUpdate(capturedKey, { image_status: updated.image_status, image_url: updated.image_url, image_path: updated.image_path });
            }
            if (isDone && hasUrl && attempts >= 2) {
              const url = updated.image_url || api.mediaUrl(pid, updated.image_path);
              setLocalImages(prev => ({ ...prev, [capturedKey]: url }));
              if (onRegenerated) onRegenerated();
              clearInterval(poll);
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
    if (url.startsWith('http') || url.startsWith('/api')) return url;
    return api.mediaUrl(pid, url);
  };
  // localImages[charKey]가 null이면 생성 중 — 기존 이미지 숨김
  const currentImageUrl = charKey in localImages
    ? resolveUrl(localImages[charKey])
    : resolveUrl(character.image_url);

  const completeness = calcCompleteness(selections);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)', flexShrink: 0 }}>
        <InitialAvatar name={nameDraft || character.name_ko} color={CHIPS[0]} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
            CAST SHEET · {character.role_ko || '등장인물'}
          </div>
          {nameEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setNameEdit(false); }}
                onBlur={saveName}
                style={{ fontSize: 15, fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--violet)', borderRadius: 6, padding: '2px 8px', color: 'var(--text)', outline: 'none', width: 160 }}
              />
              {nameSaving && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setNameEdit(true)}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{nameDraft || character.name_ko}</span>
              <Icon name="edit" size={12} style={{ color: 'var(--text-4)', opacity: 0.6 }} />
            </div>
          )}
        </div>
      </div>

      {/* 탭 바 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', flexShrink: 0 }}>
        {[{ id: 'builder', label: '빌더' }, { id: 'info', label: '정보' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '10px 20px', fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400, border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === tab.id ? '#00d4a0' : 'var(--text-4)', borderBottom: activeTab === tab.id ? '2px solid #00d4a0' : '2px solid transparent', transition: 'color 0.15s', marginBottom: -1 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activeTab === 'builder' && (
          <>
            <BuilderTab selections={selections} setSelections={setSelections} character={character} extraPrompt={extraPrompt} setExtraPrompt={setExtraPrompt} />

            {/* 생성 버튼 영역 */}
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ModelSelect value={imageModel} onChange={setImageModel} style={{ flex: 1 }} />
              <button
                className="btn primary"
                style={{ fontSize: 12, fontWeight: 700, background: completeness >= 40 ? '#00d4a0' : 'rgba(0,212,160,0.3)', color: completeness >= 40 ? '#000' : 'rgba(0,212,160,0.5)', border: 'none', padding: '8px 16px', cursor: completeness >= 40 ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                onClick={generateImage}
                disabled={imageGenLoading || completeness < 40}
              >
                {imageGenLoading
                  ? <><span className="spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />생성 중...</>
                  : <><Icon name="image" size={12} />이미지 생성</>}
              </button>
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
        setCastData(prev => {
          if (!prev) return prev;
          const upd = list => list.map(it => (it.char_key || it.key) === obj.key ? { ...it, image_url: obj.url, status: 'done' } : it);
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
      await api.post(`/api/projects/${pid}/shorts/${activeShortId}/cast/approve`, { video_model: 'fal-ai/kling-video/v2.1/standard/image-to-video' });
      const u = await api.get(`/api/projects/${pid}/shorts/${activeShortId}`);
      if (onShortUpdate) onShortUpdate(u);
      if (setView) setView('scene-image');
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const characters = castData?.characters || [];
  const canApprove  = shortStage === 'cast' && shortStatus === 'choosing';
  const confirmed   = shortStage !== 'cast' && shortStage !== 'scenario';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', height: '100%', overflow: 'hidden' }}>

      {/* ── 왼쪽: CAST 목록 ── */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'oklch(0.12 0.005 280)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>CAST</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{String(characters.length).padStart(2, '0')}</span>
        </div>

        <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading && <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}><span className="spinner" /></div>}
          {characters.map((c, i) => {
            const chip = CHIPS[i % CHIPS.length];
            const cKey = c.char_key || c.key;
            const isActive = (selectedChar?.char_key || selectedChar?.key) === cKey;
            return (
              <div key={cKey || i} onClick={() => setSelectedChar(c)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 8, cursor: 'pointer', background: isActive ? 'color-mix(in oklch, var(--text) 6%, transparent)' : 'transparent', transition: 'background 0.1s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.querySelector('.del-btn')?.style && (e.currentTarget.querySelector('.del-btn').style.opacity = '1')}
                onMouseLeave={e => e.currentTarget.querySelector('.del-btn')?.style && (e.currentTarget.querySelector('.del-btn').style.opacity = '0')}>
                <InitialAvatar name={c.name_ko} color={chip} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', marginBottom: 1 }}>
                    C{String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name_ko}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.role_ko || '등장인물'}</div>
                </div>
                {(() => {
                  const st = c.image_status;
                  const isLocalGen = genLoadingMap[cKey] === true;
                  if (isLocalGen || st === 'generating') return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>생성중</span>
                    </div>
                  );
                  if (st === 'choosing') return (
                    <span style={{ fontSize: 9, color: '#7c6ff7', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>선택 대기</span>
                  );
                  if (st === 'done') return (
                    <span style={{ fontSize: 9, color: '#00d4a0', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>완료됨</span>
                  );
                  if (st === 'failed') return (
                    <span style={{ fontSize: 9, color: 'var(--rose)', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>실패</span>
                  );
                  return <span style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>없음</span>;
                })()}
                <button className="del-btn"
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'color-mix(in oklch, var(--rose) 15%, var(--surface))', border: 'none', borderRadius: 4, color: 'var(--rose)', padding: '3px 5px', cursor: 'pointer', opacity: 0, transition: 'opacity 0.1s', fontSize: 0 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm(`"${c.name_ko}" 등장인물을 삭제할까요?`)) return;
                    try {
                      await api.del(`/api/projects/${pid}/characters/${cKey}`);
                      if (selectedChar && (selectedChar.char_key || selectedChar.key) === cKey) setSelectedChar(null);
                      loadCast();
                    } catch (err) { alert('삭제 실패: ' + err.message); }
                  }}>
                  <Icon name="trash" size={11} />
                </button>
              </div>
            );
          })}
          {!loading && characters.length === 0 && (
            <div style={{ padding: '20px 10px', fontSize: 12, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.6 }}>
              오른쪽 폼에서<br />캐릭터를 생성하세요
            </div>
          )}
        </div>

        {/* CONSISTENCY LOCK */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: 4 }}>
            <Icon name="lock" size={11} />CONSISTENCY LOCK
          </div>
          <div style={{ fontSize: 10, color: 'var(--mint)', lineHeight: 1.5 }}>모든 씬에서 같은 얼굴과 의상이 유지됩니다.</div>
        </div>

        {/* 확정 버튼 */}
        {canApprove && !streaming && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: 'var(--mint)', color: '#000' }}
              onClick={approve} disabled={approving}>
              {approving ? <span className="spinner" style={{ width: 11, height: 11, borderWidth: 2 }} /> : <Icon name="check" size={12} />}
              확정 → 씬 이미지 생성
            </button>
          </div>
        )}
        {confirmed && setView && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }} onClick={() => setView('scene-image')}>
              다음: 씬 이미지 →
            </button>
          </div>
        )}
      </div>

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
  );
};
