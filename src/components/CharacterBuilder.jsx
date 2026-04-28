import React from 'react';
import Avataaars from 'avataaars';
import { Icon } from './Icons';
import { api } from '../api';

/* ── 옵션 정의 ── */
const OPTIONS = {
  skin: {
    label: '피부톤',
    items: [
      { id: 'Tanned',  label: '밝은 갈색' },
      { id: 'Yellow',  label: '황색' },
      { id: 'Pale',    label: '창백' },
      { id: 'Light',   label: '밝음' },
      { id: 'Brown',   label: '갈색' },
      { id: 'DarkBrown', label: '짙은 갈색' },
      { id: 'Black',   label: '다크' },
    ],
  },
  top: {
    label: '헤어스타일',
    items: [
      { id: 'NoHair',           label: '없음' },
      { id: 'ShortHairShortFlat', label: '단발 (직)' },
      { id: 'ShortHairShortWaved', label: '단발 (웨이브)' },
      { id: 'ShortHairDreads01',   label: '드레드' },
      { id: 'LongHairStraight',    label: '긴머리 (직)' },
      { id: 'LongHairWavy',        label: '긴머리 (웨이브)' },
      { id: 'LongHairCurly',       label: '긴머리 (컬)' },
      { id: 'LongHairBun',         label: '번머리' },
      { id: 'LongHairBob',         label: '단발 (밥)' },
      { id: 'Hijab',               label: '히잡' },
      { id: 'Hat',                 label: '모자' },
      { id: 'WinterHat1',          label: '비니' },
    ],
  },
  hairColor: {
    label: '머리색',
    items: [
      { id: 'Black',      label: '검정' },
      { id: 'BrownDark',  label: '짙은 갈색' },
      { id: 'Brown',      label: '갈색' },
      { id: 'Blonde',     label: '금발' },
      { id: 'BlondeGolden', label: '골든 금발' },
      { id: 'Auburn',     label: '적갈색' },
      { id: 'Pastel',     label: '파스텔' },
      { id: 'Blue01',     label: '블루' },
      { id: 'PlatinumBlonde', label: '플래티넘' },
      { id: 'Red',        label: '빨강' },
      { id: 'SilverGray', label: '은발' },
    ],
  },
  eyes: {
    label: '눈',
    items: [
      { id: 'Default',   label: '기본' },
      { id: 'Happy',     label: '웃음' },
      { id: 'Wink',      label: '윙크' },
      { id: 'Hearts',    label: '하트' },
      { id: 'Surprised', label: '놀람' },
      { id: 'Squint',    label: '가늘게' },
      { id: 'Cry',       label: '눈물' },
      { id: 'Side',      label: '옆눈' },
    ],
  },
  eyebrow: {
    label: '눈썹',
    items: [
      { id: 'Default',            label: '기본' },
      { id: 'DefaultNatural',     label: '자연스러운' },
      { id: 'FlatNatural',        label: '평평한' },
      { id: 'RaisedExcited',      label: '들어올린' },
      { id: 'SadConcerned',       label: '걱정스러운' },
      { id: 'UnibrowNatural',     label: '일자눈썹' },
      { id: 'UpDown',             label: '위아래' },
    ],
  },
  mouth: {
    label: '입',
    items: [
      { id: 'Default',   label: '기본' },
      { id: 'Smile',     label: '미소' },
      { id: 'Serious',   label: '진지' },
      { id: 'Sad',       label: '슬픔' },
      { id: 'ScreamOpen', label: '놀람' },
      { id: 'Twinkle',   label: '반짝' },
      { id: 'Tongue',    label: '혀' },
    ],
  },
  accessories: {
    label: '액세서리',
    items: [
      { id: 'Blank',          label: '없음' },
      { id: 'Kurt',           label: '동그란 안경' },
      { id: 'Prescription01', label: '뿔테 안경' },
      { id: 'Prescription02', label: '반테 안경' },
      { id: 'Sunglasses',     label: '선글라스' },
      { id: 'Wayfarers',      label: '웨이파러' },
      { id: 'Round',          label: '원형 안경' },
    ],
  },
  clothes: {
    label: '상의',
    items: [
      { id: 'BlazerShirt',     label: '블레이저' },
      { id: 'BlazerSweater',   label: '블레이저+스웨터' },
      { id: 'CollarSweater',   label: '카라 스웨터' },
      { id: 'GraphicShirt',    label: '그래픽 티' },
      { id: 'Hoodie',          label: '후드' },
      { id: 'Overall',         label: '오버롤' },
      { id: 'ShirtCrewNeck',   label: '크루넥' },
      { id: 'ShirtScoopNeck',  label: '스쿱넥' },
      { id: 'ShirtVNeck',      label: 'V넥' },
    ],
  },
  clotheColor: {
    label: '상의 색',
    items: [
      { id: 'Black',       label: '검정' },
      { id: 'White',       label: '흰색' },
      { id: 'Gray01',      label: '연회색' },
      { id: 'Gray02',      label: '진회색' },
      { id: 'Heather',     label: '헤더' },
      { id: 'Blue01',      label: '하늘색' },
      { id: 'Blue02',      label: '파랑' },
      { id: 'Blue03',      label: '남색' },
      { id: 'PastelBlue',  label: '파스텔 블루' },
      { id: 'Red',         label: '빨강' },
      { id: 'PastelRed',   label: '파스텔 레드' },
      { id: 'Pink',        label: '핑크' },
      { id: 'PastelGreen', label: '파스텔 그린' },
      { id: 'PastelOrange', label: '파스텔 오렌지' },
      { id: 'PastelYellow', label: '파스텔 옐로우' },
    ],
  },
  facialHair: {
    label: '수염',
    items: [
      { id: 'Blank',           label: '없음' },
      { id: 'BeardLight',      label: '짧은 수염' },
      { id: 'BeardMagestic',   label: '긴 수염' },
      { id: 'BeardMedium',     label: '중간 수염' },
      { id: 'MoustacheFancy',  label: '콧수염 (멋진)' },
      { id: 'MoustacheMagnum', label: '콧수염 (매그넘)' },
    ],
  },
};

