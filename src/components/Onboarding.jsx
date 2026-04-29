import React from 'react';

/* ── CSS animations injected once ── */
const ANIM_STYLE = `
@keyframes blink-caret { 0%,49%{opacity:1} 50%,100%{opacity:0} }
@keyframes pulse-soft { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes fade-in-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes spin-anim { to{transform:rotate(360deg)} }
@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes drift-x { 0%,100%{transform:translateX(0) rotate(-4deg)} 50%{transform:translateX(8px) rotate(-2deg)} }
@keyframes drift-x-r { 0%,100%{transform:translateX(0) rotate(4deg)} 50%{transform:translateX(-8px) rotate(2deg)} }
@keyframes scan-line { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(180px);opacity:1} }
@keyframes pulse-glow {
  0%,100%{box-shadow:0 0 0 0 color-mix(in oklch,var(--accent) 50%,transparent),0 30px 80px rgba(0,0,0,0.5)}
  50%{box-shadow:0 0 0 14px color-mix(in oklch,var(--accent) 0%,transparent),0 30px 80px rgba(0,0,0,0.5)}
}
@keyframes ken-burns { 0%,100%{transform:scale(1.04) translate(0,0)} 50%{transform:scale(1.08) translate(-2%,-2%)} }
`;

const InjectStyle = () => {
  React.useEffect(() => {
    if (document.getElementById('sf-onboard-anim')) return;
    const s = document.createElement('style');
    s.id = 'sf-onboard-anim';
    s.textContent = ANIM_STYLE;
    document.head.appendChild(s);
  }, []);
  return null;
};

/* ── 반응형 훅 (모바일 ≤ 640px) ── */
const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
};

const STEPS = [
  { key: 'script', label: '시나리오', color: 'var(--violet)', soft: 'var(--violet-soft)', desc: 'AI가 다큐 대본을 자동 작성', icon: 'pen' },
  { key: 'cast',   label: '등장인물', color: 'var(--mint)',   soft: 'var(--mint-soft)',   desc: '얼굴·의상이 일관된 캐릭터',  icon: 'face' },
  { key: 'place',  label: '배경',     color: 'var(--orange)', soft: 'var(--orange-soft)', desc: '키워드 한 줄로 장소 생성',   icon: 'mountain' },
  { key: 'scene',  label: '씬 이미지',color: 'var(--blue)',   soft: 'var(--blue-soft)',   desc: '컷 이미지를 자동 합성',     icon: 'frames' },
  { key: 'render', label: '영상 렌더',color: 'var(--rose)',   soft: 'var(--rose-soft)',   desc: '나레이션·자막을 붙여 완성', icon: 'film' },
];

const SAMPLE_PROMPTS = [
  '조선시대 마지막 어의의 하루',
  '심해 7000m, 아무도 본 적 없는 생물',
  'NASA가 숨긴 1972년의 기록',
  '1929년 뉴욕, 대공황의 첫 24시간',
  '북극 다이아몬드 광산의 진실',
];

/* ── SVG 아이콘 셋 ── */
const Ico = ({ name, size = 18, color = 'currentColor', stroke = 1.6 }) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'pen':      return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>;
    case 'face':     return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10.5" r=".6" fill={color}/><circle cx="15" cy="10.5" r=".6" fill={color}/><path d="M9 15c1 1 2 1.4 3 1.4S13.5 16 14.5 15"/></svg>;
    case 'mountain': return <svg {...p}><path d="M3 19l5.5-9 4 6 2-3 6.5 6z"/><circle cx="17" cy="7" r="1.6"/></svg>;
    case 'frames':   return <svg {...p}><rect x="3" y="6" width="14" height="11" rx="1.5"/><rect x="7" y="9" width="14" height="11" rx="1.5"/></svg>;
    case 'film':     return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9h18M3 15h18M8 5v14M16 5v14"/></svg>;
    case 'sparkle':  return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.7L21.5 19l-1.8.6L19 21.5l-.7-1.8L16.5 19l1.8-.6z"/></svg>;
    case 'arrow':    return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'play':     return <svg {...p} fill={color} stroke="none"><path d="M7 5l12 7-12 7z"/></svg>;
    case 'check':    return <svg {...p}><path d="M5 12l4 4 10-10"/></svg>;
    case 'google':   return (
      <svg width={size} height={size} viewBox="0 0 18 18">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    );
    default: return null;
  }
};

/* ── 로고 ── */
const LogoMark = ({ size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: 'linear-gradient(135deg, oklch(0.78 0.17 160) 0%, oklch(0.72 0.17 285) 100%)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 6px 22px rgba(124,111,247,0.35), inset 0 0 0 1px rgba(255,255,255,0.15)',
    overflow: 'hidden',
  }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M5 5l14 7-14 7z" fill="#0a0a0f" opacity="0.85"/>
      <circle cx="18" cy="6" r="2" fill="#fff"/>
    </svg>
  </div>
);

const Wordmark = ({ size = 20 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size * 1.4} />
    <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)' }}>
      AI <span style={{ color: 'var(--mint)' }}>다큐멘터리</span>
    </div>
  </div>
);

