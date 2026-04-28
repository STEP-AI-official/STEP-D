/* Tweaks panel for ShortsForge */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "mint",
  "density": "comfortable",
  "sidebarVariant": "default",
  "bgTone": "cool",
  "showGridBg": true
}/*EDITMODE-END*/;

const accentOptions = [
  { id: 'mint', label: '민트', hue: 160 },
  { id: 'blue', label: '블루', hue: 240 },
  { id: 'violet', label: '바이올렛', hue: 285 },
  { id: 'orange', label: '오렌지', hue: 45 },
  { id: 'rose', label: '로즈', hue: 15 }
];

const applyTweaks = (t) => {
  const root = document.documentElement;
  const acc = accentOptions.find(a => a.id === t.accentColor) || accentOptions[0];
  // remap --mint to chosen accent
  root.style.setProperty('--mint', `oklch(0.78 0.17 ${acc.hue})`);
  root.style.setProperty('--mint-soft', `oklch(0.35 0.08 ${acc.hue})`);

  // density
  if (t.density === 'compact') {
    root.style.setProperty('--r-md', '8px');
  } else {
    root.style.setProperty('--r-md', '10px');
  }

  // bg tone
  const bgHue = t.bgTone === 'warm' ? 40 : t.bgTone === 'neutral' ? 280 : 260;
  const chroma = t.bgTone === 'neutral' ? 0.005 : 0.012;
  root.style.setProperty('--bg', `oklch(0.17 ${chroma} ${bgHue})`);
  root.style.setProperty('--bg-2', `oklch(0.19 ${chroma} ${bgHue})`);
  root.style.setProperty('--surface', `oklch(0.21 ${chroma + 0.002} ${bgHue})`);
};

const TweaksPanel = ({ tweaks, setTweaks, onClose }) => {
  const update = (key, val) => {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    applyTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      width: 280, background: 'var(--surface)',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-pop)',
      overflow: 'hidden',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-2)' }}>
        <Icon name="wand" size={14} style={{ color: 'var(--mint)' }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Tweaks</div>
        <button className="btn ghost icon sm" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={12} /></button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>액센트 컬러</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {accentOptions.map(a => (
              <button key={a.id}
                onClick={() => update('accentColor', a.id)}
                title={a.label}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `oklch(0.78 0.17 ${a.hue})`,
                  border: `2px solid ${tweaks.accentColor === a.id ? 'var(--text)' : 'transparent'}`,
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>배경 톤</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'cool', label: '차가운' },
              { id: 'neutral', label: '뉴트럴' },
              { id: 'warm', label: '따뜻한' }
            ].map(t => (
              <button key={t.id}
                className={'btn sm ' + (tweaks.bgTone === t.id ? 'primary' : '')}
                onClick={() => update('bgTone', t.id)}
                style={{ flex: 1 }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>밀도</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'comfortable', label: '편안' },
              { id: 'compact', label: '컴팩트' }
            ].map(d => (
              <button key={d.id}
                className={'btn sm ' + (tweaks.density === d.id ? 'primary' : '')}
                onClick={() => update('density', d.id)}
                style={{ flex: 1 }}
              >{d.label}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', marginTop: 2 }}>
          변경사항은 자동 저장됩니다
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TweaksPanel, TWEAK_DEFAULTS, applyTweaks });
