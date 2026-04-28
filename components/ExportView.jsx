/* Export view — final compose & download */

const ExportView = ({ scenes }) => {
  const [format, setFormat] = React.useState('mp4');
  const [aspect, setAspect] = React.useState('9:16');
  const [quality, setQuality] = React.useState('1080p');
  const [captions, setCaptions] = React.useState(true);
  const [bgm, setBgm] = React.useState(true);
  const [composing, setComposing] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const totalDuration = scenes.reduce((a, s) => a + s.duration, 0);

  const startCompose = () => {
    setComposing(true); setDone(false);
    setTimeout(() => { setComposing(false); setDone(true); }, 3000);
  };

  return (
    <div style={{ padding: '32px 40px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>마지막 단계</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>합성하고 내보내기</h1>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>9개 씬을 하나의 영상으로 합치고, 자막과 BGM을 얹어 완성합니다.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginTop: 28 }}>
          {/* Preview */}
          <div>
            <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="img-ph rose" style={{ aspectRatio: '9/16', maxHeight: 540, margin: '0 auto', width: '100%', borderRadius: 8 }}>
                <span className="ph-label">최종 합성 · 9씬</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-3)', justifyContent: 'center' }}>
                <span><Icon name="clock" size={11} style={{ verticalAlign: -1 }} /> {totalDuration.toFixed(1)}초</span>
                <span><Icon name="film" size={11} style={{ verticalAlign: -1 }} /> {scenes.length}씬</span>
                <span><Icon name="cube" size={11} style={{ verticalAlign: -1 }} /> {aspect} · {quality}</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>포맷</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['mp4', 'mov', 'webm'].map(f => (
                  <button key={f} className={'btn sm ' + (format === f ? 'primary' : '')} onClick={() => setFormat(f)} style={{ flex: 1 }}>{f.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>화면비</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['9:16', '1:1', '16:9'].map(a => (
                  <button key={a} className={'btn sm ' + (aspect === a ? 'primary' : '')} onClick={() => setAspect(a)} style={{ flex: 1 }}>{a}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>화질</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['720p', '1080p', '4K'].map(q => (
                  <button key={q} className={'btn sm ' + (quality === q ? 'primary' : '')} onClick={() => setQuality(q)} style={{ flex: 1 }}>{q}</button>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { k: 'captions', label: '자동 자막', on: captions, toggle: () => setCaptions(c => !c) },
                { k: 'bgm', label: 'BGM (감성 피아노)', on: bgm, toggle: () => setBgm(b => !b) },
                { k: 'watermark', label: '워터마크 제거', on: false, locked: true }
              ].map(row => (
                <div key={row.k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 13, flex: 1 }}>{row.label}</div>
                  {row.locked ? (
                    <span className="chip orange"><Icon name="lock" size={10}/>Pro</span>
                  ) : (
                    <button
                      onClick={row.toggle}
                      style={{
                        width: 34, height: 18, borderRadius: 12,
                        background: row.on ? 'var(--mint)' : 'var(--surface-3)',
                        position: 'relative', cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2, left: row.on ? 18 : 2,
                        width: 14, height: 14, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.15s'
                      }}/>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="zap" size={14} style={{ color: 'var(--orange)' }}/>
              <div>합성 예상: 약 <b style={{ color: 'var(--text)' }}>1분 40초</b> · 크레딧 <b style={{ color: 'var(--text)' }}>4</b> 사용</div>
            </div>

            {done ? (
              <div className="panel" style={{ padding: 14, background: 'color-mix(in oklch, var(--mint) 8%, var(--surface))', borderColor: 'var(--mint-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--mint)', marginBottom: 6 }}>
                  <Icon name="check" size={14}/>합성 완료
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  비오는날의편의점_final.mp4 · 14.2MB
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm primary" style={{ flex: 1 }}><Icon name="download" size={12}/>다운로드</button>
                  <button className="btn sm" style={{ flex: 1 }}><Icon name="play" size={11}/>미리보기</button>
                </div>
              </div>
            ) : (
              <button
                className="btn primary"
                style={{ padding: '12px', fontSize: 14, justifyContent: 'center' }}
                onClick={startCompose}
                disabled={composing}
              >
                {composing ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }}/>
                    <span>합성 중...</span>
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" size={14}/>
                    <span>합성 시작</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ExportView });
