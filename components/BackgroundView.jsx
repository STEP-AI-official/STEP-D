/* Background view — scene-by-scene image generation with composition variants */

const BackgroundView = ({ scenes }) => {
  const [selectedScene, setSelectedScene] = React.useState(scenes[2]);
  const [selectedVariant, setSelectedVariant] = React.useState(0);
  const [regen, setRegen] = React.useState(false);

  const sceneCovers = ['rose', 'orange', 'mint', 'violet', 'blue', 'rose', 'orange', 'mint', 'violet'];

  const doRegen = () => {
    setRegen(true);
    setTimeout(() => setRegen(false), 2600);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>배경 · 구도 생성</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>씬별 이미지 {scenes.length * 3}컷 · 27/27 생성 완료</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm"><Icon name="grid" size={12} />전체 보기</button>
            <button className="btn sm primary"><Icon name="check" size={12} />확정</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Scene selector strip */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, paddingBottom: 8, overflowX: 'auto' }}>
            {scenes.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setSelectedScene(s)}
                style={{
                  flexShrink: 0, cursor: 'pointer',
                  width: 120, padding: 6, borderRadius: 'var(--r-sm)',
                  border: `1px solid ${selectedScene.id === s.id ? 'var(--mint)' : 'var(--border)'}`,
                  background: selectedScene.id === s.id ? 'color-mix(in oklch, var(--mint) 8%, var(--surface))' : 'var(--surface)'
                }}
              >
                <div className={'img-ph ' + sceneCovers[i]} style={{ aspectRatio: '9/16', marginBottom: 6, borderRadius: 4 }} />
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>S{String(s.num).padStart(2, '0')}</div>
                <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
              </div>
            ))}
          </div>

          {/* Selected scene detail */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--orange)', background: 'var(--orange-soft)', padding: '2px 8px', borderRadius: 4 }}>
              SCENE {String(selectedScene.num).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{selectedScene.location}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 20px', letterSpacing: '-0.02em' }}>{selectedScene.title}</h1>

          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>3가지 구도 변형 · 원하는 것을 선택하세요</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[0, 1, 2].map(v => (
              <div
                key={v}
                onClick={() => setSelectedVariant(v)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <div
                  className={'img-ph ' + sceneCovers[selectedScene.num - 1] + (regen ? ' shimmer' : '')}
                  style={{
                    aspectRatio: '9/16',
                    borderRadius: 'var(--r-md)',
                    border: `2px solid ${selectedVariant === v ? 'var(--mint)' : 'transparent'}`,
                    boxShadow: selectedVariant === v ? '0 0 0 3px color-mix(in oklch, var(--mint) 20%, transparent)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {!regen && <span className="ph-label">{selectedScene.location.split('/')[0].trim()} · V{v + 1}</span>}
                  {selectedVariant === v && !regen && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--mint)', color: 'oklch(0.15 0.01 160)',
                      display: 'grid', placeItems: 'center'
                    }}>
                      <Icon name="check" size={14} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>V{v + 1} · {['로우 앵글', '아이레벨', '하이 앵글'][v]}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{['35mm', '50mm', '85mm'][v]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* side prompt */}
      <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>생성 프롬프트</div>
          <div className="panel" style={{ padding: 12, fontSize: 12, lineHeight: 1.6, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
            편의점 내부, 밤, 형광등 조명, 우산 코너 앞에 서 있는 서연과 지훈, 손이 투명 우산에 동시에 닿는 순간, 35mm 아이레벨, 시네마틱, 얕은 심도, 따뜻한 색조
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>스타일 프리셋</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { name: 'K-드라마 시네마틱', active: true },
              { name: '애니메이션 스타일', active: false },
              { name: '빈티지 필름', active: false },
              { name: '네온 사이버펑크', active: false }
            ].map(p => (
              <div key={p.name} style={{
                padding: '8px 12px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: p.active ? 'color-mix(in oklch, var(--mint) 8%, var(--surface))' : 'var(--surface)',
                borderColor: p.active ? 'var(--mint)' : 'var(--border)',
                fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
              }}>
                {p.active && <Icon name="check" size={11} style={{ color: 'var(--mint)' }} />}
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>캐릭터</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ n: '서연', c: 'mint' }, { n: '지훈', c: 'blue' }].map(c => (
              <div key={c.n} className="chip" style={{ padding: '4px 8px 4px 4px', gap: 6 }}>
                <Avatar name={c.n} chip={c.c} size={18} />
                {c.n}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn" onClick={doRegen} disabled={regen}>
            {regen ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }}/> : <Icon name="refresh" size={13} />}
            이 씬 다시 생성
          </button>
          <button className="btn primary">
            <Icon name="check" size={13} />
            이 구도로 확정
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center' }}>크레딧 2 사용 · 남은 840cr</div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { BackgroundView });
