import React from 'react';
import { Icon } from './Icons';
import { api, shortStageToUi } from '../api';
import { PreProductionChat } from './PreProductionChat';

const stageMeta = {
  scripting:  { label: '시나리오 작성 중', dot: 'var(--violet)', view: 'script' },
  generating: { label: '이미지 생성 중',   dot: 'var(--orange)', view: 'characters' },
  rendering:  { label: '영상 렌더링 중',   dot: '#60a5fa', view: 'render' },
  done:       { label: '완료',             dot: 'var(--mint)', view: 'render' },
  failed:     { label: '실패',             dot: 'var(--rose)', view: 'script' },
  draft:      { label: '대기 중',          dot: 'var(--text-4)', view: 'script' },
};

const ShortCard = ({ short, onOpen, onDelete }) => {
  const uiStatus = shortStageToUi(short);
  const meta = stageMeta[uiStatus] || stageMeta.draft;
  const isActive = uiStatus === 'scripting' || uiStatus === 'generating' || uiStatus === 'rendering';
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`"${short.title || '이 다큐'}"를 삭제할까요?`)) return;
    setDeleting(true);
    try {
      await api.del(`/api/projects/${short.project_id}/shorts/${short.id}`);
      if (onDelete) onDelete(short.id);
    } catch (e) { alert('삭제 실패: ' + e.message); setDeleting(false); }
  };

  return (
    <div
      onClick={() => !deleting && onOpen(short)}
      className="panel"
      style={{ padding: '14px 16px', cursor: deleting ? 'default' : 'pointer', transition: 'border-color 0.12s, box-shadow 0.12s', opacity: deleting ? 0.5 : 1, position: 'relative' }}
      onMouseEnter={e => { if (!deleting) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <button onClick={handleDelete} disabled={deleting}
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 4, opacity: 0, transition: 'opacity 0.1s' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--rose)'; e.currentTarget.style.background = 'color-mix(in oklch, var(--rose) 10%, transparent)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'none'; }}>
        {deleting ? <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : <Icon name="trash" size={11} />}
      </button>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, paddingRight: 20 }}>{short.title || '제목 없음'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, flexShrink: 0, boxShadow: isActive ? `0 0 6px ${meta.dot}` : 'none' }} />
        <span style={{ color: isActive ? meta.dot : 'var(--text-3)' }}>{meta.label}</span>
        {isActive && <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginLeft: 4 }} />}
      </div>
      {short.progress && (
        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>{short.progress}</div>
      )}
    </div>
  );
};

export const ProjectHomeView = ({ project, setView, onOpenShort }) => {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showChat, setShowChat] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [deletedShortIds, setDeletedShortIds] = React.useState([]);

  const projectId = project?.id;

  const loadDetail = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.get(`/api/projects/${projectId}`);
      setDetail(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => { setLoading(true); loadDetail(); }, [loadDetail]);

  const handleShortCreated = async (short) => {
    setShowChat(false);
    await loadDetail();
    onOpenShort(short);
  };

  const shorts = (detail?.shorts || []).filter(s => !deletedShortIds.includes(s.id));
  const characters = detail?.characters || [];
  const locations = detail?.locations || [];

  return (
    <>
    <div style={{ overflowY: 'auto', height: '100%', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{project?.title || '프로젝트'}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
              {shorts.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="film" size={12} />{shorts.length}개 다큐</span>}
              {characters.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="user" size={12} />{characters.length}명 캐릭터</span>}
              {locations.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="camera" size={12} />{locations.length}개 장소</span>}
            </div>
          </div>
          <button className="btn sm primary" onClick={() => setShowChat(true)}>
            <Icon name="sparkles" size={12} />새 다큐 기획하기
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'color-mix(in oklch, var(--rose) 10%, var(--surface))', border: '1px solid var(--rose)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--rose)' }}>{error}</div>
        )}


        {/* 다큐 목록 */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="film" size={14} style={{ color: 'var(--mint)' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>다큐 목록</div>
            {shorts.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{shorts.length}개</span>}
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={loadDetail}><Icon name="refresh" size={12} /></button>
          </div>
          <div style={{ padding: 16 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--surface-3)', borderTopColor: 'var(--mint)', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>불러오는 중...</div>
              </div>
            ) : shorts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-4)', fontSize: 13 }}>
                <div style={{ marginBottom: 12 }}>아직 다큐가 없습니다</div>
                <button className="btn sm primary" onClick={() => setShowChat(true)}><Icon name="sparkles" size={12} />AI와 첫 번째 다큐 기획하기</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {shorts.map((s, i) => (
                  <ShortCard key={s.id || i} short={s} onOpen={onOpenShort}
                    onDelete={(id) => setDeletedShortIds(prev => [...prev, id])} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 등장인물 그리드 */}
        {characters.length > 0 && (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="user" size={14} style={{ color: 'var(--mint)' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>프로젝트 등장인물</div>
              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{characters.length}명</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 14 }}>
                {characters.map((c, i) => (
                  <div key={c.char_key || i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name_ko}
                        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="img-ph mint" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, fontSize: 0 }}>
                        <span className="ph-label" style={{ fontSize: 11 }}>{c.name_ko?.[0] || '?'}</span>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name_ko}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{c.role_ko}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>

    {showChat && (
      <PreProductionChat
        project={project}
        onShortCreated={handleShortCreated}
        onClose={() => setShowChat(false)}
      />
    )}
    </>
  );
};
