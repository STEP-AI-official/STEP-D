import React from 'react';
import { Dashboard } from './pages/Dashboard.jsx';
import { Projects } from './pages/Projects.jsx';
import { Shorts } from './pages/Shorts.jsx';
import { Rag } from './pages/Rag.jsx';
import { GuideQuestions } from './pages/GuideQuestions.jsx';

const NAV = [
  { id: 'dashboard',  label: '대시보드',    section: '개요' },
  { id: 'projects',   label: '프로젝트',    section: '데이터' },
  { id: 'shorts',     label: '쇼츠',        section: '데이터' },
  { id: 'rag',        label: 'RAG 관리',    section: '콘텐츠' },
  { id: 'questions',  label: '가이드 질문', section: '콘텐츠' },
];

const SECTIONS = [...new Set(NAV.map(n => n.section))];

const Icon = ({ name }) => {
  const icons = {
    dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    projects:  'M3 7h18M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7',
    shorts:    'M15 10l-9 5V5l9 5z M3 3h18v18H3z',
    rag:       'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    questions: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.dashboard} />
    </svg>
  );
};

export default function App() {
  const [page, setPage] = React.useState('dashboard');

  const content = {
    dashboard: <Dashboard />,
    projects:  <Projects />,
    shorts:    <Shorts />,
    rag:       <Rag />,
    questions: <GuideQuestions />,
  }[page];

  return (
    <div className="layout">
      {/* Topbar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--mint)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, color: '#000' }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>STEP D</span>
          <span style={{ fontSize: 11, padding: '2px 7px', background: 'var(--rose-dim)', color: 'var(--rose)', borderRadius: 20, fontWeight: 600 }}>ADMIN</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{import.meta.env.VITE_API_BASE_URL || 'localhost:8766'}</span>
      </header>

      {/* Sidebar */}
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

      {/* Main */}
      <main className="main">{content}</main>
    </div>
  );
}
