import React from 'react';
import { Topbar, Sidebar } from './components/Chrome';
import { loadAuth, saveAuth, signInWithGoogle } from './lib/auth';
import { LoginModal } from './components/Chrome';
import { Dashboard } from './components/Dashboard';
import { CanvasView } from './components/CanvasView';
import { ScriptView } from './components/ScriptView';
import { CharactersView } from './components/CharactersView';
import { BackgroundView } from './components/BackgroundView';
import { SceneImageView } from './components/SceneImageView';
import { RenderView } from './components/RenderView';
import { ThumbnailView } from './components/ThumbnailView';
import { ExportView } from './components/ExportView';
import { NewProjectWizard } from './components/NewProjectWizard';
import { TweaksPanel, TWEAK_DEFAULTS, applyTweaks } from './components/TweaksPanel';
import { ProjectHomeView } from './components/ProjectHomeView';
import { ImageGenChatView } from './components/ImageGenChatView';
import { VideoEditor } from './components/VideoEditor';
import { SeedLibraryView } from './components/SeedLibraryView';
import { AdminView } from './components/AdminView';
import { APP_DATA } from './data';
import { api, apiBase } from './api';
import { ProgressBanner } from './components/ProgressBanner';
import { ToastProvider } from './components/Toast';
import { OnboardingLogin } from './components/Onboarding';

