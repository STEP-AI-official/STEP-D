import React from 'react';
import { api } from '../api.js';

const STAGE_BADGE = { scenario: 'badge-blue', video: 'badge-orange', audio: 'badge-violet', edit: 'badge-gray' };
const STATUS_BADGE = { done: 'badge-mint', failed: 'badge-rose', generating: 'badge-orange', pending: 'badge-gray' };

export const Dashboard = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dash, worker, stats] = await Promise.all([
        api.get('/dashboard'),
        api.get('/system/worker'),
        api.get('/system/stats'),
      ]);
      setData({ dash, worker, stats });
      setErr(null);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  if (loading) return <div className="flex gap-8" style={{ padding: 40 }}><span className="spinner" />불러오는 중...</div>;
  if (err) return <div style={{ color: 'var(--rose)', padding: 40 }}>{err} <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={load}>재시도</button></div>;

  const { dash, worker, stats } = data;

  const statCards = [
    { label: '프로젝트',   val: dash?.projects       ?? '-', color: 'var(--blue)'   },
    { label: '전체 쇼츠',  val: dash?.shorts_total   ?? '-', color: 'var(--violet)' },
    { label: '시나리오',   val: dash?.scenarios      ?? '-', color: 'var(--mint)'   },
    { label: 'RAG 소스',   val: dash?.rag_sources    ?? '-', color: 'var(--orange)' },
    { label: 'RAG 청크',   val: (dash?.rag_chunks ?? '-').toLocaleString?.() ?? dash?.rag_chunks, color: 'var(--text2)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">대시보드</div>
        <button className="btn btn-ghost btn-sm ml-auto" onClick={load}>새로고침</button>
      </div>
      <div className="page-sub">전체 시스템 현황</div>

      {/* 수치 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* 쇼츠 단계별 현황 */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>쇼츠 단계별 현황</div>
          {dash?.shorts_breakdown?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text4)', padding: '4px 8px' }}>stage</th>
                  <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text4)', padding: '4px 8px' }}>status</th>
                  <th style={{ textAlign: 'right', fontSize: 11, color: 'var(--text4)', padding: '4px 8px' }}>수</th>
                </tr>
              </thead>
              <tbody>
                {dash.shorts_breakdown.map((b, i) => (
                  <tr key={i}>
                    <td style={{ padding: '5px 8px' }}><span className={`badge ${STAGE_BADGE[b.stage] || 'badge-gray'}`}>{b.stage}</span></td>
                    <td style={{ padding: '5px 8px' }}><span className={`badge ${STATUS_BADGE[b.status] || 'badge-gray'}`}>{b.status}</span></td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--mono)' }}>{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <span className="text-muted">데이터 없음</span>}
        </div>

        {/* 워커 큐 */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>워커 큐</div>
          {worker ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="flex gap-8">
                <span className="text-muted" style={{ minWidth: 100 }}>대기 작업</span>
                <span style={{ fontWeight: 600 }}>{worker.queue_size ?? '-'}</span>
              </div>
              <div className="flex gap-8">
                <span className="text-muted" style={{ minWidth: 100 }}>활성 작업</span>
                <span style={{ fontWeight: 600 }}>{worker.active_jobs?.length ?? '-'}개</span>
              </div>
              {worker.active_jobs?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {worker.active_jobs.map(jobId => {
                    const prog = worker.progress?.[jobId];
                    return (
                      <div key={jobId} style={{ marginBottom: 8 }}>
                        <div className="flex gap-8" style={{ marginBottom: 4 }}>
                          <span className="mono text-muted" style={{ fontSize: 11 }}>{jobId}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--mint)' }}>{prog?.pct ?? 0}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${prog?.pct ?? 0}%`, background: 'var(--mint)', borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                        {prog?.step && <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>{prog.step}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : <span className="text-muted">데이터 없음</span>}
        </div>
      </div>

      {/* 최근 실패 */}
      {dash?.recent_failures?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--rose)' }}>최근 실패 쇼츠</div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>제목</th><th>프로젝트</th><th>stage</th><th>오류</th><th>시간</th>
                </tr>
              </thead>
              <tbody>
                {dash.recent_failures.map(f => (
                  <tr key={f.id}>
                    <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.id}</td>
                    <td style={{ fontWeight: 500 }}>{f.title}</td>
                    <td className="text-muted mono" style={{ fontSize: 11 }}>{f.project_id}</td>
                    <td><span className={`badge ${STAGE_BADGE[f.stage] || 'badge-gray'}`}>{f.stage}</span></td>
                    <td style={{ color: 'var(--rose)', fontSize: 12 }}>{f.error}</td>
                    <td className="text-muted">{f.updated_at ? new Date(f.updated_at).toLocaleString('ko') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DB 통계 */}
      {stats?.counts && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>DB 테이블 통계</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {Object.entries(stats.counts).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg2)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{v.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