/* ── 선택값 → 영어 프롬프트 변환 ── */
const toPrompt = (config) => {
  const parts = [];

  const skinMap = { Tanned: 'tanned skin', Yellow: 'yellow skin', Pale: 'pale skin', Light: 'light skin', Brown: 'brown skin', DarkBrown: 'dark brown skin', Black: 'dark skin' };
  if (skinMap[config.skin]) parts.push(skinMap[config.skin]);

  const hairMap = { NoHair: 'bald', ShortHairShortFlat: 'short straight hair', ShortHairShortWaved: 'short wavy hair', ShortHairDreads01: 'dreadlocks', LongHairStraight: 'long straight hair', LongHairWavy: 'long wavy hair', LongHairCurly: 'long curly hair', LongHairBun: 'hair in a bun', LongHairBob: 'bob haircut', Hijab: 'wearing hijab', Hat: 'wearing hat', WinterHat1: 'wearing beanie' };
  const hairColorMap = { Black: 'black', BrownDark: 'dark brown', Brown: 'brown', Blonde: 'blonde', BlondeGolden: 'golden blonde', Auburn: 'auburn', Pastel: 'pastel colored', Blue01: 'blue', PlatinumBlonde: 'platinum blonde', Red: 'red', SilverGray: 'silver gray' };
  if (config.top !== 'NoHair' && config.top !== 'Hijab' && config.top !== 'Hat' && config.top !== 'WinterHat1') {
    const color = hairColorMap[config.hairColor] || '';
    const style = hairMap[config.top] || '';
    if (color && style) parts.push(`${color} ${style}`);
  } else if (hairMap[config.top]) {
    parts.push(hairMap[config.top]);
  }

  const clothesMap = { BlazerShirt: 'blazer over shirt', BlazerSweater: 'blazer over sweater', CollarSweater: 'collar sweater', GraphicShirt: 'graphic t-shirt', Hoodie: 'hoodie', Overall: 'overalls', ShirtCrewNeck: 'crew neck shirt', ShirtScoopNeck: 'scoop neck shirt', ShirtVNeck: 'v-neck shirt' };
  const colorMap = { Black: 'black', White: 'white', Gray01: 'light gray', Gray02: 'dark gray', Heather: 'heather gray', Blue01: 'sky blue', Blue02: 'blue', Blue03: 'navy', PastelBlue: 'pastel blue', Red: 'red', PastelRed: 'pastel red', Pink: 'pink', PastelGreen: 'pastel green', PastelOrange: 'pastel orange', PastelYellow: 'pastel yellow' };
  if (clothesMap[config.clothes]) parts.push(`wearing ${colorMap[config.clotheColor] || ''} ${clothesMap[config.clothes]}`.trim());

  const accMap = { Kurt: 'round glasses', Prescription01: 'thick frame glasses', Prescription02: 'semi-rimless glasses', Sunglasses: 'sunglasses', Wayfarers: 'wayfarer sunglasses', Round: 'circular glasses' };
  if (accMap[config.accessories]) parts.push(`wearing ${accMap[config.accessories]}`);

  const facialMap = { BeardLight: 'light beard', BeardMagestic: 'full beard', BeardMedium: 'medium beard', MoustacheFancy: 'fancy moustache', MoustacheMagnum: 'thick moustache' };
  if (facialMap[config.facialHair]) parts.push(facialMap[config.facialHair]);

  return parts.join(', ');
};

