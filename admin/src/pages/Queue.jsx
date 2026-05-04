import React from 'react';
import { api } from '../api.js';

// Worker 큐 모니터링 & 제어
// GET  /api/admin/queue/jobs?status=&limit=&offset=   → { total, jobs: [...] }
// GET  /api/admin/queue/stats                         → { pending, running, done, failed, workers }
// POST /api/admin/queue/jobs/{job_id}/retry           → job 재시도
// POST /api/admin/queue/jobs/{job_id}/cancel          → job 취소
// POST /api/admin/queue/workers/pause                 → 큐 일시정지
// POST /api/admin/queue/workers/resume                → 큐 재개

const STATUS_STYLE = {
  pending:    { bg: 'color-mix(in srgb, var(--text4) 12%, transparent)', text: 'var(--text4)' },
  running:    { bg: 'color-mix(in srgb, var(--mint) 12%, transparent)',  text: 'var(--mint)' },
  done:       { bg: 'color-mix(in srgb, #4ade80 12%, transparent)',      text: '#4ade80' },
  failed:     { bg: 'color-mix(in srgb, var(--rose) 12%, transparent)',  text: 'var(--rose)' },
  cancelled:  { bg: 'color-mix(in srgb, var(--amber) 12%, transparent)', text: 'var(--amber)' },
  uploading:  { bg: 'color-mix(in srgb, #38bdf8 12%, transparent)',      text: '#38bdf8' },
  processing: { bg: 'color-mix(in srgb, #a78bfa 12%, transparent)',      text: '#a78bfa' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: s.bg, color: s.text, display: 'inline-block', minWidth: 64, textAlign: 'center' }}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card" style={{ padding: '16px 20px', flex: 1, minWidth: 120 }}>
    <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || 'var(--text1)' }}>{value ?? '—'}</div>
  </div>
);

const ProgressBar = ({ pct }) => (
  <div style={{ width: 80, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }}>
    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--mint)', transition: 'width 0.3s' }} />
  </div>
);

const JobRow = ({ job, onRetry, onCancel }) => {
  const [acting, setAct] = React.useState(false);

  const retry = async () => {
    if (!confirm('이 job을 다시 실행할까요?')) return;
    setAct(true);
    try { await onRetry(job.job_id); } catch (e) { alert(e.message); } finally { setAct(false); }
  };
  const cancel = async () => {
    if (!confirm('이 job을 취소할까요?')) return;
    setAct(true);
    try { await onCancel(job.job_id); } catch (e) { alert(e.message); } finally { setAct(false); }
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
        {job.job_id}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12 }}>{job.job_type || '—'}</td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {job.short_title || job.project_title || job.subject || '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <StatusBadge status={job.status} />
        {job.status === 'running' && job.progress_pct != null && (
          <><ProgressBar pct={job.progress_pct} /><span style={{ fontSize: 10, color: 'var(--text4)', marginLeft: 4 }}>{job.progress_pct}%</span></>
        )}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text4)' }}>
        {job.worker_id || '—'}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text4)' }}>
        {job.created_at ? new Date(job.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--rose)', maxWidth: 200, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {job.error || ''}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {(job.status === 'failed' || job.status === 'cancelled') && (
          <button className="btn btn-ghost btn-sm" disabled={acting} onClick={retry} style={{ marginRight: 4 }}>재시도</button>
        )}
        {(job.status === 'pending' || job.status === 'running') && (
          <button className="btn btn-ghost btn-sm" disabled={acting} onClick={cancel}
            style={{ color: 'var(--rose)' }}>취소</button>
        )}
      </td>
    </tr>
  );
};

const STATUS_TABS = ['all', 'pending', 'running', 'failed', 'done', 'cancelled'];

export const Queue = () => {
  const [stats, setStats] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [statusTab, setStatusTab] = React.useState('all');
  const [offset, setOffset] = React.useState(0);
  const [pausing, setPausing] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const LIMIT = 50;

  const loadStats = async () => {
    try {
      const d = await api.get('/queue/stats');
      setStats(d);
      setPaused(d.paused || false);
    } catch { setStats(null); }
  };

  const loadJobs = React.useCallback(async (tab, off) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: off });
      if (tab !== 'all') params.set('status', tab);
      const d = await api.get(`/queue/jobs?${params}`);
      setJobs(d.jobs || []);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    loadStats();
    loadJobs(statusTab, offset);
    const t = setInterval(() => { loadStats(); loadJobs(statusTab, offset); }, 5000);
    return () => clearInterval(t);
  }, [statusTab, offset, loadJobs]);

  const handleTabChange = (tab) => {
    setStatusTab(tab);
    setOffset(0);
  };

  const retryJob = async (jobId) => {
    await api.post(`/queue/jobs/${jobId}/retry`);
    await loadJobs(statusTab, offset);
  };
  const cancelJob = async (jobId) => {
    await api.post(`/queue/jobs/${jobId}/cancel`);
    await loadJobs(statusTab, offset);
  };

  const togglePause = async () => {
    setPausing(true);
    try {
      await api.post(paused ? '/queue/workers/resume' : '/queue/workers/pause');
      setPaused(p => !p);
    } catch (e) { alert(e.message); }
    finally { setPausing(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">작업 큐</div>
        <div className="flex gap-8 ml-auto">
          <button className="btn btn-ghost btn-sm" onClick={() => { loadStats(); loadJobs(statusTab, offset); }}>새로고침</button>
          <button
            className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: paused ? undefined : 'var(--rose)', borderColor: paused ? undefined : 'var(--rose)' }}
            disabled={pausing}
            onClick={togglePause}
          >
            {pausing ? '...' : paused ? '▶ 큐 재개' : '⏸ 큐 일시정지'}
          </button>
        </div>
      </div>
      <div className="page-sub">Worker 상태 모니터링 · Job 재시도 / 취소 · 5초 자동 새로고침</div>

      {paused && (
        <div style={{ background: 'color-mix(in srgb, var(--amber) 10%, transparent)', border: '1px solid var(--amber)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--amber)' }}>
          ⚠ 큐가 일시정지 상태입니다. 새 job이 실행되지 않습니다.
        </div>
      )}

      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="대기중" value={stats.pending} />
          <StatCard label="실행중" value={stats.running} color="var(--mint)" />
          <StatCard label="완료" value={stats.done} color="#4ade80" />
          <StatCard label="실패" value={stats.failed} color="var(--rose)" />
          <StatCard label="워커" value={`${stats.active_workers ?? '?'} / ${stats.total_workers ?? '?'}`} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(t => (
          <button key={t} className={`btn btn-sm ${statusTab === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleTabChange(t)}>
            {t === 'all' ? `전체 (${total})` : t}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading && jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text4)' }}>job 없음</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Job ID', '타입', '대상', '상태', 'Worker', '생성', '에러', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text4)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <JobRow key={j.job_id} job={j} onRetry={retryJob} onCancel={cancelJob} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" disabled={offset === 0}
            onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>이전</button>
          <span style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>
            {offset + 1}–{Math.min(offset + LIMIT, total)} / {total}
          </span>
          <button className="btn btn-ghost btn-sm" disabled={offset + LIMIT >= total}
            onClick={() => setOffset(o => o + LIMIT)}>다음</button>
        </div>
      )}
    </div>
  );
};
