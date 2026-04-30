import React from 'react';
import { api } from '../api.js';

export const Analytics = () => {
  const [days, setDays] = React.useState(30);
  const [errors, setErrors] = React.useState(null);
  const [usage, setUsage] = React.useState(null);
  const [models, setModels] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [e, u, m] = await Promise.all([
        api.get(`/analytics/errors?days=${days}`),
        api.get(`/analytics/usage?days=${days}`),
        api.get(`/analytics/models?days=${days}`),
      ]);
      setErrors(e); setUsage(u); setModels(m);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [days]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">분석</div>
        <div className="flex gap-8 ml-auto">
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDays(d)}>{d}일</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
        </div>
      </div>
      <div className="page-sub">최근 {days}일 기준</div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* stage별 실패율 */}
          {errors?.stage_stats?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Stage별 실패율</div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>stage</th><th>완료</th><th>실패</th><th>전체</th><th>실패율</th></tr></thead>
                  <tbody>
                    {errors.stage_stats.map(s => (
                      <tr key={s.stage}>
                        <td><span className="badge badge-gray">{s.stage}</span></td>
                        <td className="mono">{s.done}</td>
                        <td className="mono" style={{ color: 'var(--rose)' }}>{s.failed}</td>
                        <td className="mono">{s.total}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${s.fail_rate}%`, background: 'var(--rose)', borderRadius: 2 }} />
                            </div>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--rose)', minWidth: 36 }}>{s.fail_rate?.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 모델별 사용 */}
          {models?.models?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>모델별 사용 현황</div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>모델</th><th>전체</th><th>완료</th><th>실패</th><th>평균 점수</th></tr></thead>
                  <tbody>
                    {models.models.map(m => (
                      <tr key={m.model}>
                        <td className="mono" style={{ fontSize: 11 }}>{m.model}</td>
                        <td className="mono">{m.total}</td>
                        <td className="mono" style={{ color: 'var(--mint)' }}>{m.done}</td>
                        <td className="mono" style={{ color: 'var(--rose)' }}>{m.failed}</td>
                        <td className="mono">{m.avg_score ? `★ ${m.avg_score.toFixed(1)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 최근 에러 */}
          {errors?.recent_errors?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--rose)' }}>최근 실패</div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead><tr><th>ID</th><th>프로젝트</th><th>stage</th><th>오류</th><th>시간</th></tr></thead>
                  <tbody>
                    {errors.recent_errors.map(e => (
                      <tr key={e.id}>
                        <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{e.id}</td>
                        <td style={{ fontSize: 12 }}>{e.project_title || '-'}</td>
                        <td><span className="badge badge-gray">{e.stage}</span></td>
                        <td style={{ color: 'var(--rose)', fontSize: 12 }}>{e.error}</td>
                        <td className="text-muted">{e.updated_at ? new Date(e.updated_at).toLocaleString('ko') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 일별 추이 */}
          {usage?.shorts_daily?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>일별 쇼츠 생성</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
                {[...usage.shorts_daily].reverse().map(d => (
                  <div key={d.day} className="flex gap-8" style={{ fontSize: 12 }}>
                    <span className="mono text-muted" style={{ minWidth: 90 }}>{d.day}</span>
                    <span>생성 <span className="mono" style={{ color: 'var(--blue)' }}>{d.created}</span></span>
                    <span>완료 <span className="mono" style={{ color: 'var(--mint)' }}>{d.done}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