/* ── 상단 네비 ── */
const TopBar = ({ onLogin, onNav, activePage = 'home' }) => {
  const isMobile = useIsMobile();
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
      height: 60, padding: isMobile ? '0 14px' : '0 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      background: 'linear-gradient(to bottom, color-mix(in oklch, var(--bg) 70%, transparent), transparent)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ cursor: 'pointer', minWidth: 0, flexShrink: 1 }} onClick={() => onNav('home')}>
        <Wordmark size={isMobile ? 13 : 15} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 4, flexShrink: 0 }}>
        {!isMobile && (
          <>
            {[{ key: 'home', label: '제품' }, { key: 'showcase', label: '쇼케이스' }].map(({ key, label }) => (
              <a key={key} onClick={() => onNav(key)}
                style={{
                  fontSize: 13, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  textDecoration: 'none', transition: 'color 0.15s',
                  color: activePage === key ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: activePage === key ? 700 : 400,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = activePage === key ? 'var(--text)' : 'var(--text-3)'}
              >{label}</a>
            ))}
            <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 6px' }} />
            <button onClick={onLogin} style={{
              fontSize: 13, color: 'var(--text-2)', padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none',
            }}>로그인</button>
          </>
        )}
        {isMobile && (
          <a onClick={() => onNav(activePage === 'showcase' ? 'home' : 'showcase')}
            style={{
              fontSize: 12, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              color: 'var(--text-2)', fontWeight: 600,
            }}>{activePage === 'showcase' ? '제품' : '쇼케이스'}</a>
        )}
        <button onClick={onLogin} style={{
          fontSize: isMobile ? 12 : 13, color: '#0a0a0f',
          padding: isMobile ? '7px 12px' : '7px 14px', borderRadius: 8,
          cursor: 'pointer', fontWeight: 700, background: 'var(--mint)', border: 'none',
          whiteSpace: 'nowrap',
        }}>{isMobile ? '시작하기' : '무료로 시작'}</button>
      </div>
    </div>
  );
};

/* ── 라이브 타이핑 훅 ── */
const useTyping = (texts, { typeMs = 55, holdMs = 1800, eraseMs = 25 } = {}) => {
  const [idx, setIdx] = React.useState(0);
  const [text, setText] = React.useState('');
  const [phase, setPhase] = React.useState('typing');
  React.useEffect(() => {
    let t;
    const target = texts[idx];
    if (phase === 'typing') {
      if (text.length < target.length) {
        t = setTimeout(() => setText(target.slice(0, text.length + 1)), typeMs);
      } else {
        t = setTimeout(() => setPhase('hold'), holdMs);
      }
    } else if (phase === 'hold') {
      t = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), eraseMs);
      } else {
        setIdx((idx + 1) % texts.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(t);
  }, [text, phase, idx, texts, typeMs, holdMs, eraseMs]);
  return text;
};

