import React from 'react';
import { Icon } from './Icons';
import { projectToUi, api } from '../api';

const statusMeta = {
  draft:      { label: '초안',            dot: 'var(--text-4)' },
  scripting:  { label: '시나리오 작성 중', dot: 'var(--violet)' },
  generating: { label: '이미지 생성 중',   dot: 'var(--orange)' },
  rendering:  { label: '영상 렌더링 중',   dot: '#60a5fa' },
  done:       { label: '완료',             dot: 'var(--mint)' },
  failed:     { label: '실패',             dot: 'var(--rose)' },
};

const coverGradients = {
  rose:   'linear-gradient(135deg, oklch(0.45 0.18 15) 0%, oklch(0.28 0.10 350) 100%)',
  mint:   'linear-gradient(135deg, oklch(0.45 0.15 160) 0%, oklch(0.28 0.08 200) 100%)',
  violet: 'linear-gradient(135deg, oklch(0.45 0.18 285) 0%, oklch(0.28 0.10 310) 100%)',
  blue:   'linear-gradient(135deg, oklch(0.45 0.16 240) 0%, oklch(0.28 0.10 260) 100%)',
  orange: 'linear-gradient(135deg, oklch(0.55 0.18 45) 0%,  oklch(0.32 0.10 30)  100%)',
};

const ProjectCard = ({ project, onOpen, onDelete }) => {
  const grad = coverGradients[project.cover] || coverGradients.mint;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`"${project.title}" 프로젝트를 삭제할까요?\n\n모든 다큐, 캐릭터, 배경 데이터가 삭제됩니다.`)) return;
    setDeleting(true);
    try {
      await api.del(`/api/projects/${project.id}`);
      if (onDelete) onDelete(project.id);
    } catch (e) { alert('삭제 실패: ' + e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div
      onClick={() => !menuOpen && onOpen(project._raw)}
      style={{ background: deleting ? 'var(--surface-2)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: deleting ? 'default' : 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', opacity: deleting ? 0.5 : 1 }}
      onMouseEnter={e => { if (!deleting) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ height: 6, background: grad }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{project.title}</div>
          <div style={{ position: 'relative' }}>
            <button
              className="btn ghost icon"
              style={{ width: 26, height: 26, padding: 0, flexShrink: 0, opacity: 0.6 }}
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            >
              {deleting
                ? <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
                : <Icon name="more" size={14} />}
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
                <div style={{ position: 'absolute', right: 0, top: 30, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, minWidth: 140, overflow: 'hidden' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onOpen(project._raw); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icon name="edit" size={12} />열기
                  </button>
                  <div style={{ height: 1, background: 'var(--border)', margin: '0 8px' }} />
                  <button
                    onClick={handleDelete}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--rose)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--rose) 10%, transparent)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icon name="trash" size={12} />삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
          {project.shorts_count > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="film" size={11} />{project.shorts_count}개 다큐
            </span>
          )}
          {project.characters_count > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="user" size={11} />{project.characters_count}명
            </span>
          )}
          <span style={{ marginLeft: 'auto', color: 'var(--text-4)' }}>{project.createdAt}</span>
        </div>
      </div>
    </div>
  );
};

const NewProjectCard = ({ onNew }) => (
  <div
    onClick={onNew}
    style={{ background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 12, cursor: 'pointer', padding: '32px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 160, transition: 'background 0.15s, border-color 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--mint)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
  >
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in oklch, var(--mint) 12%, transparent)', color: 'var(--mint)', display: 'grid', placeItems: 'center' }}>
      <Icon name="plus" size={20} />
    </div>
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>새 프로젝트</div>
      <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', lineHeight: 1.5 }}>제목 입력 → 다큐 AI 자동 생성</div>
    </div>
  </div>
);

export const Dashboard = ({ projects, loading, onOpenProject, onNew, onRefresh, onDeleteProject }) => {
  const [search, setSearch] = React.useState('');
  const projectList = (projects || []).map(projectToUi);

  const filtered = projectList
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* 헤더 */}
      <div style={{ padding: '36px 48px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Projects</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn sm ghost" onClick={onRefresh} title="새로고침">
              <Icon name="refresh" size={13} />
            </button>
            <button className="btn primary" style={{ padding: '8px 16px', gap: 6 }} onClick={onNew}>
              <Icon name="plus" size={14} />
              <span>New project</span>
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16 }}>
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="프로젝트 검색..."
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 34, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--mint)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-4)', marginLeft: 4 }}>{filtered.length}개</span>
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      <div style={{ padding: '28px 48px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>불러오는 중...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            <NewProjectCard onNew={onNew} />
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={onOpenProject} onDelete={onDeleteProject} />
            ))}
            {filtered.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-4)', fontSize: 13 }}>
                {search ? `"${search}" 검색 결과 없음` : '프로젝트가 없습니다'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