const App = () => {
  const [view, setView] = React.useState(() => {
    try {
      const saved = localStorage.getItem('sf:view') || 'dashboard';
      // scene-image 탭은 localStorage에서 복원하지 않음 — 생성 중 탭 전환 버그 방지
      return saved === 'scene-image' ? 'canvas' : saved;
    } catch { return 'dashboard'; }
  });
  const [activeProject, setActiveProject] = React.useState(null);
  const [activeShort, setActiveShort] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [projectsLoading, setProjectsLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(false);
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [user, setUser] = React.useState(() => loadAuth().user || null);
  const [loginOpen, setLoginOpen] = React.useState(false);

  React.useEffect(() => { applyTweaks(tweaks); }, []);

  React.useEffect(() => {
    try {
      // scene-image는 저장하지 않음 — 페이지 재로드 시 자동 복원 방지
      if (view !== 'scene-image') localStorage.setItem('sf:view', view);
    } catch {}
  }, [view]);

  const loadProjects = React.useCallback(async () => {
    if (!loadAuth().token) { setProjectsLoading(false); return; }
    try {
      const data = await api.get('/api/projects');
      const list = Array.isArray(data) ? data : (data.projects || []);
      setProjects(list);
    } catch (e) {
      console.warn('projects fetch failed:', e);
    } finally {
      setProjectsLoading(false);
    }
  }, [user]);

  // 화면 복귀 시 short 최신 상태 DB에서 재조회 — generating이면 SSE가 자동 연결됨
  React.useEffect(() => {
    if (!activeProject || !activeShort) return;
    api.get(`/api/projects/${activeProject.id}/shorts/${activeShort.id}`)
      .then(u => setActiveShort(u)).catch(() => {});
  }, [activeProject?.id, activeShort?.id]);

  // SSE: activeShort 진행 상태 + 이미지 이벤트 실시간 수신
  React.useEffect(() => {
    if (!activeProject || !activeShort) return;
    if (activeShort.status !== 'generating') return;
    const token = localStorage.getItem('auth_token');
    const sseUrl = `${apiBase}/projects/${activeProject.id}/shorts/${activeShort.id}/progress${token ? `?token=${token}` : ''}`;
    const es = new EventSource(sseUrl);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'image') {
          // 이미지 이벤트 — CharactersView/SceneImageView 등에서 처리하도록 커스텀 이벤트 dispatch
          window.dispatchEvent(new CustomEvent('short:image_event', { detail: data }));
          return;
        }
        // progress 이벤트
        setActiveShort(prev => prev ? { ...prev, ...data } : prev);
        if (data.status === 'done' || data.status === 'failed' || data.status === 'choosing') {
          es.close();
          api.get(`/api/projects/${activeProject.id}/shorts/${activeShort.id}`)
            .then(u => setActiveShort(u)).catch(() => {});
        }
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [activeProject?.id, activeShort?.id, activeShort?.status]);

  React.useEffect(() => {
    loadProjects();
    const t = setInterval(loadProjects, 30000);
    return () => clearInterval(t);
  }, [loadProjects, user]);

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

  const openProject = (project) => {
    setActiveProject(project);
    setActiveShort(null);
    setView('home');
    try { localStorage.setItem('sf:project', project.id); } catch {}
  };

  const openShort = (short) => {
    setActiveShort(short);
    setView('canvas');
  };

  const goHome = () => {
    if (activeProject) {
      setActiveShort(null);
      setView('home');
    } else {
      setActiveProject(null);
      setActiveShort(null);
      setView('dashboard');
      try { localStorage.removeItem('sf:project'); } catch {}
    }
  };

  const handleProjectCreated = (project) => {
    setShowWizard(false);
    setProjects(prev => [project, ...prev]);
    openProject(project);
  };

  const crumbs = (() => {
    if (!activeProject) {
      const labels = { dashboard: '대시보드', projects: '프로젝트', templates: '템플릿', assets: '에셋 라이브러리', seeds: '시드 라이브러리', admin: '어드민 · 점수 태깅' };
      return [labels[view] || '대시보드'];
    }
    const labels = { home: '프로젝트 홈', canvas: '워크플로우', script: '시나리오', characters: '등장인물', background: '배경 / 구도', imagechat: 'AI 이미지 생성', 'scene-image': '씬 이미지', render: '씬 영상', editor: '영상 편집기', thumbnail: '썸네일', export: '합성·내보내기' };
    return ['프로젝트', activeProject.title || activeProject.id, labels[view] || '홈'];
  })();

  // 비로그인 상태 → 온보딩/로그인 화면만 표시
  if (!user) {
    return (
      <ToastProvider>
        <OnboardingLogin onLoginClick={() => setLoginOpen(true)} />
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={u => { setUser(u); setLoginOpen(false); loadProjects(); }} />
      </ToastProvider>
    );
  }

  const isAdmin = user?.role === 'admin';

  let content;
  if (view === 'admin' && isAdmin) {
    content = <AdminView />;
  } else if (view === 'seeds' && isAdmin) {
    content = <SeedLibraryView />;
  } else if (!activeProject || ['dashboard', 'projects', 'templates', 'assets'].includes(view)) {
    content = <Dashboard projects={projects} loading={projectsLoading} onOpenProject={openProject} onNew={() => setShowWizard(true)} onRefresh={loadProjects}
      onDeleteProject={(pid) => { setProjects(prev => prev.filter(p => p.id !== pid)); }} />;
  } else if (view === 'home') {
    content = <ProjectHomeView project={activeProject} setView={setView} onOpenShort={openShort} />;
  } else if (view === 'canvas') {
    content = <CanvasView short={activeShort} setView={setView} />;
  } else if (view === 'script') {
    content = <ScriptView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} setView={setView} />;
  } else if (view === 'characters') {
    content = <CharactersView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} setView={setView} />;
  } else if (view === 'background') {
    content = <BackgroundView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} setView={setView} />;
  } else if (view === 'imagechat') {
    content = <ImageGenChatView project={activeProject} />;
  } else if (view === 'scene-image') {
    content = <SceneImageView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} setView={setView} />;
  } else if (view === 'render') {
    content = <RenderView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} setView={setView} />;
  } else if (view === 'thumbnail') {
    content = <ThumbnailView project={activeProject} short={activeShort} onShortUpdate={setActiveShort} />;
  } else if (view === 'export') {
    content = <ExportView scenes={APP_DATA.scenes} />;
  } else if (view === 'editor') {
    content = <VideoEditor project={activeProject} short={activeShort} onBack={() => setView('render')} />;
  }

  return (
    <ToastProvider>
    <div className="app-chrome" data-screen-label={view}>
      <Topbar view={view} crumbs={crumbs} onHome={goHome} user={user} onLoginClick={() => setLoginOpen(true)} />
      <Sidebar view={view} setView={setView} activeProject={activeProject} activeShort={activeShort} onGoHome={() => { setActiveProject(null); setActiveShort(null); setView('dashboard'); try { localStorage.removeItem('sf:project'); } catch {} }} user={user} setUser={setUser} onLoginClick={() => setLoginOpen(true)} />
      <div className="main fade-in" key={view} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {activeShort && <ProgressBanner short={activeShort} />}
        <div style={{ flex: 1, overflow: view === 'editor' ? 'hidden' : 'auto' }}>{content}</div>
      </div>
      {showWizard && <NewProjectWizard onCreated={handleProjectCreated} onClose={() => setShowWizard(false)} />}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => { setTweaksOpen(false); window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*'); }} />}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={u => { setUser(u); setLoginOpen(false); loadProjects(); }} />
    </div>
    </ToastProvider>
  );
};

export default App;
