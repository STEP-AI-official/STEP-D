import React from 'react';
import AvataaarsAvatar, { AvatarStyle } from 'avataaars';
import { Icon } from './Icons';

/* ── 모든 옵션 값 (avataaars dist 파일 기준) ── */
export const AVATAR_OPTIONS = {
  topType: [
    'NoHair','Eyepatch','Hat','Hijab','Turban',
    'WinterHat1','WinterHat2','WinterHat3','WinterHat4',
    'LongHairBigHair','LongHairBob','LongHairBun','LongHairCurly','LongHairCurvy',
    'LongHairDreads','LongHairFrida','LongHairFro','LongHairFroBand','LongHairMiaWallace',
    'LongHairNotTooLong','LongHairShavedSides','LongHairStraight','LongHairStraight2','LongHairStraightStrand',
    'ShortHairDreads01','ShortHairDreads02','ShortHairFrizzle','ShortHairShaggy','ShortHairShaggyMullet',
    'ShortHairShortCurly','ShortHairShortFlat','ShortHairShortRound','ShortHairShortWaved','ShortHairSides',
    'ShortHairTheCaesar','ShortHairTheCaesarSidePart',
  ],
  accessoriesType: ['Blank','Kurt','Prescription01','Prescription02','Round','Sunglasses','Wayfarers'],
  hairColor: ['Auburn','Black','Blonde','BlondeGolden','Brown','BrownDark','PastelPink','Platinum','Red','SilverGray'],
  hatColor: ['Black','Blue01','Blue02','Blue03','Gray01','Gray02','Heather','PastelBlue','PastelGreen','PastelOrange','PastelRed','PastelYellow','Pink','Red','White'],
  facialHairType: ['Blank','BeardLight','BeardMajestic','BeardMedium','MoustacheFancy','MoustacheMagnum'],
  facialHairColor: ['Auburn','Black','Blonde','BlondeGolden','Brown','BrownDark','Platinum','Red'],
  clotheType: ['BlazerShirt','BlazerSweater','CollarSweater','GraphicShirt','Hoodie','Overall','ShirtCrewNeck','ShirtScoopNeck','ShirtVNeck'],
  clotheColor: ['Black','Blue01','Blue02','Blue03','Gray01','Gray02','Heather','PastelBlue','PastelGreen','PastelOrange','PastelRed','PastelYellow','Pink','Red','White'],
  graphicType: ['Bat','Cumbia','Deer','Diamond','Hola','Pizza','Resist','Selena','Bear','SkullOutline','Skull'],
  eyeType: ['Close','Cry','Default','Dizzy','EyeRoll','Happy','Hearts','Side','Squint','Surprised','Wink','WinkWacky'],
  eyebrowType: ['Angry','AngryNatural','Default','DefaultNatural','FlatNatural','FrownNatural','RaisedExcited','RaisedExcitedNatural','SadConcerned','SadConcernedNatural','UnibrowNatural','UpDown','UpDownNatural'],
  mouthType: ['Concerned','Default','Disbelief','Eating','Grimace','Sad','ScreamOpen','Serious','Smile','Tongue','Twinkle','Vomit'],
  skinColor: ['Tanned','Yellow','Pale','Light','Brown','DarkBrown','Black'],
};

const OPTION_LABELS = {
  topType: '헤어 / 모자',
  accessoriesType: '안경 / 악세사리',
  hairColor: '머리 색',
  hatColor: '모자 색',
  facialHairType: '수염',
  facialHairColor: '수염 색',
  clotheType: '의상',
  clotheColor: '의상 색',
  graphicType: '그래픽',
  eyeType: '눈',
  eyebrowType: '눈썹',
  mouthType: '입',
  skinColor: '피부 톤',
};

/* 옵션 그룹: 의상·외모·헤어 (그래픽 제거) */
const GROUPS = [
  { label: '의상 · WARDROBE', keys: ['clotheType','clotheColor'] },
  { label: '헤어 · HAIR', keys: ['topType','hairColor','hatColor','facialHairType','facialHairColor'] },
  { label: '얼굴 · FACE', keys: ['eyeType','eyebrowType','mouthType','skinColor','accessoriesType'] },
];

const GENDER_OPTIONS = ['남성', '여성'];
const AGE_OPTIONS    = ['10대', '20대 초반', '20대 중반', '20대 후반', '30대 초반', '30대 중반', '30대 후반', '40대', '50대', '60대 이상'];

