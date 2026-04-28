/* RenderView — loads clips from /api/jobs/{id}/clips with polling */

const RenderView = ({ job, onJobUpdate }) => {
  const [clips, setClips] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedClip, setSelectedClip] = React.useState(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [showShotPicker, setShowShotPicker] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const videoRef = React.useRef(null);

  const jobId = job?.id;
  const jobStatus = job?.status || '';

  const loadClips = React.useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await api.get(`/api/jobs/${jobId}/clips`);
      const list = Array.isArray(data) ? data : (data.clips || []);
      setClips(list);
      if (list.length > 0 && !selectedClip) {
        // prefer the first non-done (active) or the last done
        const active = list.find(c => c.status === 'generating' || c.status === 'queued');
        setSelectedClip(active || list[list.length - 1]);
      } else {
        // keep selected in sync
        setSelectedClip(prev => {
          if (!prev) return prev;
          return list.find(c => c.id === prev.id) || prev;
        });
      }
      setError(null);
    } catch (e) {
      if (!e.message?.includes('404')) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    setLoading(true);
    setClips([]);
    loadClips();
  }, [loadClips]);

  // Poll every 4s while rendering is in progress
  React.useEffect(() => {
    if (!jobId) return;
    const isActive = jobStatus.includes('clips_generating') || jobStatus.includes('clips_pending') || jobStatus.includes('cast_done');
    if (!isActive) return;
    const t = setInterval(loadClips, 4000);
    return () => clearInterval(t);
  }, [jobId, jobStatus, loadClips]);

  // Playhead animation
  const totalDuration = clips.reduce((a, c) => a + (parseFloat(c.duration) || 6), 0) || 58;
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.1;
        if (next >= totalDuration) { setPlaying(false); return totalDuration; }
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [playing, totalDuration]);

  const fmtTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const f = Math.floor((t % 1) * 24);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`;
  };

  const sceneCovers = ['rose','orange','mint','violet','blue','rose','orange','mint','violet'];

  const regenerateAll = async () => {
    setRegenerating(true);
    try {
      const updated = await api.post(`/api/jobs/${jobId}/clips/regenerate`);
      if (onJobUpdate) onJobUpdate(typeof updated === 'object' && updated.id ? updated : await api.get(`/api/jobs/${jobId}`));
      await loadClips();
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  };

  // Build cumulative timeline positions
  let cumTime = 0;
  const clipRanges = clips.map(c => {
    const dur = parseFloat(c.duration) || 6;
    const start = cumTime;
    cumTime += dur;
    return { ...c, start, end: cumTime, dur };
  });

  const doneCount = clips.filter(c => c.status === 'done').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }}/>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>영상 클립 불러오는 중...</div>
      </div>
    );
  }

  if (!clips.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14 }}>
        <Icon name="film" size={32} style={{ color: 'var(--text-4)' }}/>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
          {jobStatus.startsWith('scenario') || jobStatus.startsWith('cast')
            ? '캐스트를 먼저 확정해주세요'
            : '생성된 클립이 없습니다'}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--rose)' }}>{error}</div>}
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>작업 상태: {jobStatus}</div>
      </div>
    );
  }

  const sel = selectedClip || clips[0];

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 0 }}>
        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="film" size={14} style={{ color: 'var(--text-3)' }}/>
              <span style={{ fontSize: 13, fontWeight: 500 }}>씬 영상 생성</span>
              {jobStatus.includes('clips_generating') && (
                <span className="chip orange"><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.2 }}/>렌더링 중</span>
              )}
              {jobStatus === 'done' && <span className="chip mint">완료</span>}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{doneCount}/{clips.length} 완료</div>
              <div style={{ width: 120 }}>
                <div className="progress"><span style={{ width: `${clips.length ? (doneCount / clips.length) * 100 : 0}%` }}/></div>
              </div>
              <button className="btn sm" onClick={regenerateAll} disabled={regenerating}>
                {regenerating ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}/> : <Icon name="refresh" size={11} />}
                전체 재생성
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 20, background: 'oklch(0.14 0.008 280)', minHeight: 0, position: 'relative' }}>
            <div style={{
              position: 'relative', height: '100%', maxHeight: 560,
              aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', border: '1px solid var(--border-strong)'
            }}>
              {/* Video or placeholder */}
              {sel.video_path ? (
                <video
                  ref={videoRef}
                  src={api.mediaUrl(jobId, sel.video_path)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  loop
                  playsInline
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
              ) : (
                <div className={'img-ph ' + (sceneCovers[(sel.scene_number || 1) - 1] || 'mint')} style={{ position: 'absolute', inset: 0, borderRadius: 0 }}>
                  {sel.status !== 'generating' && <span className="ph-label">{sel.title || `씬 ${sel.scene_number}`}</span>}
                </div>
              )}

              {/* Generating overlay */}
              {sel.status === 'generating' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--text)'
                }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--mint)', animation: 'spin 1.2s linear infinite' }}/>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>씬 {sel.scene_number} 렌더링 중</div>
                  {sel.progress != null && (
                    <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{sel.progress}%</div>
                  )}
                  {sel.progress != null && (
                    <div style={{ width: 180 }}>
                      <div className="progress"><span style={{ width: `${sel.progress}%`, background: 'var(--mint)' }}/></div>
                    </div>
                  )}
                </div>
              )}

              {/* Play overlay for done clips */}
              {sel.status === 'done' && sel.video_path && (
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      playing ? videoRef.current.pause() : videoRef.current.play();
                    }
                  }}
                  style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.2)', transition: 'background 0.15s' }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', color: 'oklch(0.2 0.01 280)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    <Icon name={playing ? 'pause' : 'play'} size={28} />
                  </div>
                </button>
              )}

              {/* Queued overlay */}
              {sel.status === 'queued' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-2)' }}>
                  <Icon name="clock" size={28} style={{ opacity: 0.6 }}/>
                  <div style={{ fontSize: 12 }}>렌더링 대기 중</div>
                </div>
              )}

              {/* Top labels */}
              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', color: '#fff', padding: '3px 7px', borderRadius: 4 }}>
                  SCENE {String(sel.scene_number || '').padStart(2, '0')}
                </span>
                {sel.duration != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', color: '#fff', padding: '3px 7px', borderRadius: 4 }}>
                    {parseFloat(sel.duration).toFixed(1)}s
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', color: '#fff', padding: '3px 7px', borderRadius: 4 }}>
                  9:16 · 1080p
                </span>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-2)' }}>
            <button className="btn ghost icon" onClick={() => setCurrentTime(0)}><Icon name="chevron-left" size={14} /></button>
            <button className="btn primary icon" style={{ width: 36, height: 36 }}
              onClick={() => {
                if (videoRef.current) { playing ? videoRef.current.pause() : videoRef.current.play(); }
                else setPlaying(p => !p);
              }}
            >
              <Icon name={playing ? 'pause' : 'play'} size={15} />
            </button>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtTime(currentTime)} <span style={{ color: 'var(--text-4)' }}>/ {fmtTime(totalDuration)}</span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm ghost"><Icon name="music" size={12} />BGM</button>
              <button className="btn sm ghost"><Icon name="mic" size={12} />내레이션</button>
              <button className="btn sm ghost"><Icon name="type" size={12} />자막</button>
            </div>
          </div>
        </div>

        {/* Right detail panel */}
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-2)', overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-4)', marginBottom: 4 }}>
              SCENE {String(sel.scene_number || '').padStart(2, '0')} · {sel.duration != null ? parseFloat(sel.duration).toFixed(1) + 's' : ''}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>{sel.title || `씬 ${sel.scene_number}`}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{sel.location}</div>
          </div>

          {sel.action && (
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>지문</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-2)' }}>{sel.action}</div>
            </div>
          )}

          {sel.thumbnail_path && (
            <div className="panel" style={{ padding: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 4 }}>썸네일</div>
              <img src={api.mediaUrl(jobId, sel.thumbnail_path)} alt="thumbnail"
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 4 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {sel.prompt && (
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>영상 프롬프트</div>
              <div style={{ fontSize: 11, lineHeight: 1.6, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{sel.prompt}</div>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn sm" onClick={async () => {
              try {
                await api.post(`/api/jobs/${jobId}/clips/regenerate`, { scene_number: sel.scene_number });
                await loadClips();
              } catch (e) { setError(e.message); }
            }}>
              <Icon name="refresh" size={12} />이 씬 재생성
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <ClipTimeline
        clipRanges={clipRanges}
        totalDuration={totalDuration}
        currentTime={currentTime}
        selectedClip={sel}
        onSelectClip={setSelectedClip}
        onSeek={setCurrentTime}
        sceneCovers={sceneCovers}
      />

      {error && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'color-mix(in oklch, var(--rose) 15%, var(--surface))', border: '1px solid var(--rose)', borderRadius: 8, padding: '10px 16px', fontSize: 12, color: 'var(--rose)' }}>
          {error}
        </div>
      )}
    </div>
  );
};

const ClipTimeline = ({ clipRanges, totalDuration, currentTime, selectedClip, onSelectClip, onSeek, sceneCovers }) => {
  const trackRef = React.useRef(null);
  const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2,'0')}:${String(Math.floor(t % 60)).padStart(2,'0')}`;

  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    onSeek(((e.clientX - rect.left) / rect.width) * totalDuration);
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
      <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>타임라인</div>
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{clipRanges.length}씬 · {totalDuration.toFixed(1)}초</span>
      </div>

      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          {[0, 10, 20, 30, 40, 50].filter(t => t <= totalDuration).concat([Math.floor(totalDuration)]).map(t => (
            <span key={t}>{fmt(t)}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 14px' }}>
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{ height: 54, background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)', position: 'relative', display: 'flex', cursor: 'pointer', overflow: 'hidden' }}
        >
          {clipRanges.map((c, i) => {
            const widthPct = (c.dur / totalDuration) * 100;
            const isSelected = selectedClip && (selectedClip.id === c.id);
            const cover = sceneCovers[i % sceneCovers.length];
            return (
              <div
                key={c.id || i}
                onClick={(e) => { e.stopPropagation(); onSelectClip(c); }}
                style={{
                  width: `${widthPct}%`, height: '100%',
                  borderRight: '1px solid var(--bg-2)',
                  position: 'relative',
                  outline: isSelected ? '2px solid var(--mint)' : 'none',
                  outlineOffset: -2,
                  background: `color-mix(in oklch, var(--${cover}) 25%, var(--surface-2))`,
                  opacity: c.status === 'queued' ? 0.55 : 1
                }}
              >
                {c.status === 'generating' && c.progress != null && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, color-mix(in oklch, var(--orange) 30%, transparent) 0%, color-mix(in oklch, var(--orange) 30%, transparent) ${c.progress}%, transparent ${c.progress}%)`
                  }}/>
                )}
                <div style={{ position: 'absolute', top: 4, left: 6, right: 6, fontSize: 10, color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  S{String(c.scene_number || i+1).padStart(2,'0')} {c.title || ''}
                </div>
                <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                  {c.dur.toFixed(1)}s
                </div>
                {c.status === 'done' && <div style={{ position: 'absolute', top: 4, right: 6 }}><Icon name="check" size={10} style={{ color: 'var(--mint)' }}/></div>}
                {c.status === 'generating' && <div style={{ position: 'absolute', top: 4, right: 6 }}><span className="spinner" style={{ width: 9, height: 9, borderWidth: 1.2 }}/></div>}
              </div>
            );
          })}

          {/* Playhead */}
          <div style={{
            position: 'absolute', top: -4, bottom: -4,
            left: `${(currentTime / totalDuration) * 100}%`,
            width: 2, background: 'var(--mint)', pointerEvents: 'none', boxShadow: '0 0 8px var(--mint)'
          }}>
            <div style={{ position: 'absolute', top: -6, left: -5, width: 12, height: 8, background: 'var(--mint)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}/>
          </div>
        </div>

        {/* Audio tracks */}
        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { icon: 'mic', label: '내레이션', color: 'blue' },
            { icon: 'music', label: 'BGM', color: 'violet' }
          ].map(track => (
            <div key={track.label}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name={track.icon} size={10} /><span>{track.label}</span>
              </div>
              <div style={{ height: 22, background: 'var(--surface)', borderRadius: 4, border: '1px solid var(--border)', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 2, bottom: 2, left: 0, width: '100%',
                  background: `color-mix(in oklch, var(--${track.color}) 20%, var(--surface-3))`,
                  border: `1px solid var(--${track.color})`, borderRadius: 3,
                  display: 'flex', alignItems: 'center', overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', gap: 1, padding: '0 4px', width: '100%', height: '100%', alignItems: 'center' }}>
                    {Array.from({ length: 60 }).map((_, k) => (
                      <div key={k} style={{ width: 1, flex: 1, maxWidth: 2, background: `var(--${track.color})`, height: `${30 + ((k * 17) % 60)}%`, opacity: 0.6, borderRadius: 1 }}/>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${(currentTime / totalDuration) * 100}%`, width: 2, background: 'var(--mint)', pointerEvents: 'none' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { RenderView });