const DEFAULT_CONFIG = {
  skin: 'Light',
  top: 'LongHairStraight',
  hairColor: 'Black',
  eyes: 'Default',
  eyebrow: 'Default',
  mouth: 'Smile',
  accessories: 'Blank',
  clothes: 'Hoodie',
  clotheColor: 'Blue01',
  facialHair: 'Blank',
  facialHairColor: 'Black',
};

/* ── 옵션 선택 행 ── */
const OptionRow = ({ label, items, value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          style={{
            padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer', border: '1px solid',
            borderColor: value === item.id ? 'var(--mint)' : 'var(--border)',
            background: value === item.id ? 'color-mix(in oklch, var(--mint) 12%, var(--surface))' : 'var(--surface)',
            color: value === item.id ? 'var(--mint)' : 'var(--text-3)',
            fontWeight: value === item.id ? 600 : 400,
            transition: 'all 0.1s',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

/* ── 메인 컴포넌트 ── */
export const CharacterBuilder = ({ project, character, onSave, onClose }) => {
  const [config, setConfig] = React.useState({
    ...DEFAULT_CONFIG,
    ...(character?.avatar_config || {}),
  });
  const [name, setName] = React.useState(character?.name_ko || '');
  const [role, setRole] = React.useState(character?.role_ko || '');
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(character?.image_url || null);
  const [error, setError] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('face');

  const set = (key) => (val) => setConfig(prev => ({ ...prev, [key]: val }));

  const tabGroups = {
    face:  ['skin', 'eyes', 'eyebrow', 'mouth', 'facialHair'],
    hair:  ['top', 'hairColor'],
    style: ['clothes', 'clotheColor', 'accessories'],
  };

  const tabLabels = { face: '얼굴', hair: '헤어', style: '스타일' };

  const prompt = toPrompt(config);

  const generateImage = async () => {
    if (!project?.id) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post(`/api/projects/${project.id}/characters/generate`, {
        name_ko: name,
        role_ko: role,
        avatar_config: config,
        appearance_prompt: prompt,
      });
      setGenerated(res.image_url);
      if (onSave) onSave({ ...res, avatar_config: config });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="panel"
        style={{ width: 'min(860px, 96vw)', height: 'min(700px, 92vh)', boxShadow: 'var(--shadow-pop)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Icon name="user" size={15} style={{ color: 'var(--mint)' }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>캐릭터 빌더</div>
          <button className="btn ghost icon sm" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* 왼쪽: 미리보기 */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px', gap: 16, background: 'var(--bg-2)', overflowY: 'auto' }}>

            {/* 아바타 미리보기 */}
            <div style={{ width: 180, height: 180, position: 'relative' }}>
              <Avataaars
                style={{ width: '100%', height: '100%' }}
                avatarStyle="Circle"
                topType={config.top}
                accessoriesType={config.accessories}
                hairColor={config.hairColor}
                facialHairType={config.facialHair}
                facialHairColor={config.facialHairColor}
                clotheType={config.clothes}
                clotheColor={config.clotheColor}
                eyeType={config.eyes}
                eyebrowType={config.eyebrow}
                mouthType={config.mouth}
                skinColor={config.skin}
              />
            </div>

            {/* 이름/역할 입력 */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="캐릭터 이름"
                style={{ width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--mint)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="역할 (예: 주인공 · 20대 여성)"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--mint)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* 프롬프트 미리보기 */}
            <div style={{ width: '100%', padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>AI 생성 프롬프트</div>
              {prompt || '옵션을 선택하면 자동 생성됩니다'}
            </div>

            {/* AI 이미지 생성 버튼 */}
            {error && <div style={{ fontSize: 12, color: 'var(--rose)', textAlign: 'center' }}>{error}</div>}

            {generated && (
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 6 }}>생성된 이미지</div>
                <img src={generated} alt={name} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
              </div>
            )}

            <button
              className="btn primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={generateImage}
              disabled={generating || !name.trim()}
            >
              {generating
                ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />AI 이미지 생성 중...</>
                : <><Icon name="sparkles" size={13} />이 외형으로 AI 이미지 생성</>
              }
            </button>
          </div>

          {/* 오른쪽: 옵션 패널 */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', background: 'var(--bg-2)', flexShrink: 0 }}>
              {Object.entries(tabLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '12px 16px', fontSize: 13, fontWeight: activeTab === key ? 600 : 400,
                    color: activeTab === key ? 'var(--mint)' : 'var(--text-3)',
                    background: 'none', border: 'none', borderBottom: activeTab === key ? '2px solid var(--mint)' : '2px solid transparent',
                    cursor: 'pointer', marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 옵션 목록 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {tabGroups[activeTab].map(key => (
                <OptionRow
                  key={key}
                  label={OPTIONS[key].label}
                  items={OPTIONS[key].items}
                  value={config[key]}
                  onChange={set(key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