export const DEFAULT_AVATAR = {
  gender: '남성',
  age: '20대 중반',
  topType: 'ShortHairShortFlat',
  accessoriesType: 'Blank',
  hairColor: 'Black',
  hatColor: 'Black',
  facialHairType: 'Blank',
  facialHairColor: 'Black',
  clotheType: 'BlazerShirt',
  clotheColor: 'Black',
  graphicType: 'Bat',
  eyeType: 'Default',
  eyebrowType: 'Default',
  mouthType: 'Smile',
  skinColor: 'Light',
};

/* ── 옵션값 한글 라벨 ── */
const VALUE_LABELS = {
  // topType
  NoHair: '민머리', Eyepatch: '안대', Hat: '모자', Hijab: '히잡', Turban: '터번',
  WinterHat1: '겨울모자1', WinterHat2: '겨울모자2', WinterHat3: '겨울모자3', WinterHat4: '겨울모자4',
  LongHairBigHair: '긴머리 풍성', LongHairBob: '긴머리 단발', LongHairBun: '긴머리 번머리',
  LongHairCurly: '긴머리 곱슬', LongHairCurvy: '긴머리 웨이브', LongHairDreads: '긴머리 드레드',
  LongHairFrida: '긴머리 프리다', LongHairFro: '긴머리 아프로', LongHairFroBand: '긴머리 아프로+밴드',
  LongHairMiaWallace: '긴머리 미아월리스', LongHairNotTooLong: '긴머리 중간', LongHairShavedSides: '긴머리 사이드컷',
  LongHairStraight: '긴머리 직모', LongHairStraight2: '긴머리 직모2', LongHairStraightStrand: '긴머리 앞머리',
  ShortHairDreads01: '짧은 드레드1', ShortHairDreads02: '짧은 드레드2', ShortHairFrizzle: '짧은 곱슬',
  ShortHairShaggy: '짧은 텁수룩', ShortHairShaggyMullet: '짧은 멀릿', ShortHairShortCurly: '짧은 컬리',
  ShortHairShortFlat: '짧은 납작', ShortHairShortRound: '짧은 둥근', ShortHairShortWaved: '짧은 웨이브',
  ShortHairSides: '짧은 사이드', ShortHairTheCaesar: '짧은 시저컷', ShortHairTheCaesarSidePart: '짧은 시저 가르마',
  // accessoriesType
  Blank: '없음', Kurt: '커트 안경', Prescription01: '뿔테 안경', Prescription02: '반뿔테',
  Round: '동그란 안경', Sunglasses: '선글라스', Wayfarers: '웨이파러',
  // hairColor / facialHairColor
  Auburn: '적갈색', Black: '검정', Blonde: '금발', BlondeGolden: '황금 금발',
  Brown: '갈색', BrownDark: '진갈색', PastelPink: '파스텔 핑크', Platinum: '플래티넘',
  Red: '빨강', SilverGray: '은회색',
  // hatColor / clotheColor
  Blue01: '파랑1', Blue02: '파랑2', Blue03: '파랑3', Gray01: '회색1', Gray02: '회색2',
  Heather: '헤더 그레이', PastelBlue: '파스텔 블루', PastelGreen: '파스텔 그린',
  PastelOrange: '파스텔 오렌지', PastelRed: '파스텔 레드', PastelYellow: '파스텔 옐로',
  Pink: '핑크', White: '흰색',
  // facialHairType
  BeardLight: '수염 옅은', BeardMajestic: '수염 풍성', BeardMedium: '수염 중간',
  MoustacheFancy: '콧수염 멋진', MoustacheMagnum: '콧수염 굵은',
  // clotheType
  BlazerShirt: '블레이저+셔츠', BlazerSweater: '블레이저+스웨터', CollarSweater: '카라 스웨터',
  GraphicShirt: '그래픽 티셔츠', Hoodie: '후드티', Overall: '오버롤',
  ShirtCrewNeck: '크루넥 셔츠', ShirtScoopNeck: '스쿱넥 셔츠', ShirtVNeck: 'V넥 셔츠',
  // graphicType
  Bat: '박쥐', Cumbia: '쿰비아', Deer: '사슴', Diamond: '다이아몬드', Hola: '올라',
  Pizza: '피자', Resist: '저항', Selena: '셀레나', Bear: '곰', SkullOutline: '해골 아웃라인', Skull: '해골',
  // eyeType
  Close: '감은 눈', Cry: '우는 눈', Default: '기본', Dizzy: '어지러운', EyeRoll: '눈 굴리기',
  Happy: '행복한', Hearts: '하트 눈', Side: '옆보기', Squint: '찡그린', Surprised: '놀란',
  Wink: '윙크', WinkWacky: '윙크(과장)',
  // eyebrowType
  Angry: '화난', AngryNatural: '화난(자연)', DefaultNatural: '기본(자연)', FlatNatural: '평평(자연)',
  FrownNatural: '찡그린(자연)', RaisedExcited: '올린', RaisedExcitedNatural: '올린(자연)',
  SadConcerned: '슬픈', SadConcernedNatural: '슬픈(자연)', UnibrowNatural: '일자눈썹', UpDown: '위아래', UpDownNatural: '위아래(자연)',
  // mouthType
  Concerned: '걱정', Disbelief: '불신', Eating: '먹는 중', Grimace: '찡그림',
  Sad: '슬픔', ScreamOpen: '비명', Serious: '진지함', Smile: '미소', Tongue: '혀 내밀기',
  Twinkle: '반짝', Vomit: '구역질',
  // skinColor
  Tanned: '구릿빛', Yellow: '노란빛', Pale: '창백', Light: '밝은', DarkBrown: '진갈색', // Brown 중복 위에서 처리
};