/* ── 파이프라인 시각화 ── */
const PipelineFlow = ({ active = 2 }) => {
  const isMobile = useIsMobile();
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center', gap: 0,
      flexWrap: isMobile ? 'nowrap' : 'wrap',
      justifyContent: 'center',
      width: '100%',
    }}>
      {STEPS.map((s, i) => {
        const isActive = i <= active;
        const isCurrent = i === active;
        return (
          <React.Fragment key={s.key}>
            <div style={{
              width: isMobile ? '100%' : 140,
              maxWidth: isMobile ? 320 : undefined,
              padding: isMobile ? '12px 14px' : '14px 10px',
              borderRadius: 12,
              background: isActive ? `color-mix(in oklch, ${s.color} 8%, var(--surface))` : 'var(--surface)',
              border: `1px solid ${isCurrent ? s.color : isActive ? `color-mix(in oklch, ${s.color} 35%, var(--border))` : 'var(--border)'}`,
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: 'center',
              gap: isMobile ? 12 : 8,
              boxShadow: isCurrent ? `0 0 0 4px color-mix(in oklch, ${s.color} 18%, transparent)` : 'none',
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `color-mix(in oklch, ${s.color} ${isActive ? 22 : 10}%, var(--surface-2))`,
                border: `1px solid color-mix(in oklch, ${s.color} ${isActive ? 50 : 25}%, var(--border))`,
                display: 'grid', placeItems: 'center',
                color: isActive ? s.color : 'var(--text-4)',
              }}>
                <Ico name={s.icon} size={18} />
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 2 : 6, flex: isMobile ? 1 : undefined, minWidth: 0,
              }}>
                <div style={{
                  fontSize: 8.5, fontWeight: 700, fontFamily: 'monospace',
                  color: isActive ? s.color : 'var(--text-4)', letterSpacing: '0.12em',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {isCurrent && <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, animation: 'pulse-soft 1.4s ease infinite' }} />}
                  STEP {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{s.label}</div>
                <div style={{
                  fontSize: 10.5, color: 'var(--text-4)',
                  textAlign: isMobile ? 'left' : 'center', lineHeight: 1.5,
                }}>{s.desc}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: isMobile ? 'auto' : 18,
                height: isMobile ? 18 : 'auto',
                display: 'grid', placeItems: 'center',
                color: i < active ? STEPS[i].color : 'var(--border-strong)',
                opacity: i < active ? 0.7 : 1,
                transform: isMobile ? 'rotate(90deg)' : 'none',
                margin: isMobile ? '4px 0' : 0,
              }}>
                <Ico name="arrow" size={14} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ── intro_3→2→1 슬라이드쇼 합성 데모 ── */
const INTRO_SLIDES = [
  { src: '/intro_3.png', label: '등장인물', sub: 'CAST · AI 생성', accent: 'var(--mint)',   badge: 'CHARACTER' },
  { src: '/intro_2.png', label: '배경',     sub: 'LOCATION · AI 생성', accent: 'var(--orange)', badge: 'BACKGROUND' },
  { src: '/intro_1.png', label: '씬 이미지', sub: 'SCENE · 합성 완료', accent: 'var(--violet)', badge: 'SCENE' },
];

const IntroSlideshow = () => {
  const isMobile = useIsMobile();
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => (i + 1) % INTRO_SLIDES.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const isScene = idx === 2;

  const fuseArrow = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 5, flexShrink: 0,
      transform: isMobile ? 'rotate(90deg)' : 'none',
      margin: isMobile ? '4px 0' : 0,
    }}>
      <div style={{ fontSize: 8.5, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>FUSE</div>
      <svg width="56" height="20" viewBox="0 0 60 20" fill="none">
        <defs>
          <linearGradient id="fuseGrad2" x1="0" y1="0" x2="60" y2="0">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="1"/>
            <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        <path d="M2 10 L52 10 M46 4 L52 10 L46 16" stroke="url(#fuseGrad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: 'var(--text-4)', letterSpacing: '0.1em' }}>~5s</div>
    </div>
  );

  const plusBadge = (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'var(--surface)', border: '1px solid var(--border-strong)',
      display: 'grid', placeItems: 'center', color: 'var(--text-2)',
      fontSize: 18, fontWeight: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0,
    }}>+</div>
  );

  return (
    <div style={{
      width: '100%', maxWidth: 1100,
      display: isMobile ? 'flex' : 'grid',
      flexDirection: isMobile ? 'column' : undefined,
      gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr auto 1fr',
      alignItems: 'center',
      gap: isMobile ? 10 : 20,
      padding: isMobile ? '20px 16px' : '32px 36px',
      borderRadius: 24,
      background: 'color-mix(in oklch, var(--surface) 45%, transparent)',
      border: '1px solid var(--border)',
      backdropFilter: 'blur(8px)',
      animation: 'fade-in-up 0.7s 0.3s ease both',
      position: 'relative',
    }}>
      <IntroImageSlot src="/intro_3.png" label="등장인물" sub="CAST · AI 생성" accent="var(--mint)" badge="CHARACTER"
        anim={isMobile ? 'none' : 'drift-x 4s ease-in-out infinite'} dimmed={isScene} fullWidth={isMobile} />
      {plusBadge}
      <IntroImageSlot src="/intro_2.png" label="배경" sub="LOCATION · AI 생성" accent="var(--orange)" badge="BACKGROUND"
        anim={isMobile ? 'none' : 'drift-x-r 4s ease-in-out infinite'} dimmed={isScene} fullWidth={isMobile} />
      {fuseArrow}
      <IntroImageSlot src="/intro_1.png" label="씬 이미지" sub="SCENE · 합성 완료" accent="var(--violet)" badge="SCENE"
        anim="none" highlight fullWidth={isMobile} />
    </div>
  );
};

