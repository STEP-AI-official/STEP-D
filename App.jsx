/* Main App shell for ShortsForge */

const App = () => {
  const [view, setView] = React.useState(() => {
    try { return localStorage.getItem('sf:view') || 'dashboard'; } catch { return 'dashboard'; }
  });
  const [activeJob, setActiveJob] = React.useState(null); // raw job object from API
  const [jobs, setJobs] = React.useState([]);
  const [jobsLoading, setJobsLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(false);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);

  React.useEffect(() => { applyTweaks(tweaks); }, []);

  React.useEffect(() => {
    try { localStorage.setItem('sf:view', view); } catch {}
  }, [view]);

  // Load jobs from API on mount, then poll every 5s
  const loadJobs = React.useCallback(async () => {
    try {
      const data = await api.get('/api/jobs');
      const list = Array.isArray(data) ? data : (data.jobs || []);
      setJobs(list);
      // Keep activeJob in sync if it's open
      setActiveJob(prev => {
        if (!prev) return prev;
        const updated = list.find(j => j.id === prev.id);
        return updated || prev;
      });
    } catch (e) {
      console.warn('jobs fetch failed:', e);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadJobs();
    const t = setInterval(loadJobs, 5000);
    return () => clearInterval(t);
  }, [loadJobs]);

  // Tweaks protocol
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const openJob = (job) => {
    setActiveJob(job);
    setView('canvas');
    try { localStorage.setItem('sf:job', job.id); } catch {}
  };

  const goHome = () => {
    setActiveJob(null);
    setView('dashboard');
    try { localStorage.removeItem('sf:job'); } catch {}
  };

  const handleJobCreated = (job) => {
    setShowWizard(false);
    setJobs(prev => [job, ...prev]);
    openJob(job);
  };

  // Build node/edge data from active job status
  const buildNodesFromJob = (job) => {
    if (!job) return { nodes: APP_DATA.nodes, edges: APP_DATA.edges };
    const s = job.status || '';
    const stageOrder = ['scenario', 'cast', 'clips', 'compose'];
    const stageToNode = {
      scenario: 'n2', cast: 'n3', clips: 'n5', compose: 'n6'
    };
    const getStatus = (nodeId) => {
      if (nodeId === 'n1') return 'done'; // prompt always done once job exists
      const stage = Object.entries(stageToNode).find(([, nid]) => nid === nodeId)?.[0];
      if (!stage) return 'pending';
      const idx = stageOrder.indexOf(stage);
      const curStage = s.split('_')[0];
      const curIdx = stageOrder.indexOf(curStage);
      if (s === 'done') return 'done';
      if (curIdx > idx) return 'done';
      if (curIdx === idx) return s.endsWith('_generating') ? 'active' : 'done';
      return 'pending';
    };
    const nodes = APP_DATA.nodes.map(n => ({ ...n, status: getStatus(n.id) }));
    // n3 (character) and n4 (background) share cast stage
    const castStatus = getStatus('n3');
    return {
      nodes: nodes.map(n => n.id === 'n4' ? { ...n, status: castStatus } : n),
      edges: APP_DATA.edges
    };
  };

  const { nodes, edges } = buildNodesFromJob(activeJob);

  const crumbs = (() => {
    if (!activeJob) {
      const labels = { dashboard: '대시보드', projects: '프로젝트', templates: '템플릿', assets: '에셋 라이브러리' };
      return [labels[view] || '대시보드'];
    }
    const labels = { canvas: '워크플로우', script: '시나리오', characters: '등장인물', background: '배경 / 구도', render: '씬 영상 생성', export: '합성·내보내기' };
    return ['프로젝트', activeJob.topic || activeJob.id, labels[view] || '워크플로우'];
  })();

  const activeProject = activeJob ? jobToProject(activeJob) : null;

  let content;
  if (!activeJob || view === 'dashboard' || view === 'projects' || view === 'templates' || view === 'assets') {
    content = (
      <Dashboard
        jobs={jobs}
        loading={jobsLoading}
        onOpenJob={openJob}
        onNew={() => setShowWizard(true)}
        onRefresh={loadJobs}
      />
    );
  } else if (view === 'canvas') {
    content = (
      <CanvasView
        nodes={nodes}
        edges={edges}
        activeNodeId={nodes.find(n => n.status === 'active')?.id || null}
        setView={setView}
        nodeStatuses={Object.fromEntries(nodes.map(n => [n.id, n.status]))}
      />
    );
  } else if (view === 'script') {
    content = <ScriptView job={activeJob} onJobUpdate={setActiveJob} />;
  } else if (view === 'characters') {
    content = <CharactersView job={activeJob} onJobUpdate={setActiveJob} />;
  } else if (view === 'background') {
    content = <BackgroundView scenes={APP_DATA.scenes} />;
  } else if (view === 'render') {
    content = <RenderView job={activeJob} onJobUpdate={setActiveJob} />;
  } else if (view === 'export') {
    content = <ExportView scenes={APP_DATA.scenes} />;
  }

  return (
    <div className="app-chrome" data-screen-label={`${view}`}>
      <Topbar view={view} crumbs={crumbs} onHome={goHome} />
      <Sidebar view={view} setView={setView} activeProject={activeProject} />
      <div className="main fade-in" key={view}>{content}</div>

      {showWizard && (
        <NewProjectWizard
          onCreated={handleJobCreated}
          onClose={() => setShowWizard(false)}
        />
      )}
      {tweaksOpen && (
        <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => {
          setTweaksOpen(false);
          window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*');
        }} />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