/* ── Select 행 ── */
const OptionRow = ({ optKey, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
    <div style={{ fontSize: 11, color: 'var(--text-3)', width: 90, flexShrink: 0 }}>{OPTION_LABELS[optKey]}</div>
    <select
      value={value}
      onChange={e => onChange(optKey, e.target.value)}
      style={{ flex: 1, fontSize: 11, padding: '4px 6px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)' }}
    >
      {AVATAR_OPTIONS[optKey].map(v => (
        <option key={v} value={v}>{VALUE_LABELS[v] || v}</option>
      ))}
    </select>
  </div>
);

/* ── 메인 커스터마이저 ── */
export const AvatarCustomizer = ({ value = DEFAULT_AVATAR, onChange, onSave, saving, extraAction }) => {
  const [activeGroup, setActiveGroup] = React.useState(0);

  const set = (k, v) => onChange({ ...value, [k]: v });

  const group = GROUPS[activeGroup];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
          AVATAR STYLE · WARDROBE & APPEARANCE
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {extraAction}
          {onSave && (
            <button
              className="btn sm primary"
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? <span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.5 }} />
                : <Icon name="check" size={10} />}
              SAVE
            </button>
          )}
        </div>
      </div>

      {/* 성별 · 나이 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>성별</div>
          <select value={value.gender || '남성'} onChange={e => set('gender', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer' }}>
            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>나이대</div>
          <select value={value.age || '20대 중반'} onChange={e => set('age', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer' }}>
            {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, alignItems: 'start' }}>
        {/* 아바타 미리보기 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'center' }}>
            <AvataaarsAvatar
              style={{ width: 110, height: 110 }}
              avatarStyle={AvatarStyle.Circle}
              topType={value.topType}
              accessoriesType={value.accessoriesType}
              hairColor={value.hairColor}
              hatColor={value.hatColor}
              facialHairType={value.facialHairType}
              facialHairColor={value.facialHairColor}
              clotheType={value.clotheType}
              clotheColor={value.clotheColor}
              graphicType={value.graphicType}
              eyeType={value.eyeType}
              eyebrowType={value.eyebrowType}
              mouthType={value.mouthType}
              skinColor={value.skinColor}
            />
          </div>
          {/* 랜덤 버튼 */}
          <button
            className="btn sm ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            onClick={() => {
              const rand = {};
              Object.keys(AVATAR_OPTIONS).forEach(k => {
                const arr = AVATAR_OPTIONS[k];
                rand[k] = arr[Math.floor(Math.random() * arr.length)];
              });
              onChange(rand);
            }}
          >
            <Icon name="refresh" size={10} /> RANDOM
          </button>
        </div>

        {/* 옵션 패널 */}
        <div>
          {/* 그룹 탭 */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {GROUPS.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.04em',
                  padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
                  background: activeGroup === i ? 'var(--surface-3)' : 'transparent',
                  color: activeGroup === i ? 'var(--text)' : 'var(--text-4)',
                  cursor: 'pointer',
                }}
              >
                {g.label.split(' · ')[1]}
              </button>
            ))}
          </div>

          {/* 옵션 rows */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, color: 'var(--mint)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 8 }}>{group.label}</div>
            {group.keys.map(k => (
              <OptionRow key={k} optKey={k} value={value[k] || AVATAR_OPTIONS[k][0]} onChange={set} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
