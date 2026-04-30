import React from 'react';
import { Dashboard } from './pages/Dashboard.jsx';
import { Users } from './pages/Users.jsx';
import { Projects } from './pages/Projects.jsx';
import { Shorts } from './pages/Shorts.jsx';
import { Videos } from './pages/Videos.jsx';
import { Rag } from './pages/Rag.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Config } from './pages/Config.jsx';
import { GuideQuestions } from './pages/GuideQuestions.jsx';

const NAV = [
  { id: 'dashboard',  label: '대시보드',    section: '개요' },
  { id: 'analytics',  label: '분석',        section: '개요' },
  { id: 'users',      label: '유저',        section: '데이터' },
  { id: 'projects',   label: '프로젝트',    section: '데이터' },
  { id: 'shorts',     label: '쇼츠',        section: '데이터' },
  { id: 'videos',     label: '영상 태깅',   section: '데이터' },
  { id: 'rag',        label: 'RAG',         section: '콘텐츠' },
  { id: 'questions',  label: '가이드 질문', section: '콘텐츠' },
  { id: 'config',     label: '설정',        section: '시스템' },
];

const SECTIONS = [...new Set(NAV.map(n => n.section))];

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  analytics: 'M18 20V10M12 20V4M6 20v-6',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4a3 3 0 0 1 0 6',
  projects:  'M3 7h18M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7',
  shorts:    'M15 10l-9 5V5l9 5z M3 3h18v18H3z',
  videos:    'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z',
  rag:       'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  questions: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  config:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};

const Icon = ({ name }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name] || ICONS.dashboard} />
  </svg>
);

export default function App() {
  const [page, setPage] = React.useState('dashboard');

  const content = {
    dashboard: <Dashboard />,
    analytics: <Analytics />,
    users:     <Users />,
    projects:  <Projects />,
    shorts:    <Shorts />,
    videos:    <Videos />,
    rag:       <Rag />,
    questions: <GuideQuestions />,
    config:    <Config />,
  }[page];

  return (
    <div className="layout">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--mint)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, color: '#000' }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>STEP D</span>
          <span style={{ fontSize: 11, padding: '2px 7px', background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 20, fontWeight: 600 }}>ADMIN</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{import.meta.env.VITE_API_BASE_URL || 'localhost:8766'}</span>
      </header>

      <nav className="sidebar">
        {SECTIONS.map(sec => (
          <React.Fragment key={sec}>
            <div className="nav-section">{sec}</div>
            {NAV.filter(n => n.section === sec).map(n => (
              <div key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
                <Icon name={n.id} />
                {n.label}
              </div>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <main className="main">{content}</main>
    </div>
  );
}
