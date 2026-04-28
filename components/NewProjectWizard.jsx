/* New project wizard — calls POST /api/jobs */

const NewProjectWizard = ({ onCreated, onClose }) => {
  const [step, setStep] = React.useState(1);
  const [topic, setTopic] = React.useState('비 오는 밤, 편의점에서 마지막 우산을 두고 마주친 두 사람의 이야기');
  const [genre, setGenre] = React.useState('K-드라마 · 로맨스');
  const [duration, setDuration] = React.useState(60);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const job = await api.post('/api/jobs', { topic, genre, duration });
      onCreated(job);
    } catch (e) {
      setError(e.message || '작업 생성 실패');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel" style={{ width: 'min(680px, 92vw)', boxShadow: 'var(--shadow-pop)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkles" size={16} style={{ color: 'var(--mint)' }}/>
          <div style={{ fontSize: 14, fontWeight: 600 }}>새 쇼츠 만들기</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>STEP {step} / 2</div>
          <button className="btn ghost icon sm" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        {step === 1 && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>어떤 이야기를 만들고 싶으세요?</div>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: 14, fontSize: 14, lineHeight: 1.6,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', resize: 'none', outline: 'none'
              }}
              placeholder="예: 비 오는 밤 편의점에서 마주친 두 사람..."
            />

            <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>장르</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {['K-드라마 · 로맨스', '시트콤', '공포', '잔잔 드라마', '코미디', '청춘'].map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={'chip ' + (genre === g ? 'mint' : '')}
                  style={{ cursor: 'pointer', padding: '5px 10px' }}
                >{g}</button>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>길이</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[30, 60, 90].map(d => (
                    <button key={d} className={'btn sm ' + (duration === d ? 'primary' : '')} onClick={() => setDuration(d)} style={{ flex: 1 }}>{d}초</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>화면비</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['9:16', '1:1', '16:9'].map(a => (
                    <button key={a} className={'btn sm ' + (a === '9:16' ? 'primary' : '')} style={{ flex: 1 }}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: 24, minHeight: 240 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '40px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '3px solid var(--surface-3)', borderTopColor: 'var(--mint)',
                  animation: 'spin 1.2s linear infinite'
                }}/>
                <div style={{ fontSize: 14, fontWeight: 600 }}>작업 생성 중...</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                  시나리오 생성 작업을 서버에 등록하고 있어요.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>주제</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)' }}>{topic}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { icon: 'doc', label: '시나리오', value: '자동 생성' },
                    { icon: 'user', label: '등장인물', value: 'AI 캐스팅' },
                    { icon: 'camera', label: '영상 클립', value: '씬별 생성' }
                  ].map(s => (
                    <div key={s.label} className="panel" style={{ padding: 12, textAlign: 'center' }}>
                      <Icon name={s.icon} size={18} style={{ color: 'var(--mint)' }}/>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'color-mix(in oklch, var(--rose) 10%, var(--surface))', border: '1px solid var(--rose)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--rose)' }}>
                    {error}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="zap" size={12} style={{ color: 'var(--orange)' }}/>
                  <span>장르: {genre} · {duration}초</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {step === 2 && !loading && <button className="btn sm" onClick={() => { setStep(1); setError(null); }}>이전</button>}
          {step === 1 && <button className="btn sm primary" onClick={() => setStep(2)} disabled={!topic.trim()}>다음</button>}
          {step === 2 && !loading && (
            <button className="btn sm primary" onClick={create}>
              <Icon name="sparkles" size={12}/>생성 시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NewProjectWizard });