const IntroImageSlot = ({ src, label, sub, accent, badge, anim, dimmed, highlight, fullWidth }) => (
  <div style={{
    position: 'relative', aspectRatio: '16/9', minHeight: 0,
    width: fullWidth ? '100%' : undefined,
    borderRadius: 14, overflow: 'hidden',
    border: `1.5px solid color-mix(in oklch, ${accent} ${highlight ? 60 : 35}%, var(--border))`,
    boxShadow: highlight
      ? `0 0 0 3px color-mix(in oklch, ${accent} 20%, transparent), 0 20px 50px rgba(0,0,0,0.45)`
      : '0 14px 40px rgba(0,0,0,0.35)',
    animation: anim && anim !== 'none' ? anim : undefined,
    transition: 'opacity 0.35s',
    opacity: dimmed ? 0.55 : 1,
    flexShrink: 0,
  }}>
  <img
    src={src}
    alt={label}
    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
    onError={e => { e.currentTarget.style.display = 'none'; }}
  />
  {/* 스캔라인 */}
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 14px ${accent}`, animation: 'scan-line 3s ease-in-out infinite' }} />
  {/* 모서리 */}
  {[{ top: 7, left: 7, b: ['top','left'] }, { top: 7, right: 7, b: ['top','right'] }, { bottom: 7, left: 7, b: ['bottom','left'] }, { bottom: 7, right: 7, b: ['bottom','right'] }].map((c, i) => (
    <div key={i} style={{ position: 'absolute', width: 9, height: 9, top: c.top, left: c.left, right: c.right, bottom: c.bottom, borderTop: c.b.includes('top') ? `1.5px solid ${accent}` : 'none', borderBottom: c.b.includes('bottom') ? `1.5px solid ${accent}` : 'none', borderLeft: c.b.includes('left') ? `1.5px solid ${accent}` : 'none', borderRight: c.b.includes('right') ? `1.5px solid ${accent}` : 'none' }} />
  ))}
  {/* 하단 레이블 */}
  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 11px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{label}</div>
      <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginTop: 1 }}>{sub}</div>
    </div>
    <div style={{ padding: '2px 5px', borderRadius: 4, fontSize: 8, fontFamily: 'monospace', fontWeight: 700, background: `color-mix(in oklch, ${accent} 25%, rgba(0,0,0,0.6))`, color: accent, letterSpacing: '0.06em' }}>{badge}</div>
  </div>
  {highlight && (
    <div style={{ position: 'absolute', top: -10, right: 10, padding: '3px 9px', borderRadius: 999, background: accent, color: '#0a0a0f', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em', boxShadow: `0 4px 14px color-mix(in oklch, ${accent} 40%, transparent)` }}>
      ✨ AI 합성
    </div>
  )}
</div>
);

/* ── 캐릭터 + 배경 → 영상 합성 애니메이션 (레거시, 미사용) ── */
const PhotoSlot = ({ kind, label, sub, accent, anim }) => (
  <div style={{
    position: 'relative', aspectRatio: '3/4', minHeight: 200,
    borderRadius: 14, overflow: 'hidden',
    background: `linear-gradient(140deg, color-mix(in oklch, ${accent} 22%, var(--surface-2)), var(--surface))`,
    border: `1px solid color-mix(in oklch, ${accent} 35%, var(--border))`,
    boxShadow: '0 18px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
    animation: anim,
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: kind === 'character'
        ? `radial-gradient(circle at 50% 38%, color-mix(in oklch, ${accent} 50%, transparent), transparent 55%), radial-gradient(circle at 50% 90%, color-mix(in oklch, ${accent} 30%, transparent), transparent 60%)`
        : `linear-gradient(180deg, color-mix(in oklch, ${accent} 35%, var(--surface)), color-mix(in oklch, ${accent} 10%, var(--surface-2))), repeating-linear-gradient(95deg, transparent 0 30px, rgba(255,255,255,0.03) 30px 60px)`,
      animation: 'ken-burns 8s ease-in-out infinite',
    }} />
    {kind === 'character' ? (
      <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}>
        <ellipse cx="50" cy="46" rx="14" ry="16" fill="rgba(0,0,0,0.4)" />
        <path d="M22 130 C 22 92, 34 78, 50 78 C 66 78, 78 92, 78 130 Z" fill="rgba(0,0,0,0.4)" />
      </svg>
    ) : (
      <svg viewBox="0 0 100 75" preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%', opacity: 0.7 }}>
        <path d="M0 75 L15 40 L30 55 L48 25 L65 50 L82 30 L100 60 L100 75 Z" fill="rgba(0,0,0,0.45)" />
        <path d="M0 75 L20 55 L38 65 L55 48 L72 60 L88 50 L100 65 L100 75 Z" fill="rgba(0,0,0,0.55)" />
        <circle cx="78" cy="18" r="6" fill="rgba(255,255,255,0.4)" />
      </svg>
    )}
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      boxShadow: `0 0 14px ${accent}`,
      animation: 'scan-line 3s ease-in-out infinite',
    }} />
    {[
      { top: 8, left: 8, b: ['top','left'] },
      { top: 8, right: 8, b: ['top','right'] },
      { bottom: 8, left: 8, b: ['bottom','left'] },
      { bottom: 8, right: 8, b: ['bottom','right'] },
    ].map((c, i) => (
      <div key={i} style={{
        position: 'absolute', width: 10, height: 10,
        top: c.top, left: c.left, right: c.right, bottom: c.bottom,
        borderTop: c.b.includes('top') ? `1.5px solid ${accent}` : 'none',
        borderBottom: c.b.includes('bottom') ? `1.5px solid ${accent}` : 'none',
        borderLeft: c.b.includes('left') ? `1.5px solid ${accent}` : 'none',
        borderRight: c.b.includes('right') ? `1.5px solid ${accent}` : 'none',
      }} />
    ))}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '10px 12px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{label}</div>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{
        padding: '2px 6px', borderRadius: 4,
        fontSize: 8.5, fontFamily: 'monospace', fontWeight: 700,
        background: `color-mix(in oklch, ${accent} 25%, rgba(0,0,0,0.6))`,
        color: accent, letterSpacing: '0.06em',
      }}>READY</div>
    </div>
  </div>
);

const VideoOutput = () => (
  <div style={{
    position: 'relative', aspectRatio: '9/16', minHeight: 240,
    borderRadius: 16, overflow: 'hidden',
    background: 'linear-gradient(160deg, var(--surface), var(--bg-2))',
    border: '1px solid color-mix(in oklch, var(--accent) 50%, var(--border-strong))',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
    animation: 'pulse-glow 3s ease-in-out infinite',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: `
        radial-gradient(circle at 50% 38%, color-mix(in oklch, var(--mint) 45%, transparent), transparent 45%),
        linear-gradient(180deg, color-mix(in oklch, var(--orange) 30%, var(--bg-2)), color-mix(in oklch, var(--violet) 22%, var(--bg)))
      `,
      animation: 'ken-burns 6s ease-in-out infinite',
    }} />
    <svg viewBox="0 0 100 60" preserveAspectRatio="none"
      style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '38%', opacity: 0.85 }}>
      <path d="M0 60 L18 28 L34 42 L52 18 L70 38 L86 22 L100 48 L100 60 Z" fill="rgba(0,0,0,0.5)" />
      <path d="M0 60 L22 42 L40 50 L58 36 L74 46 L90 38 L100 50 L100 60 Z" fill="rgba(0,0,0,0.7)" />
    </svg>
    <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 }}>
      <ellipse cx="50" cy="62" rx="11" ry="13" fill="rgba(0,0,0,0.55)" />
      <path d="M30 130 C 30 96, 38 88, 50 88 C 62 88, 70 96, 70 130 Z" fill="rgba(0,0,0,0.55)" />
    </svg>
    <div style={{
      position: 'absolute', bottom: 56, left: 12, right: 12, textAlign: 'center',
      fontSize: 12, fontWeight: 800, color: '#fff',
      textShadow: '0 2px 6px rgba(0,0,0,0.9)', letterSpacing: '-0.01em', lineHeight: 1.3,
    }}>
      "조선시대 마지막<br/>어의의 하루"
    </div>
    <div style={{
      position: 'absolute', top: 10, left: 10, right: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{
        padding: '3px 7px', borderRadius: 4,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: '#fff', letterSpacing: '0.06em',
      }}>9:16 · 60s</div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', color: '#fff',
      }}>
        <Ico name="play" size={10} />
      </div>
    </div>
    <div style={{
      position: 'absolute', bottom: 10, left: 12, right: 12,
      height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: '38%',
        background: 'var(--accent)',
        boxShadow: '0 0 10px var(--accent)',
      }} />
    </div>
    <div style={{
      position: 'absolute', top: -10, right: 14,
      padding: '3px 9px', borderRadius: 999,
      background: 'var(--accent)', color: '#0a0a0f',
      fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em',
      boxShadow: '0 4px 14px color-mix(in oklch, var(--accent) 40%, transparent)',
    }}>
      ✨ AI 영상
    </div>
  </div>
);

const FusionAnimation = () => (
  <div style={{
    width: '100%', maxWidth: 980, position: 'relative',
    display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1.2fr',
    alignItems: 'center', gap: 28,
    padding: '40px 36px', borderRadius: 24,
    background: 'color-mix(in oklch, var(--surface) 45%, transparent)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(8px)',
    animation: 'fade-in-up 0.7s 0.3s ease both',
  }}>
    <div style={{
      position: 'absolute', top: 16, left: 20,
      fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700,
      color: 'var(--text-4)', letterSpacing: '0.14em',
    }}>AI FUSION · LIVE</div>
    <div style={{
      position: 'absolute', top: 16, right: 20,
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontFamily: 'monospace', color: 'var(--mint)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', animation: 'pulse-soft 1.5s ease infinite' }} />
      합성 중
    </div>

    <PhotoSlot kind="character" label="등장인물" sub="CAST · v3" accent="var(--mint)" anim="drift-x 4s ease-in-out infinite" />

    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'var(--surface)',
      border: '1px solid var(--border-strong)',
      display: 'grid', placeItems: 'center',
      color: 'var(--text-2)', fontSize: 18, fontWeight: 300,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>+</div>

    <PhotoSlot kind="background" label="배경" sub="LOCATION · 12" accent="var(--orange)" anim="drift-x-r 4s ease-in-out infinite" />

    <div style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 8.5, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>FUSE</div>
      <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
        <defs>
          <linearGradient id="fuseGrad" x1="0" y1="0" x2="60" y2="0">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="1"/>
            <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        <path d="M2 10 L52 10 M46 4 L52 10 L46 16" stroke="url(#fuseGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: 'var(--text-4)', letterSpacing: '0.1em' }}>~5s</div>
    </div>

    <VideoOutput />
  </div>
);

/* ── 쇼케이스 페이지 ── */
const ShowcaseCard = ({ item }) => {
  const videoRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (hovered && item.video_url) videoRef.current.play().catch(() => {});
    else if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [hovered, item.video_url]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        aspectRatio: '16/9',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'transform 0.22s, box-shadow 0.22s',
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        boxShadow: hovered ? '0 24px 56px rgba(0,0,0,0.6)' : '0 6px 20px rgba(0,0,0,0.3)',
      }}
    >
      {item.thumbnail_url && (
        <img src={item.thumbnail_url} alt={item.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {item.video_url && (
        <video ref={videoRef} src={item.video_url} muted loop playsInline
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
          }} />
      )}
      {!item.thumbnail_url && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, var(--surface-2), var(--bg-2))',
          display: 'grid', placeItems: 'center',
        }}>
          <Ico name="film" size={32} color="var(--text-4)" />
        </div>
      )}
      {/* 재생 아이콘 */}
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)',
          display: 'grid', placeItems: 'center',
        }}>
          <Ico name="play" size={18} color="#000" />
        </div>
      </div>
      {/* 하단 메타 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '28px 12px 12px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
          {item.title}
        </div>
      </div>
      {/* 상단 배지 */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        padding: '3px 8px', borderRadius: 999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
        color: '#fff', letterSpacing: '0.08em',
      }}>16:9 · AI</div>
    </div>
  );
};

// 쇼케이스에 표시할 영상/이미지를 여기에 추가하세요
// { id, title, thumbnail_url, video_url } — video_url은 없어도 됩니다
const SHOWCASE_ITEMS = [
  // 예시: { id: '1', title: '조선시대 마지막 어의', thumbnail_url: '/showcase/thumb1.jpg', video_url: '/showcase/video1.mp4' },
];

const ShowcasePage = ({ onLogin, onNav }) => {
  const isMobile = useIsMobile();
  const items = SHOWCASE_ITEMS;

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--bg)', userSelect: 'none',
    }}>
      <InjectStyle />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(800px 500px at 80% 10%, color-mix(in oklch, var(--mint) 14%, transparent), transparent 60%),
          radial-gradient(700px 500px at 10% 80%, color-mix(in oklch, var(--violet) 14%, transparent), transparent 60%)
        `,
      }} />

      <TopBar onLogin={onLogin} onNav={onNav} activePage="showcase" />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '90px 16px 48px' : '100px 32px 64px',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48, animation: 'fade-in-up 0.5s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999, marginBottom: 20,
            background: 'color-mix(in oklch, var(--mint) 10%, var(--surface))',
            border: '1px solid color-mix(in oklch, var(--mint) 30%, var(--border))',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', animation: 'pulse-soft 1.5s ease infinite' }} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'var(--mint)', letterSpacing: '0.08em' }}>
              MADE WITH AI
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px',
            letterSpacing: '-0.035em', lineHeight: 1.05,
          }}>
            AI가 만든 다큐 쇼츠
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
            한 줄 프롬프트로 시작해 완성된 영상들입니다.
          </p>
        </div>

        {/* 갤러리 */}
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text-4)', fontSize: 15,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
            아직 완성된 영상이 없습니다.<br />
            <button onClick={onLogin} style={{
              marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12, border: 'none',
              background: 'var(--mint)', color: '#0a0a0f',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
            }}>
              지금 만들어보기 →
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : 320}px, 1fr))`,
            gap: isMobile ? 12 : 16,
            animation: 'fade-in-up 0.6s 0.1s ease both',
          }}>
            {items.map(item => <ShowcaseCard key={item.id} item={item} />)}
          </div>
        )}

        {/* 하단 CTA */}
        {items.length > 0 && (
          <div style={{
            marginTop: 64, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 14,
            animation: 'fade-in-up 0.7s 0.2s ease both',
          }}>
            <button onClick={onLogin} style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '14px 36px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--violet), var(--mint))',
              color: '#0a0a0f', fontSize: 15, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,212,160,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,212,160,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,212,160,0.25)'; }}
            >
              <Ico name="google" size={18} />
              나도 만들어보기
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

/* ── 로그인 화면 (비로그인) ── */
export const OnboardingLogin = ({ onLoginClick }) => {
  const isMobile = useIsMobile();
  const typed = useTyping(SAMPLE_PROMPTS);
  const [hoveredChip, setHoveredChip] = React.useState(null);
  const [page, setPage] = React.useState('home'); // 'home' | 'showcase'
  const heroRef = React.useRef(null);

  const handleNav = (key) => {
    if (key === 'home') {
      setPage('home');
      setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 10);
    } else {
      setPage(key);
    }
  };

  if (page === 'showcase') {
    return <ShowcasePage onLogin={onLoginClick} onNav={handleNav} />;
  }

  return (
    <div ref={heroRef} style={{
      position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--bg)',
      userSelect: 'none',
    }}>
      <InjectStyle />

      {/* 배경 그라디언트 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(900px 500px at 18% 0%,   color-mix(in oklch, var(--violet) 18%, transparent), transparent 60%),
          radial-gradient(800px 500px at 85% 30%,  color-mix(in oklch, var(--mint)   14%, transparent), transparent 60%),
          radial-gradient(600px 400px at 50% 110%, color-mix(in oklch, var(--blue)   12%, transparent), transparent 70%)
        `,
      }} />
      {/* 그리드 */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }} />

      <TopBar onLogin={onLoginClick} onNav={handleNav} activePage="home" />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: isMobile ? '92px 16px 48px' : '110px 24px 64px', maxWidth: 1100, margin: '0 auto',
      }}>
        {/* 배지 */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '6px 14px', borderRadius: 999,
          background: 'color-mix(in oklch, var(--mint) 10%, var(--surface))',
          border: '1px solid color-mix(in oklch, var(--mint) 30%, var(--border))',
          marginBottom: 28, animation: 'fade-in-up 0.5s ease both',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mint)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
            OPEN BETA
          </div>
        </div>

        {/* 헤드라인 */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, margin: '0 0 20px',
          letterSpacing: '-0.04em', lineHeight: 1.02, textAlign: 'center',
          animation: 'fade-in-up 0.6s 0.05s ease both',
        }}>
          한 줄 프롬프트로,<br />
          <span style={{
            background: 'linear-gradient(110deg, var(--violet), var(--mint) 55%, var(--violet))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            시나리오부터 영상까지.
          </span>
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--text-3)', textAlign: 'center',
          margin: '0 0 40px', lineHeight: 1.6, maxWidth: 620,
          animation: 'fade-in-up 0.6s 0.1s ease both',
        }}>
          시나리오 · 캐릭터 · 배경 · 씬 · 렌더까지 5단계 파이프라인을<br />
          AI가 자동으로 실행합니다. 당신은 주제만 던지세요.
        </p>

        {/* 프롬프트 컴포저 */}
        <div style={{
          width: '100%', maxWidth: 720, marginBottom: 22,
          animation: 'fade-in-up 0.6s 0.15s ease both',
        }}>
          <div style={{
            background: 'color-mix(in oklch, var(--surface) 80%, transparent)',
            border: '1px solid var(--border-strong)',
            borderRadius: 18, padding: 6,
            boxShadow: '0 30px 80px rgba(0,0,0,0.4), 0 0 0 6px color-mix(in oklch, var(--mint) 8%, transparent)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'flex-start',
              gap: isMobile ? 12 : 14,
              padding: isMobile ? '14px 14px' : '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: 'color-mix(in oklch, var(--violet) 22%, var(--surface-2))',
                  border: '1px solid color-mix(in oklch, var(--violet) 40%, var(--border))',
                  color: 'var(--violet)', display: 'grid', placeItems: 'center',
                }}>
                  <Ico name="sparkle" size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.14em', marginBottom: 6 }}>
                    쇼츠 주제
                  </div>
                  <div style={{
                    fontSize: isMobile ? 16 : 18,
                    color: 'var(--text)', minHeight: 28, lineHeight: 1.4, fontWeight: 500,
                    overflowWrap: 'break-word',
                  }}>
                    {typed}
                    <span style={{
                      display: 'inline-block', width: 2, height: 18, background: 'var(--mint)',
                      verticalAlign: -3, marginLeft: 2, animation: 'blink-caret 1s step-end infinite',
                    }} />
                  </div>
                </div>
              </div>
              <button onClick={onLoginClick} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: isMobile ? '12px 18px' : '10px 18px',
                borderRadius: 12, border: 'none',
                background: 'var(--mint)', color: '#0a0a0f',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 18px color-mix(in oklch, var(--mint) 35%, transparent)',
                alignSelf: isMobile ? 'stretch' : 'flex-end',
                width: isMobile ? '100%' : 'auto',
              }}>
                만들기
                <Ico name="arrow" size={14} stroke={2.4} />
              </button>
            </div>

            {/* 옵션 바 */}
            <div style={{
              borderTop: '1px solid var(--border)',
              padding: isMobile ? '10px 12px' : '10px 16px',
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              fontSize: 11, fontFamily: 'monospace', color: 'var(--text-4)',
            }}>
              {[
                { label: '9:16',   active: true  },
                { label: '60초',   active: true  },
                { label: '한국어', active: true  },
                { label: '자막',   active: true  },
                { label: 'BGM',    active: false },
              ].map((o, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: 6,
                  background: o.active ? 'color-mix(in oklch, var(--mint) 8%, var(--surface-2))' : 'transparent',
                  border: `1px solid ${o.active ? 'color-mix(in oklch, var(--mint) 22%, var(--border))' : 'var(--border)'}`,
                  color: o.active ? 'var(--mint)' : 'var(--text-3)',
                  fontWeight: 600, letterSpacing: '0.02em',
                }}>{o.label}</span>
              ))}
              <span style={{
                marginLeft: isMobile ? 0 : 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', animation: 'pulse-soft 1.5s ease infinite' }} />
                예상 5분
              </span>
            </div>
          </div>
        </div>

        {/* 추천 칩 */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          maxWidth: 720, marginBottom: 48,
          animation: 'fade-in-up 0.6s 0.2s ease both',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-4)', alignSelf: 'center', marginRight: 4, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            EXAMPLES →
          </span>
          {['고려 시대 비밀 첩보전', '심해 미확인 생물', '대공황 첫 24시간', '북극 광산의 진실'].map((p, i) => (
            <button key={p}
              onMouseEnter={() => setHoveredChip(i)}
              onMouseLeave={() => setHoveredChip(null)}
              onClick={onLoginClick}
              style={{
                padding: '7px 14px', borderRadius: 999,
                background: hoveredChip === i ? 'var(--surface-2)' : 'var(--surface)',
                border: `1px solid ${hoveredChip === i ? 'var(--border-strong)' : 'var(--border)'}`,
                fontSize: 12, color: 'var(--text-2)', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>{p}</button>
          ))}
        </div>

        {/* 파이프라인 */}
        <div style={{
          width: '100%', maxWidth: 980, padding: isMobile ? 18 : 28, borderRadius: 20, marginTop: isMobile ? 24 : 40,
          background: 'color-mix(in oklch, var(--surface) 50%, transparent)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
          animation: 'fade-in-up 0.7s 0.4s ease both',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.14em', marginBottom: 4 }}>
              AUTOMATED PIPELINE
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>5단계 모두 AI가 자동으로 실행합니다</div>
          </div>
          <PipelineFlow active={2} />
        </div>

        {/* 합성 데모 — 실제 intro 이미지로 인물+배경→씬 표시 */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <IntroSlideshow />
        </div>

        {/* 로그인 CTA */}
        <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 400 }}>
          <button onClick={onLoginClick} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '14px 36px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, var(--violet), var(--mint))',
            color: '#0a0a0f', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', letterSpacing: '-0.01em',
            width: isMobile ? '100%' : 'auto',
            boxShadow: '0 8px 32px rgba(0,212,160,0.25)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,212,160,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,212,160,0.25)'; }}
          >
            <Ico name="google" size={18} />
            Google 로그인으로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── 로그인된 신규 사용자 온보딩 (Dashboard에서 프로젝트 0개일 때) ── */
export const Onboarding = ({ onNew }) => {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = React.useState(null);

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '32px 16px' : '48px 24px',
      background: 'var(--bg)',
      userSelect: 'none',
    }}>
      <InjectStyle />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(700px 400px at 50% 0%, color-mix(in oklch, var(--violet) 12%, transparent), transparent 60%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
          <Wordmark size={isMobile ? 16 : 18} />
          <p style={{
            fontSize: isMobile ? 14 : 15,
            color: 'var(--text-3)', margin: '16px 0 0', lineHeight: 1.6,
            padding: isMobile ? '0 8px' : 0,
          }}>
            {isMobile ? (
              '주제 하나를 입력하면 시나리오부터 최종 영상까지 AI가 자동으로 만들어 드립니다'
            ) : (
              <>
                주제 하나를 입력하면 시나리오부터 최종 영상까지<br />
                AI가 자동으로 만들어 드립니다
              </>
            )}
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', gap: 0,
          marginBottom: isMobile ? 32 : 48,
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          justifyContent: 'center',
          maxWidth: 860, width: '100%',
        }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step.key}>
              <div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  alignItems: 'center',
                  gap: isMobile ? 14 : 10,
                  padding: isMobile ? '14px 16px' : '20px 16px',
                  borderRadius: 14,
                  background: hovered === i ? `color-mix(in oklch, ${step.color} 8%, var(--surface))` : 'var(--surface)',
                  border: `1px solid ${hovered === i ? `color-mix(in oklch, ${step.color} 50%, var(--border))` : 'var(--border)'}`,
                  transition: 'all 0.18s',
                  width: isMobile ? '100%' : 132,
                  maxWidth: isMobile ? 360 : undefined,
                  cursor: 'default',
                  boxShadow: hovered === i ? `0 0 0 4px color-mix(in oklch, ${step.color} 12%, transparent)` : 'none',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `color-mix(in oklch, ${step.color} 15%, var(--surface-2))`,
                  border: `1.5px solid color-mix(in oklch, ${step.color} 35%, var(--border))`,
                  display: 'grid', placeItems: 'center',
                  color: hovered === i ? step.color : 'var(--text-3)',
                  transition: 'color 0.18s',
                }}>
                  <Ico name={step.icon} size={20} />
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? 2 : 6,
                  flex: isMobile ? 1 : undefined, minWidth: 0,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', color: step.color, letterSpacing: '0.1em' }}>
                    STEP {i + 1}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{step.label}</div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-4)',
                    textAlign: isMobile ? 'left' : 'center', lineHeight: 1.6,
                  }}>
                    {step.desc}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  color: 'var(--border-strong)', fontSize: 16,
                  flexShrink: 0,
                  padding: isMobile ? 0 : '0 4px',
                  margin: isMobile ? '6px 0' : '-12px 0 0',
                  transform: isMobile ? 'rotate(90deg)' : 'none',
                }}>›</div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 360 }}>
          <button
            onClick={onNew}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: isMobile ? '14px 24px' : '14px 32px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--violet), var(--mint))',
              color: '#000', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '-0.01em',
              width: isMobile ? '100%' : 'auto',
              boxShadow: '0 8px 32px rgba(0,212,160,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,212,160,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,212,160,0.25)'; }}
          >
            <span style={{ fontSize: 18 }}>＋</span>
            첫 번째 프로젝트 시작하기
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, textAlign: 'center' }}>
            제목 하나만 입력하면 됩니다 — 나머지는 AI가
          </p>
        </div>
      </div>
    </div>
  );
};
