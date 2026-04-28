/* Topbar + Sidebar for ShortsForge */

const Topbar = ({ view, crumbs, onHome, onToggleTweaks, tweaksOn }) => {
  return (
    <div className="topbar">
      <div className="brand" onClick={onHome} style={{ cursor: 'pointer' }}>
        <div className="brand-mark">S</div>
        <div className="brand-name">ShortsForge<em>beta</em></div>
      </div>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={12} style={{ color: 'var(--text-4)' }} />}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-right">
        <button className="btn ghost icon" title="알림"><Icon name="bell" size={16} /></button>
        <button className="btn ghost icon" title="설정"><Icon name="settings" size={16} /></button>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <Avatar name="민" chip="violet" size={28} />
      </div>
    </div>
  );
};

const Sidebar = ({ view, setView, activeProject }) => {
  const items = [
    { id: 'dashboard', icon: 'home', label: '대시보드' },
    { id: 'projects', icon: 'folder', label: '프로젝트', badge: 6 },
    { id: 'templates', icon: 'layers', label: '템플릿' },
    { id: 'assets', icon: 'image', label: '에셋 라이브러리' }
  ];

  const pipelineItems = activeProject ? [
    { id: 'canvas', icon: 'split', label: '워크플로우' },
    { id: 'script', icon: 'doc', label: '시나리오' },
    { id: 'characters', icon: 'user', label: '등장인물' },
    { id: 'background', icon: 'camera', label: '배경 / 구도' },
    { id: 'render', icon: 'film', label: '씬 영상 생성', badge: '6/9' },
    { id: 'export', icon: 'download', label: '합성·내보내기' }
  ] : [];

  return (
    <aside className="sidebar">
      <div className="side-section">
        <div className="side-title">워크스페이스</div>
        {items.map(it => (
          <div
            key={it.id}
            className={'side-item ' + (view === it.id ? 'active' : '')}
            onClick={() => setView(it.id)}
          >
            <Icon name={it.icon} size={16} className="ico" />
            <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </div>
        ))}
      </div>

      {activeProject && (
        <div className="side-section">
          <div className="side-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{activeProject.title}</span>
          </div>
          <div style={{
            padding: '4px 10px 8px', fontSize: 11, color: 'var(--text-4)',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span className="dot mint" />
            <span>진행 {activeProject.progress}%</span>
          </div>
          {pipelineItems.map(it => (
            <div
              key={it.id}
              className={'side-item ' + (view === it.id ? 'active' : '')}
              onClick={() => setView(it.id)}
            >
              <Icon name={it.icon} size={16} className="ico" />
              <span>{it.label}</span>
              {it.badge && <span className="badge">{it.badge}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="side-section" style={{ marginTop: 'auto' }}>
        <div className="side-title">도움말</div>
        <div className="side-item"><Icon name="sparkles" size={16} className="ico" /><span>튜토리얼</span></div>
        <div className="side-item"><Icon name="zap" size={16} className="ico" /><span>크레딧 <span style={{ color: 'var(--mint)', marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>840</span></span></div>
      </div>
    </aside>
  );
};

Object.assign(window, { Topbar, Sidebar });
