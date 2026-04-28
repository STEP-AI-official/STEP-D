import React from 'react';
import { api } from '../api.js';

export const Projects = () => {
  const [projects, setProjects] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(null);
  const LIMIT = 50;

  const load = async (off = offset) => {
    setLoading(true);
    try {
      const data = await api.get(`/projects?limit=${LIMIT}&offset=${off}`);
      setProjects(data.projects || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(offset); }, [offset]);

  const del = async (id) => {
    if (!confirm('프로젝트와 모든 하위 데이터(shorts·scenarios·clips)가 삭제됩니다. 계속할까요?')) return;
    setDeleting(id);
    try {
      await api.del(`/projects/${id}`);
      load(offset);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const page = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">프로젝트</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>
      <div className="page-sub">전체 {total.toLocaleString()}개</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>제목</th>
              <th>쇼츠 수</th>
              <th>생성일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>프로젝트 없음</td></tr>
            ) : projects.map(p => (
              <tr key={p.id}>
                <td className="mono" style={{ color: 'var(--text3)', fontSize: 11 }}>{p.id}</td>
                <td style={{ fontWeight: 500 }}>{p.title || '(제목 없음)'}</td>
                <td>{p.shorts_count ?? '-'}</td>
                <td className="text-muted">{p.created_at ? new Date(p.created_at).toLocaleString('ko') : '-'}</td>
                <td>
                  <button className="btn btn-danger btn-sm" disabled={deleting === p.id} onClick={() => del(p.id)}>
                    {deleting === p.id ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>다음 ›</button>
        </div>
      )}
    </div>
  );
};
