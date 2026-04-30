import React from 'react';
import { api } from '../api.js';

const LIMIT = 100;

const UserDetailModal = ({ userId, onClose }) => {
  const [d, setD] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [changing, setChanging] = React.useState(false);

  React.useEffect(() => {
    api.get(`/users/${userId}/stats`).then(setD).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

  const changeRole = async (role) => {
    if (!confirm(`역할을 '${role}'로 변경할까요?`)) return;
    setChanging(true);
    try {
      const updated = await api.patch(`/users/${userId}/role`, { role });
      setD(prev => ({ ...prev, role: updated.role }));
    } catch (e) { alert(e.message); }
    finally { setChanging(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="modal-title" style={{ margin: 0 }}>유저 상세</div>
          <button className="btn btn-ghost btn-sm ml-auto" onClick={onClose}>✕</button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></div> : !d ? (
          <span className="text-muted">데이터 없음</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 프로필 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {d.picture && <img src={d.picture} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name || d.email}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{d.email}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                  <span className={`badge ${d.role === 'admin' ? 'badge-rose' : 'badge-gray'}`}>{d.role}</span>
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>가입: {d.created_at ? new Date(d.created_at).toLocaleDateString('ko') : '-'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>최근: {d.last_login_at ? new Date(d.last_login_at).toLocaleDateString('ko') : '-'}</span>
                </div>
              </div>
            </div>

            {/* 통계 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[['프로젝트', d.stats?.projects], ['쇼츠', d.stats?.shorts], ['컷 완료', d.stats?.cuts_done]].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{v ?? '-'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{k}</div>
                </div>
              ))}
            </div>

            {/* 역할 변경 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>역할 변경:</span>
              <button className="btn btn-ghost btn-sm" disabled={changing || d.role === 'user'} onClick={() => changeRole('user')}>user</button>
              <button className="btn btn-sm btn-sm" style={{ background: 'var(--rose-dim)', color: 'var(--rose)' }} disabled={changing || d.role === 'admin'} onClick={() => changeRole('admin')}>admin</button>
            </div>

            {/* 최근 쇼츠 */}
            {d.recent_shorts?.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>최근 쇼츠</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {d.recent_shorts.map(s => (
                    <div key={s.id} style={{ background: 'var(--bg2)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 500, marginBottom: 3 }}>{s.title || '(제목 없음)'}</div>
                      <div style={{ display: 'flex', gap: 8, color: 'var(--text3)' }}>
                        <span>{s.project_title}</span>
                        <span className="badge badge-gray">{s.stage}</span>
                        <span className={`badge ${s.status === 'done' ? 'badge-mint' : s.status === 'failed' ? 'badge-rose' : 'badge-gray'}`}>{s.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Users = () => {
  const [users, setUsers] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [detailId, setDetailId] = React.useState(null);

  const load = async (off = 0) => {
    setLoading(true);
    try {
      const data = await api.get(`/users?limit=${LIMIT}&offset=${off}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setOffset(off);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(0); }, []);

  const totalPages = Math.ceil(total / LIMIT);
  const page = Math.floor(offset / LIMIT) + 1;

  return (
    <div>
      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">유저 관리</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => load(offset)}>새로고침</button>
      </div>
      <div className="page-sub">전체 {total.toLocaleString()}명</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>이름</th><th>이메일</th><th>역할</th>
              <th>프로젝트</th><th>쇼츠</th><th>컷</th>
              <th>가입일</th><th>최근 로그인</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>유저 없음</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td className="mono" style={{ color: 'var(--text3)', fontSize: 11 }}>{u.id}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.picture && <img src={u.picture} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                  <span style={{ fontWeight: 500 }}>{u.name || '-'}</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-rose' : 'badge-gray'}`}>{u.role}</span></td>
                <td className="mono" style={{ textAlign: 'center' }}>{u.project_count ?? '-'}</td>
                <td className="mono" style={{ textAlign: 'center' }}>{u.shorts_count ?? '-'}</td>
                <td className="mono" style={{ textAlign: 'center' }}>{u.cuts_done ?? '-'}</td>
                <td className="text-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString('ko') : '-'}</td>
                <td className="text-muted">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('ko') : '-'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(u.id)}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-8" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0} onClick={() => load(offset - LIMIT)}>‹ 이전</button>
          <span className="text-muted" style={{ padding: '4px 12px', fontSize: 13 }}>{page} / {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total} onClick={() => load(offset + LIMIT)}>다음 ›</button>
        </div>
      )}
    </div>
  );
};
