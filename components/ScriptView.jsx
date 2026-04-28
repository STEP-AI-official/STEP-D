/* Script view — loads scenario from API, supports SSE streaming */

const SceneCard = ({ scene, selected, onSelect }) => {
  const statusColor = {
    done: 'var(--mint)', rendering: 'var(--orange)', queued: 'var(--text-4)'
  }[scene.status] || 'var(--text-4)';
  return (
    <div
      className="panel"
      style={{
        padding: 12, cursor: 'pointer',
        borderColor: selected ? 'var(--mint)' : 'var(--border)',
        boxShadow: selected ? '0 0 0 3px color-mix(in oklch, var(--mint) 15%, transparent)' : 'none',
        transition: 'all 0.12s'
      }}
      onClick={() => onSelect(scene)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)',
          background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4
        }}>S{String(scene.scene_number || scene.num || 1).padStart(2, '0')}</span>
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{scene.title}</span>
        {scene.duration != null && (
          <span style={{ fontSize: 11, color: statusColor, fontFamily: 'var(--font-mono)' }}>
            {parseFloat(scene.duration).toFixed(1)}s
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{scene.location}</div>
    </div>
  );
};

const ScriptView = ({ job, onJobUpdate }) => {
  const [scenario, setScenario] = React.useState(null);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [showPdf, setShowPdf] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [approving, setApproving] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  const jobId = job?.id;
  const jobStatus = job?.status || '';

  const loadScenario = React.useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await api.get(`/api/jobs/${jobId}/scenario`);
      setScenario(data);
      if (data.scenes?.length > 0) setSelected(data.scenes[0]);
      setError(null);
    } catch (e) {
      if (!e.message?.includes('404')) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    setLoading(true);
    setScenario(null);
    loadScenario();
  }, [loadScenario]);

  // Start SSE stream if scenario is being generated
  React.useEffect(() => {
    if (!jobId) return;
    if (!jobStatus.includes('scenario_generating')) return;
    setStreaming(true);
    setStreamText('');
    const es = api.sse(
      `/api/jobs/${jobId}/scenario/stream`,
      (data) => {
        try {
          const obj = JSON.parse(data);
          if (obj.done) {
            setStreaming(false);
            loadScenario();
          } else if (obj.text) {
            setStreamText(prev => prev + obj.text);
          }
        } catch {
          setStreamText(prev => prev + data);
        }
      },
      () => { setStreaming(false); loadScenario(); }
    );
    return () => es.close();
  }, [jobId, jobStatus, loadScenario]);

  const approve = async () => {
    setApproving(true);
    try {
      const updated = await api.post(`/api/jobs/${jobId}/scenario/approve`);
      if (onJobUpdate) onJobUpdate(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    setScenario(null);
    setStreamText('');
    try {
      await api.post(`/api/jobs/${jobId}/scenario/regenerate`);
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

  const downloadPdf = () => {
    window.open(`${API_BASE}/api/jobs/${jobId}/scenario/pdf`, '_blank');
  };

  const scenes = scenario?.scenes || [];
  const scenarioApproved = jobStatus === 'scenario_done' || !jobStatus.startsWith('scenario');

  if (loading && !streaming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>시나리오 불러오는 중...</div>
      </div>
    );
  }

  if (streaming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1.2s linear infinite' }}/>
        <div style={{ fontSize: 14, fontWeight: 600 }}>시나리오 작성 중...</div>
        <pre style={{
          maxWidth: 640, width: '100%',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          padding: 16, fontSize: 12, lineHeight: 1.7, overflowY: 'auto', maxHeight: 400,
          fontFamily: 'var(--font-mono)', color: 'var(--text-2)', whiteSpace: 'pre-wrap'
        }}>{streamText}<span style={{ borderRight: '2px solid var(--mint)', animation: 'blink 1s step-end infinite' }}> </span></pre>
      </div>
    );
  }

  if (!scenario && error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
        <Icon name="doc" size={32} style={{ color: 'var(--text-4)' }}/>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>시나리오를 불러올 수 없습니다</div>
        <div style={{ fontSize: 12, color: 'var(--rose)' }}>{error}</div>
        <button className="btn sm" onClick={loadScenario}>다시 시도</button>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
        <Icon name="doc" size={32} style={{ color: 'var(--text-4)' }}/>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>시나리오가 아직 없습니다</div>
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>작업 상태: {jobStatus || '알 수 없음'}</div>
      </div>
    );
  }

  const sel = selected || scenes[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100%', overflow: 'hidden' }}>
      {/* Scene list */}
      <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>씬 목록</div>
          <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 6 }}>{scenes.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scenes.map((s, i) => (
            <SceneCard key={s.id || i} scene={s} selected={sel && (sel.id === s.id || sel === s)} onSelect={setSelected} />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>
              시나리오 · {scenes.length}씬
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{job?.topic || '시나리오'}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm" onClick={regenerate} disabled={regenerating}>
              {regenerating ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/> : <Icon name="refresh" size={12} />}
              AI 다시 쓰기
            </button>
            <button className="btn sm" onClick={() => setShowPdf(true)}>
              <Icon name="doc" size={12} />PDF 미리보기
            </button>
            {!scenarioApproved && (
              <button className="btn sm primary" onClick={approve} disabled={approving}>
                {approving ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/> : <Icon name="check" size={12} />}
                확정 → 캐스팅 시작
              </button>
            )}
            {scenarioApproved && (
              <span className="chip mint"><Icon name="check" size={10}/>확정됨</span>
            )}
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 24px', background: 'color-mix(in oklch, var(--rose) 8%, var(--surface))', fontSize: 12, color: 'var(--rose)', borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px' }}>
          {sel && (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 20,
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>장소</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{sel.location}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>카메라</div>
                  <div style={{ fontSize: 13 }}>{sel.camera}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>무드</div>
                  <div style={{ fontSize: 13 }}>{sel.mood}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--violet)', background: 'var(--violet-soft)', padding: '2px 8px', borderRadius: 4 }}>
                  SCENE {String(sel.scene_number || sel.num || '').padStart(2, '0')}
                </span>
                {sel.duration != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>{parseFloat(sel.duration).toFixed(1)}초</span>
                )}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 20px', letterSpacing: '-0.02em' }}>{sel.title}</h1>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>지문</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                  {sel.action}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>대사</span>
                  <span style={{ color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0 }}>{(sel.dialogue || []).length}줄</span>
                </div>
                {(!sel.dialogue || sel.dialogue.length === 0) ? (
                  <div style={{ padding: 14, border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-4)', fontSize: 13, textAlign: 'center' }}>
                    대사 없음 · 인서트 씬
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sel.dialogue.map((d, i) => (
                      <div key={i} style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <div style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.who || d.character}</div>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>"{d.line || d.text}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPdf && <PdfModal jobId={jobId} scenes={scenes} topic={job?.topic} onDownload={downloadPdf} onClose={() => setShowPdf(false)} />}
    </div>
  );
};

const PdfModal = ({ jobId, scenes, topic, onDownload, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div
      className="panel"
      style={{ width: 'min(820px, 92vw)', maxHeight: '88vh', boxShadow: 'var(--shadow-pop)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="doc" size={16} style={{ color: 'var(--text-3)' }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>시나리오 PDF</div>
        <span className="chip">{scenes.length} 씬</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn sm" onClick={onDownload}><Icon name="download" size={12} />다운로드</button>
          <button className="btn sm ghost icon" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'oklch(0.14 0.008 280)' }}>
        <div style={{ background: '#f5f2ec', color: '#1a1a1a', padding: '48px 56px', width: 'min(620px, 100%)', margin: '0 auto 16px', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', fontFamily: 'ui-serif, Georgia, serif', aspectRatio: '1 / 1.414', position: 'relative' }}>
          <div style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-mono)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ShortsForge · Scenario</div>
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>{topic || '시나리오'}</div>
            <div style={{ width: 40, height: 1, background: '#1a1a1a', margin: '24px auto' }} />
          </div>
        </div>
        {scenes.slice(0, 4).map((s, i) => (
          <div key={s.id || i} style={{ background: '#f5f2ec', color: '#1a1a1a', padding: '48px 56px', width: 'min(620px, 100%)', margin: '0 auto 16px', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', fontFamily: 'ui-serif, Georgia, serif' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              S{String(s.scene_number || s.num || i + 1).padStart(2, '0')}. {s.location}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>{s.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.9, marginBottom: 18, color: '#333' }}>{s.action}</div>
            {(s.dialogue || []).map((d, j) => (
              <div key={j} style={{ textAlign: 'center', margin: '16px 0' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{d.who || d.character}</div>
                <div style={{ fontSize: 13, fontStyle: 'italic', maxWidth: '70%', margin: '0 auto', lineHeight: 1.7 }}>"{d.line || d.text}"</div>
              </div>
            ))}
          </div>
        ))}
        {scenes.length > 4 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', padding: '8px 0' }}>
            ... {scenes.length}개 씬 중 4개 표시 — 전체 보려면 다운로드
          </div>
        )}
      </div>
    </div>
  </div>
);

Object.assign(window, { ScriptView, PdfModal });
