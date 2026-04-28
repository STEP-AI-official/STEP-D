/* Characters view — loads cast images from /api/jobs/{id}/cast */

const CharactersView = ({ job, onJobUpdate }) => {
  const [castData, setCastData] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [approving, setApproving] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false);

  const jobId = job?.id;
  const jobStatus = job?.status || '';

  const loadCast = React.useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await api.get(`/api/jobs/${jobId}/cast`);
      const list = Array.isArray(data) ? data : (data.characters || data.cast || []);
      setCastData(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
      setError(null);
    } catch (e) {
      if (!e.message?.includes('404')) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    setLoading(true);
    setCastData(null);
    loadCast();
  }, [loadCast]);

  // SSE stream for cast generation
  React.useEffect(() => {
    if (!jobId) return;
    if (!jobStatus.includes('cast_generating')) return;
    setStreaming(true);
    const es = api.sse(
      `/api/jobs/${jobId}/cast/stream`,
      (data) => {
        try {
          const obj = JSON.parse(data);
          if (obj.done) { setStreaming(false); loadCast(); }
          else if (obj.character) {
            setCastData(prev => {
              const arr = prev || [];
              const idx = arr.findIndex(c => c.id === obj.character.id);
              if (idx >= 0) { const n = [...arr]; n[idx] = obj.character; return n; }
              return [...arr, obj.character];
            });
          }
        } catch {}
      },
      () => { setStreaming(false); loadCast(); }
    );
    return () => es.close();
  }, [jobId, jobStatus, loadCast]);

  const approve = async () => {
    setApproving(true);
    try {
      const updated = await api.post(`/api/jobs/${jobId}/cast/approve`);
      if (onJobUpdate) onJobUpdate(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    setCastData(null);
    try {
      await api.post(`/api/jobs/${jobId}/cast/regenerate`);
      if (onJobUpdate) {
        const updJob = await api.get(`/api/jobs/${jobId}`);
        onJobUpdate(updJob);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  };

  const castApproved = jobStatus === 'cast_done' || (!jobStatus.startsWith('cast') && !jobStatus.startsWith('scenario'));
  const characters = castData || [];
  const chipColors = ['mint', 'blue', 'orange', 'violet', 'rose'];

  if (loading && !streaming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>캐스트 불러오는 중...</div>
      </div>
    );
  }

  if (!characters.length && !streaming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
        <Icon name="user" size={32} style={{ color: 'var(--text-4)' }}/>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          {jobStatus.startsWith('scenario') ? '시나리오를 먼저 확정해주세요' : '등장인물이 없습니다'}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--rose)' }}>{error}</div>}
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>작업 상태: {jobStatus}</div>
      </div>
    );
  }

  const sel = selected || characters[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>등장인물</div>
          <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>{characters.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {characters.map((c, i) => {
            const chip = c.chip || chipColors[i % chipColors.length];
            const isSelected = sel && (sel.id === c.id || sel === c);
            return (
              <div
                key={c.id || i}
                className="panel"
                style={{ padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderColor: isSelected ? `var(--${chip})` : 'var(--border)' }}
                onClick={() => setSelected(c)}
              >
                {c.thumbnail ? (
                  <img src={api.mediaUrl(jobId, c.thumbnail)} alt={c.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid var(--${chip})` }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Avatar name={c.name} chip={chip} size={36} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.role}</div>
                </div>
                {streaming && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/>}
              </div>
            );
          })}
        </div>

        {streaming && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }}/>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>이미지 생성 중...</div>
          </div>
        )}

        {!streaming && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'color-mix(in oklch, var(--mint) 5%, var(--surface))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              <Icon name="lock" size={12} style={{ color: 'var(--mint)' }} /> 캐릭터 일관성 락
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
              모든 씬에서 같은 얼굴과 의상이 유지됩니다.
            </div>
          </div>
        )}
      </div>

      {/* Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)' }}>
          {sel && (
            <>
              <Avatar name={sel.name} chip={sel.chip || 'mint'} size={34} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sel.role}</div>
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm" onClick={regenerate} disabled={regenerating || streaming}>
              {regenerating ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/> : <Icon name="refresh" size={12} />}
              다시 생성
            </button>
            {!castApproved && !streaming && (
              <button className="btn sm primary" onClick={approve} disabled={approving}>
                {approving ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/> : <Icon name="check" size={12} />}
                확정 → 영상 생성 시작
              </button>
            )}
            {castApproved && <span className="chip mint"><Icon name="check" size={10}/>확정됨</span>}
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 24px', background: 'color-mix(in oklch, var(--rose) 8%, var(--surface))', fontSize: 12, color: 'var(--rose)', borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
          {sel && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  AI 프롬프트 · 시나리오 기반 자동 생성됨
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  {sel.description || sel.desc || ''}
                </div>
                {sel.tags && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {sel.tags.map(t => <span key={t} className="chip">{t}</span>)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>레퍼런스 이미지</div>
                <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>
                  {(sel.images || sel.refs || []).length}컷
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {(sel.images || sel.refs || []).map((img, i) => {
                  const chip = sel.chip || chipColors[(characters.indexOf(sel)) % chipColors.length] || 'mint';
                  const isUrl = typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'));
                  const imgPath = typeof img === 'object' ? img.path : img;
                  const label = typeof img === 'object' ? (img.angle || img.label || `컷 ${i+1}`) : `컷 ${i+1}`;
                  return (
                    <div key={i} style={{ position: 'relative' }}>
                      {imgPath ? (
                        <img
                          src={isUrl ? imgPath : api.mediaUrl(jobId, imgPath)}
                          alt={label}
                          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 6, marginBottom: 6 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className={'img-ph ' + chip + (streaming ? ' shimmer' : '')} style={{ aspectRatio: '3/4', marginBottom: 6 }}>
                          {!streaming && <span className="ph-label">{sel.name} · {label}</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CharactersView });
