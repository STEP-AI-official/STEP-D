/* Dashboard: project grid — driven by /api/jobs */

const StatusPill = ({ status }) => {
  const map = {
    draft:      { label: '초안',           chip: '' },
    scripting:  { label: '시나리오 작성 중', chip: 'violet' },
    generating: { label: '이미지 생성 중',  chip: 'orange' },
    rendering:  { label: '영상 렌더링 중',  chip: 'blue' },
    done:       { label: '완료',            chip: 'mint' }
  };
  const s = map[status] || map.draft;
  return (
    <span className={'chip ' + s.chip}>
      <span className={'dot ' + (s.chip || '')} style={{ width: 5, height: 5 }} />
      {s.label}
    </span>
  );
};

const ProjectCard = ({ project, onOpen }) => (
  <div
    className="panel"
    style={{ padding: 14, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 12 }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    onClick={() => onOpen(project._raw)}
  >
    <div className={'img-ph ' + project.cover} style={{ aspectRatio: '9/16', width: '100%', maxHeight: 220 }}>
      <span className="ph-label">{project.thumb || project.title}</span>
      {(project.status === 'rendering' || project.status === 'generating') && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          padding: '6px 8px', borderRadius: 6,
          fontSize: 11, color: 'var(--text)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
          <span>{project.status === 'rendering' ? '영상 생성 중' : '이미지 생성 중'}</span>
          {project.progress > 0 && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--mint)' }}>{project.progress}%</span>
          )}
        </div>
      )}
    </div>

    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{project.title}</div>
        <button className="btn ghost icon" style={{ width: 24, height: 24, padding: 0 }} onClick={e => e.stopPropagation()}>
          <Icon name="more" size={14} />
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{project.genre}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="clock" size={11} />{project.duration}초
        </span>
        {project.sceneCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="film" size={11} />{project.sceneCount}씬
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>{project.updatedAt}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <StatusPill status={project.status} />
      </div>
    </div>
  </div>
);

const NewProjectCard = ({ onNew }) => (
  <div
    className="panel"
    style={{
      padding: 14, cursor: 'pointer',
      borderStyle: 'dashed', borderColor: 'var(--border-strong)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 320, gap: 10, background: 'transparent'
    }}
    onClick={onNew}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      background: 'color-mix(in oklch, var(--mint) 12%, transparent)',
      color: 'var(--mint)', display: 'grid', placeItems: 'center'
    }}>
      <Icon name="plus" size={22} />
    </div>
    <div style={{ fontWeight: 600, fontSize: 14 }}>새 쇼츠 만들기</div>
    <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', maxWidth: 180, lineHeight: 1.5 }}>
      주제만 입력하면 시나리오부터 영상까지 자동 생성
    </div>
  </div>
);

const Dashboard = ({ jobs, loading, onOpenJob, onNew, onRefresh }) => {
  const [filter, setFilter] = React.useState('all');

  const projects = (jobs || []).map(jobToProject);
  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <div style={{ padding: '32px 40px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>ShortsForge</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>오늘은 어떤 이야기를 만들어볼까요?</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn sm ghost" onClick={onRefresh} title="새로고침">
            <Icon name="refresh" size={13} />
          </button>
          <button className="btn primary" style={{ padding: '10px 16px' }} onClick={onNew}>
            <Icon name="sparkles" size={14} />
            <span>새 쇼츠 만들기</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>내 프로젝트</h2>
        <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{projects.length}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: '전체' },
            { id: 'rendering', label: '렌더링 중' },
            { id: 'done', label: '완료' },
            { id: 'draft', label: '초안' }
          ].map(f => (
            <button
              key={f.id}
              className={'btn sm ' + (filter === f.id ? '' : 'ghost')}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }}/>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>프로젝트 불러오는 중...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          <NewProjectCard onNew={onNew} />
          {filtered.map(p => <ProjectCard key={p.id} project={p} onOpen={onOpenJob} />)}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-4)', fontSize: 13 }}>
              프로젝트가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Dashboard });
